import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaCore, prismaIp } from "@/lib/prisma"
import { chat } from "@/lib/llm"
import { deductPoints } from "@/lib/billing"
import { logGeneration } from "@/lib/logging"
import { parseBody, recompileSchema } from "@/lib/validation"
import { updateOverview } from "@/lib/knowledge-overview"

export const maxDuration = 300 // 5 minutes for AI compilation

// POST /api/account-knowledge/recompile - regenerate wiki pages from sources
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  try {
    const { ipId } = parseBody(recompileSchema, await req.json())

    // Get all sources for this user (optionally filtered by IP)
    const where: any = { userId: user.id }
    if (ipId) where.ipId = ipId

    const sources = await prismaIp.knowledgeSource.findMany({ where })

    if (sources.length === 0) {
      return NextResponse.json({ error: "没有可编译的来源" }, { status: 400 })
    }

    const sourceContent = sources
      .map((s) => `## ${s.title}\n${s.subtitle ?? ""}\n${s.content ?? ""}`)
      .join("\n\n")

    const action = ipId ? "wiki_recompiled" : "wiki_compiled"

    // Fetch IP info for prompt context if ipId is provided
    let ipContext = ""
    if (ipId) {
      const ip = await prismaIp.ip.findUnique({ where: { id: ipId, userId: user.id } })
      if (ip) {
        ipContext = `
## 当前 IP 信息
- 名称：${ip.name}
- 创始人：${ip.founderName || "未填写"}
- 人设特点：${ip.founderTraits ? (Array.isArray(ip.founderTraits) ? ip.founderTraits.join("、") : ip.founderTraits) : "未填写"}
- 行业：${ip.industry || "未填写"}
- 产品/服务：${ip.products ? (Array.isArray(ip.products) ? ip.products.join("、") : ip.products) : "未填写"}
- 目标客户：${ip.targetClients ? (Array.isArray(ip.targetClients) ? ip.targetClients.join("、") : ip.targetClients) : "未填写"}
- 内容禁区：${ip.contentBan ? (Array.isArray(ip.contentBan) ? ip.contentBan.join("、") : ip.contentBan) : "无"}
`
      }
    }

    const prompt = `你是一位专业的知识编译 agent${ipId ? `，专门为「${ipContext.match(/名称：(.+)/)?.[1] || "该 IP"}」编译 Wiki 页面` : ""}。以下是账号的知识来源材料：

${sourceContent}
${ipContext ? `请先读取上方 IP 信息，确保编译出的内容符合该 IP 的人设和业务场景。\n` : ""}
请将这些材料编译为结构化的 Wiki 页面。返回纯 JSON，格式如下：
{
  "pages": [
    {"title": "简洁的页面标题", "category": "ip_subpage", "content": "markdown格式内容"},
    {"title": "简洁的页面标题", "category": "trust_asset", "content": "markdown格式内容"}
  ]
}

约定：
- category 只能是 ip_subpage 或 trust_asset（不要生成 overview，总览页由系统维护）
- title 必须是简洁的描述性标题（如"产品知识"、"品牌介绍"），禁止使用来源文件的原始标题
- content 必须是 markdown 格式
- 至少生成 1-3 个页面
- 每个页面内容要结构化，使用标题、列表等 markdown 语法`

    const startTime = Date.now()
    const deducted = await deductPoints(user.id, 5)
    if (!deducted) {
      return NextResponse.json({ error: "积分不足" }, { status: 402 })
    }
    const result = await chat([{ role: "user", content: prompt }])
    await logGeneration(user.id, "knowledge_compile", "qwen3-max-2026-01-23", "success", result.length / 4, 0.01, Date.now() - startTime)
    const cleaned = result.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI 返回格式异常" }, { status: 422 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.pages || !Array.isArray(parsed.pages)) {
      return NextResponse.json({ error: "AI 返回缺少 pages 字段" }, { status: 422 })
    }

    // Delete existing non-overview pages (preserve the account knowledge overview)
    if (ipId) {
      await prismaIp.wikiPage.deleteMany({ where: { userId: user.id, ipId } })
    } else {
      await prismaIp.wikiPage.deleteMany({ where: { userId: user.id, category: { not: "overview" } } })
    }

    // Link compiled pages to the first source as primary reference
    const primarySourceId = sources[0]?.id || null

    const pages = await Promise.all(
      parsed.pages.map((page: any) =>
        prismaIp.wikiPage.create({
          data: {
            userId: user.id,
            title: page.title,
            content: page.content,
            category: page.category,
            ipId: ipId || null,
            sourceId: primarySourceId,
          },
        })
      )
    )

    await prismaIp.compileEvent.create({
      data: {
        userId: user.id,
        action,
        detail: `Wiki 编译完成: ${pages.length} 个页面${ipId ? ` (IP: ${ipId})` : ""}`,
      },
    })

    // Trigger overview update with live stats
    try {
      await updateOverview(user.id)
    } catch { /* ignore overview update errors */ }

    return NextResponse.json({ pages })
  } catch (err: any) {
    console.error("Recompile error:", err)
    await prismaCore.generationLog.create({
      data: { userId: user.id, type: "knowledge_compile", model: "qwen3-max-2026-01-23", status: "error", duration: 0, error: err.message },
    })
    return NextResponse.json({ error: "编译失败，请稍后重试" }, { status: 500 })
  }
}
