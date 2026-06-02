import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"
import { softDelete } from "@/lib/soft-delete"

// GET /api/geo/publish - list publish records
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const records = await prismaIp.publishRecord.findMany({
    where: softDelete({ userId: user.id }),
    orderBy: { createdAt: "desc" },
    include: { geoArticle: true },
    take: 50,
  })

  return NextResponse.json({ records })
}

// POST /api/geo/publish - create a publish record
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { platform, title, content, geoArticleId } = await req.json()

  if (!platform || !title) return NextResponse.json({ error: "平台和标题必填" }, { status: 400 })

  const record = await prismaIp.publishRecord.create({
    data: {
      userId: user.id,
      platform,
      title,
      content: content || "",
      geoArticleId: geoArticleId || null,
      status: "published",
      publishedAt: new Date(),
    },
  })

  return NextResponse.json({ record })
}
