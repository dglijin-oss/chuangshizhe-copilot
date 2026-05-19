"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sparkles, Wand2, Check, Clock, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAiGeneration } from "@/hooks/use-ai-generation"

const contentTypes: Record<string, { label: string; color: string; subtleColor: string }> = {
  traffic: { label: "流量型", color: "bg-primary-light text-primary", subtleColor: "text-primary" },
  persona: { label: "人设型", color: "bg-[#e0f2fe] text-[#0284c7]", subtleColor: "text-[#0284c7]" },
  product: { label: "产品型", color: "bg-[#dcfce7] text-[#16a34a]", subtleColor: "text-[#16a34a]" },
}

export default function WeeklyPlanPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const ipId = params.id

  const [ip, setIp] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [userDirection, setUserDirection] = useState("")
  const [submitFeedback, setSubmitFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [generatingItem, setGeneratingItem] = useState<string | null>(null)
  const { withProgress } = useAiGeneration()

  const groupedItems = useCallback(() => {
    if (!plan?.items) return []
    return (["traffic", "persona", "product"] as const).map((type) => ({
      type,
      label: contentTypes[type].label,
      items: plan.items.filter((i: any) => i.contentType === type),
    }))
  }, [plan])

  const loadIP = useCallback(async () => {
    try {
      const res = await fetch(`/api/ip/${ipId}`)
      const data = await res.json()
      if (data.ip) setIp(data.ip)
    } catch {
      setError("加载 IP 信息失败")
    }
  }, [ipId])

  const loadPlan = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ip/${ipId}/weekly-plan`)
      const data = await res.json()
      if (data.plan) {
        setPlan(data.plan)
        setUserDirection(data.plan.userDirection || "")
      }
    } catch {
      setError("加载周策划失败")
    } finally {
      setLoading(false)
    }
  }, [ipId])

  useEffect(() => {
    loadIP()
    loadPlan()
  }, [loadIP, loadPlan])

  const handleGeneratePlan = async () => {
    setError("")
    setGenerating(true)
    try {
      const data = await withProgress(
        fetch(`/api/ip/${ipId}/weekly-plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userDirection: userDirection.trim() || undefined }),
        }).then((r) => r.json())
      )
      if (data.error) { setError(data.error); return }
      setPlan(data.plan)
      setUserDirection(data.plan.userDirection || "")
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmitDirection = async () => {
    if (!userDirection.trim()) {
      setSubmitFeedback("请写一个大概方向。")
      return
    }
    setSubmitFeedback("")
    setSubmitting(true)
    try {
      const data = await withProgress(
        fetch(`/api/ip/${ipId}/weekly-plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userDirection: userDirection.trim() }),
        }).then((r) => r.json())
      )
      if (data.error) { setSubmitFeedback(data.error); return }
      setPlan(data.plan)
      setUserDirection(data.plan.userDirection || "")
      setSubmitFeedback("已按你的想法重新策划。")
    } catch {
      setSubmitFeedback("网络错误，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerateItem = async (itemId: string) => {
    setGeneratingItem(itemId)
    setError("")
    try {
      const data = await withProgress(
        fetch(`/api/weekly-plan-items/${itemId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }).then((r) => r.json())
      )
      if (data.error) { setError(data.error); return }
      // Update the item in plan state
      setPlan({
        ...plan,
        items: plan.items.map((i: any) => i.id === itemId ? { ...i, ...data.item } : i),
      })
      // Navigate to view the generated package
      router.push(`/item/${itemId}`)
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setGeneratingItem(null)
    }
  }

  if (!ip) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8 md:p-12 text-center">
          <div className="w-3 h-3 rounded-full bg-primary mx-auto animate-pulse mb-3" />
          <p className="text-sm text-muted">正在拉取周策划…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <p className="section-kicker text-red-500">PLAN ERROR</p>
          <h2 className="text-sm font-bold mt-1">这期周策划没有拉起来。</h2>
          <p className="text-xs text-gray-400 mt-1">{error}</p>
        </div>
      )}

      {!plan ? (
        // No plan yet - show generation UI
        <div className="space-y-6">
          {/* Hero Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-primary font-medium tracking-wider">WEEKLY CONTENT PLAN</span>
            </div>
            <h1 className="text-lg md:text-xl font-bold mt-1">这不是一条文案，而是这一周整个账号的打法。</h1>
            <p className="text-xs text-muted mt-2">先让 AI 基于 IP 档案和知识库生成本周选题，再输入方向重新调整。</p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <span className="bg-primary-light text-primary px-2 py-1 rounded text-xs font-medium">流量型 {ip.contentMixFlow}</span>
              <span className="bg-[#e0f2fe] text-[#0284c7] px-2 py-1 rounded text-xs font-medium">人设型 {ip.contentMixPersona}</span>
              <span className="bg-[#dcfce7] text-[#16a34a] px-2 py-1 rounded text-xs font-medium">产品型 {ip.contentMixProduct}</span>
            </div>
          </div>

          {/* User Direction Input */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <p className="text-xs text-primary font-medium tracking-wider">MY IDEA THIS WEEK</p>
            <h2 className="text-sm font-bold mt-1">我本周有一个大概想法。</h2>
            <p className="text-xs text-gray-400 mt-1">不用写成选题，输入一句方向就行。AI 会基于这个方向，重新给你策划本周的流量型、人设型和产品型内容。</p>
            <textarea
              value={userDirection}
              onChange={(e) => setUserDirection(e.target.value)}
              placeholder="比如：主要讲流量的重要性 / 新手小白如何低成本创业 / 后疫情时代如何投资"
              maxLength={180}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-4 resize-none focus:outline-none focus:border-primary"
            />
            {submitFeedback && (
              <p className={cn("text-xs mt-2", submitFeedback.includes("请") ? "text-primary" : "text-green-500")}>{submitFeedback}</p>
            )}
            <div className="mt-4">
              <button
                onClick={handleSubmitDirection}
                disabled={submitting || !userDirection.trim()}
                className={cn(
                  "bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  (submitting || !userDirection.trim()) && "opacity-50 cursor-not-allowed"
                )}
              >
                按这个想法策划本周
              </button>
            </div>
          </div>

          {/* Or generate without direction */}
          <div className="text-center">
            <span className="text-xs text-gray-400">或者不输入方向，直接让 AI 自主发挥：</span>
            <div className="mt-3">
              <button
                onClick={handleGeneratePlan}
                disabled={generating}
                className={cn(
                  "border border-gray-200 text-muted px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto hover:bg-gray-50 transition-colors",
                  generating && "opacity-50 cursor-not-allowed"
                )}
              >
                <Wand2 className="w-4 h-4" />
                AI 自主生成周策划
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Plan exists - show plan content
        <div className="space-y-6">
          {/* Hero Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs text-primary font-medium tracking-wider">{ip.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/ip/${ipId}/profile`)}
                  className="text-xs text-muted hover:text-primary transition-colors"
                >
                  返回知识库
                </button>
                <span className="text-xs text-gray-200">·</span>
                <button
                  onClick={() => router.push("/")}
                  className="text-xs text-muted hover:text-primary transition-colors"
                >
                  工作台
                </button>
              </div>
            </div>
            <p className="text-xs text-primary font-medium tracking-wider">WEEKLY CONTENT PLAN</p>
            <h1 className="text-lg md:text-xl font-bold mt-1">这不是一条文案，而是这一周整个账号的打法。</h1>
            <p className="text-xs text-muted mt-1">{plan.summary || "这一周先按内容类型拉开结构，再从单点执行到整体策略逐步细化。"}</p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <span className="bg-primary-light text-primary px-2 py-1 rounded text-xs font-medium">流量型 {ip.contentMixFlow}</span>
              <span className="bg-[#e0f2fe] text-[#0284c7] px-2 py-1 rounded text-xs font-medium">人设型 {ip.contentMixPersona}</span>
              <span className="bg-[#dcfce7] text-[#16a34a] px-2 py-1 rounded text-xs font-medium">产品型 {ip.contentMixProduct}</span>
              {plan.userDirection && (
                <span className="bg-gray-200 text-muted px-2 py-1 rounded text-xs font-medium">本周方向：{plan.userDirection}</span>
              )}
            </div>
          </div>

          {/* History Actions Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">创建于 {formatDate(plan.createdAt)}</span>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className={cn(
                "border border-gray-200 text-muted px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors",
                generating && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
              重新生成这一周
            </button>
          </div>

          {/* Idea Capture Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-xs text-primary font-medium tracking-wider">MY IDEA THIS WEEK</p>
                <h2 className="text-sm font-bold mt-0.5">我本周有一个大概想法。</h2>
              </div>
              <span className="text-xs text-gray-400">重新策划整周</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">不用写成选题，输入一句方向就行。AI 会基于这个方向，重新给你策划本周的流量型、人设型和产品型内容。</p>
            <textarea
              value={userDirection}
              onChange={(e) => setUserDirection(e.target.value)}
              placeholder="比如：主要讲流量的重要性 / 新手小白如何低成本创业 / 后疫情时代如何投资"
              maxLength={180}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-3 resize-none focus:outline-none focus:border-primary"
            />
            {submitFeedback && (
              <p className={cn("text-xs mt-2", submitFeedback.includes("请") ? "text-primary" : "text-green-500")}>{submitFeedback}</p>
            )}
            <div className="mt-3">
              <button
                onClick={handleSubmitDirection}
                disabled={submitting || !userDirection.trim()}
                className={cn(
                  "bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors",
                  (submitting || !userDirection.trim()) && "opacity-50 cursor-not-allowed"
                )}
              >
                按这个想法策划本周
              </button>
            </div>
          </div>

          {/* Plan Items Grouped by Type */}
          <div className="space-y-4">
            {groupedItems().map((group) => {
              if (group.items.length === 0) return null
              return (
                <div key={group.type} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="mb-4">
                    <p className="text-xs text-primary font-medium tracking-wider">{group.label}</p>
                    <h2 className="text-sm font-bold mt-0.5">{group.items.length} 条内容</h2>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((item: any) => (
                      <article key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("text-xs px-2 py-0.5 rounded font-medium", contentTypes[group.type].color)}>
                            {group.label}
                          </span>
                          <span className={cn("text-xs", item.generationStatus === "done" ? "text-green-500" : "text-gray-400")}>
                            {item.generationStatus === "done" ? "已生成发布包" : "待执行"}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium">{item.title}</h3>
                        <p className="text-xs text-muted mt-1">{item.reason}</p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <span className="text-xs text-gray-400">
                            {item.generatedAt
                              ? `上次生成 ${formatDate(new Date(item.generatedAt))}`
                              : "还没生成完整发布包"
                            }
                          </span>
                          <button
                            onClick={() => item.generatedResult ? router.push(`/item/${item.id}`) : handleGenerateItem(item.id)}
                            disabled={generatingItem === item.id}
                            className={cn(
                              "border border-gray-200 text-muted px-2 py-1 rounded text-xs hover:bg-gray-50 transition-colors",
                              generatingItem === item.id && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {generatingItem === item.id ? "生成中..." : item.generatedResult ? "查看发布包" : "生成完整发布包"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(d: Date | string) {
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
}
