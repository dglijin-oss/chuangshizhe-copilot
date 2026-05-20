import { NextResponse } from "next/server"
import { deleteSession } from "@/lib/auth"

export async function POST() {
  await deleteSession()
  const res = NextResponse.json({ ok: true })
  res.cookies.set("session-token", "", { maxAge: 0, path: "/" })
  res.cookies.set("user-role", "", { maxAge: 0, path: "/" })
  return res
}
