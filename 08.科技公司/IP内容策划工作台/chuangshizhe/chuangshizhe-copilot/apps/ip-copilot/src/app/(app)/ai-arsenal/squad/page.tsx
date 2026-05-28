"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Agent {
  id: string
  name: string
  icon: string
  tagline: string
  description: string
  quickPrompts: string[]
  themeColor: string
}

export default function SquadPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  const loadAgents = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/agents", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setAgents(data.agents || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAgents()
  }, [])

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      {/* Header */}
      <div className="bg-[#fef9ef] border-b border-[#f0e6cc] px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#2d2a26]">选择一个智能体</h1>
            <p className="text-sm text-gray-500 mt-1">
              每个智能体都有独立提示词、独立长期记忆，并会自动读取你的账号知识库。
            </p>
          </div>
          <button
            onClick={loadAgents}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#f0c040] text-[#5c4a1e] hover:bg-[#e0b030]"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            刷新
          </button>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onClick={() => router.push(`/ai-arsenal/squad/${agent.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#f0e6cc] p-6 hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Top row: icon + name + status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: agent.themeColor }}
          >
            {agent.icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#2d2a26]">{agent.name}</h3>
            <p className="text-xs text-gray-500">{agent.tagline}</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fef3cd] text-[#856404] font-medium">
          已开放
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-relaxed mb-4">{agent.description}</p>

      {/* Capability tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {agent.quickPrompts.slice(0, 4).map((prompt, i) => (
          <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-gray-50 text-gray-500">
            {prompt}
          </span>
        ))}
      </div>

      {/* Capability badges */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] px-2 py-1 rounded-md bg-[#f0f9ff] text-[#0369a1]">
          知识库已连接
        </span>
        <span className="text-[10px] px-2 py-1 rounded-md bg-[#f0fdf4] text-[#15803d]">
          长期记忆
        </span>
      </div>

      {/* CTA Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        className="w-full py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all"
        style={{ backgroundColor: agent.themeColor }}
      >
        进入对话
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  )
}
