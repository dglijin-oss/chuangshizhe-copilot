import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get("classId")

  const students = await prismaEdu.eduStudent.findMany({
    where: classId ? { classId } : undefined,
    include: { class: { select: { name: true, school: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ students })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { name, classId, schoolId, gender, birthDate, parentName, parentPhone, healthNote } = body as {
    name: string
    classId: string
    schoolId: string
    gender?: string
    birthDate?: string
    parentName?: string
    parentPhone?: string
    healthNote?: string
  }

  if (!name || !classId) {
    return NextResponse.json({ error: "学生姓名和班级不能为空" }, { status: 400 })
  }

  const student = await prismaEdu.eduStudent.create({
    data: {
      name,
      classId,
      schoolId,
      gender: gender || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      parentName: parentName || null,
      parentPhone: parentPhone || null,
      healthNote: healthNote || null,
    },
    include: { class: { select: { name: true, school: { select: { name: true } } } } },
  })

  return NextResponse.json({ student })
}
