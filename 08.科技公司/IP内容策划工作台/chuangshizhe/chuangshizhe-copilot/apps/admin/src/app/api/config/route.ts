import { NextResponse } from "next/server"
import { prismaCore } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const config = await prismaCore.paymentConfig.findMany()
  const packages = [
    { amount: 10, points: 100, bonus: 0 },
    { amount: 20, points: 200, bonus: 0 },
    { amount: 30, points: 300, bonus: 0 },
    { amount: 50, points: 500, bonus: 100 },
    { amount: 100, points: 1000, bonus: 300 },
    { amount: 200, points: 2000, bonus: 1000 },
  ]
  return NextResponse.json({ config, packages })
}

export async function PUT(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { key, value } = await request.json()
  const config = await prismaCore.paymentConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
  return NextResponse.json({ config })
}
