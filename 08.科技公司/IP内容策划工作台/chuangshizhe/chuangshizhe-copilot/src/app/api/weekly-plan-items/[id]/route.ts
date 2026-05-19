import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { chat } from "@/lib/llm"
import { fetchKnowledgeContext } from "@/lib/knowledge"
import { deductPoints } from "@/lib/billing"
import { logGeneration } from "@/lib/logging"
import { parseBody, weeklyPlanItemUpdateSchema, weeklyPlanGenerateSchema } from "@/lib/validation"

// GET /api/weekly-plan-items/[id] - get item details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params

  const item = await prisma.weeklyPlanItem.findUnique({
    where: { id },
    include: {
      plan: {
        include: {
          ip: true,
        },
      },
    },
  })

  if (!item) return NextResponse.json({ error: "选题不存在" }, { status: 404 })
  if (item.plan.userId !== user.id) return NextResponse.json({ error: "无权访问" }, { status: 403 })

  return NextResponse.json({ item })
}

// PATCH /api/weekly-plan-items/[id]/result - update item result
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const body = parseBody(weeklyPlanItemUpdateSchema, await req.json())

  const item = await prisma.weeklyPlanItem.findUnique({
    where: { id },
    include: { plan: true },
  })

  if (!item || item.plan.userId !== user.id) {
    return NextResponse.json({ error: "选题不存在" }, { status: 404 })
  }

  const updated = await prisma.weeklyPlanItem.update({
    where: { id },
    data: {
      generatedResult: body.generatedResult || null,
      generationStatus: body.generatedResult ? "done" : "idle",
    },
  })

  return NextResponse.json({ item: updated })
}

// POST /api/weekly-plan-items/[id]/generate - generate publish package via AI
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const { userDirection } = parseBody(weeklyPlanGenerateSchema, await req.json())

  const item = await prisma.weeklyPlanItem.findUnique({
    where: { id },
    include: {
      plan: {
        include: {
          ip: true,
        },
      },
    },
  })

  if (!item || item.plan.userId !== user.id) {
    return NextResponse.json({ error: "选题不存在" }, { status: 404 })
  }

  const ip = item.plan.ip
  if (!ip) return NextResponse.json({ error: "IP 不存在" }, { status: 404 })
  const contentTypeLabels: Record<string, string> = {
    traffic: "流量型",
    persona: "人设型",
    product: "产品型",
  }

  // Get knowledge context for prompt injection
  const { memories, wikiPages } = await fetchKnowledgeContext(user.id, ip.id)

  const directionBlock = userDirection
    ? `## 用户方向\n${userDirection}`
    : ""

  const prompt = `你是一位专业的短视频内容策划 agent。请为以下选题生成完整的发布包。

## IP 档案
- 名称：${ip.name}
- 创始人：${ip.founderName || "未填写"}
- 人设特点：${ip.founderTraits || "未填写"}
- 行业：${ip.industry || "未填写"}
- 产品/服务：${ip.products || "未填写"}
- 目标客户：${ip.targetClients || "未填写"}
- 内容禁区：${ip.contentBan || "无"}

${directionBlock}

## 选题信息
- 类型：${contentTypeLabels[item.contentType] || item.contentType}
- 标题：${item.title}
- 选题理由：${item.reason}

## 账号记忆（写作约束）
${memories}

## IP 知识库参考
${wikiPages}

## 输出要求
请只返回纯 JSON，不要包含任何其他文字。格式如下：
{
  "title": "视频标题，15-20字，要能抓住注意力，包含行业词+冲突/利益点",
  "hook": "开头3秒钩子，一句话抓住观众，不能是'大家好''今天我们来聊聊'这种废话",
  "script": "口播脚本正文，300-500字，分段清晰，口语化，说人话，不要书面语，不要套话",
  "description": "发布简介，50-80字，包含核心关键词，适合平台搜索",
  "tags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5"],
  "tips": ["发布建议1", "发布建议2", "发布建议3"]
}

## 约定
- title 必须有具体利益点，不能空泛
- hook 必须在一句话内完成，不能分段
- script 必须口语化，像老板在跟客户聊天，不能像念稿子
- 每条内容必须直接关联该 IP 的真实业务
- tags 必须包含行业词、地域词、产品词`

  try {
    // Deduct points before generation
    const pointsToDeduct = 1 // 1 point per generation
    const deducted = await deductPoints(user.id, pointsToDeduct)
    if (!deducted) {
      return NextResponse.json({ error: "积分不足，请充值后重试" }, { status: 402 })
    }

    const startTime = Date.now()
    const result = await chat([{ role: "user", content: prompt }])
    const duration = Date.now() - startTime

    if (!result) {
      await logGeneration(user.id, "publish_package", "qwen3.6-plus", "error", 0, 0, duration, "AI 返回为空")
      return NextResponse.json({ error: "AI 未返回有效内容，请重试" }, { status: 502 })
    }

    const cleaned = result.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      await logGeneration(user.id, "publish_package", "qwen3.6-plus", "error", 0, 0, duration, `AI 返回格式异常: ${result.substring(0, 200)}`)
      return NextResponse.json({ error: "AI 返回格式异常，请重试" }, { status: 422 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.title || !parsed.script) {
      await logGeneration(user.id, "publish_package", "qwen3.6-plus", "error", 0, 0, duration, "AI 返回内容不完整")
      return NextResponse.json({ error: "AI 返回内容不完整，请重试" }, { status: 422 })
    }

    // Save result
    const updated = await prisma.weeklyPlanItem.update({
      where: { id },
      data: {
        generatedResult: parsed,
        generationStatus: "done",
      },
    })

    await logGeneration(user.id, "publish_package", "qwen3.6-plus", "success", result.length / 4, 0.01, duration)

    return NextResponse.json({
      item: updated,
      result: parsed,
    })
  } catch (err: any) {
    console.error("Generate item error:", err)
    const errorMessage = err.message || "未知错误"
    await prisma.generationLog.create({
      data: { userId: user.id, type: "publish_package", model: "qwen3.6-plus", status: "error", duration: 0, error: errorMessage },
    })
    // Return specific error messages for known failures
    if (errorMessage.includes("API") || errorMessage.includes("apikey") || errorMessage.includes("key")) {
      return NextResponse.json({ error: "AI 服务配置异常，请联系管理员" }, { status: 500 })
    }
    if (errorMessage.includes("积分") || errorMessage.includes("balance") || errorMessage.includes("余额")) {
      return NextResponse.json({ error: "积分不足，请充值后重试" }, { status: 402 })
    }
    return NextResponse.json({ error: `生成失败：${errorMessage}` }, { status: 500 })
  }
}
