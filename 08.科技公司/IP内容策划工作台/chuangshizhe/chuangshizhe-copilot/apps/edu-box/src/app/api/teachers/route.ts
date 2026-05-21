import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const schoolId = searchParams.get("schoolId")

  const teachers = await prismaEdu.eduTeacher.findMany({
    where: schoolId ? { schoolId } : undefined,
    include: { school: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ teachers })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { name, schoolId, subjects, role } = body as {
    name: string
    schoolId: string
    subjects?: string[]
    role?: string
  }

  if (!name || !schoolId) {
    return NextResponse.json({ error: "教师姓名和所属学校不能为空" }, { status: 400 })
  }

  const teacher = await prismaEdu.eduTeacher.create({
    data: {
      name,
      schoolId,
      subjects: subjects || [],
      role: role || "teacher",
    },
    include: { school: { select: { name: true } } },
  })

  return NextResponse.json({ teacher })
}
