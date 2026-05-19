import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, hashPassword, createSession } from "@/lib/auth"
import { parseBody, loginSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = parseBody(loginSchema, await req.json())

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 })
    }

    // Auto-migrate legacy SHA-256 passwords to bcrypt
    if (!user.password.startsWith("$")) {
      const bcryptHash = await hashPassword(password)
      await prisma.user.update({ where: { id: user.id }, data: { password: bcryptHash } })
    }

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
    return NextResponse.json({ error: err.message || "登录失败" }, { status: 500 })
  }
}
