import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const settlement = await prismaEdu.studyTourSettlement.update({ where: { id }, data: body })

  return NextResponse.json({ settlement })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  await prismaEdu.studyTourSettlement.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
