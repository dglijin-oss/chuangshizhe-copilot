"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Edit2, Trash2, Save, X } from "lucide-react"

type User = {
  id: string
  name: string
  phone: string
  role: string
  points: number
  createdAt: string
  _count?: { ips: number; questionnaires: number; pointsRecharges: number; generationLogs: number }
}

export default function AdminUsersPage() {
  const { role } = useUser()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", role: "", points: 0 })
  const [error, setError] = useState("")

  useEffect(() => {
    if (role !== "admin") { router.push("/dashboard") }
    fetch("/api/admin/users")
      .then(res => res.json())
      .then(data => { setUsers(data.users || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [role, router])

  const handleEdit = (u: User) => {
    setEditingId(u.id)
    setEditForm({ name: u.name, role: u.role, points: u.points })
  }

  const handleSave = async (id: string) => {
    setError("")
    const res = await fetch(`/api/admin/users?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
      credentials: "include",
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setUsers(users.map(u => u.id === id ? { ...u, ...data.user } : u))
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此用户？此操作不可恢复。")) return
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE", credentials: "include" })
    if (res.ok) setUsers(users.filter(u => u.id !== id))
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  )

  if (loading) return <div className="p-4 md:p-6 text-gray-400">加载中...</div>

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
        <h1 className="text-lg md:text-xl font-bold mb-1">用户管理</h1>
        <p className="text-xs text-muted mb-4">共 {users.length} 个用户</p>
        <input type="text" placeholder="搜索用户名或手机号..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
      </div>

      {error && <p className="text-xs text-red-500 mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">用户名</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">手机号</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">角色</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">积分</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">IP数</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">注册</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-400">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50">
                {editingId === u.id ? (
                  <>
                    <td className="py-3 px-4"><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="border border-gray-200 rounded px-2 py-1 text-sm w-32" /></td>
                    <td className="py-3 px-4 text-gray-400">{u.phone}</td>
                    <td className="py-3 px-4">
                      <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="border border-gray-200 rounded px-2 py-1 text-sm bg-white">
                        <option value="user">用户</option>
                        <option value="admin">管理员</option>
                      </select>
                    </td>
                    <td className="py-3 px-4"><input type="number" value={editForm.points} onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) || 0 })} className="border border-gray-200 rounded px-2 py-1 text-sm w-20" /></td>
                    <td className="py-3 px-4 text-gray-400">{u._count?.ips || 0}</td>
                    <td className="py-3 px-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right flex justify-end gap-1">
                      <button onClick={() => handleSave(u.id)} className="text-[#22c55e] hover:text-[#16a34a]"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-900"><X className="w-4 h-4" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-3 px-4 font-medium">{u.name}</td>
                    <td className="py-3 px-4 text-muted">{u.phone}</td>
                    <td className="py-3 px-4">
                      <span className={cn("text-xs px-2 py-0.5 rounded", u.role === "admin" ? "bg-primary-light text-primary" : "bg-gray-200 text-gray-400")}>
                        {u.role === "admin" ? "管理员" : "用户"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-primary font-medium">{u.points}</td>
                    <td className="py-3 px-4 text-gray-400">{u._count?.ips || 0}</td>
                    <td className="py-3 px-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleEdit(u)} className="text-primary hover:text-primary-hover"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">暂无用户</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
