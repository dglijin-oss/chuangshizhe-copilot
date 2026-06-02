"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type RechargeRecord = {
  id: string
  amount: number
  points: number
  bonus: number
  status: string
  payMethod: string
  createdAt: string
  user: { name: string | null; phone: string } | null
}

const payMethodMap: Record<string, string> = { wechat: "微信", alipay: "支付宝", bank: "银行转账" }

export default function AdminRechargesPage() {
  const { role } = useUser()
  const router = useRouter()
  const [recharges, setRecharges] = useState<RechargeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (role !== "admin") { router.push("/dashboard") }
    fetch("/api/admin/recharges", { credentials: "include" })
      .then(res => res.json())
      .then(data => { setRecharges(data.recharges || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [role, router])

  if (loading) return <div className="p-4 md:p-6 text-gray-400">加载中...</div>

  const filtered = recharges.filter(r =>
    [r.user?.name, r.user?.phone, r.status, r.payMethod].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4">充值记录</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <p className="text-xs text-muted mb-4">共 {recharges.length} 条</p>

        <input
          type="text"
          placeholder="搜索用户名、手机号、状态..."
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
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">金额</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">积分</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">赠送</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">状态</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">支付方式</th>
                <th className="text-left py-2 px-3 font-medium text-muted text-xs">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">暂无数据</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium">{r.user?.name || "—"}</td>
                  <td className="py-2.5 px-3 text-gray-500">{r.user?.phone || "—"}</td>
                  <td className="py-2.5 px-3">¥{r.amount}</td>
                  <td className="py-2.5 px-3 text-primary">+{r.points}</td>
                  <td className="py-2.5 px-3 text-orange-500">+{r.bonus}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      r.status === "paid" ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-400"
                    )}>
                      {r.status === "paid" ? "已支付" : r.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-500">{payMethodMap[r.payMethod] || r.payMethod}</td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
