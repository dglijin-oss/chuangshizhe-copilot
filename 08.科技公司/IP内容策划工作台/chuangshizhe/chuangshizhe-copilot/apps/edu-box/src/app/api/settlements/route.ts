import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")
  const status = searchParams.get("status")

  const where: Record<string, unknown> = {}
  if (productId) where.productId = productId
  if (status) where.status = status

  const settlements = await prismaEdu.studyTourSettlement.findMany({
    where,
    include: {
      product: { select: { name: true, pricePerStudent: true } },
      school: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ settlements })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { productId, schoolId, totalRevenue, totalCost, profit, studentCount, costBreakdown } = body as {
    productId: string
    schoolId: string
    totalRevenue?: number
    totalCost?: number
    profit?: number
    studentCount?: number
    costBreakdown?: Record<string, unknown>
  }

  if (!productId || !schoolId) {
    return NextResponse.json({ error: "产品和学校不能为空" }, { status: 400 })
  }

  const settlement = await prismaEdu.studyTourSettlement.create({
    data: {
      productId, schoolId,
      totalRevenue: totalRevenue || 0,
      totalCost: totalCost || 0,
      profit: profit || 0,
      studentCount: studentCount || 0,
      costBreakdown: costBreakdown ? (costBreakdown as any) : null,
    },
    include: {
      product: { select: { name: true, pricePerStudent: true } },
      school: { select: { name: true } },
    },
  })

  return NextResponse.json({ settlement })
}
