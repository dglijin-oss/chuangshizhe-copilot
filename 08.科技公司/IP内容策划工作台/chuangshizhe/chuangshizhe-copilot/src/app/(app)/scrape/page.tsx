"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTIONS = [
  { label: "提取B站视频字幕", prompt: "帮我提取这个B站视频的字幕内容，并总结要点：https://www.bilibili.com/video/BV1xx411c7mD" },
  { label: "获取抖音用户信息", prompt: "帮我获取这个抖音用户的信息和作品概况：" },
  { label: "查看抖音热榜", prompt: "帮我查看当前抖音热榜内容，并分析热点趋势" },
  { label: "提取YouTube字幕", prompt: "帮我提取这个YouTube视频的字幕并翻译成中文：https://www.youtube.com/watch?v=" },
]

export default function ScrapePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  const handleSend = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading) return

    const userMsg: Message = { role: "user", content }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)
    setStreamingContent("")

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }))

      const res = await fetch("/api/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "请求失败" }))
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${data.error || "请求失败"}` }])
        setLoading(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setMessages((prev) => [...prev, { role: "assistant", content: "响应流不可用" }])
        setLoading(false)
        return
      }

      let fullContent = ""
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
          if (!trimmed || !trimmed.startsWith("data:")) continue
          try {
            const parsed = JSON.parse(trimmed.slice(5).trim())
            if (parsed.type === "chunk") {
              fullContent += parsed.content
              setStreamingContent(fullContent)
            } else if (parsed.type === "error") {
              fullContent = `❌ ${parsed.message}`
              setStreamingContent(fullContent)
            } else if (parsed.type === "done") {
              setMessages((prev) => [...prev, { role: "assistant", content: fullContent || "(无内容)" }])
              setStreamingContent("")
              setLoading(false)
              return
            }
          } catch {
            // skip
          }
        }
      }

      if (fullContent) {
        setMessages((prev) => [...prev, { role: "assistant", content: fullContent }])
      }
      setStreamingContent("")
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ 网络请求失败，请检查连接" }])
    }
    setLoading(false)
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  const handleClear = () => {
    setMessages([])
    setStreamingContent("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold">AI 智能采集</h1>
          <p className="text-xs text-gray-400">OpenClaw 智能助手 — 告诉我你想采集什么</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-gray-400 hover:text-primary transition-colors px-3 py-1.5 border border-gray-200 rounded-lg"
          >
            清空对话
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🤖</div>
              <h2 className="text-xl font-bold mb-1">OpenClaw 智能采集助手</h2>
              <p className="text-sm text-gray-400">告诉我你想采集什么，我来帮你完成</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(s.prompt)
                    inputRef.current?.focus()
                  }}
                  className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm hover:border-primary hover:shadow-sm transition-all"
                >
                  <span className="font-medium">{s.label}</span>
                  <p className="text-xs text-gray-400 mt-1 truncate">{s.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed relative group",
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-white border border-gray-200 rounded-bl-sm"
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-300 hover:text-primary bg-white rounded-full p-1 shadow-sm"
                      title="复制"
                    >
                      📋
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed">
                  <div className="whitespace-pre-wrap">{streamingContent}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="animate-pulse w-1.5 h-1.5 bg-primary rounded-full" />
                    <div className="animate-pulse w-1.5 h-1.5 bg-primary rounded-full" style={{ animationDelay: "0.15s" }} />
                    <div className="animate-pulse w-1.5 h-1.5 bg-primary rounded-full" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 md:px-6 py-3">
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="告诉我你想采集什么..."
            rows={1}
            className="flex-1 resize-none px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className={cn(
              "px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              loading || !input.trim()
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-dark"
            )}
          >
            {loading ? "发送中..." : "发送"}
          </button>
        </div>
      </div>
    </div>
  )
}
