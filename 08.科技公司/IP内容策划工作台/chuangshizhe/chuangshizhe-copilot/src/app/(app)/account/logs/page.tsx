"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export default function GenerationLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalTokens: 0, totalCost: 0 })

  useEffect(() => {
    fetch("/api/account/logs")
      .then((res) => res.json())
      .then((data) => {
        if (data.logs) setLogs(data.logs)
        setStats({ totalTokens: data.totalTokens || 0, totalCost: data.totalCost || 0 })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4 md:p-6 max-w-7xl mx-auto"><div className="text-sm text-gray-400">加载中...</div></div>

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 card-hover">
        <h1 className="text-lg md:text-xl font-bold mb-1">生成记录</h1>
        <p className="text-xs text-muted mb-4">查看 AI 调用历史、耗时、扣费估算和失败原因。</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-primary-light rounded-lg p-3">
            <span className="text-xs text-gray-400">总 Tokens</span>
            <div className="text-lg font-bold">{stats.totalTokens.toLocaleString()}</div>
          </div>
          <div className="bg-primary-light rounded-lg p-3">
            <span className="text-xs text-gray-400">总成本 (元)</span>
            <div className="text-lg font-bold">¥{(stats.totalCost * 100).toFixed(2)}</div>
          </div>
          <div className="bg-primary-light rounded-lg p-3">
            <span className="text-xs text-gray-400">记录数</span>
            <div className="text-lg font-bold">{logs.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">暂无生成记录。使用 AI 功能后会自动记录。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">类型</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">模型</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">状态</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Tokens</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">耗时</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">成本</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">时间</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-200">
                    <td className="py-3 px-4">{log.type}</td>
                    <td className="py-3 px-4 font-mono text-xs">{log.model}</td>
                    <td className="py-3 px-4">
                      <span className={cn("text-xs px-2 py-0.5 rounded",
                        log.status === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500")}>
                        {log.status === "success" ? "成功" : "失败"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{log.tokens}</td>
                    <td className="py-3 px-4">{log.duration}ms</td>
                    <td className="py-3 px-4">¥{(log.cost * 100).toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
