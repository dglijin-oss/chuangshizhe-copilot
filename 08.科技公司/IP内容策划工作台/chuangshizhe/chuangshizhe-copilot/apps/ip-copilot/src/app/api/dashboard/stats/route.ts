import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaCore, prismaIp } from "@/lib/prisma"

// GET /api/dashboard/stats - aggregate dashboard data
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Parallel fetch all stats
  const [
    articleTotal,
    articleRecent7d,
    weeklyPlanCount,
    ipTotal,
    ipWithoutPlan,
    publishCount,
    knowledgeCount,
    generationLogRecent7d,
    ips,
    dailyArticles,
  ] = await Promise.all([
    // 已生成文案总数
    prismaIp.geoArticle.count({ where: { userId: user.id } }),
    // 近7天生成文案
    prismaIp.geoArticle.count({ where: { userId: user.id, createdAt: { gte: sevenDaysAgo } } }),
    // 周策划总数
    prismaIp.weeklyPlan.count({ where: { userId: user.id } }),
    // IP 账号总数
    prismaIp.ip.count({ where: { userId: user.id } }),
    // IP 无策划（没有 weeklyPlan 的 IP）
    prismaIp.ip.count({
      where: { userId: user.id, weeklyPlans: { none: {} } },
    }),
    // 发布包数量
    prismaIp.publishRecord.count({ where: { userId: user.id } }),
    // 知识库条目
    prismaIp.knowledgeBase.count({ where: { userId: user.id } }),
    // 近7天生成记录数
    prismaCore.generationLog.count({ where: { userId: user.id, createdAt: { gte: sevenDaysAgo } } }),
    // IP 列表带计数
    prismaIp.ip.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: { select: { weeklyPlans: true, geoArticles: true } },
      },
    }),
    // 每日生成记录数（近7天）— 用作产出趋势
    prismaCore.generationLog.findMany({
      where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  // Build daily trend: count generation logs per day for last 7 days
  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
    const count = dailyArticles.filter((a) => a.createdAt >= start && a.createdAt < end).length
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      count,
    }
  })

  // IP account list with counts
  const ipList = ips.map((ip) => ({
    id: ip.id,
    name: ip.name,
    industry: ip.industry || "未设置",
    contentMix: `${ip.contentMixFlow}:${ip.contentMixPersona}:${ip.contentMixProduct}`,
    articleCount: ip._count.geoArticles,
    planCount: ip._count.weeklyPlans,
    updatedAt: ip.updatedAt,
  }))

  return NextResponse.json({
    articleTotal,
    articleRecent7d,
    weeklyPlanCount,
    ipTotal,
    ipWithoutPlan,
    publishCount,
    knowledgeCount,
    generationLogRecent7d,
    trend,
    ipList,
  })
}
