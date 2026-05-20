import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { chat } from "@/lib/llm"
import { prisma } from "@/lib/prisma"
import { deductPoints } from "@/lib/billing"
import { logGeneration } from "@/lib/logging"
import { parseBody, ipbriefSchema } from "@/lib/validation"

// POST /api/ai/ipbrief - auto-fill IP profile from description
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { description } = parseBody(ipbriefSchema, await req.json())

  const prompt = `你是一位专业的 IP 人设策划师。根据以下描述，帮我分析并提取 IP 账号的关键信息。

描述：${description}

请只返回纯 JSON，不要包含任何其他文字、markdown 标记或代码块。格式如下：
{"name":"IP账号名称","founderName":"创始人姓名","industry":"行业名称","founderTraits":["特点1","特点2"],"products":["产品1","产品2"],"targetClients":["客户1","客户2"],"accountGoals":["目标1","目标2"],"contentBan":["禁区1","禁区2"]}

如果某字段无法从描述中推断，该字段设为 null。`

  try {
    const deducted = await deductPoints(user.id, 5)
    if (!deducted) return NextResponse.json({ error: "积分不足" }, { status: 402 })

    const startTime = Date.now()
    const result = await chat([{ role: "user", content: prompt }])
    await logGeneration(user.id, "ipbrief", "qwen3-max-2026-01-23", "success", result.length / 4, 0.005, Date.now() - startTime)
    // Strip markdown code blocks first
    const cleaned = result.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const profile = JSON.parse(jsonMatch[0])
      return NextResponse.json({ profile })
    }
    console.error("IP brief: could not extract JSON from:", result)
    return NextResponse.json({ profile: null, raw: result })
  } catch (err: any) {
    console.error("IP brief error:", err)
    await logGeneration(user.id, "ipbrief", "qwen3-max-2026-01-23", "error", 0, 0, 0, err.message)
    return NextResponse.json({ error: "分析失败，请稍后重试" }, { status: 500 })
  }
}
