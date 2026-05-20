import { NextResponse } from "next/server"
import { prismaCore, prismaIp } from "@/lib/prisma"
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

  const [user, ips, questionnaires, pointsRecharges, generationLogs] = await Promise.all([
    prismaCore.user.findUnique({ where: { id } }),
    prismaIp.ip.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" } }),
    prismaIp.questionnaire.findMany({ where: { userId: id } }),
    prismaCore.pointsRecharge.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" } }),
    prismaCore.generationLog.findMany({ where: { userId: id }, take: 10, orderBy: { createdAt: "desc" } }),
  ])

  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 })

  return NextResponse.json({ user: { ...user, ips, questionnaires, pointsRecharges, generationLogs } })
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
    await prismaCore.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
