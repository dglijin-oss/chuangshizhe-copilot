import crypto from "crypto"

// HMAC-signed captcha token — no server-side storage needed.
// The captcha ID returned by /api/auth/captcha is a base64 token that
// embeds the answer + timestamp, sealed with an HMAC signature.
// This survives HMR restarts, multi-instance deployments, and server recycles.

const CAPTCHA_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getSecret(): string {
  return process.env.CAPTCHA_SECRET || "captcha-dev-secret-change-in-prod"
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex")
}

interface CaptchaToken {
  a: number  // answer
  t: number  // createdAt timestamp
  s: string  // signature
}

function encodeToken(answer: number, createdAt: number): string {
  const payload = `${answer}:${createdAt}`
  const signature = sign(payload)
  const token: CaptchaToken = { a: answer, t: createdAt, s: signature }
  return Buffer.from(JSON.stringify(token)).toString("base64url")
}

function decodeToken(token: string): CaptchaToken | null {
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString()) as CaptchaToken
    if (!parsed.a || !parsed.t || !parsed.s) return null
    // Verify signature
    const payload = `${parsed.a}:${parsed.t}`
    const expected = sign(payload)
    if (parsed.s !== expected) return null
    return parsed
  } catch {
    return null
  }
}

// Clean up expired captchas — kept for backwards compat but no longer needed
// since tokens are self-contained. Removed to avoid confusion.

export function generateCaptcha(): { question: string; answer: number; token: string } {
  const ops = [
    () => {
      const a = Math.floor(Math.random() * 20) + 1
      const b = Math.floor(Math.random() * 20) + 1
      return { question: `${a} + ${b} = ?`, answer: a + b }
    },
    () => {
      const a = Math.floor(Math.random() * 20) + 5
      const b = Math.floor(Math.random() * (a - 1)) + 1
      return { question: `${a} - ${b} = ?`, answer: a - b }
    },
    () => {
      const a = Math.floor(Math.random() * 10) + 2
      const b = Math.floor(Math.random() * 10) + 2
      return { question: `${a} × ${b} = ?`, answer: a * b }
    },
  ]
  const op = ops[Math.floor(Math.random() * ops.length)]
  const { question, answer } = op()
  const token = encodeToken(answer, Date.now())
  return { question, answer, token }
}

export function verifyCaptcha(token: string, answer: number | string): { valid: boolean; expired: boolean } {
  const decoded = decodeToken(token)
  if (!decoded) return { valid: false, expired: false }
  if (Date.now() - decoded.t > CAPTCHA_TTL_MS) return { valid: false, expired: true }
  if (Number(answer) !== decoded.a) return { valid: false, expired: false }
  return { valid: true, expired: false }
}
