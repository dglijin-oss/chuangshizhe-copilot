import * as auth from "@chuangshizhe/auth"
import { prismaCore } from "@/lib/prisma"

export async function getSessionUser() {
  const { cookies } = await import("next/headers")
  const token = (await cookies()).get(auth.SESSION_COOKIE)?.value
  if (!token) return null
  return auth.getSessionUser(prismaCore, token)
}

export async function requireAdmin() {
  const { cookies } = await import("next/headers")
  const token = (await cookies()).get(auth.SESSION_COOKIE)?.value
  return auth.requireAdmin(prismaCore, token)
}
