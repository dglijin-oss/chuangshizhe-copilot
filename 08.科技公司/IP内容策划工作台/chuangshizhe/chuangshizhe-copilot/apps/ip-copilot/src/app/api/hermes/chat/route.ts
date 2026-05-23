import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { proxyStreamHermes } from "@/lib/hermes";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { messages } = await req.json() as { messages: Array<{ role: string; content: string }> };

  const stream = proxyStreamHermes({ messages });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
