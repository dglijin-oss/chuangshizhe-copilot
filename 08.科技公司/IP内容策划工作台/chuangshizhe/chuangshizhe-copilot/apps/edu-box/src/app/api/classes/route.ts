import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const classes = await prismaEdu.eduClass.findMany({
    include: { school: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ classes })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { name, schoolId, grade, teacherId, studentCount } = body as {
    name: string
    schoolId: string
    grade: string
    teacherId?: string
    studentCount?: number
  }

  if (!name || !schoolId || !grade) {
    return NextResponse.json({ error: "班级名称、学校和年级不能为空" }, { status: 400 })
  }

  const cls = await prismaEdu.eduClass.create({
    data: { name, schoolId, grade, teacherId: teacherId || null, studentCount: studentCount || 0 },
    include: { school: { select: { name: true } } },
  })

  return NextResponse.json({ class: cls })
}
