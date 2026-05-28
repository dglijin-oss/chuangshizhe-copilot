import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

    const record = await prismaIp.userCapability.findUnique({
      where: { userId: user.id },
    })

    const defaults = {
      knowledgeBase: true,
      longTermMemory: false,
      fileUpload: true,
      webSearch: false,
    }

    if (!record) {
      return NextResponse.json({ capabilities: defaults })
    }

    return NextResponse.json({
      capabilities: {
        knowledgeBase: record.knowledgeBase,
        longTermMemory: record.longTermMemory,
        fileUpload: record.fileUpload,
        webSearch: record.webSearch,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: "加载配置失败" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

    const caps = (await req.json()) as {
      knowledgeBase?: boolean
      longTermMemory?: boolean
      fileUpload?: boolean
      webSearch?: boolean
    }

    const record = await prismaIp.userCapability.upsert({
      where: { userId: user.id },
      update: caps,
      create: { userId: user.id, ...caps },
    })

    return NextResponse.json({
      capabilities: {
        knowledgeBase: record.knowledgeBase,
        longTermMemory: record.longTermMemory,
        fileUpload: record.fileUpload,
        webSearch: record.webSearch,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: "更新配置失败" }, { status: 500 })
  }
}
