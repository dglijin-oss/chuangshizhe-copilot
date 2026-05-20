import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

// GET /api/admin/ip-users - list all users who have IPs
export async function GET() {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: {
      ips: { some: {} },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: {
        select: { ips: true },
      },
    },
  })

  return NextResponse.json({ users })
}
