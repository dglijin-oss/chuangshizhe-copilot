"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Plus,
  Send,
  Trash2,
  FileUp,
  Globe,
  BookOpen,
  Brain,
  FileText,
  Loader2,
  ChevronDown,
  X,
  ArrowLeft,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ---- Types ---- */

interface ChatSession {
  id: string
  title: string
  updatedAt: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string
}

interface Capabilities {
  knowledgeBase: boolean
  longTermMemory: boolean
  fileUpload: boolean
  webSearch: boolean
}

const MODELS = [
  { value: "qwen3-max-2026-01-23", label: "Qwen3 Max" },
  { value: "qwen-plus", label: "Qwen Plus" },
]

/* ---- Main Page ---- */

export default function ProjectAssistantPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [model, setModel] = useState("qwen3-max-2026-01-23")
  const [capabilities, setCapabilities] = useState<Capabilities>({
    knowledgeBase: true,
    longTermMemory: false,
    fileUpload: true,
    webSearch: false,
  })
  const [fileContent, setFileContent] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [newSessionTitle, setNewSessionTitle] = useState("")
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [createError, setCreateError] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* Load sessions */
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-arsenal/sessions", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch {
      // silently ignore — user may not be logged in yet
    }
  }, [])

  /* Load capabilities */
  const loadCapabilities = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-arsenal/capabilities", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      if (data.capabilities) setCapabilities(data.capabilities)
    } catch {
      // silently ignore
    }
  }, [])

  /* Load session messages */
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
      // silently ignore
    }
  }, [])

  /* Create new session */
  const createSession = useCallback(async (title: string) => {
    setCreateError("")
    try {
      const res = await fetch("/api/ai-arsenal/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setCreateError(data.error || "创建失败")
        return
      }
      const data = await res.json()
      if (data.session) {
        setSessions((prev) => [data.session, ...prev])
        loadSession(data.session.id)
      }
    } catch {
      setCreateError("网络请求失败")
    }
  }, [loadSession])

  const openNewSessionModal = () => {
    setNewSessionTitle("")
    setCreateError("")
    setShowNewSessionModal(true)
  }

  const confirmNewSession = async () => {
    if (!newSessionTitle.trim()) return
    setShowNewSessionModal(false)
    await createSession(newSessionTitle.trim())
  }

  /* Delete session */
  const deleteSession = useCallback(
    async (id: string) => {
      await fetch(`/api/ai-arsenal/sessions/${id}`, { method: "DELETE", credentials: "include" })
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (activeSessionId === id) {
        setActiveSessionId(null)
        setMessages([])
      }
    },
    [activeSessionId]
  )

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

    // Build the full message with file context if any
    let fullMessage = content
    if (fileContent) {
      fullMessage = `【参考文件：${fileName}】\n\n${fileContent}\n\n---\n\n${content}`
    }

    try {
      const res = await fetch("/api/ai-arsenal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: fullMessage,
          sessionId: activeSessionId,
          model,
          webSearch: capabilities.webSearch,
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

      // Handle non-streaming error response
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json()
        if (data.error) {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", content: `❌ ${data.error}`, createdAt: new Date().toISOString() },
          ])
          setLoading(false)
          return
        }
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

      // Stream ended without done signal — save whatever we collected
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
  }, [input, loading, activeSessionId, model, capabilities.webSearch, fileContent, fileName, loadSessions])

  /* Handle file upload */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("files", file)

    const res = await fetch("/api/ai-arsenal/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    })
    const data = await res.json()
    if (data.files?.[0]?.text) {
      setFileContent(data.files[0].text)
      setFileName(data.files[0].fileName)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  /* Toggle capability */
  const toggleCapability = async (key: keyof Capabilities) => {
    const next = { ...capabilities, [key]: !capabilities[key] }
    setCapabilities(next)
    await fetch("/api/ai-arsenal/capabilities", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(next),
    })
  }

  /* Scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  /* Init */
  useEffect(() => {
    loadSessions()
    loadCapabilities()
  }, [loadSessions, loadCapabilities])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${m}-${day}`
  }

  return (
    <div className="flex md:h-[calc(100vh-4rem)] h-[calc(100vh-8rem)] bg-[#faf8f4] relative">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ===== Left: Session List ===== */}
      <div className={cn(
        "w-[320px] border-r border-gray-200 bg-white flex flex-col flex-shrink-0 z-40 md:z-auto",
        "fixed md:relative inset-y-0 left-0 transform transition-transform duration-200 md:translate-x-0",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-title">项目助手</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">项目协作对话 · 已连接知识库</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={openNewSessionModal}
              className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center hover:bg-amber-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
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
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-colors",
                activeSessionId === session.id
                  ? "bg-amber-50 text-amber-800"
                  : "hover:bg-gray-50 text-gray-600"
              )}
              onClick={() => { loadSession(session.id); setMobileSidebarOpen(false) }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{session.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(session.updatedAt)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSession(session.id)
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Right: Chat Area ===== */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Grid background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {!activeSessionId ? (
          /* Empty state with CTA */
          <div className="relative flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-title mb-2">项目助手</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                基于知识库、长期记忆和会话文件，协助项目推进与决策。
              </p>
              <button
                onClick={openNewSessionModal}
                className="px-6 py-3 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新建对话
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Capability badges */}
            <div className="relative px-6 pt-4 pb-2 flex items-center gap-3 flex-wrap z-10">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-amber-700">项</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-title">项目助手</p>
                  <p className="text-[10px] text-gray-400">项目协作对话 · 已连接知识库</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <CapabilityBadge
                  icon={<BookOpen className="w-3 h-3" />}
                  label="知识库已连接"
                  active={capabilities.knowledgeBase}
                  onToggle={() => toggleCapability("knowledgeBase")}
                />
                <CapabilityBadge
                  icon={<Brain className="w-3 h-3" />}
                  label="长期记忆"
                  active={capabilities.longTermMemory}
                  onToggle={() => toggleCapability("longTermMemory")}
                />
                <CapabilityBadge
                  icon={<FileText className="w-3 h-3" />}
                  label="可读文件"
                  active={capabilities.fileUpload}
                  onToggle={() => toggleCapability("fileUpload")}
                />
                <CapabilityBadge
                  icon={<Globe className="w-3 h-3" />}
                  label="可联网搜索"
                  active={capabilities.webSearch}
                  onToggle={() => toggleCapability("webSearch")}
                />
              </div>
            </div>

            {/* Messages area */}
            <div className="relative flex-1 overflow-y-auto px-6 py-4 z-10">
              {messages.length === 0 && !streamingContent ? (
                <div className="max-w-lg mx-auto mt-12">
                  <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-title mb-2">开始一段新对话</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      开始一段新对话，我会读取账号知识库、长期记忆和会话文件来协助项目推进。
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
                            ? "bg-amber-600 text-white rounded-br-sm"
                            : "bg-white border border-gray-200 rounded-bl-sm shadow-sm"
                        )}
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
                          <div className="animate-pulse w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          <div className="animate-pulse w-1.5 h-1.5 bg-amber-500 rounded-full" style={{ animationDelay: "0.15s" }} />
                          <div className="animate-pulse w-1.5 h-1.5 bg-amber-500 rounded-full" style={{ animationDelay: "0.3s" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="relative z-10 border-t border-gray-200 bg-white px-6 py-4 md:pb-4 pb-safe-bottom">
              {/* File indicator */}
              {fileContent && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{fileName}</span>
                  <button
                    onClick={() => { setFileContent(""); setFileName(""); }}
                    className="ml-auto text-amber-400 hover:text-amber-700"
                  >
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
                            model === m.value ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* File upload */}
                {capabilities.fileUpload && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-amber-600 hover:border-amber-300 transition-colors bg-white"
                  >
                    <FileUp className="w-4 h-4" />
                  </button>
                )}

                {/* Web search toggle */}
                {capabilities.webSearch && (
                  <button
                    onClick={() => toggleCapability("webSearch")}
                    className={cn(
                      "p-2.5 border rounded-xl transition-colors bg-white",
                      capabilities.webSearch
                        ? "border-amber-300 text-amber-600 bg-amber-50"
                        : "border-gray-200 text-gray-400 hover:text-gray-600"
                    )}
                    title="联网搜索"
                  >
                    <Globe className="w-4 h-4" />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
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
                  className="flex-1 resize-none px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white max-h-32"
                  style={{ minHeight: "44px" }}
                />

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className={cn(
                    "px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                    loading || !input.trim()
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-amber-500 text-white hover:bg-amber-600"
                  )}
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
              <h3 className="text-base font-bold text-title">新建项目对话</h3>
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">为当前项目起一个名字，方便后续查找</p>
            {createError && (
              <p className="text-xs text-red-500 mb-3">{createError}</p>
            )}
            <input
              type="text"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmNewSession() }}
              placeholder="例如：六堡茶 Q2 直播策划"
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
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
                  "px-5 py-2 rounded-xl text-sm font-medium transition-all",
                  !newSessionTitle.trim()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                )}
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

/* ---- Capability Badge ---- */

function CapabilityBadge({
  icon,
  label,
  active,
  onToggle,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
        active
          ? "bg-amber-100 text-amber-700 border border-amber-200"
          : "bg-gray-100 text-gray-400 border border-gray-200"
      )}
    >
      {icon}
      {label}
    </button>
  )
}
