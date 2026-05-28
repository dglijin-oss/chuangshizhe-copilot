import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

    const { id } = await params

    const session = await prismaIp.chatSession.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!session) return NextResponse.json({ error: "会话不存在" }, { status: 404 })

    return NextResponse.json({
      session: { id: session.id, title: session.title || "新对话" },
      messages: session.messages,
    })
  } catch (err: any) {
    return NextResponse.json({ error: "加载会话失败" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

    const { id } = await params

    await prismaIp.chatSession.deleteMany({
      where: { id, userId: user.id },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: "删除会话失败" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

    const { id } = await params
    const { title } = (await req.json()) as { title: string }

    await prismaIp.chatSession.updateMany({
      where: { id, userId: user.id },
      data: { title },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: "更新会话失败" }, { status: 500 })
  }
}
