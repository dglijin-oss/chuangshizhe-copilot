import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"
import { parseBody, searchSchema } from "@/lib/validation"
import { softDelete } from "@/lib/soft-delete"

// POST /api/account-knowledge/search - search across wiki pages and sources
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { query } = parseBody(searchSchema, await req.json())

  // Search wiki pages and sources using ILIKE (PostgreSQL)
  const [wikiPages, sources] = await Promise.all([
    prismaIp.wikiPage.findMany({
      where: softDelete({
        userId: user.id,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      }),
      take: 20,
    }),
    prismaIp.knowledgeSource.findMany({
      where: softDelete({
        userId: user.id,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      }),
      take: 20,
    }),
  ])

  const results = [
    ...wikiPages.map((p) => ({
      type: "wiki" as const,
      id: p.id,
      title: p.title,
      content: p.content?.slice(0, 200) ?? "",
      category: p.category,
      updatedAt: p.updatedAt,
    })),
    ...sources.map((s) => ({
      type: "source" as const,
      id: s.id,
      title: s.title,
      content: s.content?.slice(0, 200) ?? "",
      sourceType: s.sourceType,
      createdAt: s.createdAt,
    })),
  ]

  return NextResponse.json({ results, total: results.length })
}
