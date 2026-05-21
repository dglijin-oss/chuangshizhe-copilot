import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const lessonPlan = await prismaEdu.eduLessonPlan.findUnique({
    where: { id },
    include: { teacher: { select: { name: true } } },
  })

  if (!lessonPlan) return NextResponse.json({ error: "教案不存在" }, { status: 404 })
  return NextResponse.json({ lessonPlan })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const lessonPlan = await prismaEdu.eduLessonPlan.update({
    where: { id },
    data: body,
    include: { teacher: { select: { name: true } } },
  })

  return NextResponse.json({ lessonPlan })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  await prismaEdu.eduLessonPlan.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
