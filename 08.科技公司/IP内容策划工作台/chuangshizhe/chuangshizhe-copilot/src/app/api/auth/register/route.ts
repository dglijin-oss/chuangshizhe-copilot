import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, createSession } from "@/lib/auth"
import { parseBody, registerSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  try {
    const { name, phone, password } = parseBody(registerSchema, await req.json())

    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json({ error: "该手机号已注册" }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: { name, phone, password: passwordHash },
    })

    const token = await createSession(user.id)

    const res = NextResponse.json({ user: { id: user.id, name: user.name, phone: user.phone, role: user.role, points: user.points } })
    res.cookies.set("session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })
    res.cookies.set("user-role", user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })

    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "注册失败" }, { status: 500 })
  }
}
