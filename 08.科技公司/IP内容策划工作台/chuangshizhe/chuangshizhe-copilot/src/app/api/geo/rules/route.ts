import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"

// GET /api/geo/rules - list user's generation rules
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const rules = await prismaIp.generationRule.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ rules })
}

// POST /api/geo/rules - save a new generation rule
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { name, articleType, tone, targetLength, targetQuestions, extraRules } = await req.json()

  if (!name) return NextResponse.json({ error: "规则名称必填" }, { status: 400 })

  const rule = await prismaIp.generationRule.create({
    data: {
      userId: user.id,
      name,
      articleType: articleType || "品宣文章",
      tone: tone || "专业",
      targetLength: parseInt(targetLength) || 1200,
      targetQuestions: targetQuestions || "",
      extraRules: extraRules || "",
    },
  })

  return NextResponse.json({ rule })
}

// DELETE /api/geo/rules/[id]
export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID 必填" }, { status: 400 })

  await prismaIp.generationRule.delete({ where: { id, userId: user.id } })
  return NextResponse.json({ success: true })
}
