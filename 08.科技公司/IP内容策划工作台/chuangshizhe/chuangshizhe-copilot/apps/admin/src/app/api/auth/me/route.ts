import { NextResponse } from "next/server"
import * as auth from "@chuangshizhe/auth"
import { prismaCore } from "@/lib/prisma"

export async function GET() {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  const token = cookieStore.get(auth.SESSION_COOKIE)?.value
  const user = await auth.getSessionUser(prismaCore, token)
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  return NextResponse.json({ user: { id: user.id, name: user.name, phone: user.phone, role: user.role, points: user.points } })
}
