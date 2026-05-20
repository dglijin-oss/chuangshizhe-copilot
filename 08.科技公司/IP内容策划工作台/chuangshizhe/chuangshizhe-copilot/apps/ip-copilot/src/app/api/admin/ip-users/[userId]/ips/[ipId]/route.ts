import { NextResponse } from "next/server"
import { prismaCore, prismaIp } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string; ipId: string }> }
) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const { userId, ipId } = await params

  const [ip, user] = await Promise.all([
    prismaIp.ip.findUnique({
      where: { id: ipId, userId },
      include: {
        geoArticles: { orderBy: { createdAt: "desc" }, take: 20 },
        weeklyPlans: { orderBy: { createdAt: "desc" }, take: 20, include: { items: true } },
      },
    }),
    prismaCore.user.findUnique({ where: { id: userId }, select: { name: true, phone: true } }),
  ])
  if (!ip) return NextResponse.json({ error: "IP 不存在" }, { status: 404 })

  return NextResponse.json({ ip, user })
}
