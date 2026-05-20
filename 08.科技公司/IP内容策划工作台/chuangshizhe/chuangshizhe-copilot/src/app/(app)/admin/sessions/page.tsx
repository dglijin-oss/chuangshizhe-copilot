"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"

type SessionRecord = {
  id: string
  token: string
  expiresAt: string
  createdAt: string
  user: { name: string | null; phone: string } | null
}

export default function AdminSessionsPage() {
  const { role } = useUser()
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (role !== "admin") { router.push("/") }
    fetch("/api/admin/sessions", { credentials: "include" })
      .then(res => res.json())
      .then(data => { setSessions(data.sessions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [role, router])

  if (loading) return <div className="p-4 md:p-6 text-gray-400">加载中...</div>

  const filtered = sessions.filter(s =>
    [s.user?.name, s.user?.phone].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4">登录记录</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <p className="text-xs text-muted mb-4">共 {sessions.length} 条</p>

        <input
          type="text"
          placeholder="搜索用户名、手机号..."
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
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">Token</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">创建时间</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">过期时间</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">状态</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">暂无数据</td></tr>
              )}
              {filtered.map(s => {
                const expired = new Date(s.expiresAt) < new Date()
                return (
                  <tr key={s.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium">{s.user?.name || "—"}</td>
                    <td className="py-2.5 px-3 text-gray-500">{s.user?.phone || "—"}</td>
                    <td className="py-2.5 px-3 text-gray-400 font-mono text-xs">{s.token.slice(0, 8)}...</td>
                    <td className="py-2.5 px-3 text-gray-400 text-xs">{new Date(s.createdAt).toLocaleString("zh-CN")}</td>
                    <td className="py-2.5 px-3 text-gray-400 text-xs">{new Date(s.expiresAt).toLocaleString("zh-CN")}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${expired ? "bg-red-100 text-red-500" : "bg-green-100 text-green-600"}`}>
                        {expired ? "已过期" : "活跃"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
