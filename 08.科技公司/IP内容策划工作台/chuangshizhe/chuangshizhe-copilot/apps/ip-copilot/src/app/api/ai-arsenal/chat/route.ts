import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"
import { client } from "@/lib/llm"
import { fetchKnowledgeContext } from "@/lib/knowledge"
import { webSearch } from "@/lib/web-search"

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { message, sessionId, model, webSearch: doWebSearch } = (await req.json()) as {
    message: string
    sessionId: string
    model?: string
    webSearch?: boolean
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 })
  }

  // Build system prompt
  let systemPrompt = "你是创世者 Copilot 的项目助手，帮助用户进行项目协作、文案创作、策略分析等工作。回答专业、简洁、有建设性。"

  // Inject knowledge context
  const knowledge = await fetchKnowledgeContext(user.id, null)
  if (knowledge.memories && knowledge.memories !== "无") {
    systemPrompt += `\n\n## 账号记忆（必须严格遵守）\n${knowledge.memories}`
  }
  if (knowledge.wikiPages && knowledge.wikiPages !== "无") {
    systemPrompt += `\n\n## 账号知识库参考\n${knowledge.wikiPages}`
  }

  // Web search
  if (doWebSearch) {
    try {
      const searchResults = await webSearch(message, 3)
      if (searchResults) {
        systemPrompt += `\n\n## 联网搜索结果（参考用）\n${searchResults}`
      }
    } catch {
      // silently ignore web search errors
    }
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
        const aiStream = await client.messages.create({
          model: model || "qwen3-max-2026-01-23",
          system: systemPrompt,
          messages: anthropicMessages,
          max_tokens: 4000,
          stream: true,
        })

        for await (const chunk of aiStream) {
          // DashScope Anthropic-compatible endpoint may use different chunk types
          // Handle both Anthropic format and DashScope format
          if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
            // Standard Anthropic format
            fullContent += chunk.delta.text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: chunk.delta.text })}\n\n`)
            )
          } else if (chunk.type === "delta" && chunk.text) {
            // DashScope format: { type: "delta", text: "..." }
            fullContent += chunk.text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: chunk.text })}\n\n`)
            )
          } else if (chunk.content && typeof chunk.content === "string") {
            // Fallback: raw content field
            fullContent += chunk.content
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: chunk.content })}\n\n`)
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
        console.error("[ai-arsenal/chat] Error:", err)
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
