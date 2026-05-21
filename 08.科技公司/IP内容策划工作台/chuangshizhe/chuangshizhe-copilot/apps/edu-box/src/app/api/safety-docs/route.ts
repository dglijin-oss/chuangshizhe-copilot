import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")
  const type = searchParams.get("type")

  const where: Record<string, unknown> = {}
  if (productId) where.productId = productId
  if (type) where.type = type

  const docs = await prismaEdu.studyTourSafetyDoc.findMany({
    where,
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ docs })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { productId, type, title, content, fileUrl } = body as {
    productId: string
    type: string
    title: string
    content?: string
    fileUrl?: string
  }

  if (!productId || !type || !title) {
    return NextResponse.json({ error: "产品、类型、标题不能为空" }, { status: 400 })
  }

  const doc = await prismaEdu.studyTourSafetyDoc.create({
    data: {
      productId, type, title,
      content: content || null,
      fileUrl: fileUrl || null,
    },
    include: { product: { select: { name: true } } },
  })

  return NextResponse.json({ doc })
}
