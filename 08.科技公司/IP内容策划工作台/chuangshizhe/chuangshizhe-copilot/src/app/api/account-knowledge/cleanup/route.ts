import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"

// POST /api/account-knowledge/cleanup - remove messy wiki pages with source-derived titles
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  // Delete wiki pages whose titles look like source material (contain brackets like [发布包], [IP档案])
  const messyPages = await prismaIp.wikiPage.findMany({
    where: {
      userId: user.id,
      category: { not: "overview" },
      OR: [
        { title: { contains: "[" } },
        { title: { contains: "【" } },
        { title: { contains: "[发布包]" } },
        { title: { contains: "[IP档案]" } },
      ],
    },
  })

  const deletedCount = messyPages.length
  if (deletedCount > 0) {
    await prismaIp.wikiPage.deleteMany({
      where: {
        id: { in: messyPages.map((p: any) => p.id) },
      },
    })

    await prismaIp.compileEvent.create({
      data: {
        userId: user.id,
        action: "wiki_compiled",
        detail: `清理 ${deletedCount} 个混乱 Wiki 页面`,
      },
    })
  }

  return NextResponse.json({ deletedCount })
}
