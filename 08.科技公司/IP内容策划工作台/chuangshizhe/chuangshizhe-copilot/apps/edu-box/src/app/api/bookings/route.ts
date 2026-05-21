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

  const bookings = await prismaEdu.studyTourBooking.findMany({
    where,
    include: {
      product: { select: { name: true, type: true, pricePerStudent: true } },
      school: { select: { name: true } },
      student: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ bookings })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { productId, schoolId, studentId, studentName, parentName, parentPhone, healthNote, price } = body as {
    productId: string
    schoolId: string
    studentId?: string
    studentName: string
    parentName: string
    parentPhone: string
    healthNote?: string
    price?: number
  }

  if (!productId || !schoolId || !studentName || !parentName || !parentPhone) {
    return NextResponse.json({ error: "产品、学校、学生姓名、家长姓名、联系电话不能为空" }, { status: 400 })
  }

  const product = await prismaEdu.studyTourProduct.findUnique({ where: { id: productId } })
  const booking = await prismaEdu.studyTourBooking.create({
    data: {
      productId, schoolId,
      studentId: studentId || null,
      studentName, parentName, parentPhone,
      healthNote: healthNote || null,
      price: price || product?.pricePerStudent || 0,
    },
    include: {
      product: { select: { name: true, type: true } },
      school: { select: { name: true } },
      student: { select: { name: true } },
    },
  })

  return NextResponse.json({ booking })
}
