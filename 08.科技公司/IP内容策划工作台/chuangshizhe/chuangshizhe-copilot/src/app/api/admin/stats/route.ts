import { NextResponse } from "next/server"
import { prismaCore, prismaIp } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET() {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const [totalUsers, totalIps, totalArticles, totalRecharges, recentUsers, recentLogs, recentRecharges] = await Promise.all([
    prismaCore.user.count(),
    prismaIp.ip.count(),
    prismaIp.geoArticle.count(),
    prismaCore.pointsRecharge.count(),
    prismaCore.user.findMany({ take: 10, orderBy: { createdAt: "desc" }, select: { id: true, name: true, phone: true, points: true, createdAt: true } }),
    prismaCore.generationLog.findMany({ take: 10, orderBy: { createdAt: "desc" } }),
    prismaCore.pointsRecharge.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, phone: true } } } }),
  ])

  const totalPoints = await prismaCore.user.aggregate({ _sum: { points: true } })

  return NextResponse.json({
    stats: {
      totalUsers,
      totalIps,
      totalArticles,
      totalRecharges,
      totalPoints: totalPoints._sum.points || 0,
    },
    recentUsers,
    recentLogs,
    recentRecharges,
  })
}
