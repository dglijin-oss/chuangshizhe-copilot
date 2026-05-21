import { NextRequest, NextResponse } from "next/server"
import { prismaEdu } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get("classId")

  const students = await prismaEdu.eduStudent.findMany({
    where: classId ? { classId } : {},
    include: {
      class: { select: { name: true, grade: true } },
      profiles: { take: 1 },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Normalize profile (singular) from the array
  const normalized = students.map((s) => {
    const { profiles, ...rest } = s as any
    return { ...rest, profile: profiles?.[0] || null }
  })

  return NextResponse.json({ students: normalized })
}
