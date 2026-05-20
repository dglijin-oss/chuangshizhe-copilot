import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/assets/integrations - list integration configs
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const integrations = await prisma.integrationConfig.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ integrations })
}

// POST /api/assets/integrations - create integration config
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { platform, configName, configData, status } = await req.json()

  if (!platform || !configName) return NextResponse.json({ error: "平台和名称必填" }, { status: 400 })

  const integration = await prisma.integrationConfig.create({
    data: {
      userId: user.id,
      platform,
      configName,
      configData: configData || "",
      status: status || "待配置",
    },
  })

  return NextResponse.json({ integration })
}

// DELETE /api/assets/integrations
export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID 必填" }, { status: 400 })

  await prisma.integrationConfig.delete({ where: { id, userId: user.id } })
  return NextResponse.json({ success: true })
}
