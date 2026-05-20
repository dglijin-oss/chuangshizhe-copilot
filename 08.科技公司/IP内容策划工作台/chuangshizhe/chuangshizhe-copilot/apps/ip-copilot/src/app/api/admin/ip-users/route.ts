import { NextResponse } from "next/server"
import { prismaCore, prismaIp } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

// GET /api/admin/ip-users - list all users who have IPs
export async function GET() {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  // Get all userIds that have IPs
  const ipUserIds = await prismaIp.ip.findMany({
    select: { userId: true },
    distinct: ["userId"],
  })
  const userIds = ipUserIds.map((r: any) => r.userId)

  const users = await prismaCore.user.findMany({
    where: { id: { in: userIds } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  })

  // Count IPs per user
  const ipCounts = await prismaIp.ip.groupBy({
    by: ["userId"],
    _count: { id: true },
    where: { userId: { in: userIds } },
  })
  const countMap = new Map(ipCounts.map((c: any) => [c.userId, c._count.id]))

  const usersWithCount = users.map(u => ({
    ...u,
    _count: { ips: countMap.get(u.id) || 0 },
  }))

  return NextResponse.json({ users: usersWithCount })
}
