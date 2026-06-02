"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type LogRecord = {
  id: string
  type: string
  model: string | null
  status: string
  tokens: number
  duration: number
  cost: number
  error: string | null
  createdAt: string
  user: { name: string | null; phone: string } | null
}

const statusMap: Record<string, string> = { success: "成功", failed: "失败" }

export default function AdminLogsPage() {
  const { role } = useUser()
  const router = useRouter()
  const [logs, setLogs] = useState<LogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (role !== "admin") { router.push("/dashboard") }
    fetch("/api/admin/logs", { credentials: "include" })
      .then(res => res.json())
      .then(data => { setLogs(data.logs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [role, router])

  if (loading) return <div className="p-4 md:p-6 text-gray-400">加载中...</div>

  const filtered = logs.filter(log =>
    [log.user?.name, log.user?.phone, log.type, log.model, log.status].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const fmtDuration = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4">操作日志</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <p className="text-xs text-muted mb-4">共 {logs.length} 条</p>

        <input
          type="text"
          placeholder="搜索用户名、手机号、类型、模型..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-primary"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">用户名</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">手机号</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">类型</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">模型</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">状态</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">Tokens</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">耗时</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">费用</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">错误</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">暂无数据</td></tr>
              )}
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium">{log.user?.name || "—"}</td>
                  <td className="py-2.5 px-3 text-gray-500">{log.user?.phone || "—"}</td>
                  <td className="py-2.5 px-3">{log.type}</td>
                  <td className="py-2.5 px-3 text-gray-500">{log.model || "—"}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      log.status === "success" ? "bg-green-100 text-green-600" : log.status === "failed" ? "bg-red-100 text-red-500" : "bg-gray-200 text-gray-400"
                    )}>
                      {statusMap[log.status] || log.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">{log.tokens}</td>
                  <td className="py-2.5 px-3">{fmtDuration(log.duration)}</td>
                  <td className="py-2.5 px-3">¥{log.cost.toFixed(4)}</td>
                  <td className="py-2.5 px-3 max-w-[120px] truncate text-gray-400" title={log.error || undefined}>{log.error || "—"}</td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
