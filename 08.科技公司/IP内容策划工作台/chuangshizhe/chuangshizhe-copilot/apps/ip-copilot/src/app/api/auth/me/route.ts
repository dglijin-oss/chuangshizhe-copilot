import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const questionnaire = await prisma.questionnaire.findFirst({
    where: { userId: user.id, submitted: true },
    select: { id: true },
  })

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      points: user.points,
      hasQuestionnaire: !!questionnaire,
    },
  })
}
