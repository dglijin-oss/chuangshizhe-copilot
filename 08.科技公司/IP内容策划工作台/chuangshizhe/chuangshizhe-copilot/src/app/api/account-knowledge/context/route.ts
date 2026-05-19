import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseBody, contextSchema } from "@/lib/validation"

// POST /api/account-knowledge/context - inject knowledge context for AI generation
// Used by GEO article generation, IP content generation, and agent chat
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { purpose, ipId } = parseBody(contextSchema, await req.json())

  // purpose: "geo_article" | "ip_content" | "agent_chat" | "weekly_plan"

  // Always include overview
  const overview = await prisma.wikiPage.findFirst({
    where: { userId: user.id, category: "overview" },
    select: { title: true, content: true, category: true },
  })

  const context: any = {
    overview: overview ? { title: overview.title, content: overview.content } : null,
    companyInfo: null,
    ipPages: [],
    trustAssets: [],
    sources: [],
    usageRules: null,
  }

  // For IP-specific requests, include IP subpage and trust assets
  if (ipId) {
    const [ipPage, ipTrustAssets, ipSources] = await Promise.all([
      prisma.wikiPage.findFirst({
        where: { userId: user.id, category: "ip_subpage", ipId },
        select: { title: true, content: true },
      }),
      prisma.wikiPage.findMany({
        where: { userId: user.id, category: "trust_asset", ipId },
        select: { title: true, content: true },
      }),
      prisma.knowledgeSource.findMany({
        where: { userId: user.id, ipId },
        select: { title: true, content: true, sourceType: true },
        take: 10,
      }),
    ])

    context.ipPages = ipPage ? [{ title: ipPage.title, content: ipPage.content }] : []
    context.trustAssets = ipTrustAssets.map((a: any) => ({ title: a.title, content: a.content }))
    context.sources = ipSources.map((s: any) => ({ title: s.title, content: s.content, sourceType: s.sourceType }))
  } else {
    // For account-level requests, include all trust assets and sources
    const [allTrustAssets, allSources] = await Promise.all([
      prisma.wikiPage.findMany({
        where: { userId: user.id, category: "trust_asset" },
        select: { title: true, content: true },
        take: 20,
      }),
      prisma.knowledgeSource.findMany({
        where: { userId: user.id },
        select: { title: true, content: true, sourceType: true },
        take: 20,
      }),
    ])

    context.trustAssets = allTrustAssets.map((a: any) => ({ title: a.title, content: a.content }))
    context.sources = allSources.map((s: any) => ({ title: s.title, content: s.content, sourceType: s.sourceType }))
  }

  // Build formatted context for prompt injection
  const formattedContext = buildPromptContext(context, purpose || "")

  return NextResponse.json({ context, formattedContext })
}

function buildPromptContext(ctx: any, purpose: string): string {
  const lines: string[] = []

  lines.push("=== 账号知识库上下文 ===")
  lines.push("")

  if (ctx.overview) {
    lines.push("--- 账号总览 ---")
    lines.push(ctx.overview.content)
    lines.push("")
  }

  if (ctx.ipPages.length > 0) {
    lines.push("--- IP 子页 ---")
    ctx.ipPages.forEach((p: any) => {
      lines.push(`## ${p.title}`)
      lines.push(p.content)
      lines.push("")
    })
  }

  if (ctx.trustAssets.length > 0) {
    lines.push("--- 信任资产 ---")
    ctx.trustAssets.forEach((a: any) => {
      lines.push(`## ${a.title}`)
      lines.push(a.content)
      lines.push("")
    })
  }

  if (ctx.sources.length > 0) {
    lines.push("--- 资料来源 ---")
    ctx.sources.forEach((s: any) => {
      lines.push(`## [${s.sourceType}] ${s.title}`)
      lines.push(s.content?.slice(0, 2000))
      lines.push("")
    })
  }

  lines.push("=== 使用规则 ===")
  lines.push("- GEO 文章优先读取公司主体、信任资产、资料来源。")
  lines.push("- IP 文稿读取账号总库和对应 IP 子页，禁止串用其他 IP 的人设与禁区。")
  lines.push("- 涉及资质、客户、数据、认证时必须来自来源资料，缺失时标注待补充。")
  lines.push("")
  lines.push("=== 上下文结束 ===")

  return lines.join("\n")
}
