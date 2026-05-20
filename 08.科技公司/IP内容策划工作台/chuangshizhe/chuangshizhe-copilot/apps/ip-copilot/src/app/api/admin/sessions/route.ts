import { NextResponse } from "next/server"
import { prismaCore } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET() {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const sessions = await prismaCore.session.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, phone: true } },
    },
  })

  return NextResponse.json({ sessions })
}
