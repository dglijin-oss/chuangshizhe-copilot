import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"
import { softDelete } from "@/lib/soft-delete"

// GET /api/ip/list - list all IPs for current user
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const ips = await prismaIp.ip.findMany({
    where: softDelete({ userId: user.id }),
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          weeklyPlans: { where: { deletedAt: null } },
          geoArticles: { where: { deletedAt: null } },
        },
      },
    },
  })

  return NextResponse.json({ ips })
}
