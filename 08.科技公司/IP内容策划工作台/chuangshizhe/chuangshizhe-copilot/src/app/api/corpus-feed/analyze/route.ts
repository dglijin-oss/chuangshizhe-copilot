import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { chat } from "@/lib/llm"
import { prisma } from "@/lib/prisma"
import { deductPoints } from "@/lib/billing"
import { logGeneration } from "@/lib/logging"
import { parseBody, corpusAnalyzeSchema } from "@/lib/validation"

// POST /api/corpus-feed/analyze - analyze corpus content and extract knowledge suggestions
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { content } = parseBody(corpusAnalyzeSchema, await req.json())
  if (!content) return NextResponse.json({ error: "缺少内容" }, { status: 400 })

  const prompt = `你是一位 IP 内容策划专家。请分析以下历史语料（脚本、访谈、账号资料等），提炼出值得进入这个 IP 知识库的建议。

请返回以下格式的 JSON，不要包含任何其他文字：
{
  "summary": "一句话总结这份资料的核心价值",
  "suggestions": [
    {
      "category": "fact_correction",  // fact_correction | writing_preference | expression_restriction | customer_insight
      "content": "具体建议内容，用一句话描述"
    }
  ],
  "keyInsights": ["关键洞察1", "关键洞察2"]
}

## 分析维度
- **事实纠错**: 资料中提到的事实性信息，比如产品参数、经营年限、门店数量等
- **写作偏好**: 语料中体现的说话风格、表达习惯、常用句式
- **表达禁区**: 资料中明确说不能说的话、不能碰的话题
- **客户洞察**: 关于目标客户的偏好、痛点、决策逻辑

## 待分析语料
${content}

只返回 JSON，不要其他任何文字。`

  try {
    const deducted = await deductPoints(user.id, 5)
    if (!deducted) return NextResponse.json({ error: "积分不足" }, { status: 402 })

    const startTime = Date.now()
    const result = await chat([{ role: "user", content: prompt }])
    await logGeneration(user.id, "corpus_analyze", "qwen3.6-plus", "success", result.length / 4, 0.005, Date.now() - startTime)
    const cleaned = result.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI 返回格式异常" }, { status: 422 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({ result: parsed })
  } catch (err: any) {
    console.error("Corpus analyze error:", err)
    await logGeneration(user.id, "corpus_analyze", "qwen3.6-plus", "error", 0, 0, 0, err.message)
    return NextResponse.json({ error: "分析失败，请稍后重试" }, { status: 500 })
  }
}
