import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const schools = await prismaEdu.eduSchool.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          teachers: true,
          classes: true,
          tours: true,
        },
      },
    },
  })

  return NextResponse.json({ schools })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { name, type, region, address, contact, phone } = body as {
    name: string
    type: string
    region?: string
    address?: string
    contact?: string
    phone?: string
  }

  if (!name || !type) {
    return NextResponse.json({ error: "学校名称和类型不能为空" }, { status: 400 })
  }

  const school = await prismaEdu.eduSchool.create({
    data: { name, type, region: region || null, address: address || null, contact: contact || null, phone: phone || null },
  })

  return NextResponse.json({ school })
}
