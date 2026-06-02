import { prismaIp } from "./prisma"

export async function updateOverview(userId: string) {
  // Gather live stats (exclude soft-deleted)
  const [questionnaire, ipCount, allIps, trustAssets, sourceCount, wikiPageCount, ipSubpageCount] =
    await Promise.all([
      prismaIp.questionnaire.findFirst({ where: { userId, submitted: true } }),
      prismaIp.ip.count({ where: { userId, deletedAt: null } }),
      prismaIp.ip.findMany({ where: { userId, deletedAt: null }, select: { id: true, name: true, targetClients: true } }),
      prismaIp.wikiPage.findMany({ where: { userId, category: "trust_asset", deletedAt: null } }),
      prismaIp.knowledgeSource.count({ where: { userId, deletedAt: null } }),
      prismaIp.wikiPage.count({ where: { userId, deletedAt: null } }),
      prismaIp.wikiPage.count({ where: { userId, category: "ip_subpage", deletedAt: null } }),
    ])

  let companyName = "待补充公司名称"
  let industry = "待补充"
  let targetClient = "待补充目标客户"

  if (questionnaire) {
    companyName = questionnaire.productIntro || "待补充公司名称"
    industry = questionnaire.industry || "待补充"
    targetClient = questionnaire.clientType || "待补充目标客户"
  }

  // Build IP account section with live data
  const ipLines = allIps.map((ip: any) => {
    const clients = ip.targetClients || "待补充目标客户"
    return `- **${ip.name}**: ${clients}`
  }).join("\n")

  // Count trust asset tiers
  const t1Count = trustAssets.filter((a: any) => a.content?.includes("T1") || a.title?.includes("T1")).length
  const t2Count = trustAssets.filter((a: any) => a.content?.includes("T2") || a.title?.includes("T2")).length
  const t3Count = trustAssets.filter((a: any) => a.content?.includes("T3") || a.title?.includes("T3")).length

  const overviewContent = [
    `# 账号知识库总览`,
    ``,
    `## 公司主体`,
    `- **公司**: ${companyName}`,
    `- **定位**: ${industry}`,
    `- **行业**: ${industry}`,
    ``,
    `## IP 账号`,
    `- **IP 总数**: ${ipCount}`,
    ipLines || `- *暂无 IP 账号，请先创建 IP*`,
    ``,
    `## 信任资产`,
    `- **总数**: ${trustAssets.length}`,
    `- **T1**: ${t1Count}`,
    `- **T2**: ${t2Count}`,
    `- **T3**: ${t3Count}`,
    ``,
    `## 资料来源`,
    `- **资料库文档**: ${sourceCount}`,
    `- **Wiki 页面**: ${wikiPageCount}`,
    `- **IP 子页**: ${ipSubpageCount}`,
    ``,
    `## 使用规则`,
    `- GEO 文章优先读取公司主体、信任资产、资料来源。`,
    `- IP 文稿读取账号总库和对应 IP 子页，禁止串用其他 IP 的人设与禁区。`,
    `- 涉及资质、客户、数据、认证时必须来自来源资料，缺失时标注待补充。`,
  ].join("\n")

  // Upsert overview
  const existing = await prismaIp.wikiPage.findFirst({
    where: { userId, category: "overview", deletedAt: null },
  })

  let page
  if (existing) {
    page = await prismaIp.wikiPage.update({
      where: { id: existing.id },
      data: { content: overviewContent, updatedAt: new Date() },
    })
  } else {
    page = await prismaIp.wikiPage.create({
      data: {
        userId,
        title: "账号知识库总览",
        category: "overview",
        content: overviewContent,
      },
    })
  }

  // Ensure each IP has exactly one wiki subpage and one knowledge source (auto-sync + dedup)
  const fullIps = await prismaIp.ip.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, name: true, founderName: true, founderTraits: true, industry: true, products: true, targetClients: true, accountGoals: true, contentBan: true, contentMixFlow: true, contentMixPersona: true, contentMixProduct: true },
  })

  // Process all IPs in parallel
  await Promise.all(fullIps.map(async (ip) => {
    const syncContent = [
      `**名称**: ${ip.name}`,
      ip.founderName ? `**创始人**: ${ip.founderName}` : null,
      ip.founderTraits ? `**人设特点**: ${ip.founderTraits}` : null,
      ip.industry ? `**行业**: ${ip.industry}` : null,
      ip.products ? `**产品/服务**: ${ip.products}` : null,
      ip.targetClients ? `**目标客户**: ${ip.targetClients}` : null,
      ip.accountGoals ? `**账号目标**: ${ip.accountGoals}` : null,
      ip.contentBan ? `**内容禁区**: ${ip.contentBan}` : null,
      `\n**内容配比**`,
      `- 流量型: ${ip.contentMixFlow || 4}`,
      `- 人设型: ${ip.contentMixPersona || 2}`,
      `- 产品型: ${ip.contentMixProduct || 1}`,
    ].filter(Boolean).join("\n")

    // Parallel fetch existing wiki pages and sources for this IP (exclude soft-deleted)
    const [existingWikis, existingSources] = await Promise.all([
      prismaIp.wikiPage.findMany({
        where: { userId, ipId: ip.id, category: "ip_subpage", deletedAt: null },
        orderBy: { updatedAt: "desc" },
      }),
      prismaIp.knowledgeSource.findMany({
        where: { userId, ipId: ip.id, sourceType: "ip_profile", deletedAt: null },
        orderBy: { updatedAt: "desc" },
      }),
    ])

    // Dedup: keep newest, soft delete rest
    if (existingWikis.length > 1) {
      const toDelete = existingWikis.slice(1).map((w: any) => w.id)
      await prismaIp.wikiPage.updateMany({ where: { id: { in: toDelete } }, data: { deletedAt: new Date() } })
    }

    if (existingSources.length > 1) {
      const toDelete = existingSources.slice(1).map((s: any) => s.id)
      await prismaIp.knowledgeSource.updateMany({ where: { id: { in: toDelete } }, data: { deletedAt: new Date() } })
    }

    const latestWiki = existingWikis[0]
    const latestSource = existingSources[0]

    // Parallel upsert source and wiki
    await Promise.all([
      latestSource
        ? prismaIp.knowledgeSource.update({
            where: { id: latestSource.id },
            data: { title: `${ip.name} - IP 档案`, content: syncContent },
          })
        : prismaIp.knowledgeSource.create({
            data: { userId, ipId: ip.id, sourceType: "ip_profile", title: `${ip.name} - IP 档案`, content: syncContent },
          }),
      latestWiki
        ? prismaIp.wikiPage.update({
            where: { id: latestWiki.id },
            data: { title: ip.name, content: `# ${ip.name}\n\n${syncContent}` },
          })
        : prismaIp.wikiPage.create({
            data: { userId, ipId: ip.id, title: ip.name, category: "ip_subpage", content: `# ${ip.name}\n\n${syncContent}` },
          }),
    ])
  }))

  return {
    page,
    stats: { ipCount, trustAssetCount: trustAssets.length, sourceCount, wikiPageCount, ipSubpageCount },
  }
}
