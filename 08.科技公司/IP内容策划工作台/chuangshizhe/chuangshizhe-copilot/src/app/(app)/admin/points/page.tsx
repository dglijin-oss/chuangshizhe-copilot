"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"

type User = { id: string; name: string; phone: string; points: number }

export default function AdminPointsPage() {
  const { role } = useUser()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [result, setResult] = useState<{ msg: string; success: boolean } | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (role !== "admin") { router.push("/dashboard") }
    fetch("/api/admin/users")
      .then(res => res.json())
      .then(data => { setUsers(data.users || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [role, router])

  const handleSubmit = async () => {
    if (!selectedUser || !amount) return
    setResult(null)
    const res = await fetch("/api/admin/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser, amount: parseInt(amount), reason }),
    })
    const data = await res.json()
    if (!res.ok) { setResult({ msg: data.error, success: false }); return }
    setResult({ msg: `${data.user.name}（${data.user.phone}）积分变更为 ${data.newPoints}（${data.delta > 0 ? "+" : ""}${data.delta}）`, success: true })
    setUsers(users.map(u => u.id === selectedUser ? { ...u, points: data.newPoints } : u))
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  )

  if (loading) return <div className="p-4 md:p-6 text-gray-400">加载中...</div>

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
        <h1 className="text-lg md:text-xl font-bold mb-1">积分管理</h1>
        <p className="text-xs text-muted mb-4">为用户手动增减积分</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
        <span className="text-xs text-primary font-medium">选择用户</span>
        <input type="text" placeholder="搜索用户名或手机号..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 focus:outline-none focus:border-primary" />
        <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
          {filtered.map(u => (
            <button key={u.id} onClick={() => setSelectedUser(u.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between ${selectedUser === u.id ? "bg-primary-light" : "hover:bg-gray-50"}`}>
              <span>{u.name}（{u.phone}）</span>
              <span className="text-primary font-medium">{u.points} 积分</span>
            </button>
          ))}
        </div>
      </div>

      {selectedUser && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <span className="text-xs text-primary font-medium">调整积分</span>
          <div className="flex gap-4 mt-3 items-end flex-wrap">
            <div className="flex-1 min-w-0">
              <label className="text-xs text-muted">数量（正数=增加，负数=减少）</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs text-muted">原因（选填）</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary" />
            </div>
            <button onClick={handleSubmit} className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
              确认调整
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className={`mt-4 px-4 py-3 rounded-lg text-sm ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {result.msg}
        </div>
      )}
    </div>
  )
}
