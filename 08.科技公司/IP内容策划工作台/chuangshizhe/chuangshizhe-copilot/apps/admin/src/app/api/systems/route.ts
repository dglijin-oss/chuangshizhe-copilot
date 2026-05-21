import { NextResponse } from "next/server"
import { prismaCore } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const systems = await prismaCore.system.findMany({ orderBy: { sortOrder: "asc" } })
  return NextResponse.json({ systems })
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const data = await request.json()
  const system = await prismaCore.system.create({ data })
  return NextResponse.json({ system })
}

export async function PUT(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { id, ...data } = await request.json()
  const system = await prismaCore.system.update({ where: { id }, data })
  return NextResponse.json({ system })
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "缺少系统ID" }, { status: 400 })

  await prismaCore.system.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
