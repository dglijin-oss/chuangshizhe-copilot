import { prismaIp } from "./prisma"

export interface KnowledgeContext {
  memories: string  // formatted AccountMemory entries
  wikiPages: string // formatted WikiPage entries
}

/**
 * Fetch AccountMemory + WikiPage for a given IP/user scope.
 * Used to inject knowledge constraints into AI prompts.
 *
 * Priority order for prompt injection:
 * 1. IP-specific AccountMemory (writing preferences, forbidden expressions, fact corrections, customer insights)
 * 2. Account-level AccountMemory (global rules)
 * 3. IP-specific WikiPage (ip_subpage, trust_asset)
 * 4. Account-level WikiPage (overview)
 */
export async function fetchKnowledgeContext(
  userId: string,
  ipId: string | null
): Promise<KnowledgeContext> {
  const memoryCategoryLabels: Record<string, string> = {
    fact_correction: "事实纠错",
    writing_preference: "写作偏好",
    expression_restriction: "表达禁区",
    customer_insight: "客户洞察",
  }

  const pageCategoryLabels: Record<string, string> = {
    overview: "总览",
    ip_subpage: "IP 子页",
    trust_asset: "信任资产",
  }

  // Parallel fetch all 4 independent queries
  const [ipMemories, accountMemories, ipWikiPages, accountWikiPages] = await Promise.all([
    ipId
      ? prismaIp.accountMemory.findMany({ where: { userId, ipId }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    prismaIp.accountMemory.findMany({ where: { userId, ipId: null }, orderBy: { createdAt: "desc" } }),
    ipId
      ? prismaIp.wikiPage.findMany({ where: { userId, ipId }, orderBy: { updatedAt: "desc" } })
      : Promise.resolve([]),
    prismaIp.wikiPage.findMany({ where: { userId, ipId: null }, orderBy: { updatedAt: "desc" } }),
  ])

  // Format AccountMemory as structured text for prompt injection
  const allMemories = [...ipMemories, ...accountMemories]
  const groupedMemories: Record<string, string[]> = {}
  for (const m of allMemories) {
    const label = memoryCategoryLabels[m.category] || m.category
    if (!groupedMemories[label]) groupedMemories[label] = []
    groupedMemories[label].push(m.content)
  }

  let memoriesBlock = "无"
  if (allMemories.length > 0) {
    const parts = Object.entries(groupedMemories).map(([label, items]) => {
      return `- ${label}：${items.join("；")}`
    })
    memoriesBlock = parts.join("\n")
  }

  // Format WikiPage content for prompt injection (cap total length)
  const allPages = [...ipWikiPages, ...accountWikiPages]
  let wikiBlock = "无"
  if (allPages.length > 0) {
    const chunks = allPages
      .slice(0, 8) // limit to 8 pages
      .map((p) => {
        const label = pageCategoryLabels[p.category] || p.category
        const content = (p.content || "").substring(0, 2000) // cap per page
        return `## ${p.title} [${label}]\n${content}`
      })
    wikiBlock = chunks.join("\n\n")
  }

  return { memories: memoriesBlock, wikiPages: wikiBlock }
}
