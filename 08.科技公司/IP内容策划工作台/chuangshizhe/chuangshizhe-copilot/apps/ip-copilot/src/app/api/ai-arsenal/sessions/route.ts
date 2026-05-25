import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const sessions = await prismaIp.chatSession.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
  })

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title || "新对话",
      updatedAt: s.updatedAt,
    })),
  })
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { title } = (await req.json()) as { title?: string }

  const session = await prismaIp.chatSession.create({
    data: { userId: user.id, title: title || "新对话" },
  })

  return NextResponse.json({ session: { id: session.id, title: session.title, updatedAt: session.updatedAt } })
}
