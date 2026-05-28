import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const agents = await prismaIp.agent.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  })

  return NextResponse.json({
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
      tagline: a.tagline,
      description: a.description,
      quickPrompts: a.quickPrompts,
      themeColor: a.themeColor,
    })),
  })
}
