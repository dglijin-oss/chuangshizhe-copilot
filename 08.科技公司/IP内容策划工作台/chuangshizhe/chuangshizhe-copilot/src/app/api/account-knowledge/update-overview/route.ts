import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { updateOverview } from "@/lib/knowledge-overview"

// POST /api/account-knowledge/update-overview - rebuild overview with live stats
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  try {
    const result = await updateOverview(user.id)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error("Update overview error:", err)
    return NextResponse.json({ error: "更新失败，请稍后重试" }, { status: 500 })
  }
}
