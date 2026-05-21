import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const teacherId = searchParams.get("teacherId")
  const classId = searchParams.get("classId")

  const where: Record<string, unknown> = {}
  if (teacherId) where.teacherId = teacherId
  if (classId) where.classId = classId

  const homeworks = await prismaEdu.eduHomework.findMany({
    where,
    include: {
      teacher: { select: { name: true } },
      class: { select: { name: true, grade: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ homeworks })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { teacherId, classId, title, subject, type, content, dueDate, published } = body as {
    teacherId: string
    classId: string
    title: string
    subject: string
    type?: string
    content: Record<string, unknown>
    dueDate?: string
    published?: boolean
  }

  if (!teacherId || !classId || !title || !subject) {
    return NextResponse.json({ error: "教师、班级、标题、学科不能为空" }, { status: 400 })
  }

  const homework = await prismaEdu.eduHomework.create({
    data: {
      teacherId,
      classId,
      title,
      subject,
      type: type || "normal",
      content: content as any,
      dueDate: dueDate ? new Date(dueDate) : null,
      published: published || false,
    },
    include: {
      teacher: { select: { name: true } },
      class: { select: { name: true, grade: true } },
    },
  })

  return NextResponse.json({ homework })
}
