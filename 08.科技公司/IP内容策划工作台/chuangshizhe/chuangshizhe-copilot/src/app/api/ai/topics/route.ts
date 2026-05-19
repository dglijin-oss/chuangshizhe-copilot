import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { chat } from "@/lib/llm"
import { prisma } from "@/lib/prisma"
import { deductPoints } from "@/lib/billing"
import { logGeneration } from "@/lib/logging"
import { parseBody, topicsSchema } from "@/lib/validation"

// POST /api/ai/topics - generate article topics based on industry/IP info
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { industry, productDesc } = parseBody(topicsSchema, await req.json())

  const prompt = `你是一位专业的内容策划师，擅长为不同行业策划有吸引力的文章选题。

行业：${industry || "未指定"}
产品/服务：${productDesc || "未指定"}

请生成 5 个适合该行业发布在自媒体平台（头条号、知乎、小红书）的文章选题。
每个选题要：
1. 包含地域词或行业关键词
2. 解决用户真实问题或痛点
3. 能吸引点击和转发

请严格按以下 JSON 格式输出，不要其他内容：
[{"topic":"选题标题","keywords":"关键词1,关键词2","questions":["问句1","问句2"]}]`

  try {
    const deducted = await deductPoints(user.id, 1)
    if (!deducted) return NextResponse.json({ error: "积分不足" }, { status: 402 })

    const startTime = Date.now()
    const result = await chat([{ role: "user", content: prompt }])
    await logGeneration(user.id, "topics", "qwen3.6-plus", "success", result.length / 4, 0.005, Date.now() - startTime)
    const cleaned = result.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim()
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const topics = JSON.parse(jsonMatch[0])
      return NextResponse.json({ topics })
    }
    console.error("Topics: could not extract JSON from:", result)
    return NextResponse.json({ topics: [], raw: result })
  } catch (err: any) {
    console.error("Topic generation error:", err)
    await logGeneration(user.id, "topics", "qwen3.6-plus", "error", 0, 0, 0, err.message)
    return NextResponse.json({ error: "生成失败，请稍后重试" }, { status: 500 })
  }
}
