import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaCore, prismaIp } from "@/lib/prisma"

// GET /api/dashboard/stats - aggregate dashboard data
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const activeIp = { deletedAt: null }

  // Parallel fetch all stats (exclude soft-deleted records)
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
    prismaIp.geoArticle.count({ where: { userId: user.id, deletedAt: null } }),
    // 近7天生成文案
    prismaIp.geoArticle.count({ where: { userId: user.id, deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
    // 周策划总数
    prismaIp.weeklyPlan.count({ where: { userId: user.id, deletedAt: null } }),
    // IP 账号总数
    prismaIp.ip.count({ where: { userId: user.id, deletedAt: null } }),
    // IP 无策划（没有 weeklyPlan 的 IP）
    prismaIp.ip.count({
      where: { ...activeIp, userId: user.id, weeklyPlans: { none: { deletedAt: null } } },
    }),
    // 发布包数量
    prismaIp.publishRecord.count({ where: { userId: user.id, deletedAt: null } }),
    // 知识库条目
    prismaIp.knowledgeBase.count({ where: { userId: user.id, deletedAt: null } }),
    // 近7天生成记录数
    prismaCore.generationLog.count({ where: { userId: user.id, createdAt: { gte: sevenDaysAgo } } }),
    // IP 列表带计数
    prismaIp.ip.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: {
          select: {
            weeklyPlans: { where: { deletedAt: null } },
            geoArticles: { where: { deletedAt: null } },
          },
        },
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

  // IP account list with counts + health score
  const ipList = ips.map((ip) => {
    // Health score: weighted based on content activity
    const planScore = ip._count.weeklyPlans > 0 ? 40 : 0
    const articleScore = Math.min(ip._count.geoArticles * 5, 40)
    const kbScore = ip.knowledgeBase ? 10 : 0
    const freshnessScore = Math.min(10, Math.max(0, 10 - Math.floor((Date.now() - ip.updatedAt.getTime()) / (7 * 24 * 60 * 60 * 1000))))
    const health = planScore + articleScore + kbScore + freshnessScore

    return {
      id: ip.id,
      name: ip.name,
      industry: ip.industry || "未设置",
      contentMix: `${ip.contentMixFlow}:${ip.contentMixPersona}:${ip.contentMixProduct}`,
      articleCount: ip._count.geoArticles,
      planCount: ip._count.weeklyPlans,
      updatedAt: ip.updatedAt,
      health: Math.min(health, 100),
    }
  })

  // Daily tip: find the most needy IP and generate a tip
  let dailyTip: string | null = null
  const unhealthyIps = ipList.filter((ip) => ip.health < 60)
  const noPlanIps = ipList.filter((ip) => ip.planCount === 0)

  if (unhealthyIps.length > 0) {
    const worst = unhealthyIps[0]
    dailyTip = `「${worst.name}」的内容健康度偏低（${worst.health}%），建议今天生成 2 条新内容补充素材库。`
  } else if (noPlanIps.length > 0) {
    dailyTip = `「${noPlanIps[0].name}」还没有周策划，点击「生成周策划」为它制定本周内容计划。`
  } else if (s?.articleRecent7d && s.articleRecent7d < 5) {
    dailyTip = `本周内容产出较少（${s.articleRecent7d} 条），建议多利用 AI 军火库生成内容。`
  }

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
    dailyTip,
  })
}
