import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseBody, generationLogSchema } from "@/lib/validation"

// GET /api/account/logs - list generation logs
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const logs = await prisma.generationLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const totalTokens = await prisma.generationLog.aggregate({
    where: { userId: user.id },
    _sum: { tokens: true },
  })

  const totalCost = await prisma.generationLog.aggregate({
    where: { userId: user.id },
    _sum: { cost: true },
  })

  return NextResponse.json({ logs, totalTokens: totalTokens._sum.tokens || 0, totalCost: totalCost._sum.cost || 0 })
}

// POST /api/account/logs - create a generation log (called after AI generation)
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { type, model, status, tokens, duration, cost, error } = parseBody(generationLogSchema, await req.json())

  const log = await prisma.generationLog.create({
    data: {
      userId: user.id,
      type: type || "article",
      model: model || "qwen-plus",
      status: status || "success",
      tokens: tokens || 0,
      duration: duration || 0,
      cost: cost || 0,
      error: error || null,
    },
  })

  return NextResponse.json({ log })
}
