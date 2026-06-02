import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"
import { parseBody, knowledgeSourceSchema } from "@/lib/validation"
import { softDelete } from "@/lib/soft-delete"

// GET /api/account-knowledge/sources - list sources
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sourceType = searchParams.get("sourceType")

  const where: any = softDelete({ userId: user.id })
  if (sourceType) where.sourceType = sourceType

  const sources = await prismaIp.knowledgeSource.findMany({
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

  const source = await prismaIp.knowledgeSource.create({
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

  await prismaIp.compileEvent.create({
    data: {
      userId: user.id,
      action: "source_imported",
      detail: `来源导入: ${title}`,
    },
  })

  return NextResponse.json({ source })
}

// DELETE /api/account-knowledge/sources - soft delete source
export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 })

  await prismaIp.knowledgeSource.update({
    where: { id, userId: user.id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
