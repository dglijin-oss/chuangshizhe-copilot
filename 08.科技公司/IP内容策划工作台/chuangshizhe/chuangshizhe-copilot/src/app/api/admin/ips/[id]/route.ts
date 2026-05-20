import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const { id } = await params

  const ip = await prisma.ip.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, phone: true } },
      geoArticles: { orderBy: { createdAt: "desc" }, take: 20 },
      weeklyPlans: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  })
  if (!ip) return NextResponse.json({ error: "IP 不存在" }, { status: 404 })

  return NextResponse.json({ ip })
}
