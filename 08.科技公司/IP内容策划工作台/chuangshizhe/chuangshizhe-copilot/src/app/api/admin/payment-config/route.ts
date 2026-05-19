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
  console.log("[payment-config] PUT request received")

  let admin
  try {
    admin = await getSessionUser()
    console.log("[payment-config] admin:", admin?.id, admin?.role)
  } catch (e) {
    console.error("[payment-config] getSessionUser error:", e)
    return NextResponse.json({ error: "鉴权失败" }, { status: 500 })
  }

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  let body
  try {
    body = await req.json()
  } catch (e) {
    console.error("[payment-config] JSON parse error:", e)
    return NextResponse.json({ error: "请求体解析失败" }, { status: 400 })
  }

  const { qrDataUrl } = body
  console.log("[payment-config] qrDataUrl length:", qrDataUrl?.length)

  if (!qrDataUrl || !qrDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "二维码格式无效" }, { status: 400 })
  }

  try {
    await prisma.paymentConfig.upsert({
      where: { key: "wechat_qr" },
      create: { key: "wechat_qr", value: qrDataUrl },
      update: { value: qrDataUrl },
    })
    console.log("[payment-config] Saved successfully")
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[payment-config] DB error:", e)
    return NextResponse.json({ error: "保存失败: " + (e instanceof Error ? e.message : String(e)) }, { status: 500 })
  }
}
