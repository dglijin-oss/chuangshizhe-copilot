import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { client, MODEL } from "@/lib/llm"

const SYSTEM_PROMPT = `你是一个智能内容采集助手，帮助用户从各大平台（B站、抖音、小红书、快手、YouTube、X、Instagram、微博、TikTok、Lemon8）提取和分析内容。

你的能力：
- 提取视频字幕/字幕总结
- 获取视频/文章详情信息
- 查看用户信息和作品概况
- 查看评论分析
- 查看平台热榜和热点趋势

当用户提供具体 URL 时，请分析 URL 所属平台，告诉用户你将如何帮助提取该平台的内容。
用简洁清晰的中文回复。`

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { messages } = (await req.json()) as { messages: Array<{ role: string; content: string }> }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        const res = await client.messages.create({
          model: MODEL,
          messages: [
            { role: "user", content: SYSTEM_PROMPT },
            ...messages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          ],
          max_tokens: 4000,
          stream: true,
        })

        for await (const chunk of res) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: chunk.delta.text })}\n\n`))
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
        controller.close()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "连接模型服务失败"
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`))
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
