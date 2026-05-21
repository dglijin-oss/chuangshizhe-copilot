import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const teacherId = searchParams.get("teacherId")

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (teacherId) where.teacherId = teacherId

  const lessonPlans = await prismaEdu.eduLessonPlan.findMany({
    where,
    include: { teacher: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ lessonPlans })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { teacherId, title, subject, grade, unit, objectives, content, agent } = body as {
    teacherId: string
    title: string
    subject: string
    grade: string
    unit?: string
    objectives?: Record<string, unknown>
    content: Record<string, unknown>
    agent?: string
  }

  if (!teacherId || !title || !subject || !grade) {
    return NextResponse.json({ error: "教师、标题、学科、年级不能为空" }, { status: 400 })
  }

  const lessonPlan = await prismaEdu.eduLessonPlan.create({
    data: {
      teacherId,
      title,
      subject,
      grade,
      unit: unit || null,
      objectives: objectives ? (objectives as any) : null,
      content: content as any,
      agent: agent || "jiangxin",
      status: "draft",
    },
    include: { teacher: { select: { name: true } } },
  })

  return NextResponse.json({ lessonPlan })
}
