"use client"

import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const platforms = ["头条号", "知乎", "小红书", "公众号", "抖音", "快手", "视频号", "百家号"]

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [form, setForm] = useState({ platform: "头条号", configName: "", configData: "", status: "待配置" })
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/assets/integrations")
      .then((res) => res.json())
      .then((data) => { if (data.integrations) setIntegrations(data.integrations) })
      .catch(() => {})
  }, [])

  const handleAdd = async () => {
    if (!form.configName) { setMessage("配置名称必填"); return }
    setMessage("")
    const res = await fetch("/api/assets/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.integration) {
      setIntegrations([data.integration, ...integrations])
      setForm({ platform: "头条号", configName: "", configData: "", status: "待配置" })
      setMessage("接入配置已添加")
    } else {
      setMessage(data.error || "添加失败")
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/assets/integrations?id=${id}`, { method: "DELETE" })
    if (res.ok) setIntegrations(integrations.filter((i) => i.id !== id))
  }

  const statusColor = (s: string) => {
    if (s === "已配置") return "bg-green-100 text-green-600"
    if (s === "已停用") return "bg-red-100 text-red-500"
    return "bg-primary-light text-primary"
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 card-hover">
        <h1 className="text-lg md:text-xl font-bold mb-1">接入配置</h1>
        <p className="text-xs text-muted mb-6">保存自媒体平台配置和状态，本轮用于记录与 adapter 预留。</p>

        {message && <p className="text-xs text-green-600 mb-4 bg-green-50 px-3 py-2 rounded-lg">{message}</p>}

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary">
              {platforms.map(p => <option key={p}>{p}</option>)}
            </select>
            <input type="text" placeholder="配置名称" value={form.configName}
              onChange={(e) => setForm({ ...form, configName: e.target.value })}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary">
              <option>待配置</option>
              <option>已配置</option>
              <option>已停用</option>
            </select>
          </div>
          <textarea placeholder='配置备注或 JSON，例如 {"account":"xxx"}' value={form.configData}
            onChange={(e) => setForm({ ...form, configData: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:border-primary" />
          <button onClick={handleAdd} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            新增接入
          </button>
        </div>
      </div>

      {integrations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
          <h2 className="text-base font-bold mb-4">已配置的接入 ({integrations.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs text-muted font-medium">平台</th>
                  <th className="text-left py-3 px-4 text-xs text-muted font-medium">配置名称</th>
                  <th className="text-left py-3 px-4 text-xs text-muted font-medium">状态</th>
                  <th className="text-left py-3 px-4 text-xs text-muted font-medium">创建时间</th>
                  <th className="text-left py-3 px-4 text-xs text-muted font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{item.platform}</td>
                    <td className="py-3 px-4 font-medium">{item.configName}</td>
                    <td className="py-3 px-4"><span className={cn("text-xs px-2 py-0.5 rounded", statusColor(item.status))}>{item.status}</span></td>
                    <td className="py-3 px-4 text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4"><button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
