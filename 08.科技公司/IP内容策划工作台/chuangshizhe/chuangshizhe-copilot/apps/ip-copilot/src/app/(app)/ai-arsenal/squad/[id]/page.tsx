"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Send, FileUp, Loader2, ChevronDown, X, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const MODELS = [
  { value: "qwen3-max-2026-01-23", label: "Qwen3 Max" },
  { value: "qwen-plus", label: "Qwen Plus" },
]

interface Agent {
  id: string
  name: string
  icon: string
  tagline: string
  description: string
  systemPrompt: string
  quickPrompts: string[]
  themeColor: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string
}

export default function SquadChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [agentId, setAgentId] = useState<string>("")
  const [agent, setAgent] = useState<Agent | null>(null)
  const [sessions, setSessions] = useState<{ id: string; title: string; updatedAt: string }[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [model, setModel] = useState("qwen3-max-2026-01-23")
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [newSessionTitle, setNewSessionTitle] = useState("")
  const [fileContent, setFileContent] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get agent ID from params
  useEffect(() => {
    params.then((p) => setAgentId(p.id))
  }, [params])

  // Load agent detail
  useEffect(() => {
    if (!agentId) return
    const loadAgent = async () => {
      try {
        const res = await fetch(`/api/agents/${agentId}`, { credentials: "include" })
        if (!res.ok) return
        const data = await res.json()
        if (data.agent) setAgent(data.agent)
      } catch {
        // ignore
      }
    }
    loadAgent()
  }, [agentId])

  // Load sessions for this agent
  const loadSessions = useCallback(async () => {
    if (!agentId) return
    try {
      const res = await fetch(`/api/ai-arsenal/sessions?agentId=${agentId}`, { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch {
      // ignore
    }
  }, [agentId])

  // Load session messages
  const loadSession = useCallback(async (id: string) => {
    try {
      setActiveSessionId(id)
      setMessages([])
      setStreamingContent("")
      const res = await fetch(`/api/ai-arsenal/sessions/${id}`, { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch {
      // ignore
    }
  }, [])

  // Create new session
  const createSession = useCallback(async (title: string) => {
    try {
      const res = await fetch("/api/ai-arsenal/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, agentId }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.session) {
        setSessions((prev) => [data.session, ...prev])
        loadSession(data.session.id)
      }
    } catch {
      // ignore
    }
  }, [agentId, loadSession])

  const openNewSessionModal = () => {
    setNewSessionTitle("")
    setShowNewSessionModal(true)
  }

  const confirmNewSession = async () => {
    if (!newSessionTitle.trim()) return
    setShowNewSessionModal(false)
    await createSession(newSessionTitle.trim())
  }

  /* Init */
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  /* Send message */
  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || loading || !activeSessionId) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)
    setStreamingContent("")

    let fullMessage = content
    if (fileContent) {
      fullMessage = `【参考文件：${fileName}】\n\n${fileContent}\n\n---\n\n${content}`
    }

    try {
      const res = await fetch("/api/ai-arsenal/squad/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: fullMessage,
          sessionId: activeSessionId,
          model,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "请求失败" }))
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: `❌ ${data.error}`, createdAt: new Date().toISOString() },
        ])
        setLoading(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
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
          if (!trimmed || trimmed === "data: [DONE]" || !trimmed.startsWith("data:")) continue
          try {
            const raw = trimmed.slice(5).trim()
            if (!raw) continue
            const parsed = JSON.parse(raw)
            if (parsed.type === "chunk") {
              fullContent += parsed.content
              setStreamingContent(fullContent)
            } else if (parsed.type === "done") {
              if (fullContent) {
                setMessages((prev) => [
                  ...prev,
                  { id: crypto.randomUUID(), role: "assistant", content: fullContent, createdAt: new Date().toISOString() },
                ])
              }
              setStreamingContent("")
              setLoading(false)
              setFileContent("")
              setFileName("")
              loadSessions()
              return
            } else if (parsed.type === "error") {
              setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "assistant", content: `❌ ${parsed.message}`, createdAt: new Date().toISOString() },
              ])
              setStreamingContent("")
              setLoading(false)
              return
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      if (fullContent) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: fullContent, createdAt: new Date().toISOString() },
        ])
      }
      setStreamingContent("")
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "❌ 网络请求失败", createdAt: new Date().toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, activeSessionId, model, fileContent, fileName, loadSessions])

  /* Scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[#faf8f4]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    )
  }

  const themeColor = agent.themeColor
  const themeBg = themeColor + "15"
  const themeBorder = themeColor + "30"

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#faf8f4]">
      {/* Left: Session List (simplified) */}
      <div className="w-[280px] border-r bg-white flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="px-5 py-4 border-b">
          <button
            onClick={() => router.push("/ai-arsenal/squad")}
            className="text-xs text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            返回智能体列表
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: themeColor }}
            >
              {agent.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[#2d2a26]">{agent.name}</h2>
              <p className="text-xs text-gray-400">{agent.tagline}</p>
            </div>
          </div>
          <button
            onClick={openNewSessionModal}
            className="mt-3 w-8 h-8 rounded-lg flex items-center justify-center text-white hover:opacity-90 transition-opacity ml-auto"
            style={{ backgroundColor: themeColor }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {sessions.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">暂无对话</p>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-colors text-xs",
                activeSessionId === session.id
                  ? "text-white"
                  : "hover:bg-gray-50 text-gray-600"
              )}
              style={activeSessionId === session.id ? { backgroundColor: themeColor } : {}}
              onClick={() => loadSession(session.id)}
            >
              <p className="font-medium truncate">{session.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Header */}
        <div className="relative px-6 pt-4 pb-2 flex items-center gap-3 z-10">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white border-2"
            style={{ backgroundColor: themeColor, borderColor: themeBorder }}
          >
            {agent.icon}
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#2d2a26]">{agent.name}</h1>
            <p className="text-xs text-gray-400">{agent.tagline}</p>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[10px] px-2 py-1 rounded-md bg-[#fef3cd] text-[#856404]">知识库已连接</span>
            <span className="text-[10px] px-2 py-1 rounded-md bg-[#f0fdf4] text-[#15803d]">长期记忆</span>
            <span className="text-[10px] px-2 py-1 rounded-md bg-[#f0f9ff] text-[#0369a1]">可读文件</span>
            <span className="text-[10px] px-2 py-1 rounded-md bg-[#fef3cd] text-[#856404]">可联网搜索</span>
          </div>
        </div>

        {!activeSessionId ? (
          /* Empty state with welcome card */
          <div className="relative flex-1 flex items-center justify-center">
            <div className="max-w-lg mx-auto px-6">
              <div
                className="bg-white border rounded-2xl p-8 shadow-sm"
                style={{ borderColor: themeBorder }}
              >
                <h3 className="text-lg font-bold text-[#2d2a26] mb-3">{agent.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">{agent.description}</p>
                <div className="space-y-2">
                  {agent.quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(prompt)
                        inputRef.current?.focus()
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm bg-white border border-gray-200 hover:border-gray-300 transition-colors text-gray-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Messages area */}
            <div className="relative flex-1 overflow-y-auto px-6 py-4 z-10">
              {messages.length === 0 && !streamingContent ? (
                <div className="max-w-lg mx-auto mt-12">
                  <div
                    className="bg-white border rounded-2xl p-6 shadow-sm"
                    style={{ borderColor: themeBorder }}
                  >
                    <h3 className="text-sm font-bold text-[#2d2a26] mb-2">开始一段新对话</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {agent.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                          msg.role === "user"
                            ? "text-white rounded-br-sm"
                            : "bg-white border border-gray-200 rounded-bl-sm shadow-sm"
                        )}
                        style={msg.role === "user" ? { backgroundColor: themeColor } : {}}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}

                  {/* Streaming */}
                  {streamingContent && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed shadow-sm">
                        <div className="whitespace-pre-wrap">{streamingContent}</div>
                        <div className="flex items-center gap-1 mt-2">
                          <div className="animate-pulse w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
                          <div className="animate-pulse w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor, animationDelay: "0.15s" }} />
                          <div className="animate-pulse w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor, animationDelay: "0.3s" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="relative z-10 border-t border-gray-200 bg-white px-6 py-4">
              {/* File indicator */}
              {fileContent && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: themeBg, color: themeColor }}>
                  <FileUp className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{fileName}</span>
                  <button onClick={() => { setFileContent(""); setFileName(""); }} className="ml-auto opacity-50 hover:opacity-100">
                    ×
                  </button>
                </div>
              )}

              <div className="max-w-2xl mx-auto flex items-end gap-2">
                {/* Model selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowModelMenu((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-600 hover:border-gray-300 transition-colors bg-white"
                  >
                    {MODELS.find((m) => m.value === model)?.label || model}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showModelMenu && (
                    <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px] z-20">
                      {MODELS.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => { setModel(m.value); setShowModelMenu(false); }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-xs transition-colors",
                            model === m.value
                              ? "text-white"
                              : "text-gray-600 hover:bg-gray-50"
                          )}
                          style={model === m.value ? { backgroundColor: themeColor } : {}}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* File upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-amber-600 hover:border-amber-300 transition-colors bg-white"
                >
                  <FileUp className="w-4 h-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.csv,.xlsx,.xls"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append("files", file)
                    const res = await fetch("/api/ai-arsenal/upload", { method: "POST", credentials: "include", body: formData })
                    const data = await res.json()
                    if (data.files?.[0]?.text) {
                      setFileContent(data.files[0].text)
                      setFileName(data.files[0].fileName)
                    }
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                />

                {/* Text input */}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="输入消息，可以引用已上传文件或打开联网搜索"
                  rows={1}
                  className="flex-1 resize-none px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 bg-white max-h-32"
                  style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
                />

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className={cn(
                    "px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                    loading || !input.trim()
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "text-white hover:opacity-90"
                  )}
                  style={loading || !input.trim() ? {} : { backgroundColor: themeColor }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      发送
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New session modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#2d2a26]">新建对话</h3>
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">为当前对话起一个名字，方便后续查找</p>
            <input
              type="text"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmNewSession() }}
              placeholder="例如：公司战略复盘"
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmNewSession}
                disabled={!newSessionTitle.trim()}
                className={cn(
                  "px-5 py-2 rounded-xl text-sm font-medium transition-all text-white",
                  !newSessionTitle.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "hover:opacity-90"
                )}
                style={newSessionTitle.trim() ? { backgroundColor: themeColor } : {}}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
