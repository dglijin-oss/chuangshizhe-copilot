"use client"

import { useState, useEffect } from "react"
import { ClipboardList, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Booking {
  id: string
  productId: string
  product: { name: string; type: string; pricePerStudent: number }
  schoolId: string
  school: { name: string }
  student?: { name: string } | null
  studentName: string
  parentName: string
  parentPhone: string
  healthNote: string | null
  status: string
  paymentStatus: string
  price: number
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
  pending: { label: "待确认", color: "bg-amber-50 text-amber-600" },
  confirmed: { label: "已确认", color: "bg-green-50 text-green-600" },
  cancelled: { label: "已取消", color: "bg-red-50 text-red-600" },
}
const paymentMap: Record<string, { label: string; color: string }> = {
  unpaid: { label: "未缴费", color: "bg-red-50 text-red-600" },
  paid: { label: "已缴费", color: "bg-green-50 text-green-600" },
  refunded: { label: "已退款", color: "bg-gray-100 text-gray-500" },
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    productId: "", schoolId: "", studentId: "", studentName: "", parentName: "", parentPhone: "", healthNote: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function loadData() {
    setLoading(true)
    const [bRes, pRes, sRes] = await Promise.all([
      fetch("/api/bookings", { credentials: "include" }),
      fetch("/api/tours", { credentials: "include" }),
      fetch("/api/schools", { credentials: "include" }),
    ])
    if (bRes.ok) { const d = await bRes.json(); setBookings(d.bookings || []) }
    if (pRes.ok) { const d = await pRes.json(); setProducts(d.products || []) }
    if (sRes.ok) { const d = await sRes.json(); setSchools(d.schools || []) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function openAdd() {
    setForm({ productId: products[0]?.id || "", schoolId: "", studentId: "", studentName: "", parentName: "", parentPhone: "", healthNote: "" })
    setError("")
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!form.productId || !form.schoolId || !form.studentName || !form.parentName || !form.parentPhone) {
      setError("产品、学校、学生姓名、家长姓名、联系电话不能为空"); return
    }
    setSubmitting(true)
    setError("")

    const res = await fetch("/api/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(form),
    })

    if (res.ok) { setShowModal(false); loadData() }
    else { const d = await res.json(); setError(d.error || "操作失败") }
    setSubmitting(false)
  }

  async function updateStatus(id: string, field: string, value: string) {
    await fetch(`/api/bookings/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ [field]: value }),
    })
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该报名？")) return
    await fetch(`/api/bookings/${id}`, { method: "DELETE", credentials: "include" })
    loadData()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">报名管理</h1>
          <p className="text-sm text-gray-500 mt-1">研学项目报名与缴费管理</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover">
          <Plus className="w-4 h-4" /> 新建报名
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">暂无报名记录</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">学生</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">产品</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">学校</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">家长联系</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">费用</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">报名状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">缴费</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.studentName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{b.product.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{b.school.name}</td>
                  <td className="px-4 py-3 text-xs">
                    <p>{b.parentName}</p>
                    <p className="text-gray-400">{b.parentPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-primary text-xs font-medium">¥{b.price}</td>
                  <td className="px-4 py-3">
                    <select value={b.status} onChange={(e) => updateStatus(b.id, "status", e.target.value)} className={cn("px-2 py-0.5 text-xs rounded-full border-0 appearance-none cursor-pointer", statusMap[b.status]?.color)}>
                      {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={b.paymentStatus} onChange={(e) => updateStatus(b.id, "paymentStatus", e.target.value)} className={cn("px-2 py-0.5 text-xs rounded-full border-0 appearance-none cursor-pointer", paymentMap[b.paymentStatus]?.color)}>
                      {Object.entries(paymentMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(b.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"><Trash2 className="w-3.5 h-3.5" /></button>
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
            <h2 className="text-base font-bold mb-4">新建报名</h2>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">产品 *</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (¥{p.pricePerStudent})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">学校 *</label>
                <select value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">请选择学校</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">学生姓名 *</label>
                <input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">家长姓名 *</label>
                  <input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">联系电话 *</label>
                  <input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
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
