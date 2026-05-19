import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseBody, rechargeSchema } from "@/lib/validation"

// POST /api/billing/recharge - create a recharge order
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { amount, points } = parseBody(rechargeSchema, await req.json())

  const order = await prisma.pointsRecharge.create({
    data: {
      userId: user.id,
      amount,
      points,
      bonus: 0,
      status: "pending",
      payMethod: "wechat",
    },
  })

  return NextResponse.json({ order })
}

// GET /api/billing/recharge - list user's recharge orders
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const orders = await prisma.pointsRecharge.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json({ orders })
}
