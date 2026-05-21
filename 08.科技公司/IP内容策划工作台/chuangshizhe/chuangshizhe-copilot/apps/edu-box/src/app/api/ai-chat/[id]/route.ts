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
  const dialogue = await prismaEdu.eduDialogue.findUnique({
    where: { id },
    include: { teacher: { select: { name: true } } },
  })

  if (!dialogue) return NextResponse.json({ error: "对话不存在" }, { status: 404 })
  return NextResponse.json({ dialogue })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  await prismaEdu.eduDialogue.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
