"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function PublishArchivePage() {
  const router = useRouter()
  const [groupedItems, setGroupedItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIpId, setSelectedIpId] = useState<string>("")

  const loadData = useCallback(async (ipId?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (ipId) params.set("ipId", ipId)
      const res = await fetch(`/api/history?${params}`)
      const data = await res.json()
      if (data.groupedItems) setGroupedItems(data.groupedItems)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const allItems = groupedItems.flatMap((g) => g.items)
  const totalCount = allItems.length

  const contentTypeLabels: Record<string, string> = {
    traffic: "流量型",
    persona: "人设型",
    product: "产品型",
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-subtle flex items-center justify-center">
        <div className="text-sm text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-subtle">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-xs text-muted hover:text-primary transition-colors">← 返回</button>
            <span className="text-xs text-gray-400">创世者Copilot 工作台</span>
            <span className="text-sm font-bold">发布归档</span>
          </div>
          <button
            onClick={() => router.push("/ip/create")}
            className="text-xs text-muted hover:text-primary transition-colors"
          >
            创建 IP
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
          <span className="text-xs text-primary font-medium tracking-wider">PUBLISH ARCHIVE</span>
          <h1 className="text-base md:text-lg font-bold mt-2">回看那些已经进入执行层的发布包。</h1>
          <p className="text-xs text-muted mt-1">这里只展示已经从周选题池里点过完整发布包的内容。</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-2xl font-bold">{totalCount}</span>
            <span className="text-xs text-gray-400">个已生成发布包</span>
          </div>
        </div>

        {/* IP Filter Tabs */}
        {groupedItems.length > 0 && (
          <div className="flex gap-2 flex-wrap overflow-x-auto pb-1">
            <button
              onClick={() => { setSelectedIpId(""); loadData() }}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                !selectedIpId
                  ? "bg-primary text-white"
                  : "border border-gray-200 text-muted hover:border-primary"
              )}
            >
              全部 IP ({totalCount})
            </button>
            {groupedItems.map((g) => (
              <button
                key={g.ip.id}
                onClick={() => { setSelectedIpId(g.ip.id); loadData(g.ip.id) }}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                  selectedIpId === g.ip.id
                    ? "bg-primary text-white"
                    : "border border-gray-200 text-muted hover:border-primary"
                )}
              >
                {g.ip.name} ({g.count})
              </button>
            ))}
          </div>
        )}

        {totalCount === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 md:p-16 text-center">
            <p className="text-sm text-gray-400 mb-4">还没有生成过发布包</p>
            <p className="text-xs text-gray-400">从 IP 列表进入周策划，点击选题的"生成完整发布包"后，内容会出现在这里。</p>
            <button
              onClick={() => router.push("/ip/manage")}
              className="mt-4 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              去创建选题
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedItems.map((group) => (
              <div key={group.ip.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{group.ip.name}</span>
                    <span className="text-xs text-gray-400">{group.ip.industry || ""}</span>
                  </div>
                  <span className="text-xs text-gray-400">{group.count} 条</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.items.map((item: any) => {
                    const weekStart = item.planWeekStart ? new Date(item.planWeekStart) : null
                    const weekLabel = weekStart ? `${weekStart.getMonth() + 1}月${weekStart.getDate()}日周` : ""
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(10,61,98,0.08)] transition-all cursor-pointer"
                        onClick={() => router.push(`/item/${item.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded font-medium",
                            item.contentType === "traffic" ? "bg-primary-light text-primary" :
                            item.contentType === "persona" ? "bg-primary-light text-primary-mid" :
                            "bg-primary-light text-primary"
                          )}>
                            {contentTypeLabels[item.contentType] || item.contentType}
                          </span>
                          <span className="text-xs text-gray-400">{weekLabel}</span>
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
