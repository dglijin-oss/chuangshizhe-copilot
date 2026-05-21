import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const product = await prismaEdu.studyTourProduct.findUnique({
    where: { id },
    include: { school: { select: { name: true } }, bookings: true },
  })

  if (!product) return NextResponse.json({ error: "产品不存在" }, { status: 404 })
  return NextResponse.json({ product })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const product = await prismaEdu.studyTourProduct.update({
    where: { id },
    data: body,
    include: { school: { select: { name: true } } },
  })

  return NextResponse.json({ product })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  await prismaEdu.studyTourProduct.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
