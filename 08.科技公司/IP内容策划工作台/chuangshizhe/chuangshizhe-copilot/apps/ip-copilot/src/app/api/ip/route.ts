import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { parseBody, createIpSchema } from "@/lib/validation"

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  try {
    const { name, founderName, founderTraits, industry, products, targetClients, accountGoals, contentBan, contentMixFlow, contentMixPersona, contentMixProduct } = parseBody(createIpSchema, await req.json())

    const ip = await prisma.ip.create({
      data: {
        userId: user.id,
        name,
        founderName: founderName || undefined,
        founderTraits: Array.isArray(founderTraits) ? founderTraits : founderTraits || undefined,
        industry: industry || undefined,
        products: Array.isArray(products) ? products : products || undefined,
        targetClients: Array.isArray(targetClients) ? targetClients : targetClients || undefined,
        accountGoals: Array.isArray(accountGoals) ? accountGoals : accountGoals || undefined,
        contentBan: Array.isArray(contentBan) ? contentBan : contentBan || undefined,
        contentMixFlow: Math.max(0, contentMixFlow ? (typeof contentMixFlow === "number" ? contentMixFlow : parseInt(contentMixFlow) || 4) : 4),
        contentMixPersona: Math.max(0, contentMixPersona ? (typeof contentMixPersona === "number" ? contentMixPersona : parseInt(contentMixPersona) || 2) : 2),
        contentMixProduct: Math.max(0, contentMixProduct ? (typeof contentMixProduct === "number" ? contentMixProduct : parseInt(contentMixProduct) || 1) : 1),
      },
    })

    // Auto-create knowledge source (IP profile) and wiki page
    const profileContent = [
      `**名称**: ${ip.name}`,
      founderName ? `**创始人**: ${founderName}` : null,
      founderTraits ? `**人设特点**: ${founderTraits}` : null,
      industry ? `**行业**: ${industry}` : null,
      products ? `**产品/服务**: ${products}` : null,
      targetClients ? `**目标客户**: ${targetClients}` : null,
      accountGoals ? `**账号目标**: ${accountGoals}` : null,
      contentBan ? `**内容禁区**: ${contentBan}` : null,
      `\n**内容配比**`,
      `- 流量型: ${ip.contentMixFlow}`,
      `- 人设型: ${ip.contentMixPersona}`,
      `- 产品型: ${ip.contentMixProduct}`,
    ].filter(Boolean).join("\n")

    await Promise.all([
      prisma.knowledgeSource.create({
        data: {
          userId: user.id,
          ipId: ip.id,
          sourceType: "ip_profile",
          title: `${ip.name} - IP 档案`,
          content: profileContent,
        },
      }),
      prisma.wikiPage.create({
        data: {
          userId: user.id,
          ipId: ip.id,
          title: ip.name,
          category: "ip_subpage",
          content: `# ${ip.name}\n\n${profileContent}`,
        },
      }),
      prisma.compileEvent.create({
        data: {
          userId: user.id,
          action: "ip_created",
          detail: `IP 创建: ${ip.name}，自动同步至知识库`,
        },
      }),
    ])

    return NextResponse.json({ ip })
  } catch (err) {
    console.error("Create IP error:", err)
    return NextResponse.json({ error: "创建失败" }, { status: 500 })
  }
}
