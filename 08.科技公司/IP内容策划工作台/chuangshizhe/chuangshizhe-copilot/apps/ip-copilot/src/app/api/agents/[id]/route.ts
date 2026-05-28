import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params

  const agent = await prismaIp.agent.findFirst({
    where: { id, isActive: true },
  })

  if (!agent) return NextResponse.json({ error: "智能体不存在" }, { status: 404 })

  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      icon: agent.icon,
      tagline: agent.tagline,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      quickPrompts: agent.quickPrompts,
      themeColor: agent.themeColor,
    },
  })
}
