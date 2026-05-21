import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  if (body.birthDate) body.birthDate = new Date(body.birthDate)

  const student = await prismaEdu.eduStudent.update({
    where: { id },
    data: body,
    include: { class: { select: { name: true, school: { select: { name: true } } } } },
  })

  return NextResponse.json({ student })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params

  try {
    await prismaEdu.eduStudent.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "删除失败，请先删除关联的作业提交/报名记录" }, { status: 400 })
  }
}
