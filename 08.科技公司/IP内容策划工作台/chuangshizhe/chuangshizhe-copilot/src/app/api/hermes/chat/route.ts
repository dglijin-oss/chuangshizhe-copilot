import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

const OPENCLAW_URL = process.env.OPENCLAW_API_URL;
const OPENCLAW_KEY = process.env.OPENCLAW_API_KEY;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  if (!OPENCLAW_URL || !OPENCLAW_KEY) {
    return NextResponse.json({ error: "OpenClaw 服务未配置" }, { status: 503 });
  }

  const { messages } = await req.json() as { messages: Array<{ role: string; content: string }> };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let buffer = "";

      try {
        const res = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENCLAW_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openclaw/default",
            messages,
            stream: true,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: `OpenClaw 错误 (${res.status}): ${errBody}` })}\n\n`));
          controller.close();
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += new TextDecoder().decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
              controller.close();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", content })}\n\n`));
              }
            } catch {
              // skip malformed JSON
            }
          }
        }

        controller.close();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "连接 OpenClaw 服务失败";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`));
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
