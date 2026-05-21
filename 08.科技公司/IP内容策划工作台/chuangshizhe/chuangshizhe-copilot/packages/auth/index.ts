/**
 * @chuangshizhe/auth — 共享认证模块
 *
 * 所有函数接受 PrismaClient 参数，不硬编码导入，使任意 app 都能复用。
 */

import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import type { PrismaClient } from "@chuangshizhe/database/client-core"

export const SESSION_COOKIE = "session-token"
export const SESSION_DAYS = 30
export const BCRYPT_ROUNDS = 12

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS)
}

export function verifyPassword(password: string, hash: string): { valid: boolean; needsMigration: boolean } {
  // 支持旧 SHA-256 格式: salt:hash (salt 32 chars, hash 64 chars)
  const parts = hash.split(":")
  if (parts.length === 2 && parts[0].length === 32 && parts[1].length === 64) {
    const [salt, expectedHash] = parts
    const { createHash } = require("crypto")
    const computedHash = createHash("sha256").update(salt + password).digest("hex")
    return { valid: computedHash === expectedHash, needsMigration: true }
  }
  return { valid: bcrypt.compareSync(password, hash), needsMigration: false }
}

export async function createSession(prisma: PrismaClient, userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS)

  await prisma.session.create({
    data: { userId, token, expiresAt },
  })
  return token
}

export async function getSessionUser(prisma: PrismaClient, token: string | undefined) {
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session) return null
  if (session.expiresAt < new Date()) return null

  return session.user
}

export async function deleteSession(prisma: PrismaClient, token: string | undefined): Promise<void> {
  if (!token) return
  await prisma.session.deleteMany({ where: { token } })
}

export async function requireAdmin(prisma: PrismaClient, token: string | undefined) {
  const user = await getSessionUser(prisma, token)
  if (!user || user.role !== "admin") return null
  return user
}
