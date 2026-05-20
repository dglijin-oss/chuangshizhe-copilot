import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"

// POST /api/account-knowledge/init-overview - ensure overview wiki page exists
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  // Check if overview already exists
  const existing = await prismaIp.wikiPage.findFirst({
    where: { userId: user.id, category: "overview" },
  })
  if (existing) {
    return NextResponse.json({ page: existing, created: false })
  }

  // Try to get questionnaire data
  const questionnaire = await prismaIp.questionnaire.findFirst({
    where: { userId: user.id, submitted: true },
  })

  let companyName = "待补充公司名称"
  let industry = "待补充"
  let targetClient = "待补充目标客户"

  if (questionnaire) {
    companyName = questionnaire.productIntro || "待补充公司名称"
    industry = questionnaire.industry || "待补充"
    targetClient = questionnaire.clientType || "待补充目标客户"
  }

  const shortName = companyName.slice(0, 10)

  const overviewContent = [
    `# 账号知识库总览`,
    ``,
    `## 公司主体`,
    `- **公司**: ${companyName}`,
    `- **定位**: ${industry}`,
    `- **行业**: ${industry}`,
    ``,
    `## IP 账号`,
    `- **${shortName}**: ${targetClient}`,
    ``,
    `## 信任资产`,
    `- **总数**: 0`,
    `- **T1**: 0`,
    `- **T2**: 0`,
    `- **T3**: 0`,
    ``,
    `## 资料来源`,
    `- **资料库文档**: 0`,
    ``,
    `## 使用规则`,
    `- GEO 文章优先读取公司主体、信任资产、资料来源。`,
    `- IP 文稿读取账号总库和对应 IP 子页，禁止串用其他 IP 的人设与禁区。`,
    `- 涉及资质、客户、数据、认证时必须来自来源资料，缺失时标注待补充。`,
  ].join("\n")

  const page = await prismaIp.wikiPage.create({
    data: {
      userId: user.id,
      title: "账号知识库总览",
      category: "overview",
      content: overviewContent,
    },
  })

  await prismaIp.compileEvent.create({
    data: {
      userId: user.id,
      action: "wiki_compiled",
      detail: "初始化账号知识库总览页面",
    },
  })

  return NextResponse.json({ page, created: true })
}
