import { NextRequest, NextResponse } from "next/server"
import { prismaCore } from "@/lib/prisma"
import { hashPassword, createSession } from "@/lib/auth"
import { parseBody, registerSchema } from "@/lib/validation"
import { captchaStore } from "@/lib/captcha"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, password, captchaId, captchaAnswer } = body as {
      name: string
      phone: string
      password: string
      captchaId?: string
      captchaAnswer?: number | string
    }

    parseBody(registerSchema, { name, phone, password })

    if (!captchaId || captchaAnswer === undefined) {
      return NextResponse.json({ error: "请完成图形验证码" }, { status: 400 })
    }

    const entry = captchaStore.get(captchaId)
    if (!entry) {
      return NextResponse.json({ error: "验证码已过期，请重新获取" }, { status: 400 })
    }
    captchaStore.delete(captchaId)

    if (Number(captchaAnswer) !== entry.answer) {
      return NextResponse.json({ error: "验证码错误" }, { status: 400 })
    }

    const existing = await prismaCore.user.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json({ error: "该手机号已注册" }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)
    const user = await prismaCore.user.create({
      data: { name, phone, password: passwordHash },
    })

    const token = await createSession(user.id)

    const res = NextResponse.json({ user: { id: user.id, name: user.name, phone: user.phone, role: user.role, points: user.points } })
    res.cookies.set("session-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })
    res.cookies.set("user-role", user.role, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })

    return res
  } catch (err: any) {
    return NextResponse.json({ error: "注册失败" }, { status: 500 })
  }
}
