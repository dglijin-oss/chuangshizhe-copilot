import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseBody, knowledgeSourceSchema } from "@/lib/validation"

// GET /api/account-knowledge/sources - list sources
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sourceType = searchParams.get("sourceType")

  const where: any = { userId: user.id }
  if (sourceType) where.sourceType = sourceType

  const sources = await prisma.knowledgeSource.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ sources })
}

// POST /api/account-knowledge/sources - create source
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { title, subtitle, content, sourceType, ipId, fileName } = parseBody(knowledgeSourceSchema, await req.json())

  const source = await prisma.knowledgeSource.create({
    data: {
      userId: user.id,
      title,
      subtitle: subtitle || null,
      content: content || null,
      sourceType, // ip_profile, imported_file, imported_text, manual
      ipId: ipId || null,
      fileName: fileName || null,
    },
  })

  await prisma.compileEvent.create({
    data: {
      userId: user.id,
      action: "source_imported",
      detail: `来源导入: ${title}`,
    },
  })

  return NextResponse.json({ source })
}

// DELETE /api/account-knowledge/sources - delete source
export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 })

  await prisma.knowledgeSource.delete({
    where: { id, userId: user.id },
  })

  return NextResponse.json({ success: true })
}
