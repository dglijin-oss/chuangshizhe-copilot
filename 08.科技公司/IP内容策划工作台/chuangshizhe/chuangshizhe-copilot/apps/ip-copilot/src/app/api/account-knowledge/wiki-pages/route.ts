import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"
import { parseBody, wikiPageSchema } from "@/lib/validation"
import { softDelete } from "@/lib/soft-delete"

// GET /api/account-knowledge/wiki-pages - list wiki pages
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")

  const where: any = softDelete({ userId: user.id })
  if (category) where.category = category

  const pages = await prismaIp.wikiPage.findMany({
    where,
    include: { source: { select: { title: true, sourceType: true, deletedAt: false } } },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ pages })
}

// POST /api/account-knowledge/wiki-pages - create wiki page
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { title, content, category, sourceId, ipId } = parseBody(wikiPageSchema, await req.json())

  const page = await prismaIp.wikiPage.create({
    data: {
      userId: user.id,
      title,
      content,
      category,
      sourceId: sourceId || null,
      ipId: ipId || null,
    },
    include: { source: { select: { title: true, sourceType: true } } },
  })

  // Log compile event
  await prismaIp.compileEvent.create({
    data: {
      userId: user.id,
      action: "page_updated",
      detail: `Wiki 页面创建: ${title}`,
    },
  })

  return NextResponse.json({ page })
}

// PUT /api/account-knowledge/wiki-pages - update wiki page
export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id, title, content } = await req.json()

  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 })

  // Verify ownership (exclude soft-deleted)
  const existing = await prismaIp.wikiPage.findFirst({
    where: softDelete({ id, userId: user.id }),
  })
  if (!existing) return NextResponse.json({ error: "页面不存在" }, { status: 404 })

  const page = await prismaIp.wikiPage.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(content !== undefined && { content }),
    },
  })

  await prismaIp.compileEvent.create({
    data: {
      userId: user.id,
      action: "page_updated",
      detail: `Wiki 页面更新: ${page.title}`,
    },
  })

  return NextResponse.json({ page })
}

// DELETE /api/account-knowledge/wiki-pages - soft delete wiki page
export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 })

  const page = await prismaIp.wikiPage.findUnique({ where: { id } })
  if (!page || page.userId !== user.id) {
    return NextResponse.json({ error: "页面不存在" }, { status: 404 })
  }

  // Soft delete
  await prismaIp.wikiPage.update({ where: { id }, data: { deletedAt: new Date() } })

  await prismaIp.compileEvent.create({
    data: {
      userId: user.id,
      action: "page_deleted",
      detail: `Wiki 页面删除: ${page.title}`,
    },
  })

  return NextResponse.json({ success: true })
}
