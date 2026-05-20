interface CaptchaEntry {
  question: string
  answer: number
  createdAt: number
}

export const captchaStore = new Map<string, CaptchaEntry>()

// Clean up expired captchas every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of captchaStore) {
    if (now - entry.createdAt > 10 * 60 * 1000) {
      captchaStore.delete(key)
    }
  }
}, 10 * 60 * 1000)

export function generateCaptcha(): { question: string; answer: number } {
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
  return op()
}
