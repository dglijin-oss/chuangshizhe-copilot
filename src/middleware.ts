import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/api/auth", "/api/generate"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 允许静态资源和公开 API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("session-token")?.value;

  // 保护 API 路由
  if (pathname.startsWith("/api/")) {
    if (!sessionToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
