import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/account-knowledge/overview - stats cards with live data
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const [sourceCount, wikiCount, ipSubpageCount, trustAssetCount, ipCount] = await Promise.all([
    prisma.knowledgeSource.count({ where: { userId: user.id } }),
    prisma.wikiPage.count({ where: { userId: user.id } }),
    prisma.wikiPage.count({ where: { userId: user.id, category: "ip_subpage" } }),
    prisma.wikiPage.count({ where: { userId: user.id, category: "trust_asset" } }),
    prisma.ip.count({ where: { userId: user.id } }),
  ])

  const latestEvent = await prisma.compileEvent.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    sourceCount,
    wikiCount,
    ipSubpageCount,
    snippetCount: trustAssetCount, // trust assets shown as "检索片段" stat
    ipCount,
    trustAssetCount,
    lastCompileTime: latestEvent?.createdAt ?? null,
  })
}
