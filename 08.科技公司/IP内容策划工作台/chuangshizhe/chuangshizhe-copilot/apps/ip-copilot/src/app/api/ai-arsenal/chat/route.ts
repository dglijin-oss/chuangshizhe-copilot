import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"

const API_KEY = process.env.ALIYUN_API_KEY!
const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { message, sessionId, model = "qwen3-max-2026-01-23", webSearch = false } = (await req.json()) as {
    message: string
    sessionId: string
    model?: string
    webSearch?: boolean
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 })
  }

  // Fetch session messages for context (last 10)
  const history = await prismaIp.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  // Build messages array
  const messages: { role: string; content: string }[] = [
    {
      role: "system",
      content: "你是创世者 Copilot 的项目助手，帮助用户进行项目协作、文案创作、策略分析等工作。回答专业、简洁、有建设性。",
    },
    ...history.reverse().map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ]

  // Add web search system hint if enabled
  if (webSearch) {
    messages[0].content += "\n\n如果用户的问题需要最新信息，可以基于已有知识给出建议。"
  }

  // Save user message first
  await prismaIp.chatMessage.create({
    data: { sessionId, role: "user", content: message },
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let fullContent = ""

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
          }),
        })

        if (!res.ok) {
          const err = await res.text()
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: `API 错误: ${err}` })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
          controller.close()
          return
        }

        const reader = res.body?.getReader()
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "响应流不可用" })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed === "data: [DONE]") continue
            if (!trimmed.startsWith("data:")) continue

            try {
              const json = JSON.parse(trimmed.slice(5).trim())
              const delta = json.choices?.[0]?.delta
              if (delta?.content) {
                fullContent += delta.content
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: delta.content })}\n\n`)
                )
              }
            } catch {
              // skip
            }
          }
        }

        // Save assistant message
        if (fullContent) {
          await prismaIp.chatMessage.create({
            data: { sessionId, role: "assistant", content: fullContent },
          })
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`))
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: err.message || "请求失败" })}\n\n`))
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
      controller.close()
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
