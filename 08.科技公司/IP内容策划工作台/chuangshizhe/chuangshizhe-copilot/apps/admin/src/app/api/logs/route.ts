import { NextResponse } from "next/server"
import { prismaCore } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const system = searchParams.get("system")
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "50")

  const where: Record<string, unknown> = {}
  if (system) where.product = system

  const [logs, total] = await Promise.all([
    prismaCore.generationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { name: true, phone: true } } },
    }),
    prismaCore.generationLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, pageSize })
}
