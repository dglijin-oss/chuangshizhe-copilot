import { NextResponse } from "next/server"
import { prismaCore, prismaIp } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

// GET /api/admin/users - list all users
export async function GET() {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const users = await prismaCore.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      points: true,
      createdAt: true,
    },
  })

  const userIds = users.map(u => u.id)
  const [ipCounts, questionnaireCounts, rechargeCounts, logCounts] = await Promise.all([
    prismaIp.ip.groupBy({ by: ["userId"], _count: { id: true }, where: { userId: { in: userIds } } }),
    prismaIp.questionnaire.groupBy({ by: ["userId"], _count: { id: true }, where: { userId: { in: userIds } } }),
    prismaCore.pointsRecharge.groupBy({ by: ["userId"], _count: { id: true }, where: { userId: { in: userIds } } }),
    prismaCore.generationLog.groupBy({ by: ["userId"], _count: { id: true }, where: { userId: { in: userIds } } }),
  ])

  const countMaps = {
    ips: new Map(ipCounts.map((c: any) => [c.userId, c._count.id])),
    questionnaires: new Map(questionnaireCounts.map((c: any) => [c.userId, c._count.id])),
    pointsRecharges: new Map(rechargeCounts.map((c: any) => [c.userId, c._count.id])),
    generationLogs: new Map(logCounts.map((c: any) => [c.userId, c._count.id])),
  }

  const usersWithCounts = users.map(u => ({
    ...u,
    _count: {
      ips: countMaps.ips.get(u.id) || 0,
      questionnaires: countMaps.questionnaires.get(u.id) || 0,
      pointsRecharges: countMaps.pointsRecharges.get(u.id) || 0,
      generationLogs: countMaps.generationLogs.get(u.id) || 0,
    },
  }))

  return NextResponse.json({ users: usersWithCounts })
}

// PATCH /api/admin/users - edit user
export async function PATCH(req: Request) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "参数错误" }, { status: 400 })

  const body = await req.json()
  const { name, role, points } = body

  try {
    const updated = await prismaCore.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(points !== undefined && { points }),
      },
      select: { id: true, name: true, phone: true, role: true, points: true },
    })

    return NextResponse.json({ user: updated })
  } catch {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 })
  }
}

// DELETE /api/admin/users - delete user with all related data
export async function DELETE(req: Request) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "参数错误" }, { status: 400 })

  try {
    // Cascade delete: child records → Ip → direct children → User
    // Delete IP schema data first, then shared schema data
    await prismaIp.publishRecord.deleteMany({ where: { userId: id } })
    await prismaIp.keyword.deleteMany({ where: { userId: id } })
    await prismaIp.wikiPage.deleteMany({ where: { userId: id } })
    await prismaIp.knowledgeBase.deleteMany({ where: { userId: id } })
    await prismaIp.knowledgeSource.deleteMany({ where: { userId: id } })
    await prismaIp.accountMemory.deleteMany({ where: { userId: id } })
    await prismaIp.corpusFeed.deleteMany({ where: { userId: id } })
    await prismaIp.geoArticle.deleteMany({ where: { userId: id } })
    await prismaIp.weeklyPlan.deleteMany({ where: { userId: id } })
    await prismaIp.ip.deleteMany({ where: { userId: id } })
    await prismaIp.keywordGroup.deleteMany({ where: { userId: id } })
    await prismaIp.questionnaire.deleteMany({ where: { userId: id } })
    await prismaIp.generationRule.deleteMany({ where: { userId: id } })
    await prismaIp.integrationConfig.deleteMany({ where: { userId: id } })
    await prismaIp.compileEvent.deleteMany({ where: { userId: id } })
    // Shared schema data
    await prismaCore.generationLog.deleteMany({ where: { userId: id } })
    await prismaCore.pointsRecharge.deleteMany({ where: { userId: id } })
    await prismaCore.session.deleteMany({ where: { userId: id } })
    // Finally the user
    await prismaCore.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Delete user error:", err)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
