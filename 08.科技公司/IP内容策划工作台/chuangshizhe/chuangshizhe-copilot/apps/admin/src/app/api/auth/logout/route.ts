import { NextResponse } from "next/server"
import * as auth from "@chuangshizhe/auth"
import { prismaCore } from "@/lib/prisma"

export async function POST() {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  const token = cookieStore.get(auth.SESSION_COOKIE)?.value
  await auth.deleteSession(prismaCore, token)

  const response = NextResponse.json({ success: true })
  response.cookies.set(auth.SESSION_COOKIE, "", { maxAge: 0, path: "/" })
  response.cookies.set("user-role", "", { maxAge: 0, path: "/" })
  return response
}
