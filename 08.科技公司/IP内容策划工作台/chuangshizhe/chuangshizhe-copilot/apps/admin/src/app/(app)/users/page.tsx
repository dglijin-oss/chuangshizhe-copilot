"use client"

import { useState, useEffect } from "react"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPoints, setEditPoints] = useState(0)
  const [editRole, setEditRole] = useState("user")

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    const res = await fetch("/api/users", { credentials: "include" })
    const d = await res.json()
    setUsers(d.users || [])
    setLoading(false)
  }

  async function handleSave(userId: string) {
    await fetch("/api/users", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, points: editPoints, role: editRole }),
    })
    setEditingId(null)
    fetchUsers()
  }

  async function handleDelete(userId: string) {
    if (!confirm("确定删除此用户？")) return
    await fetch(`/api/users?id=${userId}`, { method: "DELETE", credentials: "include" })
    fetchUsers()
  }

  const filtered = users.filter(u =>
    (u.name || "").includes(search) || u.phone.includes(search)
  )

  return (
    <div className="space-y-4">
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="搜索姓名或手机号..."
        className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
              <th className="px-4 py-3 font-medium">姓名</th>
              <th className="px-4 py-3 font-medium">手机号</th>
              <th className="px-4 py-3 font-medium">角色</th>
              <th className="px-4 py-3 font-medium">积分</th>
              <th className="px-4 py-3 font-medium">注册时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="p-6 text-center text-gray-400">加载中...</td></tr> :
            filtered.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5">{u.name || "-"}</td>
                <td className="px-4 py-2.5 text-gray-400">{u.phone}</td>
                <td className="px-4 py-2.5">
                  {editingId === u.id ? (
                    <select value={editRole} onChange={e => setEditRole(e.target.value)} className="border rounded px-2 py-1 text-xs">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-xs ${u.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {editingId === u.id ? (
                    <input type="number" value={editPoints} onChange={e => setEditPoints(parseInt(e.target.value))} className="border rounded px-2 py-1 text-xs w-20" />
                  ) : u.points}
                </td>
                <td className="px-4 py-2.5 text-gray-400">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
                <td className="px-4 py-2.5 space-x-2">
                  {editingId === u.id ? (
                    <>
                      <button onClick={() => handleSave(u.id)} className="text-xs text-green-600 hover:underline">保存</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:underline">取消</button>
                    </>
                  ) : (
                    <button onClick={() => { setEditingId(u.id); setEditPoints(u.points); setEditRole(u.role) }} className="text-xs text-primary hover:underline">编辑</button>
                  )}
                  <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
