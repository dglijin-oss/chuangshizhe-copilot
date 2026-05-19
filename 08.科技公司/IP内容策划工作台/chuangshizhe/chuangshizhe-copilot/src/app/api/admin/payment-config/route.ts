import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/payment-config - get current payment QR code
export async function GET() {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const config = await prisma.paymentConfig.findUnique({
    where: { key: "wechat_qr" },
  })

  return NextResponse.json({ qrDataUrl: config?.value || null })
}

// PUT /api/admin/payment-config - upload/update WeChat payment QR code
export async function PUT(req: Request) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const { qrDataUrl } = await req.json()
  if (!qrDataUrl || !qrDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "二维码格式无效" }, { status: 400 })
  }

  await prisma.paymentConfig.upsert({
    where: { key: "wechat_qr" },
    create: { key: "wechat_qr", value: qrDataUrl },
    update: { value: qrDataUrl },
  })

  return NextResponse.json({ success: true })
}
