"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"

type IpRecord = {
  id: string
  name: string
  founderName: string | null
  industry: string | null
  createdAt: string
  user: { name: string | null; phone: string } | null
  _count: { geoArticles: number; weeklyPlans: number }
}

export default function AdminIpsPage() {
  const { role } = useUser()
  const router = useRouter()
  const [ips, setIps] = useState<IpRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (role !== "admin") { router.push("/") }
    fetch("/api/admin/ips", { credentials: "include" })
      .then(res => res.json())
      .then(data => { setIps(data.ips || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [role, router])

  if (loading) return <div className="p-4 md:p-6 text-gray-400">加载中...</div>

  const filtered = ips.filter(ip =>
    [ip.name, ip.founderName, ip.industry, ip.user?.name, ip.user?.phone].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4">IP 档案</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <p className="text-xs text-muted mb-4">共 {ips.length} 个 IP</p>

        <input
          type="text"
          placeholder="搜索 IP 名称、创始人、行业、创建者..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-primary"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">IP 名称</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">创始人</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">行业</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">创建者</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">文章</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">周策划</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">创建日期</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">暂无数据</td></tr>
              )}
              {filtered.map(ip => (
                <tr key={ip.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2.5 px-3">
                    <a href={`/admin/ips/${ip.id}`} className="font-medium text-primary hover:underline cursor-pointer">{ip.name}</a>
                  </td>
                  <td className="py-2.5 px-3 text-gray-500">{ip.founderName || "—"}</td>
                  <td className="py-2.5 px-3 text-gray-500">{ip.industry || "—"}</td>
                  <td className="py-2.5 px-3 text-gray-500">{ip.user?.name || ip.user?.phone || "—"}</td>
                  <td className="py-2.5 px-3 text-center">{ip._count.geoArticles}</td>
                  <td className="py-2.5 px-3 text-center">{ip._count.weeklyPlans}</td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{new Date(ip.createdAt).toLocaleDateString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
