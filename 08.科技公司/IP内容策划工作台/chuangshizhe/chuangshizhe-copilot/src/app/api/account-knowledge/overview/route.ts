import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"

// GET /api/account-knowledge/overview - stats cards with live data
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const [sourceCount, wikiCount, ipSubpageCount, trustAssetCount, ipCount] = await Promise.all([
    prismaIp.knowledgeSource.count({ where: { userId: user.id } }),
    prismaIp.wikiPage.count({ where: { userId: user.id } }),
    prismaIp.wikiPage.count({ where: { userId: user.id, category: "ip_subpage" } }),
    prismaIp.wikiPage.count({ where: { userId: user.id, category: "trust_asset" } }),
    prismaIp.ip.count({ where: { userId: user.id } }),
  ])

  const latestEvent = await prismaIp.compileEvent.findFirst({
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
