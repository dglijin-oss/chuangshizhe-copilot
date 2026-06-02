"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type UserWithIpCount = {
  id: string
  name: string
  phone: string
  role: string
  createdAt: string
  _count: { ips: number }
}

export default function AdminIpsPage() {
  const { role } = useUser()
  const router = useRouter()
  const [users, setUsers] = useState<UserWithIpCount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (role !== "admin") { router.push("/dashboard") }
    fetch("/api/admin/ip-users", { credentials: "include" })
      .then(res => res.json())
      .then(data => { setUsers(data.users || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [role, router])

  if (loading) return <div className="p-4 md:p-6 text-gray-400">加载中...</div>

  const filtered = users.filter(u =>
    [u.name, u.phone].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4">IP 档案</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <p className="text-xs text-muted mb-4">共 {users.length} 个用户创建了 IP</p>

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
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">角色</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">IP 数量</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">注册日期</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">暂无数据</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium">{u.name || "—"}</td>
                  <td className="py-2.5 px-3 text-gray-500">{u.phone}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      u.role === "admin" ? "bg-primary-light text-primary" : "bg-gray-200 text-gray-400"
                    )}>
                      {u.role === "admin" ? "管理员" : "用户"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-primary font-medium">{u._count.ips}</td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td className="py-2.5 px-3">
                    <a href={`/admin/ips/${u.id}`} className="text-primary hover:underline text-xs cursor-pointer">查看 IP 列表 →</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
