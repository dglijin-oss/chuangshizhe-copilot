import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseBody, createMemorySchema, updateMemorySchema } from "@/lib/validation"

const categoryLabels: Record<string, string> = {
  fact_correction: "事实纠错",
  writing_preference: "写作偏好",
  expression_restriction: "表达禁区",
  customer_insight: "客户洞察",
}

// GET /api/account-memory - list memories for an IP
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ipId = searchParams.get("ipId")

  const where: any = { userId: user.id }
  if (ipId) where.ipId = ipId

  const memories = await prisma.accountMemory.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ memories, categoryLabels })
}

// POST /api/account-memory - create a memory
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { ipId, category, content } = parseBody(createMemorySchema, await req.json())

  const memory = await prisma.accountMemory.create({
    data: {
      userId: user.id,
      ipId: ipId || null,
      category: category || "fact_correction",
      content,
    },
  })

  return NextResponse.json({ memory })
}

// DELETE /api/account-memory - delete a memory
export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 })

  const memory = await prisma.accountMemory.findUnique({ where: { id } })
  if (!memory || memory.userId !== user.id) {
    return NextResponse.json({ error: "记忆不存在" }, { status: 404 })
  }

  await prisma.accountMemory.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

// PUT /api/account-memory - update a memory
export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 })

  const { content, category } = parseBody(updateMemorySchema, await req.json())

  const memory = await prisma.accountMemory.findUnique({ where: { id } })
  if (!memory || memory.userId !== user.id) {
    return NextResponse.json({ error: "记忆不存在" }, { status: 404 })
  }

  const updated = await prisma.accountMemory.update({
    where: { id },
    data: {
      content,
      ...(category && { category }),
    },
  })

  return NextResponse.json({ memory: updated })
}
