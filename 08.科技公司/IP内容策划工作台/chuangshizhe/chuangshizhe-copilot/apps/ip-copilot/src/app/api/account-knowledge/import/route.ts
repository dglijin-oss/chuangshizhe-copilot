import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseBody, knowledgeSourceSchema } from "@/lib/validation"

// POST /api/account-knowledge/import - import knowledge from text/file
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { title, content, sourceType, fileName, ipId } = parseBody(knowledgeSourceSchema, await req.json())

  const source = await prisma.knowledgeSource.create({
    data: {
      userId: user.id,
      title,
      content,
      sourceType: sourceType || "imported_text",
      fileName: fileName || null,
      ipId: ipId || null,
    },
  })

  await prisma.compileEvent.create({
    data: {
      userId: user.id,
      action: "source_imported",
      detail: `资料导入: ${title}`,
    },
  })

  return NextResponse.json({ source })
}
