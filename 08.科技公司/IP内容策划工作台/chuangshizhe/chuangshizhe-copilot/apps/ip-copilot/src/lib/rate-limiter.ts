// Simple in-memory rate limiter for single-instance deployments
interface RateEntry {
  count: number
  firstAttempt: number
}

const attempts = new Map<string, RateEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of attempts) {
    if (now - entry.firstAttempt > 15 * 60 * 1000) {
      attempts.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now - entry.firstAttempt > windowMs) {
    attempts.set(key, { count: 1, firstAttempt: now })
    return { allowed: true }
  }

  if (entry.count >= maxAttempts) {
    const retryAfter = Math.ceil((entry.firstAttempt + windowMs - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.count++
  return { allowed: true }
}

export function resetRateLimit(key: string) {
  attempts.delete(key)
}
