import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

// GET /api/admin/users/[id] - get single user detail
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const { id } = await context.params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      ips: true,
      questionnaires: true,
      pointsRecharges: true,
      generationLogs: { take: 10, orderBy: { createdAt: "desc" } },
    },
  })

  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 })

  return NextResponse.json({ user })
}

// DELETE /api/admin/users/[id] - delete user
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const { id } = await context.params

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
