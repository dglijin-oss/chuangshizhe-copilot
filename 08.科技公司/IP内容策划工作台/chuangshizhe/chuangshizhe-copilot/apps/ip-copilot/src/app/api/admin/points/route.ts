import { NextResponse } from "next/server"
import { prismaCore } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

// POST /api/admin/points - adjust user points
export async function POST(req: Request) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  try {
    const { userId, amount, reason } = await req.json()

    if (!userId || amount === undefined) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 })
    }

    const user = await prismaCore.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 })

    const newPoints = user.points + amount
    if (newPoints < 0) {
      return NextResponse.json({ error: "积分不足" }, { status: 400 })
    }

    await prismaCore.user.update({
      where: { id: userId },
      data: { points: newPoints },
    })

    return NextResponse.json({
      success: true,
      newPoints,
      delta: amount,
      user: { id: user.id, name: user.name, phone: user.phone },
    })
  } catch (err) {
    console.error("Points adjustment error:", err)
    return NextResponse.json({ error: "操作失败" }, { status: 500 })
  }
}
