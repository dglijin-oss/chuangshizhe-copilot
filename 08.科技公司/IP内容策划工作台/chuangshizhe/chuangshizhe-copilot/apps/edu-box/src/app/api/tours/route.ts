import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const schoolId = searchParams.get("schoolId")

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (schoolId) where.schoolId = schoolId

  const products = await prismaEdu.studyTourProduct.findMany({
    where,
    include: { school: { select: { name: true } }, _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { name, type, grade, duration, description, itinerary, costBreakdown, pricePerStudent, minStudents, schoolId } = body as {
    name: string
    type: string
    grade: string
    duration: number
    description?: string
    itinerary?: Record<string, unknown>
    costBreakdown?: Record<string, unknown>
    pricePerStudent: number
    minStudents?: number
    schoolId?: string
  }

  if (!name || !type || !grade || !duration) {
    return NextResponse.json({ error: "名称、类型、年级、天数不能为空" }, { status: 400 })
  }

  const product = await prismaEdu.studyTourProduct.create({
    data: {
      name, type, grade, duration,
      description: description || null,
      itinerary: itinerary ? (itinerary as any) : null,
      costBreakdown: costBreakdown ? (costBreakdown as any) : null,
      pricePerStudent: pricePerStudent || 0,
      minStudents: minStudents || 30,
      schoolId: schoolId || null,
    },
    include: { school: { select: { name: true } } },
  })

  return NextResponse.json({ product })
}
