import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/ip/[id]/weekly-plans - list all weekly plans for this IP
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params

  const plans = await prisma.weeklyPlan.findMany({
    where: { ipId: id, userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { orderBy: { createdAt: "asc" } },
    },
  })

  return NextResponse.json({ plans })
}
