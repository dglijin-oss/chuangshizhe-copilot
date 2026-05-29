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

  // Get the session with agent info
  const session = await prismaIp.chatSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: { agent: true },
  })

  if (!session) return NextResponse.json({ error: "会话不存在" }, { status: 404 })

  // Build system prompt
  let systemPrompt = "你是创世者 Copilot 的 AI 智能体助手。"
  if (session.agent?.systemPrompt) {
    systemPrompt = session.agent.systemPrompt
  }

  // Inject knowledge context: AccountMemory + WikiPage
  const knowledge = await fetchKnowledgeContext(user.id, session.agent?.ipId || null)
  if (knowledge.memories && knowledge.memories !== "无") {
    systemPrompt += `\n\n## 账号记忆（必须严格遵守）\n${knowledge.memories}`
  }
  if (knowledge.wikiPages && knowledge.wikiPages !== "无") {
    systemPrompt += `\n\n## IP 知识库参考\n${knowledge.wikiPages}`
  }

  // Web search: fetch results and inject into system prompt
  if (doWebSearch) {
    const searchResults = await webSearch(message, 3)
    if (searchResults) {
      systemPrompt += `\n\n## 联网搜索结果（参考用，可能不完全相关）\n${searchResults}`
    }
  }

  // Fetch session messages for context (last 10)
  const history = await prismaIp.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  const anthropicMessages = history.reverse().map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user" as const,
    content: m.content,
  }))
  anthropicMessages.push({ role: "user" as const, content: message })

  // Save user message
  await prismaIp.chatMessage.create({
    data: { sessionId, role: "user", content: message },
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let fullContent = ""

      try {
        const stream = await client.messages.create({
          model: model || "qwen3-max-2026-01-23",
          system: systemPrompt,
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
