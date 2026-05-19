import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/history - list all generated publish packages grouped by IP
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ipId = searchParams.get("ipId")

  // Fetch all weekly plan items with generationStatus "done"
  const items = await prisma.weeklyPlanItem.findMany({
    where: {
      plan: {
        userId: user.id,
        ...(ipId && { ipId }),
      },
      generationStatus: "done",
    },
    include: {
      plan: {
        include: {
          ip: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Group by IP
  const groups: Record<string, { ip: any; items: any[] }> = {}
  for (const item of items) {
    const ip = item.plan.ip
    if (!ip) continue
    const ipKey = ip.id
    if (!groups[ipKey]) {
      groups[ipKey] = {
        ip: {
          id: ip.id,
          name: ip.name,
          industry: ip.industry,
        },
        items: [],
      }
    }
    const result = item.generatedResult as Record<string, any> || {}
    groups[ipKey].items.push({
      id: item.id,
      title: result.title || item.title,
      contentType: item.contentType,
      planWeekStart: item.plan.weekStart,
      createdAt: item.createdAt,
    })
  }

  const groupedItems = Object.values(groups)
    .map((g) => ({ ...g, count: g.items.length }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({ groupedItems })
}
