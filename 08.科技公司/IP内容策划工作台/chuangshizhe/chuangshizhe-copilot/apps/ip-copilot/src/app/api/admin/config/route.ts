import { NextResponse } from "next/server"
import { prismaCore } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

// Default config stored in DB or env, for now return defaults
const defaultPackages = [
  { price: 10, points: 100, bonus: 0, label: "" },
  { price: 20, points: 200, bonus: 0, label: "" },
  { price: 30, points: 300, bonus: 0, label: "" },
  { price: 50, points: 500, bonus: 100, label: "多送 100 积分" },
  { price: 100, points: 1000, bonus: 300, label: "多送 300 积分" },
  { price: 200, points: 2000, bonus: 1000, label: "多送 1000 积分" },
]

const defaultModels = [
  { name: "通义千问 Max 2026-01-23", key: "qwen3-max-2026-01-23", pricePerK: 0.12 },
]

export async function GET() {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  // Try to read from env or return defaults
  return NextResponse.json({
    packages: defaultPackages,
    models: defaultModels,
    pointsPerYuan: 10,
  })
}

export async function PUT(req: Request) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  // For now, just acknowledge the config update
  // In production, save to a Config table or environment
  await req.json()
  return NextResponse.json({ success: true })
}
