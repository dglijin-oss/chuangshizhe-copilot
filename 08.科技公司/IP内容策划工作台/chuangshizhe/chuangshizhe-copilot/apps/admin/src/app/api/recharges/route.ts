import { NextResponse } from "next/server"
import { prismaCore } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import * as billing from "@chuangshizhe/billing"

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const recharges = await prismaCore.pointsRecharge.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, phone: true } } },
  })
  return NextResponse.json({ recharges })
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { userId, amount, points, bonus = 0 } = await request.json()
  const recharge = await billing.createRecharge(prismaCore, { userId, amount, points, bonus })
  return NextResponse.json({ recharge })
}
