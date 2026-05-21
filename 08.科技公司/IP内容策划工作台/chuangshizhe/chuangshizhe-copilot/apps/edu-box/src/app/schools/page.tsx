"use client"

import { useState, useEffect, useContext } from "react"
import { UserContext } from "@/lib/user-context"
import { Building2, Plus, Pencil, Trash2, Users, GraduationCap, Backpack } from "lucide-react"
import { cn } from "@/lib/utils"

interface School {
  id: string
  name: string
  type: string
  region: string | null
  address: string | null
  contact: string | null
  phone: string | null
  createdAt: string
  _count: {
    teachers: number
    classes: number
    tours: number
  }
}

const schoolTypes = ["小学", "初中", "高中", "九年一贯制", "完全中学"]

export default function SchoolsPage() {
  const user = useContext(UserContext)
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    type: "小学",
    region: "",
    address: "",
    contact: "",
    phone: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function loadSchools() {
    setLoading(true)
    const res = await fetch("/api/schools", { credentials: "include" })
    if (res.ok) {
      const data = await res.json()
      setSchools(data.schools || [])
    }
    setLoading(false)
  }

  useEffect(() => { loadSchools() }, [])

  function openAdd() {
    setEditId(null)
    setForm({ name: "", type: "小学", region: "", address: "", contact: "", phone: "" })
    setError("")
    setShowModal(true)
  }

  function openEdit(school: School) {
    setEditId(school.id)
    setForm({
      name: school.name,
      type: school.type,
      region: school.region || "",
      address: school.address || "",
      contact: school.contact || "",
      phone: school.phone || "",
    })
    setError("")
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError("学校名称不能为空"); return }
    setSubmitting(true)
    setError("")

    const res = editId
      ? await fetch(`/api/schools/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        })
      : await fetch("/api/schools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        })

    if (res.ok) {
      setShowModal(false)
      loadSchools()
    } else {
      const data = await res.json()
      setError(data.error || "操作失败")
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该校？请先删除关联的教师/班级/研学产品")) return
    const res = await fetch(`/api/schools/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
    if (res.ok) {
      loadSchools()
    } else {
      const data = await res.json()
      alert(data.error || "删除失败")
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">学校管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理合作学校信息</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加学校
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">学校名称</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">类型</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">地区</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">联系人</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">教师</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">班级</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">研学产品</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">加载中...</td></tr>
            ) : schools.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="w-10 h-10 text-gray-300" />
                    <p className="text-gray-400">暂无学校，点击"添加学校"开始</p>
                  </div>
                </td>
              </tr>
            ) : (
              schools.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-primary-light text-primary text-xs rounded-full">{s.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.region || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{s.contact || "-"}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{s._count.teachers}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{s._count.classes}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{s._count.tours}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(s)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mr-3">
                      <Pencil className="w-3.5 h-3.5" /> 编辑
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline">
                      <Trash2 className="w-3.5 h-3.5" /> 删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold mb-4">{editId ? "编辑学校" : "添加学校"}</h2>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">学校名称 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="请输入学校名称"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">学校类型 *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  {schoolTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">地区</label>
                <input
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="如：广西梧州"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">地址</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">联系人</label>
                  <input
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">联系电话</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
                  取消
                </button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50">
                  {submitting ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
