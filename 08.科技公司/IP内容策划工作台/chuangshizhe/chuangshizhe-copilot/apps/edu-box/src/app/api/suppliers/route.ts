import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")

  const where: Record<string, unknown> = {}
  if (category) where.category = category

  const suppliers = await prismaEdu.studyTourSupplier.findMany({
    where,
    include: { _count: { select: { products: true } } },
    orderBy: { rating: "desc" },
  })

  return NextResponse.json({ suppliers })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { name, category, contact, phone, licenseNo, address } = body as {
    name: string
    category: string
    contact?: string
    phone?: string
    licenseNo?: string
    address?: string
  }

  if (!name || !category) {
    return NextResponse.json({ error: "名称和类型不能为空" }, { status: 400 })
  }

  const supplier = await prismaEdu.studyTourSupplier.create({
    data: { name, category, contact: contact || null, phone: phone || null, licenseNo: licenseNo || null, address: address || null },
  })

  return NextResponse.json({ supplier })
}
