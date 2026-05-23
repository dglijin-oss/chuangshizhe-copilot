"use client"

import { useState, useEffect } from "react"
import { Users, FileText, BarChart3 } from "lucide-react"

const statIcons = [Users, FileText, BarChart3]

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown>>({})
  const [system, setSystem] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/stats?system=${system}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setStats(d.stats || {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [system])

  const statCards = [
    { label: "用户总数", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
    { label: "IP 总数", value: stats.totalIps, icon: FileText, color: "text-green-600" },
    { label: "积分池", value: stats.totalPoints, icon: BarChart3, color: "text-red-600" },
  ]

  return (
    <div className="space-y-6">
      {/* System Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">系统筛选：</span>
        {[
          { value: "all", label: "全部" },
          { value: "ip-copilot", label: "IP 内容工作台" },
        ].map(opt => (
          <button key={opt.value} onClick={() => setSystem(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${system === opt.value ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "..." : (value as number ?? 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">最近注册用户</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="pb-3 font-medium pr-4">姓名</th>
                <th className="pb-3 font-medium pr-4">手机号</th>
                <th className="pb-3 font-medium pr-4">积分</th>
                <th className="pb-3 font-medium">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recentUsers as any[] | undefined)?.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 pr-4">{u.name || "-"}</td>
                  <td className="py-2.5 pr-4 text-gray-400">{u.phone}</td>
                  <td className="py-2.5 pr-4">{u.points}</td>
                  <td className="py-2.5 text-gray-400">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
