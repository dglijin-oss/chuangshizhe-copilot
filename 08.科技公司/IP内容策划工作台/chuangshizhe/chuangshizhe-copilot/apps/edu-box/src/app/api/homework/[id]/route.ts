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
  const homework = await prismaEdu.eduHomework.findUnique({
    where: { id },
    include: {
      teacher: { select: { name: true } },
      class: { select: { name: true, grade: true } },
      submissions: {
        include: { student: { select: { name: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  })

  if (!homework) return NextResponse.json({ error: "作业不存在" }, { status: 404 })
  return NextResponse.json({ homework })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Handle dueDate conversion
  if (body.dueDate === "") body.dueDate = null
  if (body.dueDate) body.dueDate = new Date(body.dueDate)

  const homework = await prismaEdu.eduHomework.update({
    where: { id },
    data: body,
    include: {
      teacher: { select: { name: true } },
      class: { select: { name: true, grade: true } },
    },
  })

  return NextResponse.json({ homework })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  await prismaEdu.eduHomework.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
