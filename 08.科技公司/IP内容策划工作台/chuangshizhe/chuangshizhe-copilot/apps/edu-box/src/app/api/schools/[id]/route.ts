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

  const school = await prismaEdu.eduSchool.update({
    where: { id },
    data: body,
  })

  return NextResponse.json({ school })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params

  try {
    await prismaEdu.eduSchool.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "删除失败，请先删除关联的教师/班级/产品" }, { status: 400 })
  }
}
