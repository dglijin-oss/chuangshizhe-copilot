import { NextRequest, NextResponse } from "next/server"
import { generateCaptcha, verifyCaptcha } from "@/lib/captcha"

// GET: generate a new captcha
export async function GET() {
  const { question, token } = generateCaptcha()
  return NextResponse.json({ id: token, question })
}

// POST: verify captcha answer
export async function POST(req: NextRequest) {
  const { id, answer } = await req.json().catch(() => ({})) as { id?: string; answer?: number | string }

  if (!id || answer === undefined) {
    return NextResponse.json({ error: "验证码信息不完整" }, { status: 400 })
  }

  const result = verifyCaptcha(id, answer)
  if (result.expired) {
    return NextResponse.json({ error: "验证码已过期，请重新获取" }, { status: 400 })
  }
  if (!result.valid) {
    return NextResponse.json({ error: "验证码错误", valid: false })
  }

  return NextResponse.json({ valid: true })
}
