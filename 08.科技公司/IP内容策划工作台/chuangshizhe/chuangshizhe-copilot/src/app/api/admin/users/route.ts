import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

// GET /api/admin/users - list all users
export async function GET() {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      points: true,
      createdAt: true,
      _count: {
        select: {
          ips: true,
          questionnaires: true,
          pointsRecharges: true,
          generationLogs: true,
        },
      },
    },
  })

  return NextResponse.json({ users })
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
    const updated = await prisma.user.update({
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
    await prisma.$transaction([
      // 1. Child records that might reference Ip
      prisma.publishRecord.deleteMany({ where: { userId: id } }),
      prisma.keyword.deleteMany({ where: { userId: id } }),
      prisma.wikiPage.deleteMany({ where: { userId: id } }),
      prisma.knowledgeBase.deleteMany({ where: { userId: id } }),
      prisma.knowledgeSource.deleteMany({ where: { userId: id } }),
      prisma.accountMemory.deleteMany({ where: { userId: id } }),
      prisma.corpusFeed.deleteMany({ where: { userId: id } }),
      prisma.geoArticle.deleteMany({ where: { userId: id } }),
      prisma.weeklyPlan.deleteMany({ where: { userId: id } }),
      // 2. Ip (no children left at this point)
      prisma.ip.deleteMany({ where: { userId: id } }),
      // 3. Remaining direct children of User
      prisma.keywordGroup.deleteMany({ where: { userId: id } }),
      prisma.generationLog.deleteMany({ where: { userId: id } }),
      prisma.pointsRecharge.deleteMany({ where: { userId: id } }),
      prisma.questionnaire.deleteMany({ where: { userId: id } }),
      prisma.generationRule.deleteMany({ where: { userId: id } }),
      prisma.integrationConfig.deleteMany({ where: { userId: id } }),
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.compileEvent.deleteMany({ where: { userId: id } }),
      // 4. Finally the user
      prisma.user.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Delete user error:", err)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
