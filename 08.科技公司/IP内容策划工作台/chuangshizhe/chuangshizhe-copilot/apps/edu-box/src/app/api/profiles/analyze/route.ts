import { NextRequest, NextResponse } from "next/server"
import { prismaCore, prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ALIYUN_API_KEY,
  baseURL: "https://coding.dashscope.aliyuncs.com/apps/anthropic",
})

const MODEL = "qwen3-max-2026-01-23"

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { studentId } = body as { studentId: string }

  if (!studentId) {
    return NextResponse.json({ error: "学生 ID 不能为空" }, { status: 400 })
  }

  // Check points
  const currentUser = await prismaCore.user.findUnique({ where: { id: user.id } })
  if (!currentUser || currentUser.points < 10) {
    return NextResponse.json({ error: "积分不足，请先充值" }, { status: 402 })
  }

  // Get student data
  const student = await prismaEdu.eduStudent.findUnique({
    where: { id: studentId },
    include: {
      class: { select: { name: true, grade: true } },
      submissions: {
        include: { homework: true },
        orderBy: { submittedAt: "desc" },
        take: 10,
      },
    },
  })

  if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 })

  const prompt = `你是一位教育专家，请根据以下学生信息生成学情分析报告。

学生姓名：${student.name}
年级班级：${student.class.grade}${student.class.name}
${student.gender ? `性别：${student.gender}` : ""}
${student.birthDate ? `出生日期：${student.birthDate}` : ""}

该学生最近 ${student.submissions.length} 次作业提交记录：
${student.submissions.map((s, i) => `第 ${i + 1} 次：${s.homework.title}（${s.homework.subject}），得分：${s.score ?? "未评分"}，AI 分析：${s.aiAnalysis || "无"}，教师评语：${s.teacherNote || "无"}`).join("\n")}

请按以下 JSON 格式返回分析报告（不要返回其他内容）：
{
  "academicLevel": "优/良/中/待提高",
  "academicAnalysis": "学业水平分析（200字以内）",
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["薄弱点1", "薄弱点2"],
  "psychologicalNote": "心理状态分析建议（100字以内）",
  "behaviorNote": "行为表现建议（100字以内）",
  "suggestions": ["建议1", "建议2", "建议3"]
}

要求：
1. 评价要客观中肯，以鼓励为主
2. 建议要具体可操作
3. 返回纯 JSON，不要 markdown 代码块包裹`

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    })

    let text = ""
    for (const block of res.content) {
      if (block.type === "text") text += block.text
    }

    text = text.replace(/^```(?:json)?\n?/g, "").replace(/\n?```$/g, "").trim()

    let analysis
    try {
      analysis = JSON.parse(text)
    } catch {
      analysis = { raw: text }
    }

    const tokensUsed = res.usage ? res.usage.input_tokens + res.usage.output_tokens : 0

    // Deduct points
    await prismaCore.user.update({
      where: { id: user.id },
      data: { points: { decrement: 10 } },
    })

    // Update student profile
    const existing = await prismaEdu.eduStudentProfile.findUnique({
      where: { studentId },
    })

    if (existing) {
      await prismaEdu.eduStudentProfile.update({
        where: { studentId },
        data: {
          academicLevel: analysis.academicLevel,
          psychologicalNote: analysis.psychologicalNote,
          behaviorNote: analysis.behaviorNote,
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || [],
          lastAssessmentAt: new Date(),
        },
      })
    } else {
      await prismaEdu.eduStudentProfile.create({
        data: {
          studentId,
          academicLevel: analysis.academicLevel,
          psychologicalNote: analysis.psychologicalNote,
          behaviorNote: analysis.behaviorNote,
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || [],
          lastAssessmentAt: new Date(),
        },
      })
    }

    return NextResponse.json({ analysis, tokensUsed })
  } catch (err: any) {
    return NextResponse.json({ error: "AI 分析失败：" + (err.message || "请稍后重试") }, { status: 500 })
  }
}
