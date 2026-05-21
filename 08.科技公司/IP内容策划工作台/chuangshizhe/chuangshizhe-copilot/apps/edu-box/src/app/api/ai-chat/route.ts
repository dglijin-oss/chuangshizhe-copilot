import { NextRequest, NextResponse } from "next/server"
import { prismaEdu, prismaCore } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ALIYUN_API_KEY,
  baseURL: "https://coding.dashscope.aliyuncs.com/apps/anthropic",
})

const MODEL = "qwen3-max-2026-01-23"

const AGENTS: Record<string, { name: string; desc: string; system: string; costPerK: number }> = {
  jiangxin: {
    name: "匠心",
    desc: "教案设计专家",
    system: "你是一位经验丰富的教研专家，名叫\"匠心\"。你擅长帮助教师设计教案、分析教学重难点、规划教学流程。请给出专业、实用的建议。",
    costPerK: 1,
  },
  wenqu: {
    name: "问渠",
    desc: "知识点梳理专家",
    system: "你是一位知识点梳理专家，名叫\"问渠\"。你擅长帮助教师梳理知识点体系、构建知识框架、分析知识点之间的关联。请用清晰的结构呈现。",
    costPerK: 1,
  },
  mingjian: {
    name: "明鉴",
    desc: "测评设计专家",
    system: "你是一位测评设计专家，名叫\"明鉴\"。你擅长帮助教师设计考试题目、作业、评价标准。请确保题目质量高、难度梯度合理。",
    costPerK: 1,
  },
  mingxin: {
    name: "明心",
    desc: "心理辅导专家",
    system: "你是一位心理辅导专家，名叫\"明心\"。你擅长帮助教师理解学生心理、提供心理辅导建议、处理学生行为问题。请给予温暖、专业的建议。",
    costPerK: 1,
  },
  lexue: {
    name: "乐学",
    desc: "学习动力激发",
    system: "你是一位学习动力激发专家，名叫\"乐学\"。你擅长帮助教师激发学生学习兴趣、设计有趣的教学活动。请提供有创意的建议。",
    costPerK: 1,
  },
  shanzhi: {
    name: "善治",
    desc: "班级管理专家",
    system: "你是一位班级管理专家，名叫\"善治\"。你擅长帮助教师进行班级建设、学生管理、家校沟通。请提供实用可操作的建议。",
    costPerK: 1,
  },
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const teacherId = searchParams.get("teacherId")

  const where: Record<string, unknown> = {}
  if (teacherId) where.teacherId = teacherId

  const dialogues = await prismaEdu.eduDialogue.findMany({
    where,
    include: { teacher: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ dialogues, agents: Object.entries(AGENTS).map(([key, val]) => ({ id: key, ...val })) })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { teacherId, agent, topic, messages } = body as {
    teacherId: string
    agent: string
    topic?: string
    messages: { role: string; content: string }[]
  }

  if (!teacherId || !agent) {
    return NextResponse.json({ error: "教师 ID 和智能体不能为空" }, { status: 400 })
  }

  const agentConfig = AGENTS[agent]
  if (!agentConfig) {
    return NextResponse.json({ error: "智能体不存在" }, { status: 404 })
  }

  // Check points
  const currentUser = await prismaCore.user.findUnique({ where: { id: user.id } })
  if (!currentUser || currentUser.points < 5) {
    return NextResponse.json({ error: "积分不足，请先充值" }, { status: 402 })
  }

  // Build system message
  const systemMessagesArr: { role: string; content: string }[] = messages.length === 0
    ? [{ role: "system", content: agentConfig.system }]
    : []

  const chatMessages = [
    ...systemMessagesArr,
    ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
  ]

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: chatMessages as any,
    })

    let text = ""
    for (const block of res.content) {
      if (block.type === "text") text += block.text
    }

    const tokensUsed = res.usage ? res.usage.input_tokens + res.usage.output_tokens : 0
    const cost = Math.ceil(tokensUsed / 1000) * agentConfig.costPerK

    // Deduct points (estimate ~3 points per conversation)
    await prismaCore.user.update({
      where: { id: user.id },
      data: { points: { decrement: 3 } },
    })

    // Save or update dialogue
    let dialogue = await prismaEdu.eduDialogue.findFirst({
      where: { teacherId, agent, topic: topic || null },
    })

    const allMessages = [
      ...messages,
      { role: "assistant", content: text, timestamp: new Date().toISOString() },
    ]

    if (dialogue) {
      dialogue = await prismaEdu.eduDialogue.update({
        where: { id: dialogue.id },
        data: {
          messages: allMessages,
          tokensUsed: { increment: tokensUsed },
        },
      })
    } else {
      dialogue = await prismaEdu.eduDialogue.create({
        data: {
          teacherId,
          agent,
          topic: topic || null,
          messages: allMessages,
          tokensUsed,
        },
      })
    }

    return NextResponse.json({ content: text, tokensUsed, dialogueId: dialogue.id })
  } catch (err: any) {
    return NextResponse.json({ error: "AI 对话失败：" + (err.message || "请稍后重试") }, { status: 500 })
  }
}
