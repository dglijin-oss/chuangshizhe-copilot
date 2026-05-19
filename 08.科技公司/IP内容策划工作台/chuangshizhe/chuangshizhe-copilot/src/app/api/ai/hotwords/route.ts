import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { chat } from "@/lib/llm"
import { prisma } from "@/lib/prisma"
import { deductPoints } from "@/lib/billing"
import { logGeneration } from "@/lib/logging"
import { parseBody, hotwordsSchema } from "@/lib/validation"

// GET /api/ai/hotwords - list saved hotword matrices
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  const matrices = await prisma.hotwordMatrix.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  })

  const total = await prisma.hotwordMatrix.count({ where: { userId: user.id } })

  return NextResponse.json({ matrices, total, page, limit })
}

// POST /api/ai/hotwords - generate and save hot keyword matrix
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { coreWord, industry, region } = parseBody(hotwordsSchema, await req.json())

  const prompt = `你是一位 SEO 关键词专家。请为以下核心词生成 11 个维度的搜索问句矩阵。

核心词：${coreWord}
行业：${industry || "未指定"}
地域：${region || "广西"}

11 个维度：
1. 价格相关（多少钱、贵不贵）
2. 品牌/店铺推荐
3. 对比评测
4. 购买攻略/指南
5. 避坑/注意事项
6. 质量/真假辨别
7. 地域/本地搜索
8. 用途/效果
9. 售后/服务
10. 排名/榜单
11. 新品/趋势

每个维度生成 3 个搜索问句，总计 33 个问句。

请严格按以下 JSON 格式输出：
[{"dimension":"维度名称","keywords":["问句1","问句2","问句3"]}]`

  try {
    const deducted = await deductPoints(user.id, 5)
    if (!deducted) return NextResponse.json({ error: "积分不足" }, { status: 402 })

    const startTime = Date.now()
    const result = await chat([{ role: "user", content: prompt }])
    await logGeneration(user.id, "hotwords", "qwen3.6-plus", "success", result.length / 4, 0.005, Date.now() - startTime)
    const cleaned = result.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim()
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const hotwords = JSON.parse(jsonMatch[0])

      // Save to database
      const matrix = await prisma.hotwordMatrix.create({
        data: {
          userId: user.id,
          coreWord,
          industry: industry || null,
          region: region || null,
          data: hotwords,
        },
      })

      return NextResponse.json({ hotwords, saved: true, matrix })
    }
    console.error("Hotwords: could not extract JSON from:", result)
    return NextResponse.json({ hotwords: [], raw: result })
  } catch (err: any) {
    console.error("Hotwords generation error:", err)
    await logGeneration(user.id, "hotwords", "qwen3.6-plus", "error", 0, 0, 0, err.message)
    return NextResponse.json({ error: "生成失败，请稍后重试" }, { status: 500 })
  }
}

// DELETE /api/ai/hotwords/[id] - delete a saved hotword matrix
export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID 必填" }, { status: 400 })

  await prisma.hotwordMatrix.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ success: true })
}
