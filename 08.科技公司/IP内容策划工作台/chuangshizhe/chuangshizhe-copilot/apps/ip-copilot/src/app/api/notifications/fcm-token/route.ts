import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaCore } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  try {
    const { fcmToken, platform } = await req.json()
    if (!fcmToken) return NextResponse.json({ error: "缺少 fcmToken" }, { status: 400 })

    await prismaCore.deviceToken.upsert({
      where: { token: fcmToken },
      create: {
        userId: user.id,
        platform: platform || "android",
        token: fcmToken,
      },
      update: {
        userId: user.id,
        platform: platform || "android",
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 })
  }
}
