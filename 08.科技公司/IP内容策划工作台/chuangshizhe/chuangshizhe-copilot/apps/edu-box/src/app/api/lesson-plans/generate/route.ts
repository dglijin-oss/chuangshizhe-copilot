import { NextRequest, NextResponse } from "next/server"
import { prismaEdu, prismaCore } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ALIYUN_API_KEY,
  baseURL: "https://coding.dashscope.aliyuncs.com/apps/anthropic",
})

const MODEL = "qwen3-max-2026-01-23"

const AGENTS: Record<string, string> = {
  jiangxin: "匠心 - 教案生成专家",
  wenqu: "问渠 - 知识点梳理专家",
  mingjian: "明鉴 - 测评设计专家",
  mingxin: "明心 - 心理辅导专家",
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { teacherId, subject, grade, title, unit, agent } = body as {
    teacherId: string
    subject: string
    grade: string
    title: string
    unit?: string
    agent?: string
  }

  if (!teacherId || !subject || !grade || !title) {
    return NextResponse.json({ error: "教师、学科、年级、标题不能为空" }, { status: 400 })
  }

  // Check points
  const currentUser = await prismaCore.user.findUnique({ where: { id: user.id } })
  if (!currentUser || currentUser.points < 20) {
    return NextResponse.json({ error: "积分不足，请先充值" }, { status: 402 })
  }

  const prompt = `你是一位经验丰富的${subject}教师，请为${grade}的学生生成一份完整的教案。

课题：${title}
${unit ? `章节/单元：${unit}` : ""}

请按以下 JSON 格式返回教案内容（不要返回其他内容）：
{
  "objectives": {
    "knowledge": ["知识目标1", "知识目标2"],
    "ability": ["能力目标1"],
    "emotion": ["情感目标1"]
  },
  "keyPoints": "教学重点",
  "difficultPoints": "教学难点",
  "methods": ["教学方法1", "教学方法2"],
  "tools": ["教具1"],
  "process": [
    {
      "step": "导入新课",
      "time": "5分钟",
      "teacherActivity": "教师活动描述",
      "studentActivity": "学生活动描述",
      "designIntent": "设计意图"
    }
  ],
  "boardDesign": "板书设计描述",
  "reflection": "教学反思预留"
}

要求：
1. 教学过程至少包含 4 个环节（导入、新授、练习、总结）
2. 每个环节都要有明确的时间分配
3. 内容要符合${grade}学生的认知水平
4. 教学目标要体现三维目标（知识与技能、过程与方法、情感态度价值观）
5. 返回纯 JSON，不要 markdown 代码块包裹`

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

    // Strip markdown code block if present
    text = text.replace(/^```(?:json)?\n?/g, "").replace(/\n?```$/g, "").trim()

    let content
    try {
      content = JSON.parse(text)
    } catch {
      // If parsing fails, store as raw text
      content = { raw: text }
    }

    const tokensUsed = res.usage ? res.usage.input_tokens + res.usage.output_tokens : 0
    const cost = Math.ceil(tokensUsed / 1000) * 1

    // Deduct points
    await prismaCore.user.update({
      where: { id: user.id },
      data: { points: { decrement: 20 } },
    })

    // Log generation
    await prismaEdu.eduAIGeneration.create({
      data: {
        teacherId,
        type: "lesson_plan",
        agent: agent || "jiangxin",
        prompt,
        result: content,
        tokensUsed,
        cost,
        status: "success",
      },
    })

    return NextResponse.json({ content, tokensUsed, cost })
  } catch (err: any) {
    // Log failure
    await prismaEdu.eduAIGeneration.create({
      data: {
        teacherId,
        type: "lesson_plan",
        agent: agent || "jiangxin",
        prompt,
        status: "failed",
        error: err.message || "生成失败",
      },
    })

    return NextResponse.json({ error: "AI 生成失败：" + (err.message || "请稍后重试") }, { status: 500 })
  }
}
