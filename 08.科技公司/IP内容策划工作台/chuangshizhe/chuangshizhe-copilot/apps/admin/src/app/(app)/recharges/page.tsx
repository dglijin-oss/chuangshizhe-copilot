"use client"

import { useState, useEffect } from "react"

export default function RechargesPage() {
  const [recharges, setRecharges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/recharges", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setRecharges(d.recharges || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleConfirm(id: string) {
    const res = await fetch(`/api/recharges/${id}/confirm`, { method: "POST", credentials: "include" })
    const d = await res.json()
    if (d.success) {
      fetch("/api/recharges", { credentials: "include" })
        .then(r => r.json())
        .then(dd => setRecharges(dd.recharges || []))
    } else {
      alert(d.error || "确认失败")
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
            <th className="px-4 py-3 font-medium">用户</th>
            <th className="px-4 py-3 font-medium">金额</th>
            <th className="px-4 py-3 font-medium">积分</th>
            <th className="px-4 py-3 font-medium">赠送</th>
            <th className="px-4 py-3 font-medium">状态</th>
            <th className="px-4 py-3 font-medium">时间</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td colSpan={7} className="p-6 text-center text-gray-400">加载中...</td></tr> :
          recharges.map(r => (
            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-2.5">{r.user?.name || "-"}<div className="text-xs text-gray-400">{r.user?.phone}</div></td>
              <td className="px-4 py-2.5">¥{r.amount}</td>
              <td className="px-4 py-2.5">{r.points}</td>
              <td className="px-4 py-2.5 text-green-600">+{r.bonus}</td>
              <td className="px-4 py-2.5">
                <span className={`px-2 py-0.5 rounded text-xs ${r.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {r.status === "completed" ? "已支付" : "待支付"}
                </span>
              </td>
              <td className="px-4 py-2.5 text-gray-400">{new Date(r.createdAt).toLocaleString("zh-CN")}</td>
              <td className="px-4 py-2.5">
                {r.status !== "completed" && (
                  <button onClick={() => handleConfirm(r.id)} className="text-xs text-green-600 hover:underline">确认支付</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
