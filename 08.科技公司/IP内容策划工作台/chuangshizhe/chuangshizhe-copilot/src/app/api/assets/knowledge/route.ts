import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/assets/knowledge - list knowledge base entries
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const entries = await prisma.knowledgeBase.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ entries })
}

// POST /api/assets/knowledge - create or update knowledge base entry
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { title, content, sourceType, ipId } = await req.json()

  if (!title || !content) return NextResponse.json({ error: "标题和内容必填" }, { status: 400 })

  const entry = await prisma.knowledgeBase.create({
    data: {
      userId: user.id,
      title,
      content,
      sourceType: sourceType || "wiki",
      ipId: ipId || null,
    },
  })

  return NextResponse.json({ entry })
}

// DELETE /api/assets/knowledge
export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID 必填" }, { status: 400 })

  await prisma.knowledgeBase.delete({ where: { id, userId: user.id } })
  return NextResponse.json({ success: true })
}
