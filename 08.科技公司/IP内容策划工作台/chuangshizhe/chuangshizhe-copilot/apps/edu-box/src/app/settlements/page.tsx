"use client"

import { useState, useEffect } from "react"
import { Wallet, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Settlement {
  id: string
  productId: string
  product: { name: string; pricePerStudent: number }
  schoolId: string
  school: { name: string }
  totalRevenue: number
  totalCost: number
  profit: number
  studentCount: number
  status: string
  settledAt: string | null
  createdAt: string
}

interface Product {
  id: string
  name: string
  pricePerStudent: number
}

interface School {
  id: string
  name: string
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "待结算", color: "bg-amber-50 text-amber-600" },
  settled: { label: "已结算", color: "bg-green-50 text-green-600" },
  closed: { label: "已关闭", color: "bg-gray-100 text-gray-500" },
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    productId: "", schoolId: "", totalRevenue: 0, totalCost: 0, studentCount: 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function loadData() {
    setLoading(true)
    const [sRes, pRes, scRes] = await Promise.all([
      fetch("/api/settlements", { credentials: "include" }),
      fetch("/api/tours", { credentials: "include" }),
      fetch("/api/schools", { credentials: "include" }),
    ])
    if (sRes.ok) { const d = await sRes.json(); setSettlements(d.settlements || []) }
    if (pRes.ok) { const d = await pRes.json(); setProducts(d.products || []) }
    if (scRes.ok) { const d = await scRes.json(); setSchools(d.schools || []) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function openAdd() {
    setForm({ productId: products[0]?.id || "", schoolId: "", totalRevenue: 0, totalCost: 0, studentCount: 0 })
    setError("")
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!form.productId || !form.schoolId) { setError("产品和学校不能为空"); return }
    setSubmitting(true)
    setError("")

    const res = await fetch("/api/settlements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({
        ...form,
        profit: form.totalRevenue - form.totalCost,
      }),
    })

    if (res.ok) { setShowModal(false); loadData() }
    else { const d = await res.json(); setError(d.error || "操作失败") }
    setSubmitting(false)
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/settlements/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({
        status,
        settledAt: status === "settled" ? new Date().toISOString() : null,
      }),
    })
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该结算？")) return
    await fetch(`/api/settlements/${id}`, { method: "DELETE", credentials: "include" })
    loadData()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">财务结算</h1>
          <p className="text-sm text-gray-500 mt-1">研学项目收入成本与利润结算</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover">
          <Plus className="w-4 h-4" /> 新建结算
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : settlements.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">暂无结算记录</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">产品</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">学校</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">参与人数</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">总收入</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">总成本</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">利润</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">创建时间</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 text-xs">{s.product.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.school.name}</td>
                  <td className="px-4 py-3 text-center text-xs">{s.studentCount} 人</td>
                  <td className="px-4 py-3 text-green-600 text-xs font-medium">¥{s.totalRevenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500 text-xs">¥{s.totalCost.toLocaleString()}</td>
                  <td className={cn("px-4 py-3 text-xs font-bold", s.profit >= 0 ? "text-green-600" : "text-red-600")}>
                    ¥{s.profit.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <select value={s.status} onChange={(e) => updateStatus(s.id, e.target.value)} className={cn("px-2 py-0.5 text-xs rounded-full border-0 appearance-none cursor-pointer", statusMap[s.status]?.color)}>
                      {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td className="px-4 py-3 text-right">
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
            <h2 className="text-base font-bold mb-4">新建结算</h2>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">产品 *</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">学校 *</label>
                <select value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">请选择学校</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">总收入</label>
                  <input type="number" value={form.totalRevenue} onChange={(e) => setForm({ ...form, totalRevenue: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">总成本</label>
                  <input type="number" value={form.totalCost} onChange={(e) => setForm({ ...form, totalCost: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">参与人数</label>
                <input type="number" value={form.studentCount} onChange={(e) => setForm({ ...form, studentCount: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
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
