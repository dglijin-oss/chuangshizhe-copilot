import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { captchaStore, generateCaptcha } from "@/lib/captcha"

export async function GET() {
  const id = crypto.randomUUID()
  const { question, answer } = generateCaptcha()

  captchaStore.set(id, { question, answer, createdAt: Date.now() })

  return NextResponse.json({ id, question })
}

export async function POST(req: NextRequest) {
  const { id, answer } = await req.json().catch(() => ({})) as { id?: string; answer?: number | string }

  if (!id || answer === undefined) {
    return NextResponse.json({ error: "验证码信息不完整" }, { status: 400 })
  }

  const entry = captchaStore.get(id)
  if (!entry) {
    return NextResponse.json({ error: "验证码已过期，请重新获取" }, { status: 400 })
  }

  captchaStore.delete(id)

  const correct = Number(answer) === entry.answer
  if (!correct) {
    return NextResponse.json({ error: "验证码错误", valid: false })
  }

  return NextResponse.json({ valid: true })
}
