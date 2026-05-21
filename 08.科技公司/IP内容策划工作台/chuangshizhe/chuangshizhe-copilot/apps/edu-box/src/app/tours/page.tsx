"use client"

import { useState, useEffect } from "react"
import { Backpack, Plus, Pencil, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  type: string
  grade: string
  duration: number
  pricePerStudent: number
  minStudents: number
  status: string
  school?: { name: string } | null
  _count?: { bookings: number }
  createdAt: string
}

interface School {
  id: string
  name: string
}

const typeMap: Record<string, string> = {
  "乡村": "bg-green-50 text-green-600",
  "城市": "bg-blue-50 text-blue-600",
  "营地": "bg-purple-50 text-purple-600",
  "定制": "bg-amber-50 text-amber-600",
}
const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-500" },
  published: { label: "已发布", color: "bg-blue-50 text-blue-600" },
  active: { label: "进行中", color: "bg-green-50 text-green-600" },
  completed: { label: "已完成", color: "bg-purple-50 text-purple-600" },
  cancelled: { label: "已取消", color: "bg-red-50 text-red-600" },
}

export default function ToursPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "", type: "乡村", grade: "七年级", duration: 1,
    pricePerStudent: 0, minStudents: 30, description: "", schoolId: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function loadData() {
    setLoading(true)
    const [pRes, sRes] = await Promise.all([
      fetch("/api/tours", { credentials: "include" }),
      fetch("/api/schools", { credentials: "include" }),
    ])
    if (pRes.ok) { const d = await pRes.json(); setProducts(d.products || []) }
    if (sRes.ok) { const d = await sRes.json(); setSchools(d.schools || []) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function openAdd() {
    setEditId(null)
    setForm({ name: "", type: "乡村", grade: "七年级", duration: 1, pricePerStudent: 0, minStudents: 30, description: "", schoolId: "" })
    setError("")
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditId(p.id)
    setForm({
      name: p.name, type: p.type, grade: p.grade, duration: p.duration,
      pricePerStudent: p.pricePerStudent, minStudents: p.minStudents, description: "",
      schoolId: "",
    })
    setError("")
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!form.name || !form.type || !form.grade) { setError("名称、类型、年级不能为空"); return }
    setSubmitting(true)
    setError("")

    const res = editId
      ? await fetch(`/api/tours/${editId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          credentials: "include", body: JSON.stringify(form),
        })
      : await fetch("/api/tours", {
          method: "POST", headers: { "Content-Type": "application/json" },
          credentials: "include", body: JSON.stringify(form),
        })

    if (res.ok) { setShowModal(false); loadData() }
    else { const d = await res.json(); setError(d.error || "操作失败") }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该产品？")) return
    await fetch(`/api/tours/${id}`, { method: "DELETE", credentials: "include" })
    loadData()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">研学产品</h1>
          <p className="text-sm text-gray-500 mt-1">研学产品管理与发布</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover">
          <Plus className="w-4 h-4" /> 新建产品
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Backpack className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">暂无研学产品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-900">{p.name}</h3>
                <span className={cn("px-2 py-0.5 text-xs rounded-full", statusMap[p.status]?.color)}>{statusMap[p.status]?.label || p.status}</span>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                <div className="flex gap-2">
                  <span className={cn("px-2 py-0.5 rounded-full", typeMap[p.type] || "bg-gray-50 text-gray-600")}>{p.type}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{p.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span>{p.duration} 天</span>
                  <span className="text-primary font-medium">¥{p.pricePerStudent}/人</span>
                </div>
                <div className="flex justify-between">
                  <span>最低 {p.minStudents} 人成团</span>
                  <span>已报名 {p._count?.bookings || 0} 人</span>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(p)} className="flex-1 text-xs text-gray-500 hover:underline flex items-center justify-center gap-1"><Pencil className="w-3 h-3" /> 编辑</button>
                <button onClick={() => handleDelete(p.id)} className="flex-1 text-xs text-red-500 hover:underline flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> 删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold mb-4">{editId ? "编辑产品" : "新建产品"}</h2>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">产品名称 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="如：走进自然——生态研学之旅" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">类型</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    {["乡村", "城市", "营地", "定制"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">适用年级</label>
                  <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    {["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "七年级", "八年级", "九年级", "高一", "高二", "高三"].map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">天数</label>
                  <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 1 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" min={1} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">价格/人</label>
                  <input type="number" value={form.pricePerStudent} onChange={(e) => setForm({ ...form, pricePerStudent: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">最低人数</label>
                  <input type="number" value={form.minStudents} onChange={(e) => setForm({ ...form, minStudents: parseInt(e.target.value) || 30 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
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
