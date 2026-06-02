import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"
import { softDelete } from "@/lib/soft-delete"

// GET /api/geo/articles - list all GEO articles for current user
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  const articles = await prismaIp.geoArticle.findMany({
    where: softDelete({ userId: user.id }),
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  })

  const total = await prismaIp.geoArticle.count({ where: softDelete({ userId: user.id }) })

  return NextResponse.json({ articles, total, page, limit })
}

// POST /api/geo/articles - save a GEO article
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { topic, keywords, platform, tone, length, targetQuestions, articleType, ipId, content } = await req.json()

  if (!topic) return NextResponse.json({ error: "文章主题必填" }, { status: 400 })

  const article = await prismaIp.geoArticle.create({
    data: {
      userId: user.id,
      topic,
      keywords: keywords || "",
      platform: platform || "",
      tone: tone || "专业",
      targetLength: parseInt(length) || 1200,
      targetQuestions: targetQuestions || "",
      articleType: articleType || "品宣文章",
      ipId: ipId || null,
      content: content || null,
    },
  })

  return NextResponse.json({ article })
}

// PATCH /api/geo/articles/[id] - update article content after generation
export async function PATCH(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID 必填" }, { status: 400 })

  const { content, status } = await req.json()

  const result = await prismaIp.geoArticle.updateMany({
    where: softDelete({ id, userId: user.id }),
    data: {
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
    },
  })
  if (result.count === 0) return NextResponse.json({ error: "文章不存在" }, { status: 404 })

  const article = await prismaIp.geoArticle.findFirst({
    where: softDelete({ id, userId: user.id }),
  })

  return NextResponse.json({ article })
}
