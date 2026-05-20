import { NextResponse } from "next/server"
import { prismaCore, prismaIp } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  try {
    const body = await req.json()
    const { answers } = body as { answers: Record<string, string> }

    const existing = await prismaIp.questionnaire.findFirst({
      where: { userId: user.id, submitted: true },
    })
    if (existing) {
      return NextResponse.json({ error: "问卷已提交过，无需重复" }, { status: 400 })
    }

    await prismaIp.questionnaire.create({
      data: {
        userId: user.id,
        industry: answers["01"] || null,
        businessVolume: answers["02"] || null,
        role: answers["03"] || null,
        teamSize: answers["04"] || null,
        clientLocation: answers["05"] || null,
        primaryPlatform: answers["06"] || null,
        contentFreq: answers["07"] || null,
        accountGoal: answers["08"] || null,
        contentPain: answers["09"] || null,
        clientType: answers["10"] || null,
        priceRange: answers["11"] || null,
        salesCycle: answers["12"] || null,
        aiUsageFreq: answers["13"] || null,
        productIntro: answers["14"] || null,
        supplement: answers["15"] || null,
        submitted: true,
      },
    })

    await prismaCore.user.update({
      where: { id: user.id },
      data: { points: user.points + 10 },
    })

    // Generate account knowledge overview wiki page
    const overviewContent = [
      `# 账号知识库总览`,
      ``,
      `## 公司主体`,
      `- **公司**: ${answers["14"] || "待补充公司名称"}`,
      `- **定位**: ${answers["01"] || "待补充"}`,
      `- **行业**: ${answers["01"] || "待补充"}`,
      ``,
      `## IP 账号`,
      `- **${answers["14"]?.slice(0, 10) || "待补充"}**: ${answers["10"] || "待补充目标客户"}`,
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

    await prismaIp.wikiPage.create({
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
        detail: "问卷提交后自动生成账号知识库总览",
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Questionnaire submission error:", err)
    return NextResponse.json({ error: "提交失败，请稍后重试" }, { status: 500 })
  }
}
