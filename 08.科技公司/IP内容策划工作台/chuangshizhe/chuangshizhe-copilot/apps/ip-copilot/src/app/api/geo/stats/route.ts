import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/geo/stats - get GEO statistics
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const [totalArticles, publishedCount, totalViews, totalAiQuotes, totalConsultations] = await Promise.all([
    prisma.geoArticle.count({ where: { userId: user.id } }),
    prisma.publishRecord.count({ where: { userId: user.id, status: "published" } }),
    prisma.publishRecord.aggregate({ where: { userId: user.id }, _sum: { views: true } }),
    prisma.publishRecord.aggregate({ where: { userId: user.id }, _sum: { aiQuotes: true } }),
    prisma.publishRecord.aggregate({ where: { userId: user.id }, _sum: { consultations: true } }),
  ])

  const platformStats = await prisma.publishRecord.groupBy({
    by: ["platform"],
    where: { userId: user.id },
    _count: { id: true },
  })

  const typeStats = await prisma.geoArticle.groupBy({
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
