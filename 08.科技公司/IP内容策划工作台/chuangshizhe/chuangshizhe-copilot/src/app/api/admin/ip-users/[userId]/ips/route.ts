import { NextResponse } from "next/server"
import { prismaCore, prismaIp } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

// GET /api/admin/ip-users/[userId]/ips - list all IPs for a specific user
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const { userId } = await params

  const user = await prismaCore.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 })

  const ips = await prismaIp.ip.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { geoArticles: true, weeklyPlans: true } },
    },
  })

  return NextResponse.json({ user, ips })
}
