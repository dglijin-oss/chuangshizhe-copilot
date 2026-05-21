"use client"

import { useState, useEffect } from "react"

export default function SystemsPage() {
  const [systems, setSystems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: "", identifier: "", description: "", port: 0, url: "" })

  useEffect(() => { fetchSystems() }, [])

  async function fetchSystems() {
    const res = await fetch("/api/systems", { credentials: "include" })
    const d = await res.json()
    setSystems(d.systems || [])
    setLoading(false)
  }

  async function handleAdd() {
    await fetch("/api/systems", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, port: form.port || null, active: true }),
    })
    setShowAdd(false)
    setForm({ name: "", identifier: "", description: "", port: 0, url: "" })
    fetchSystems()
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch("/api/systems", {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    })
    fetchSystems()
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowAdd(!showAdd)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-hover">
        {showAdd ? "取消" : "+ 添加系统"}
      </button>

      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="系统名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="标识符 (如 ip-copilot)" value={form.identifier} onChange={e => setForm({ ...form, identifier: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="端口 (如 3000)" type="number" value={form.port || ""} onChange={e => setForm({ ...form, port: parseInt(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <input placeholder="描述" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full" />
          <button onClick={handleAdd} className="bg-primary text-white px-4 py-2 rounded-lg text-sm">保存</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
              <th className="px-4 py-3 font-medium">名称</th>
              <th className="px-4 py-3 font-medium">标识符</th>
              <th className="px-4 py-3 font-medium">端口</th>
              <th className="px-4 py-3 font-medium">URL</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="p-6 text-center text-gray-400">加载中...</td></tr> :
            systems.map(s => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5">{s.name}</td>
                <td className="px-4 py-2.5"><code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{s.identifier}</code></td>
                <td className="px-4 py-2.5">{s.port || "-"}</td>
                <td className="px-4 py-2.5 text-gray-400">{s.url || "-"}</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => handleToggle(s.id, !s.active)}
                    className={`px-2 py-0.5 rounded text-xs ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {s.active ? "启用" : "禁用"}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-gray-400">{new Date(s.createdAt).toLocaleDateString("zh-CN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
