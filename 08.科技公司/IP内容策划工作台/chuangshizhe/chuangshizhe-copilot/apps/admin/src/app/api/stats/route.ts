import { NextResponse } from "next/server"
import { prismaCore, prismaIp, prismaEdu } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const system = searchParams.get("system")

  let stats: Record<string, unknown> = {}

  if (!system || system === "all") {
    const [totalUsers, totalIps, totalBookings, totalLessonPlans, totalHomeworks, totalPointsResult, recentUsers, recentLogs, recentRecharges] = await Promise.all([
      prismaCore.user.count(),
      prismaIp.ip.count(),
      prismaEdu.studyTourBooking.count(),
      prismaEdu.eduLessonPlan.count(),
      prismaEdu.eduHomework.count(),
      prismaCore.user.aggregate({ _sum: { points: true } }),
      prismaCore.user.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, name: true, phone: true, points: true, createdAt: true } }),
      prismaCore.generationLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } }),
      prismaCore.pointsRecharge.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } }),
    ])
    stats = {
      totalUsers, totalIps, totalBookings, totalLessonPlans, totalHomeworks,
      totalPoints: totalPointsResult._sum.points ?? 0,
      recentUsers, recentLogs, recentRecharges,
    }
  } else if (system === "ip-copilot") {
    const [totalIps, totalArticles, totalPlans] = await Promise.all([
      prismaIp.ip.count(),
      prismaIp.geoArticle.count(),
      prismaIp.weeklyPlan.count(),
    ])
    stats = { totalIps, totalArticles, totalPlans }
  } else if (system === "edu-box") {
    const [totalBookings, totalLessonPlans, totalHomeworks, totalTeachers, totalSchools] = await Promise.all([
      prismaEdu.studyTourBooking.count(),
      prismaEdu.eduLessonPlan.count(),
      prismaEdu.eduHomework.count(),
      prismaEdu.eduTeacher.count(),
      prismaEdu.eduSchool.count(),
    ])
    stats = { totalBookings, totalLessonPlans, totalHomeworks, totalTeachers, totalSchools }
  }

  return NextResponse.json({ stats })
}
