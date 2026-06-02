"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, FileText, Coins, Zap } from "lucide-react"

type Stats = { totalUsers: number; totalIps: number; totalArticles: number; totalRecharges: number; totalPoints: number }

export default function AdminDashboardPage() {
  const { role } = useUser()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentRecharges, setRecentRecharges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role !== "admin") { router.push("/dashboard") }
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data.stats)
        setRecentUsers(data.recentUsers || [])
        setRecentRecharges(data.recentRecharges || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [role, router])

  if (loading) return <div className="p-4 md:p-6 text-gray-400">加载中...</div>

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-6">数据看板</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users className="w-5 h-5" />} label="用户总数" value={String(stats?.totalUsers || 0)} bg="bg-primary-light" />
        <StatCard icon={<FileText className="w-5 h-5" />} label="IP 总数" value={String(stats?.totalIps || 0)} bg="bg-primary-light" />
        <StatCard icon={<Zap className="w-5 h-5" />} label="文章总数" value={String(stats?.totalArticles || 0)} bg="bg-[#e8f5e9]" />
        <StatCard icon={<Coins className="w-5 h-5" />} label="积分池" value={String(stats?.totalPoints || 0)} bg="bg-gray-900" color="text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium mb-4">最近注册用户</h3>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">暂无用户</p>
          ) : (
            <div className="space-y-2">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-200">
                  <span className="font-medium">{u.name}</span>
                  <span className="text-gray-400 text-xs">{u.phone}</span>
                  <span className="text-primary text-xs">{u.points} 积分</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium mb-4">最近充值记录</h3>
          {recentRecharges.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">暂无充值</p>
          ) : (
            <div className="space-y-2">
              {recentRecharges.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-200">
                  <span className="font-medium">{r.user?.name || "未知"}</span>
                  <span className="text-gray-400 text-xs">+{r.points} 积分</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded", r.status === "paid" ? "bg-[#22c55e] text-white" : "bg-gray-200 text-gray-400")}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, bg, color }: { icon: React.ReactNode; label: string; value: string; bg: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
          <span className={cn("text-sm", color)}>{icon}</span>
        </div>
        <span className="text-xs text-muted">{label}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}
