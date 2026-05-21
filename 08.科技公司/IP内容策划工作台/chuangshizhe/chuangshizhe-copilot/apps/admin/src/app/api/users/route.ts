import { NextResponse } from "next/server"
import { prismaCore } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const users = await prismaCore.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, phone: true, role: true, points: true, createdAt: true },
  })
  return NextResponse.json({ users })
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { userId, ...data } = await request.json()
  const user = await prismaCore.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.points !== undefined && { points: data.points }),
    },
  })
  return NextResponse.json({ user })
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })

  await prismaCore.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
