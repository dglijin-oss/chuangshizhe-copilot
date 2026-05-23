/**
 * Hermes Agent WebSocket client
 * Communicates via JSON-RPC 2.0 over WS terminal protocol
 */

const HERMES_URL = process.env.HERMES_API_URL || "http://127.0.0.1:9119"
const HERMES_TOKEN = process.env.HERMES_API_TOKEN || ""
const WS_URL = HERMES_URL.replace("http", "ws")

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
 * Extract the agent's response text from terminal buffer.
 * Removes prompt echoes, shell noise, and isolates the response content.
 */
function extractResponse(buffer: string, inputText: string): string {
  let cleaned = stripAnsi(buffer)
  // Remove the echoed user input
  if (inputText) {
    cleaned = cleaned.replace(new RegExp(inputText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "")
  }
  // Remove common terminal artifacts
  cleaned = cleaned
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return cleaned
}

export interface HermesChatOptions {
  messages: Array<{ role: string; content: string }>
  onChunk?: (text: string) => void
  signal?: AbortSignal
  skill?: string  // Optional: invoke a specific Hermes skill by name
}

/**
 * Streaming chat via Hermes WebSocket terminal.
 * Connects, sends messages, streams terminal output as chunks.
 */
export async function chatStream(opts: HermesChatOptions): Promise<string> {
  const token = HERMES_TOKEN
  if (!token) throw new Error("HERMES_API_TOKEN not configured")

  const wsUrl = `${WS_URL}/api/ws?token=${encodeURIComponent(token)}`

  return new Promise((resolve, reject) => {
    let ws: WebSocket
    let fullContent = ""
    let terminalBuffer = ""
    let sessionId = ""
    let sessionCreated = false
    let messageSent = false
    let settled = false

    const settle = (err?: Error) => {
      if (settled) return
      settled = true
      try { ws?.close() } catch { /* ignore */ }
      if (err) reject(err)
      else resolve(fullContent)
    }

    // Abort signal support
    opts.signal?.addEventListener("abort", () => {
      settle(new Error("Aborted"))
    })

    try {
      ws = new WebSocket(wsUrl)
    } catch (err) {
      reject(new Error(`WebSocket connection failed: ${err instanceof Error ? err.message : String(err)}`))
      return
    }

    let reqId = 0
    const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>()

    function rpcCall(method: string, params: Record<string, unknown> = {}, timeout = 30000): Promise<unknown> {
      const id = `w${++reqId}`
      return new Promise((res, rej) => {
        const timer = setTimeout(() => {
          pending.delete(id)
          rej(new Error(`RPC timeout: ${method}`))
        }, timeout)
        pending.set(id, { resolve: res, reject: rej, timer })
        ws.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }))
      })
    }

    ws.onopen = () => {
      // Set terminal size
      ws.send("\x1B[RESIZE:120;60]")

      // Create a new session
      rpcCall("session.create", {}).then((result: unknown) => {
        const r = result as Record<string, unknown>
        sessionId = (r?.session_id as string) || ""
        sessionCreated = true

        // Build the message to send
        const userMessages = opts.messages
          .filter((m) => m.role === "user" || m.role === "system")
          .map((m) => m.content)
          .join("\n\n")

        let inputText = userMessages
        if (opts.skill) {
          inputText = `/skill ${opts.skill}\n\n${userMessages}`
        }

        // Send the message followed by Enter
        ws.send(inputText + "\r")
        messageSent = true
      }).catch((err) => {
        settle(new Error(`Failed to create session: ${err.message}`))
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
          // Handle session.info events
          if (msg.method === "event" && msg.params?.type === "session.info") {
            // Session is running, content will arrive as terminal data
          }
          return
        } catch {
          // Not JSON, treat as terminal data
        }
      }

      // Handle binary terminal data
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

      terminalBuffer += text

      // Strip ANSI and extract incremental content
      const cleaned = stripAnsi(text)
      if (cleaned && messageSent) {
        fullContent += cleaned
        opts.onChunk?.(cleaned)
      }
    }

    ws.onclose = (event) => {
      // Reject any pending RPCs
      for (const [id, p] of pending) {
        clearTimeout(p.timer)
        p.reject(new Error("WebSocket closed"))
        pending.delete(id)
      }

      // If we have content, resolve with it
      if (fullContent.trim()) {
        const finalContent = extractResponse(fullContent, opts.skill ? `/skill ${opts.skill}` : "")
        resolve(finalContent)
      } else if (!settled) {
        settle(new Error(`WebSocket closed (code: ${event.code})`))
      }
    }

    ws.onerror = () => {
      settle(new Error("WebSocket error"))
    }
  })
}

/**
 * Convenience: streaming chat returning ReadableStream for SSE passthrough
 */
export function proxyStreamHermes(opts: HermesChatOptions): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        const result = await chatStream({
          ...opts,
          onChunk: (text) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: text })}\n\n`))
          },
        })
        if (!result && !opts.onChunk) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "无内容返回" })}\n\n`))
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
        controller.close()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "连接 Hermes 失败"
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: msg })}\n\n`))
        controller.close()
      }
    },
  })
}
