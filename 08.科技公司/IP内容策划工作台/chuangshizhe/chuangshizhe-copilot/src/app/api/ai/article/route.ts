import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { chat } from "@/lib/llm"
import { prisma } from "@/lib/prisma"
import { deductPoints } from "@/lib/billing"
import { logGeneration } from "@/lib/logging"
import { parseBody, articleSchema } from "@/lib/validation"

// POST /api/ai/article - generate full article
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { topic, keywords, platform, tone, length, targetQuestions, ipInfo, wikiContent } = parseBody(articleSchema, await req.json())

  const wordCount = parseInt(length || "") || 1200

  const prompt = `你是一位专业的自媒体文章创作者，请根据以下要求生成一篇文章：

文章主题：${topic}
关键词：${keywords}
发布平台：${platform || "通用"}
语气风格：${tone}
目标字数：${wordCount} 字

${targetQuestions ? `必须覆盖以下用户问句：\n${targetQuestions.split('\n').filter(Boolean).map((q: string) => `- ${q.trim()}`).join('\n')}` : ''}

${ipInfo ? `IP 账号信息：${ipInfo}` : ''}
${wikiContent ? `参考资料：\n${wikiContent}` : ''}

要求：
1. 文章结构清晰，使用小标题分段
2. 自然融入关键词，不要堆砌
3. 语气符合${tone}风格
4. 有吸引开头的引言
5. 结尾有行动号召
6. 不要使用 markdown 格式，用纯文本

请直接输出文章正文。`

  try {
    const deducted = await deductPoints(user.id, 5)
    if (!deducted) return NextResponse.json({ error: "积分不足" }, { status: 402 })

    const startTime = Date.now()
    const content = await chat([{ role: "user", content: prompt }], 8000)
    await logGeneration(user.id, "article", "qwen3.6-plus", "success", content.length / 4, 0.02, Date.now() - startTime)
    return NextResponse.json({ content })
  } catch (err: any) {
    console.error("Article generation error:", err)
    await logGeneration(user.id, "article", "qwen3.6-plus", "error", 0, 0, 0, err.message)
    return NextResponse.json({ error: "生成失败，请稍后重试" }, { status: 500 })
  }
}
