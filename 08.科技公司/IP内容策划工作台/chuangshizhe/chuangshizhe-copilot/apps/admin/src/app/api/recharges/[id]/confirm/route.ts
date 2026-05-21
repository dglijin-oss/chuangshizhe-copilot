import { NextResponse } from "next/server"
import { prismaCore } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import * as billing from "@chuangshizhe/billing"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { id } = await params
  const result = await billing.confirmRecharge(prismaCore, id)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
