import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { chat } from "@/lib/llm"
import { prisma } from "@/lib/prisma"
import { fetchKnowledgeContext } from "@/lib/knowledge"
import { deductPoints } from "@/lib/billing"
import { logGeneration } from "@/lib/logging"
import { parseBody, rewriteSchema } from "@/lib/validation"

// Rewrite prompts that are shared across all requests
const basePrompts: Record<string, string> = {
  titleHook: `你是一位专业的短视频标题和钩子优化师。请改写以下内容，使其更有冲击力和吸引力。

要求：
- 标题：15-20字，包含行业词+冲突/利益点，不能空泛
- 钩子：一句话抓住观众，不能是"大家好""今天我们来聊聊"这种废话
- 必须说人话，像老板在跟客户聊天

返回格式：
标题：[新标题]
钩子：[新钩子]`,

  script: `你是一位专业的口播脚本优化师。请改写以下内容，使其更口语化、更有说服力。

要求：
- 口语化，像老板在跟客户聊天，不能像念稿子
- 分段清晰，每段一个核心观点
- 不要书面语，不要套话
- 直接关联真实业务场景

返回改写后的脚本正文。`,

  description: `你是一位专业的短视频发布优化师。请改写以下发布简介和标签。

要求：
- 简介：50-80字，包含核心关键词，适合平台搜索
- 标签：5个标签，包含行业词、地域词、产品词

返回格式：
简介：[新简介]
标签：[标签1] [标签2] [标签3] [标签4] [标签5]`,

  tips: `你是一位专业的短视频运营顾问。请给出更实用的发布建议。

要求：
- 每条建议具体可执行
- 包含发布时间、互动策略、数据追踪等
- 3-5条建议

每行一条建议。`,
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { text, section, ipId, direction } = parseBody(rewriteSchema, await req.json())

  let systemPrompt = section ? (basePrompts[section] || "请改写以下内容，使其更专业。") : "请改写以下内容，使其更专业。"

  // Append user's custom rewrite direction if provided
  if (direction) {
    systemPrompt += `\n\n## 用户要求\n${direction}`
  }

  // Inject AccountMemory constraints if ipId is provided
  if (ipId) {
    const { memories } = await fetchKnowledgeContext(user.id, ipId)
    if (memories !== "无") {
      systemPrompt += `\n\n## 账号记忆约束（必须遵守）\n${memories}`
    }
  }

  try {
    const deducted = await deductPoints(user.id, 5)
    if (!deducted) return NextResponse.json({ error: "积分不足" }, { status: 402 })

    const startTime = Date.now()
    const result = await chat([
      { role: "user", content: `${systemPrompt}\n\n请改写以下内容：\n${text}` },
    ])
    await logGeneration(user.id, "rewrite", "qwen3-max-2026-01-23", "success", result.length / 4, 0.005, Date.now() - startTime)
    return NextResponse.json({ text: result })
  } catch (err: any) {
    console.error("Rewrite error:", err)
    await prisma.generationLog.create({
      data: { userId: user.id, type: "rewrite", model: "qwen3-max-2026-01-23", status: "error", duration: 0, error: err.message },
    })
    return NextResponse.json({ error: "改写失败" }, { status: 500 })
  }
}
