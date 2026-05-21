import { NextRequest, NextResponse } from "next/server"
import * as auth from "@chuangshizhe/auth"

const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/register", "/api/auth/captcha"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return NextResponse.next()
  if (pathname === "/" || pathname === "/login") return NextResponse.next()

  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get(auth.SESSION_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ["/api/:path*"] }
