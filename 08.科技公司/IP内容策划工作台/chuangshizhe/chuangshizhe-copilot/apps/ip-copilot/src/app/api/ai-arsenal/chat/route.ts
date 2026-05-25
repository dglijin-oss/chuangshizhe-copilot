import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"
import { client } from "@/lib/llm"

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { message, sessionId } = (await req.json()) as {
    message: string
    sessionId: string
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

  // Build messages array (Anthropic format — system is separate)
  const anthropicMessages = history.reverse().map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user" as const,
    content: m.content,
  }))
  anthropicMessages.push({ role: "user" as const, content: message })

  // Save user message first
  await prismaIp.chatMessage.create({
    data: { sessionId, role: "user", content: message },
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let fullContent = ""

      try {
        const stream = await client.messages.create({
          model: "qwen3-max-2026-01-23",
          system: "你是创世者 Copilot 的项目助手，帮助用户进行项目协作、文案创作、策略分析等工作。回答专业、简洁、有建设性。",
          messages: anthropicMessages,
          max_tokens: 4000,
          stream: true,
        })

        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
            fullContent += chunk.delta.text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: chunk.delta.text })}\n\n`)
            )
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
