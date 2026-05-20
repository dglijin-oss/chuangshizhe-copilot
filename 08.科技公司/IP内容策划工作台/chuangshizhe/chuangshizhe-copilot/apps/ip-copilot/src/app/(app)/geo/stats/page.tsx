"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export default function GeoStatsPage() {
  const [stats, setStats] = useState<any>(null)
  const [knowledgeCount, setKnowledgeCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/geo/stats"),
      fetch("/api/assets/knowledge"),
    ]).then(([statsRes, kbRes]) => {
      statsRes.json().then((data) => { if (data.totalArticles !== undefined) setStats(data) })
      kbRes.ok && kbRes.json().then((data) => { if (data.entries) setKnowledgeCount(data.entries.length) })
    }).finally(() => setLoading(false))
  }, [])

  const platformLabels: Record<string, string> = {
    toutiao: "头条号", zhihu: "知乎", xiaohongshu: "小红书", gongzhonghao: "公众号",
  }

  if (loading) return <div className="p-4 md:p-6 max-w-7xl mx-auto"><div className="text-gray-400">加载中...</div></div>

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
        <h1 className="text-base md:text-xl font-bold mb-1">GEO 统计</h1>
        <p className="text-xs text-muted">从发布库、信任资产和平台覆盖聚合内容表现。</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="发布记录" value={stats?.totalArticles || 0} color="bg-primary-light" />
        <StatCard label="已发布" value={stats?.published || 0} color="bg-[#dcfce7]" />
        <StatCard label="浏览量" value={stats?.views || 0} color="bg-[#e0f2fe]" />
        <StatCard label="咨询量" value={stats?.consultations || 0} color="bg-[#fce7f3]" />
        <StatCard label="AI 引用" value={stats?.aiQuotes || 0} color="bg-[#f3e8ff]" />
        <StatCard label="信任资产" value={knowledgeCount} color="bg-gray-900" iconColor="text-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <span className="text-sm font-medium">平台分布</span>
          {stats?.platformStats?.length > 0 ? (
            <div className="mt-4 space-y-3">
              {stats.platformStats.map((p: any) => (
                <div key={p.platform} className="flex items-center justify-between">
                  <span className="text-sm text-muted">{platformLabels[p.platform] || p.platform}</span>
                  <span className="text-sm font-medium">{p._count.id} 篇</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm">暂无数据</div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <span className="text-sm font-medium">文章类型</span>
          {stats?.typeStats?.length > 0 ? (
            <div className="mt-4 space-y-3">
              {stats.typeStats.map((t: any) => (
                <div key={t.articleType} className="flex items-center justify-between">
                  <span className="text-sm text-muted">{t.articleType}</span>
                  <span className="text-sm font-medium">{t._count.id} 篇</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, iconColor }: { label: string; value: number; color: string; iconColor?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <span className="text-xs text-muted">{label}</span>
      <div className={cn("text-2xl font-bold mt-1", iconColor)}>{value}</div>
    </div>
  )
}
