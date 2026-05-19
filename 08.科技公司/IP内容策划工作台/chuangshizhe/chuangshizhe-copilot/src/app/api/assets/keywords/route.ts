import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/assets/keywords - list keyword groups with keywords
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const groups = await prisma.keywordGroup.findMany({
    where: { userId: user.id },
    include: { keywords: true },
    orderBy: { createdAt: "desc" },
  })

  const hotKeywords = await prisma.keyword.findMany({
    where: { userId: user.id, isHot: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ groups, hotKeywords })
}

// POST /api/assets/keywords - create a keyword group or keyword
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { type, name, content, groupId } = await req.json()

  if (type === "group") {
    if (!name) return NextResponse.json({ error: "分组名称必填" }, { status: 400 })
    const group = await prisma.keywordGroup.create({
      data: { userId: user.id, name },
    })
    return NextResponse.json({ group })
  }

  if (type === "keyword") {
    if (!content) return NextResponse.json({ error: "关键词内容必填" }, { status: 400 })
    const keyword = await prisma.keyword.create({
      data: {
        userId: user.id,
        content,
        groupId: groupId || null,
        isHot: false,
      },
    })
    return NextResponse.json({ keyword })
  }

  return NextResponse.json({ error: "无效类型" }, { status: 400 })
}

// DELETE /api/assets/keywords
export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const type = searchParams.get("type")

  if (!id || !type) return NextResponse.json({ error: "参数不完整" }, { status: 400 })

  if (type === "group") {
    await prisma.keywordGroup.delete({ where: { id, userId: user.id } })
  } else {
    await prisma.keyword.delete({ where: { id, userId: user.id } })
  }

  return NextResponse.json({ success: true })
}
