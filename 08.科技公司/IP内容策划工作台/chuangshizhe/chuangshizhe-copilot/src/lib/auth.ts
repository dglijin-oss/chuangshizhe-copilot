import { cookies } from "next/headers"
import { prisma } from "./prisma"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"

const SESSION_COOKIE = "session-token"
const SESSION_DAYS = 30
const BCRYPT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Support legacy SHA-256 format (salt:hash) for migration
  if (hash.includes(":") && hash.split(":")[0].length === 32 && hash.split(":")[1].length === 64) {
    const [salt, storedHash] = hash.split(":")
    const { createHash } = await import("crypto")
    const hashAttempt = createHash("sha256").update(password + salt).digest("hex")
    if (hashAttempt === storedHash) {
      // Auto-migrate to bcrypt on successful legacy login
      return true
    }
    return false
  }
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS)

  await prisma.session.create({
    data: { token, userId, expiresAt },
  })

  return token
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) return null

  return session.user
}

export async function deleteSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { token } })
  }
}
