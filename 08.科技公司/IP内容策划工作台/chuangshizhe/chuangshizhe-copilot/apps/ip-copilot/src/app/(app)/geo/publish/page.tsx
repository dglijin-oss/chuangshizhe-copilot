"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export default function PublishLibraryPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/geo/publish")
      .then((res) => res.json())
      .then((data) => { if (data.records) setRecords(data.records) })
      .finally(() => setLoading(false))
  }, [])

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: "待发布", color: "bg-primary-light text-primary" },
    published: { label: "已发布", color: "bg-green-100 text-green-600" },
    failed: { label: "失败", color: "bg-red-100 text-red-500" },
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold">内容发布库</h1>
            <p className="text-xs text-muted mt-1">记录每次发布的文章，追踪 AI 引擎收录状态</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">加载中...</div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-sm mb-2">暂无发布记录</span>
            <span className="text-xs">先生成 GEO 文章并发布后，这里会显示记录</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs text-muted font-medium">标题</th>
                  <th className="text-left py-3 px-4 text-xs text-muted font-medium">平台</th>
                  <th className="text-left py-3 px-4 text-xs text-muted font-medium">状态</th>
                  <th className="text-left py-3 px-4 text-xs text-muted font-medium">浏览</th>
                  <th className="text-left py-3 px-4 text-xs text-muted font-medium">AI引用</th>
                  <th className="text-left py-3 px-4 text-xs text-muted font-medium">咨询</th>
                  <th className="text-left py-3 px-4 text-xs text-muted font-medium">发布时间</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const status = statusMap[r.status] || statusMap.pending
                  return (
                    <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{r.title}</td>
                      <td className="py-3 px-4 text-muted">{r.platform}</td>
                      <td className="py-3 px-4">
                        <span className={cn("text-xs px-2 py-0.5 rounded", status.color)}>{status.label}</span>
                      </td>
                      <td className="py-3 px-4 text-muted">{r.views || 0}</td>
                      <td className="py-3 px-4 text-muted">{r.aiQuotes || 0}</td>
                      <td className="py-3 px-4 text-muted">{r.consultations || 0}</td>
                      <td className="py-3 px-4 text-gray-400">{r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : "-"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
