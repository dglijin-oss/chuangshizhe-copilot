import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"

const HERMES_URL = process.env.HERMES_API_URL || "http://127.0.0.1:9119"
const HERMES_TOKEN = process.env.HERMES_API_TOKEN || ""
const WS_URL = HERMES_URL.replace(/^http/, "ws")

/**
 * Strip ANSI escape codes from terminal output
 */
function stripAnsi(text: string): string {
  return text
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
    .replace(/\x1b\][^\x07]*\x07/g, "")
    .replace(/\x1b\^[^\x1b]*\x1b\\/g, "")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
}

/**
 * WebSocket → SSE proxy for Hermes Agent.
 * Opens WS to Hermes, sends user message, streams terminal output as SSE.
 */
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { message } = (await req.json()) as { message: string }
  if (!message?.trim()) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 })
  }

  const wsUrl = `${WS_URL}/api/ws?token=${encodeURIComponent(HERMES_TOKEN)}`

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let ws: WebSocket
      let settled = false
      let messageSent = false
      let reqId = 0
      const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>()
      let heartbeatTimer: ReturnType<typeof setTimeout>

      const settle = (err?: Error) => {
        if (settled) return
        settled = true
        clearInterval(heartbeatTimer)
        try { ws?.close() } catch { /* noop */ }
        if (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`))
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
        controller.close()
      }

      function rpcCall(method: string, params: Record<string, unknown> = {}, timeout = 30000): Promise<unknown> {
        const id = `w${++reqId}`
        return new Promise((res, rej) => {
          const timer = setTimeout(() => {
            pending.delete(id)
            rej(new Error(`RPC 超时: ${method}`))
          }, timeout)
          pending.set(id, { resolve: res, reject: rej, timer })
          ws.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }))
        })
      }

      try {
        ws = new WebSocket(wsUrl)
      } catch (err: unknown) {
        settle(new Error(`WebSocket 连接失败: ${err instanceof Error ? err.message : String(err)}`))
        return
      }

      // Heartbeat to keep WS alive during long agent responses
      heartbeatTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("\x1B[RESIZE:120;60]")
        }
      }, 30000)

      ws.onopen = () => {
        ws.send("\x1B[RESIZE:120;60]")
        rpcCall("session.create", {}).then(() => {
          ws.send(message + "\r")
          messageSent = true
        }).catch((err) => {
          settle(new Error(`创建会话失败: ${err.message}`))
        })
      }

      ws.onmessage = (event) => {
        const data = event.data

        // Handle JSON-RPC responses
        if (typeof data === "string" && data.startsWith("{")) {
          try {
            const msg = JSON.parse(data)
            if (msg.id && pending.has(msg.id)) {
              const p = pending.get(msg.id)!
              clearTimeout(p.timer)
              pending.delete(msg.id)
              if (msg.error) p.reject(new Error(msg.error.message || "RPC error"))
              else p.resolve(msg.result)
            }
            return
          } catch {
            // Not JSON, treat as terminal output
          }
        }

        // Handle terminal data
        let text: string
        if (data instanceof ArrayBuffer) {
          text = new TextDecoder().decode(data)
        } else if (data instanceof Uint8Array) {
          text = new TextDecoder().decode(data)
        } else if (typeof data === "string") {
          text = data
        } else {
          return
        }

        // Strip ANSI codes and send as SSE chunk
        const cleaned = stripAnsi(text)
        if (cleaned.trim() && messageSent) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: cleaned })}\n\n`))
        }
      }

      ws.onclose = () => {
        // Reject any pending RPCs
        for (const [, p] of pending) {
          clearTimeout(p.timer)
          p.reject(new Error("WebSocket 已关闭"))
        }
        pending.clear()
        settle()
      }

      ws.onerror = () => {
        settle(new Error("WebSocket 连接错误"))
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
