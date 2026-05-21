import { NextRequest, NextResponse } from "next/server"
import { prismaCore } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ALIYUN_API_KEY,
  baseURL: "https://coding.dashscope.aliyuncs.com/apps/anthropic",
})

const MODEL = "qwen3-max-2026-01-23"

const TYPE_PROMPTS: Record<string, string> = {
  normal: "常规作业，题目难度适中，覆盖基础知识点",
  tiered: "分层作业，包含基础题（必做）、提高题（选做）、拓展题（挑战）三个层次",
  extension: "拓展作业，注重能力迁移和创新思维，适合学有余力的学生",
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { teacherId, subject, grade, title, type, dueDate } = body as {
    teacherId: string
    subject: string
    grade: string
    title: string
    type: string
    dueDate?: string
  }

  if (!teacherId || !subject || !grade || !title) {
    return NextResponse.json({ error: "教师、学科、年级、标题不能为空" }, { status: 400 })
  }

  // Check points
  const currentUser = await prismaCore.user.findUnique({ where: { id: user.id } })
  if (!currentUser || currentUser.points < 15) {
    return NextResponse.json({ error: "积分不足，请先充值" }, { status: 402 })
  }

  const prompt = `你是一位经验丰富的${subject}教师，请为${grade}的学生设计一份${title}的作业。

作业类型：${TYPE_PROMPTS[type || "normal"] || TYPE_PROMPTS.normal}

请按以下 JSON 格式返回作业内容（不要返回其他内容）：
{
  "questions": [
    {
      "id": 1,
      "type": "选择题",
      "question": "题目内容",
      "options": ["A. 选项A", "B. 选项B", "C. 选项C", "D. 选项D"],
      "answer": "B",
      "explanation": "答案解析",
      "difficulty": "基础"
    }
  ],
  "totalQuestions": 题目总数,
  "estimatedTime": "预计完成时间（如：30分钟）"
}

要求：
1. 题目数量 5-10 道
2. 题型多样化（选择题、填空题、简答题、应用题等）
3. 难度递进，从基础到提高
4. 每道题都要有答案和解析
5. 难度标注为基础/中等/挑战
6. 返回纯 JSON，不要 markdown 代码块包裹`

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    })

    let text = ""
    for (const block of res.content) {
      if (block.type === "text") text += block.text
    }

    text = text.replace(/^```(?:json)?\n?/g, "").replace(/\n?```$/g, "").trim()

    let content
    try {
      content = JSON.parse(text)
    } catch {
      content = { raw: text }
    }

    const tokensUsed = res.usage ? res.usage.input_tokens + res.usage.output_tokens : 0
    const cost = Math.ceil(tokensUsed / 1000) * 1

    // Deduct points
    await prismaCore.user.update({
      where: { id: user.id },
      data: { points: { decrement: 15 } },
    })

    return NextResponse.json({ content, tokensUsed, cost })
  } catch (err: any) {
    return NextResponse.json({ error: "AI 生成失败：" + (err.message || "请稍后重试") }, { status: 500 })
  }
}
