"use client"

import { useState, useEffect } from "react"

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [system, setSystem] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLogs() }, [page, system])

  async function fetchLogs() {
    const params = new URLSearchParams({ page: String(page), pageSize: "50" })
    if (system) params.set("system", system)
    const res = await fetch(`/api/logs?${params}`, { credentials: "include" })
    const d = await res.json()
    setLogs(d.logs || [])
    setTotal(d.total || 0)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">系统：</span>
        {[
          { value: "", label: "全部" },
          { value: "ip-copilot", label: "IP 工作台" },
          { value: "edu-box", label: "启明盒子" },
        ].map(opt => (
          <button key={opt.value} onClick={() => { setSystem(opt.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm ${system === opt.value ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">共 {total} 条</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="px-4 py-3 font-medium">类型</th>
              <th className="px-4 py-3 font-medium">模型</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">Tokens</th>
              <th className="px-4 py-3 font-medium">耗时</th>
              <th className="px-4 py-3 font-medium">成本</th>
              <th className="px-4 py-3 font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="p-6 text-center text-gray-400">加载中...</td></tr> :
            logs.map(log => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5">{log.user?.name || "-"}<div className="text-xs text-gray-400">{log.user?.phone}</div></td>
                <td className="px-4 py-2.5">{log.type}</td>
                <td className="px-4 py-2.5 text-gray-400">{log.model || "-"}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs ${log.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {log.status === "success" ? "成功" : "失败"}
                  </span>
                </td>
                <td className="px-4 py-2.5">{log.tokens}</td>
                <td className="px-4 py-2.5">{log.duration}ms</td>
                <td className="px-4 py-2.5">¥{log.cost?.toFixed(4)}</td>
                <td className="px-4 py-2.5 text-gray-400">{new Date(log.createdAt).toLocaleString("zh-CN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 50 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50">上一页</button>
          <span className="text-sm text-gray-500">第 {page} 页</span>
          <button disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50">下一页</button>
        </div>
      )}
    </div>
  )
}
