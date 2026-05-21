"use client"

import { useState, useEffect, useRef } from "react"
import { MessageSquare, Sparkles, Trash2, Plus, Loader2, X, Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface Agent {
  id: string
  name: string
  desc: string
}

interface Dialogue {
  id: string
  teacherId: string
  teacher: { name: string }
  agent: string
  topic: string | null
  messages: { role: string; content: string; timestamp?: string }[]
  tokensUsed: number
  createdAt: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

const agentColors: Record<string, string> = {
  jiangxin: "from-blue-500 to-indigo-500",
  wenqu: "from-purple-500 to-pink-500",
  mingjian: "from-emerald-500 to-teal-500",
  mingxin: "from-orange-500 to-amber-500",
  lexue: "from-cyan-500 to-blue-500",
  shanzhi: "from-violet-500 to-purple-500",
}

const agentIcons: Record<string, string> = {
  jiangxin: "🔨",
  wenqu: "💧",
  mingjian: "🔍",
  mingxin: "💝",
  lexue: "🎯",
  shanzhi: "📋",
}

export default function AIChatPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [dialogues, setDialogues] = useState<Dialogue[]>([])
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState("")
  const [selectedTeacherId, setSelectedTeacherId] = useState("")
  const [currentDialogue, setCurrentDialogue] = useState<Dialogue | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  async function loadData() {
    setLoading(true)
    const [tRes, dRes] = await Promise.all([
      fetch("/api/teachers", { credentials: "include" }),
      fetch("/api/ai-chat", { credentials: "include" }),
    ])
    if (tRes.ok) { const d = await tRes.json(); setTeachers(d.teachers || []) }
    if (dRes.ok) {
      const d = await dRes.json()
      setAgents(d.agents || [])
      setDialogues(d.dialogues || [])
      if (d.agents?.length && !selectedAgent) setSelectedAgent(d.agents[0].id)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  function openNewDialogue() {
    setCurrentDialogue(null)
    setMessages([])
  }

  function openDialogue(d: Dialogue) {
    setCurrentDialogue(d)
    setMessages(d.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })))
  }

  async function deleteDialogue(id: string) {
    if (!confirm("确认删除该对话？")) return
    await fetch(`/api/ai-chat/${id}`, { method: "DELETE", credentials: "include" })
    if (currentDialogue?.id === id) {
      setCurrentDialogue(null)
      setMessages([])
    }
    loadData()
  }

  async function handleSend() {
    if (!input.trim() || !selectedAgent || !selectedTeacherId) return
    setSending(true)

    const userMsg: Message = { role: "user", content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")

    const res = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        teacherId: selectedTeacherId,
        agent: selectedAgent,
        topic: currentDialogue?.topic || newMessages[0]?.content?.slice(0, 50),
        messages: newMessages,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setMessages([...newMessages, { role: "assistant", content: data.content }])
      if (!currentDialogue) {
        loadData() // Refresh to get the new dialogue
      }
    } else {
      const data = await res.json()
      setMessages([...newMessages, { role: "assistant", content: `⚠️ ${data.error}` }])
    }
    setSending(false)
  }

  if (loading) return <div className="p-6 text-center text-gray-400">加载中...</div>

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar - Agent selection + dialogue list */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Agent selector */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">选择智能体</h3>
            <button onClick={openNewDialogue} className="text-gray-400 hover:text-gray-600"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAgent(a.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs transition-colors border",
                  selectedAgent === a.id
                    ? "bg-primary/5 border-primary text-primary"
                    : "border-gray-100 text-gray-500 hover:bg-gray-50"
                )}
              >
                <span className="text-lg">{agentIcons[a.id] || "🤖"}</span>
                <span className="font-medium">{a.name}</span>
                <span className="text-[10px] text-gray-400">{a.desc}</span>
              </button>
            ))}
          </div>
          {/* Teacher selector */}
          <div className="mt-3">
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            >
              <option value="">选择教师身份</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        {/* Dialogue list */}
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-xs text-gray-400 px-2 py-1">对话历史</p>
          {dialogues
            .filter((d) => d.agent === selectedAgent)
            .map((d) => (
              <div
                key={d.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer group transition-colors",
                  currentDialogue?.id === d.id ? "bg-primary/5 text-primary" : "hover:bg-gray-50 text-gray-600"
                )}
              >
                <button onClick={() => openDialogue(d)} className="flex-1 text-left truncate">
                  <p className="font-medium truncate">{d.topic || "新对话"}</p>
                  <p className="text-[10px] text-gray-400">{new Date(d.createdAt).toLocaleDateString("zh-CN")}</p>
                </button>
                <button onClick={() => deleteDialogue(d.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          {dialogues.filter((d) => d.agent === selectedAgent).length === 0 && (
            <p className="text-xs text-gray-300 text-center py-4">暂无对话记录</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{agentIcons[selectedAgent] || "🤖"}</span>
            <span className="text-sm font-medium">{agents.find((a) => a.id === selectedAgent)?.name || ""}</span>
            <span className="text-xs text-gray-400">— {agents.find((a) => a.id === selectedAgent)?.desc || ""}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-3">{agentIcons[selectedAgent] || "🤖"}</div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{agents.find((a) => a.id === selectedAgent)?.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{agents.find((a) => a.id === selectedAgent)?.desc}</p>
                <p className="text-xs text-gray-400">输入你的问题开始对话</p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                )}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="输入你的问题..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              disabled={sending || !selectedTeacherId}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim() || !selectedTeacherId}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              发送
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">AI 生成内容仅供参考，请结合实际情况使用 · 每次对话消耗 3 积分</p>
        </div>
      </div>
    </div>
  )
}
