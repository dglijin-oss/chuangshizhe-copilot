"use client"

import { useState, useEffect } from "react"
import { FileCheck, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SafetyDoc {
  id: string
  productId: string
  product: { name: string }
  type: string
  title: string
  content: string | null
  fileUrl: string | null
  status: string
  createdAt: string
}

interface Product {
  id: string
  name: string
}

const typeMap: Record<string, string> = {
  "安全责任书": "bg-red-50 text-red-600",
  "服务协议": "bg-blue-50 text-blue-600",
  "致家长信": "bg-purple-50 text-purple-600",
  "安全应急预案": "bg-amber-50 text-amber-600",
  "活动方案": "bg-green-50 text-green-600",
  "营业执照": "bg-gray-50 text-gray-600",
}
const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-500" },
  approved: { label: "已审批", color: "bg-green-50 text-green-600" },
  archived: { label: "已归档", color: "bg-orange-50 text-orange-600" },
}

export default function SafetyDocsPage() {
  const [docs, setDocs] = useState<SafetyDoc[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ productId: "", type: "安全责任书", title: "", content: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function loadData() {
    setLoading(true)
    const [dRes, pRes] = await Promise.all([
      fetch("/api/safety-docs", { credentials: "include" }),
      fetch("/api/tours", { credentials: "include" }),
    ])
    if (dRes.ok) { const d = await dRes.json(); setDocs(d.docs || []) }
    if (pRes.ok) { const d = await pRes.json(); setProducts(d.products || []) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function openAdd() {
    setForm({ productId: products[0]?.id || "", type: "安全责任书", title: "", content: "" })
    setError("")
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!form.productId || !form.type || !form.title) { setError("产品、类型、标题不能为空"); return }
    setSubmitting(true)
    setError("")

    const res = await fetch("/api/safety-docs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(form),
    })

    if (res.ok) { setShowModal(false); loadData() }
    else { const d = await res.json(); setError(d.error || "操作失败") }
    setSubmitting(false)
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/safety-docs/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status }),
    })
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该文档？")) return
    await fetch(`/api/safety-docs/${id}`, { method: "DELETE", credentials: "include" })
    loadData()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">安全文档</h1>
          <p className="text-sm text-gray-500 mt-1">研学项目安全合规文档管理</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover">
          <Plus className="w-4 h-4" /> 新建文档
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12">
          <FileCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">暂无安全文档</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">文档标题</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">类型</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">所属产品</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">创建时间</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.title}</td>
                  <td className="px-4 py-3"><span className={cn("px-2 py-0.5 text-xs rounded-full", typeMap[d.type] || "bg-gray-50 text-gray-600")}>{d.type}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{d.product.name}</td>
                  <td className="px-4 py-3">
                    <select value={d.status} onChange={(e) => updateStatus(d.id, e.target.value)} className={cn("px-2 py-0.5 text-xs rounded-full border-0 appearance-none cursor-pointer", statusMap[d.status]?.color)}>
                      {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(d.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(d.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold mb-4">新建安全文档</h2>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">所属产品 *</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">文档类型 *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {Object.keys(typeMap).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">标题 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">内容（可选）</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" rows={4} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">取消</button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50">{submitting ? "保存中..." : "保存"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
