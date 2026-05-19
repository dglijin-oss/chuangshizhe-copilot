import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/register"]

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

  // Protect API routes
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    // Admin routes: check role cookie
    if (pathname.startsWith("/api/admin/")) {
      const role = request.cookies.get("user-role")?.value
      if (role !== "admin") {
        return NextResponse.json({ error: "无权限访问" }, { status: 403 })
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
