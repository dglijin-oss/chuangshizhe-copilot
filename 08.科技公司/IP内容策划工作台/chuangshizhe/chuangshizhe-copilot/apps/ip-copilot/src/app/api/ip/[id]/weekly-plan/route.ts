import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"
import { chat } from "@/lib/llm"
import { fetchKnowledgeContext } from "@/lib/knowledge"
import { deductPoints } from "@/lib/billing"
import { logGeneration } from "@/lib/logging"
import { parseBody, weeklyPlanGenerateSchema, weeklyPlanSaveSchema } from "@/lib/validation"
import { softDelete } from "@/lib/soft-delete"

// GET /api/ip/[id]/weekly-plan - get latest weekly plan for this IP
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params

  const plan = await prismaIp.weeklyPlan.findFirst({
    where: softDelete({ ipId: id, userId: user.id }),
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { createdAt: "asc" } } },
  })

  return NextResponse.json({ plan })
}

// POST /api/ip/[id]/weekly-plan - generate new weekly plan via AI
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const { userDirection } = parseBody(weeklyPlanGenerateSchema, await req.json())

  const ip = await prismaIp.ip.findFirst({
    where: softDelete({ id, userId: user.id }),
  })
  if (!ip) return NextResponse.json({ error: "IP 不存在" }, { status: 404 })

  // Build prompt for AI to generate weekly plan items
  const mixFlow = ip.contentMixFlow || 4
  const mixPersona = ip.contentMixPersona || 2
  const mixProduct = ip.contentMixProduct || 1
  const total = mixFlow + mixPersona + mixProduct

  // Build knowledge context for prompt injection
  const { memories, wikiPages } = await fetchKnowledgeContext(user.id, id)

  const directionBlock = userDirection
    ? `## 用户特别要求\n本周方向：${userDirection}\n请优先围绕这个方向生成选题。`
    : ""

  const prompt = `你是一位专业的短视频账号周策划 agent。

## IP 档案
- 名称：${ip.name}
- 创始人：${ip.founderName || "未填写"}
- 人设特点：${ip.founderTraits || "未填写"}
- 行业：${ip.industry || "未填写"}
- 产品/服务：${ip.products || "未填写"}
- 目标客户：${ip.targetClients || "未填写"}
- 账号目标：${ip.accountGoals || "未填写"}
- 内容禁区：${ip.contentBan || "无"}

${directionBlock}

## 内容配比
- 流量型：${mixFlow} 条
- 人设型：${mixPersona} 条
- 产品型：${mixProduct} 条
- 总计：${total} 条

## 账号记忆（写作约束）
${memories}

## IP 知识库参考
${wikiPages}

## 输出要求
请只返回纯 JSON，不要包含任何其他文字、markdown 标记或代码块。格式如下：
{
  "summary": "一句话总结本周策划方向",
  "items": [
    {"contentType": "traffic", "title": "选题标题，18字以内，要能抓住注意力", "reason": "为什么这个选题适合这个账号，1-2句话"},
    {"contentType": "persona", "title": "选题标题", "reason": "为什么"},
    {"contentType": "product", "title": "选题标题", "reason": "为什么"}
  ]
}

## 约定
- items 数组总个数必须严格等于 ${total}
- 每种 contentType 的个数必须和内容配比一致
- title 不能空泛，必须有具体行业/产品词 + 冲突/利益点
- reason 必须说人话，不能写模板套话
- 选题必须直接关联该 IP 的真实业务场景，不能只是泛泛的产品/行业小科普
- 如果没有用户特别要求，则完全围绕 IP 自主发挥，每条选题必须从不同角度切入，不要重复用户原话`

  try {
    const deducted = await deductPoints(user.id, 5)
    if (!deducted) return NextResponse.json({ error: "积分不足" }, { status: 402 })

    const startTime = Date.now()
    const result = await chat([{ role: "user", content: prompt }])
    const duration = Date.now() - startTime
    const cleaned = result.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI 返回内容格式异常，请重试" }, { status: 422 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.items || !Array.isArray(parsed.items)) {
      return NextResponse.json({ error: "AI 返回数据缺少 items 字段" }, { status: 422 })
    }

    // Validate item counts match content mix
    const counts = { traffic: 0, persona: 0, product: 0 }
    for (const item of parsed.items) {
      if (item.contentType in counts) counts[item.contentType as keyof typeof counts]++
    }
    if (counts.traffic !== mixFlow || counts.persona !== mixPersona || counts.product !== mixProduct) {
      return NextResponse.json({
        error: `AI 返回的选题数量不符合内容配比（期望 ${mixFlow}:${mixPersona}:${mixProduct}，实际 ${counts.traffic}:${counts.persona}:${counts.product}）`,
      }, { status: 422 })
    }

    // Create weekly plan
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const plan = await prismaIp.weeklyPlan.create({
      data: {
        userId: user.id,
        ipId: id,
        weekStart,
        weekEnd,
        userDirection: userDirection || null,
        articleCount: total,
        items: {
          create: parsed.items.map((item: any) => ({
            contentType: item.contentType,
            title: item.title,
            reason: item.reason,
          })),
        },
      },
      include: { items: { orderBy: { createdAt: "asc" } } },
    })

    // Log generation
    await logGeneration(user.id, "weekly_plan", "qwen3-max-2026-01-23", "success", result.length / 4, 0.01, duration)

    return NextResponse.json({ plan })
  } catch (err: any) {
    console.error("Weekly plan generation error:", err)
    await logGeneration(user.id, "weekly_plan", "qwen3-max-2026-01-23", "error", 0, 0, 0, err.message)
    return NextResponse.json({ error: "生成失败，请稍后重试" }, { status: 500 })
  }
}

// PUT /api/ip/[id]/weekly-plan - save/update weekly plan
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const { items, userDirection } = parseBody(weeklyPlanSaveSchema, await req.json())

  // Update the latest weekly plan for this IP
  const latestPlan = await prismaIp.weeklyPlan.findFirst({
    where: softDelete({ ipId: id, userId: user.id }),
    orderBy: { createdAt: "desc" },
  })
  if (!latestPlan) return NextResponse.json({ error: "没有找到周策划" }, { status: 404 })

  await prismaIp.weeklyPlan.update({
    where: { id: latestPlan.id },
    data: {
      userDirection: userDirection || null,
      items: {
        deleteMany: {},
        create: items.map((item: any) => ({
          contentType: item.contentType,
          title: item.title,
          reason: item.reason,
          generatedResult: item.generatedResult || null,
        })),
      },
    },
  })

  return NextResponse.json({ success: true })
}
