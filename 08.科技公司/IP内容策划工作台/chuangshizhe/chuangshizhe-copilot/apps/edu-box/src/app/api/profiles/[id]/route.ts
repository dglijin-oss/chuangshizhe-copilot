import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const student = await prismaEdu.eduStudent.findUnique({
    where: { id },
    include: {
      class: { select: { name: true, grade: true } },
      profiles: { take: 1 },
      submissions: {
        include: {
          homework: {
            include: { class: { select: { name: true, grade: true } } },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 20,
      },
    },
  })

  if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 })

  // Normalize profile (singular) from the array
  const { profiles, ...rest } = student as any
  return NextResponse.json({ student: { ...rest, profile: profiles?.[0] || null } })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Update or create profile
  const existing = await prismaEdu.eduStudentProfile.findUnique({
    where: { studentId: id },
  })

  let profile
  if (existing) {
    profile = await prismaEdu.eduStudentProfile.update({
      where: { studentId: id },
      data: body,
    })
  } else {
    profile = await prismaEdu.eduStudentProfile.create({
      data: { studentId: id, ...body },
    })
  }

  return NextResponse.json({ profile })
}
