import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"
import { parseBody, corpusFeedSchema } from "@/lib/validation"
import { softDelete } from "@/lib/soft-delete"

// GET /api/corpus-feed - list feeds for an IP
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ipId = searchParams.get("ipId")

  const where: any = softDelete({ userId: user.id })
  if (ipId) where.ipId = ipId

  const feeds = await prismaIp.corpusFeed.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ feeds })
}

// POST /api/corpus-feed - create a feed entry
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { ipId, feedType, title, fileName, content } = parseBody(corpusFeedSchema, await req.json())

  const feed = await prismaIp.corpusFeed.create({
    data: {
      userId: user.id,
      ipId: ipId || null,
      feedType,
      title: title || null,
      fileName: fileName || null,
      content,
      status: "pending",
    },
  })

  return NextResponse.json({ feed })
}

// DELETE /api/corpus-feed - soft delete a feed
export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 })

  const feed = await prismaIp.corpusFeed.findUnique({ where: { id } })
  if (!feed || feed.userId !== user.id) {
    return NextResponse.json({ error: "语料不存在" }, { status: 404 })
  }

  await prismaIp.corpusFeed.update({ where: { id }, data: { deletedAt: new Date() } })
  return NextResponse.json({ success: true })
}
