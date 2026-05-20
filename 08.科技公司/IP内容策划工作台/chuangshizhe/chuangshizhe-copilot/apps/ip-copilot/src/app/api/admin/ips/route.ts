import { NextResponse } from "next/server"
import { prismaCore, prismaIp } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET() {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const ips = await prismaIp.ip.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { geoArticles: true, weeklyPlans: true } },
    },
  })

  // Fetch user info for all IPs
  const userIds = [...new Set(ips.map((ip: any) => ip.userId))]
  const users = await prismaCore.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, phone: true },
  })
  const userMap = new Map(users.map((u: any) => [u.id, u]))

  const ipsWithUser = ips.map((ip: any) => ({
    ...ip,
    user: userMap.get(ip.userId) || null,
  }))

  return NextResponse.json({ ips: ipsWithUser })
}
