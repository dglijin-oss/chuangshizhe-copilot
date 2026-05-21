"use client"

import { useState, useEffect } from "react"
import { Building2, Plus, Pencil, Trash2, X, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface Supplier {
  id: string
  name: string
  category: string
  contact: string | null
  phone: string | null
  licenseNo: string | null
  address: string | null
  rating: number
  grade: string
  safetyScore: number
  serviceScore: number
  priceScore: number
  responseScore: number
  _count?: { products: number }
  createdAt: string
}

const categoryMap: Record<string, string> = {
  "交通": "bg-blue-50 text-blue-600",
  "餐饮": "bg-green-50 text-green-600",
  "住宿": "bg-purple-50 text-purple-600",
  "场地": "bg-amber-50 text-amber-600",
  "医疗": "bg-red-50 text-red-600",
  "其他": "bg-gray-50 text-gray-600",
}
const gradeColor: Record<string, string> = {
  A: "bg-green-500 text-white",
  B: "bg-blue-500 text-white",
  C: "bg-gray-300 text-gray-700",
  D: "bg-red-500 text-white",
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "", category: "交通", contact: "", phone: "", licenseNo: "", address: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function loadData() {
    setLoading(true)
    const res = await fetch("/api/suppliers", { credentials: "include" })
    if (res.ok) { const d = await res.json(); setSuppliers(d.suppliers || []) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function openAdd() {
    setEditId(null)
    setForm({ name: "", category: "交通", contact: "", phone: "", licenseNo: "", address: "" })
    setError("")
    setShowModal(true)
  }

  function openEdit(s: Supplier) {
    setEditId(s.id)
    setForm({
      name: s.name, category: s.category,
      contact: s.contact || "", phone: s.phone || "",
      licenseNo: s.licenseNo || "", address: s.address || "",
    })
    setError("")
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!form.name || !form.category) { setError("名称和类型不能为空"); return }
    setSubmitting(true)
    setError("")

    const res = editId
      ? await fetch(`/api/suppliers/${editId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          credentials: "include", body: JSON.stringify(form),
        })
      : await fetch("/api/suppliers", {
          method: "POST", headers: { "Content-Type": "application/json" },
          credentials: "include", body: JSON.stringify(form),
        })

    if (res.ok) { setShowModal(false); loadData() }
    else { const d = await res.json(); setError(d.error || "操作失败") }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该供应商？")) return
    await fetch(`/api/suppliers/${id}`, { method: "DELETE", credentials: "include" })
    loadData()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">供应商管理</h1>
          <p className="text-sm text-gray-500 mt-1">研学供应商评估与评级管理</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover">
          <Plus className="w-4 h-4" /> 新建供应商
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">暂无供应商</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">供应商名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">类型</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">联系人</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">营业执照</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">等级</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">评分</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">合作产品</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3"><span className={cn("px-2 py-0.5 text-xs rounded-full", categoryMap[s.category] || "bg-gray-50 text-gray-600")}>{s.category}</span></td>
                  <td className="px-4 py-3 text-xs">
                    {s.contact && <p>{s.contact}</p>}
                    {s.phone && <p className="text-gray-400">{s.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.licenseNo || "未登记"}</td>
                  <td className="px-4 py-3"><span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", gradeColor[s.grade])}>{s.grade}级</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-medium">{s.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400">安全{s.safetyScore} 服务{s.serviceScore}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s._count?.products || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(s)} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:underline mr-2"><Pencil className="w-3.5 h-3.5" /> 编辑</button>
                    <button onClick={() => handleDelete(s.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"><Trash2 className="w-3.5 h-3.5" /></button>
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
            <h2 className="text-base font-bold mb-4">{editId ? "编辑供应商" : "新建供应商"}</h2>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">供应商名称 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">类型 *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {["交通", "餐饮", "住宿", "场地", "医疗", "其他"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted mb-1 block">联系人</label><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                <div><label className="text-xs font-medium text-muted mb-1 block">电话</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
              </div>
              <div><label className="text-xs font-medium text-muted mb-1 block">营业执照号</label><input value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
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
