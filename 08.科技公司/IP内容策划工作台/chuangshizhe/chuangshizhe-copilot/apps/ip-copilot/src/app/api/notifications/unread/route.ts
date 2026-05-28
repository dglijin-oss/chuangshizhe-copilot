import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaCore } from "@/lib/prisma"

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const notifications = await prismaCore.notification.findMany({
    where: { userId: user.id, read: false },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ notifications })
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  await prismaCore.notification.updateMany({
    where: { userId: user.id },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}
