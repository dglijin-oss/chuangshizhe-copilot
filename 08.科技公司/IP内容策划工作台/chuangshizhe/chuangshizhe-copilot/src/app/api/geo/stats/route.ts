import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"

// GET /api/geo/stats - get GEO statistics
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const [totalArticles, publishedCount, totalViews, totalAiQuotes, totalConsultations] = await Promise.all([
    prismaIp.geoArticle.count({ where: { userId: user.id } }),
    prismaIp.publishRecord.count({ where: { userId: user.id, status: "published" } }),
    prismaIp.publishRecord.aggregate({ where: { userId: user.id }, _sum: { views: true } }),
    prismaIp.publishRecord.aggregate({ where: { userId: user.id }, _sum: { aiQuotes: true } }),
    prismaIp.publishRecord.aggregate({ where: { userId: user.id }, _sum: { consultations: true } }),
  ])

  const platformStats = await prismaIp.publishRecord.groupBy({
    by: ["platform"],
    where: { userId: user.id },
    _count: { id: true },
  })

  const typeStats = await prismaIp.geoArticle.groupBy({
    by: ["articleType"],
    where: { userId: user.id },
    _count: { id: true },
  })

  return NextResponse.json({
    totalArticles,
    published: publishedCount,
    views: totalViews._sum.views || 0,
    aiQuotes: totalAiQuotes._sum.aiQuotes || 0,
    consultations: totalConsultations._sum.consultations || 0,
    platformStats,
    typeStats,
  })
}
