import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/register", "/api/auth/captcha"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static files and public pages
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get("session-token")?.value

  // Protect API routes — only check login, role is validated server-side in each handler
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
