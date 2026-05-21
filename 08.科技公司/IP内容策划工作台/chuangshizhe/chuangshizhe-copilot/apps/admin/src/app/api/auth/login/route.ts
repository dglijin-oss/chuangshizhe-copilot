import { NextResponse } from "next/server"
import * as auth from "@chuangshizhe/auth"
import { prismaCore } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json()
    if (!phone || !password) return NextResponse.json({ error: "手机号和密码不能为空" }, { status: 400 })

    const user = await prismaCore.user.findUnique({ where: { phone } })
    if (!user) return NextResponse.json({ error: "手机号或密码错误" }, { status: 401 })
    if (user.role !== "admin") return NextResponse.json({ error: "无管理员权限" }, { status: 403 })

    const { valid, needsMigration } = auth.verifyPassword(password, user.password)
    if (!valid) return NextResponse.json({ error: "手机号或密码错误" }, { status: 401 })

    if (needsMigration) {
      await prismaCore.user.update({ where: { id: user.id }, data: { password: auth.hashPassword(password) } })
    }

    const token = await auth.createSession(prismaCore, user.id)

    const response = NextResponse.json({ user: { id: user.id, name: user.name, phone: user.phone, role: user.role } })
    response.cookies.set(auth.SESSION_COOKIE, token, {
      httpOnly: true, path: "/", maxAge: auth.SESSION_DAYS * 86400, sameSite: "lax",
    })
    response.cookies.set("user-role", user.role, {
      httpOnly: false, path: "/", maxAge: auth.SESSION_DAYS * 86400, sameSite: "lax",
    })
    return response
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
