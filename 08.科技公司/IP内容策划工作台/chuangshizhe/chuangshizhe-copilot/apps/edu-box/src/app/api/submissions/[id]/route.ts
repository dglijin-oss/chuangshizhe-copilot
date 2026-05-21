import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const submission = await prismaEdu.eduHomeworkSubmission.update({
    where: { id },
    data: body,
    include: {
      student: { select: { name: true } },
      homework: {
        include: { class: { select: { name: true, grade: true } } },
      },
    },
  })

  return NextResponse.json({ submission })
}
