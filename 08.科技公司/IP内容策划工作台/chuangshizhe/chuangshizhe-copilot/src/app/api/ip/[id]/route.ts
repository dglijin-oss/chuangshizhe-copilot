import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseBody, updateIpSchema } from "@/lib/validation"

// GET /api/ip/[id] - get single IP
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params

  const ip = await prisma.ip.findUnique({
    where: { id, userId: user.id },
  })
  if (!ip) return NextResponse.json({ error: "IP 不存在" }, { status: 404 })

  return NextResponse.json({ ip })
}

// PATCH /api/ip/[id] - update IP
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const body = parseBody(updateIpSchema, await req.json())

  const existing = await prisma.ip.findUnique({
    where: { id },
  })
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "IP 不存在" }, { status: 404 })
  }

  const {
    name, founderName, founderTraits, industry, products,
    targetClients, accountGoals, contentBan, contentMixFlow,
    contentMixPersona, contentMixProduct,
  } = body

  const ip = await prisma.ip.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(founderName !== undefined && { founderName }),
      ...(founderTraits !== undefined && { founderTraits: Array.isArray(founderTraits) ? founderTraits.join(",") : founderTraits }),
      ...(industry !== undefined && { industry }),
      ...(products !== undefined && { products: Array.isArray(products) ? products.join(",") : products }),
      ...(targetClients !== undefined && { targetClients: Array.isArray(targetClients) ? targetClients.join(",") : targetClients }),
      ...(accountGoals !== undefined && { accountGoals: Array.isArray(accountGoals) ? accountGoals.join(",") : accountGoals }),
      ...(contentBan !== undefined && { contentBan: Array.isArray(contentBan) ? contentBan.join(",") : contentBan }),
      ...(contentMixFlow !== undefined && { contentMixFlow: Math.max(0, typeof contentMixFlow === "number" ? contentMixFlow : parseInt(contentMixFlow) || 4) }),
      ...(contentMixPersona !== undefined && { contentMixPersona: Math.max(0, typeof contentMixPersona === "number" ? contentMixPersona : parseInt(contentMixPersona) || 2) }),
      ...(contentMixProduct !== undefined && { contentMixProduct: Math.max(0, typeof contentMixProduct === "number" ? contentMixProduct : parseInt(contentMixProduct) || 1) }),
    },
  })

  // Sync to knowledge base: update KnowledgeSource and WikiPage
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

  await Promise.all([
    prisma.knowledgeSource.updateMany({
      where: { userId: user.id, ipId: ip.id, sourceType: "ip_profile" },
      data: { title: `${ip.name} - IP 档案`, content: syncContent },
    }),
    prisma.wikiPage.updateMany({
      where: { userId: user.id, ipId: ip.id, category: "ip_subpage" },
      data: { title: ip.name, content: `# ${ip.name}\n\n${syncContent}` },
    }),
  ])

  return NextResponse.json({ ip })
}
