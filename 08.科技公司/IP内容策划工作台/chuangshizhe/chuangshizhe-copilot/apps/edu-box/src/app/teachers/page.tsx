"use client"

import { useState, useEffect, useContext } from "react"
import { UserContext } from "@/lib/user-context"
import { Users, Plus, Pencil, Trash2, GraduationCap } from "lucide-react"

interface Teacher {
  id: string
  name: string
  schoolId: string
  school: { name: string }
  subjects: string[]
  role: string
  createdAt: string
}

interface School {
  id: string
  name: string
}

export default function TeachersPage() {
  const user = useContext(UserContext)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    schoolId: "",
    subjects: "",
    role: "teacher",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function loadData() {
    setLoading(true)
    const [tRes, sRes] = await Promise.all([
      fetch("/api/teachers", { credentials: "include" }),
      fetch("/api/schools", { credentials: "include" }),
    ])
    if (tRes.ok) { const d = await tRes.json(); setTeachers(d.teachers || []) }
    if (sRes.ok) { const d = await sRes.json(); setSchools(d.schools || []) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function openAdd() {
    setEditId(null)
    setForm({ name: "", schoolId: schools[0]?.id || "", subjects: "", role: "teacher" })
    setError("")
    setShowModal(true)
  }

  function openEdit(t: Teacher) {
    setEditId(t.id)
    setForm({
      name: t.name,
      schoolId: t.schoolId,
      subjects: t.subjects.join(", "),
      role: t.role,
    })
    setError("")
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError("教师姓名不能为空"); return }
    if (!form.schoolId) { setError("请选择所属学校"); return }
    setSubmitting(true)
    setError("")

    const body = {
      name: form.name,
      schoolId: form.schoolId,
      subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
      role: form.role,
    }

    const res = editId
      ? await fetch(`/api/teachers/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        })
      : await fetch("/api/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        })

    if (res.ok) { setShowModal(false); loadData() }
    else { const d = await res.json(); setError(d.error || "操作失败") }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该教师？请先删除关联的教案/作业")) return
    const res = await fetch(`/api/teachers/${id}`, { method: "DELETE", credentials: "include" })
    if (res.ok) { loadData() }
    else { const d = await res.json(); alert(d.error || "删除失败") }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">教师管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理教师信息和账号绑定</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
          <Plus className="w-4 h-4" /> 添加教师
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">姓名</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">学校</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">任教科目</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">角色</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">加载中...</td></tr>
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-10 h-10 text-gray-300" />
                    <p className="text-gray-400">暂无教师，请先添加学校后再添加教师</p>
                  </div>
                </td>
              </tr>
            ) : (
              teachers.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 text-gray-500">{t.school.name}</td>
                  <td className="px-4 py-3">
                    {t.subjects.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {t.subjects.map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-primary-light text-primary text-xs rounded-full">{s}</span>
                        ))}
                      </div>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={t.role === "admin" ? "px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full" : "px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full"}>
                      {t.role === "admin" ? "管理员" : "教师"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(t)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mr-3">
                      <Pencil className="w-3.5 h-3.5" /> 编辑
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline">
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
            <h2 className="text-base font-bold mb-4">{editId ? "编辑教师" : "添加教师"}</h2>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">姓名 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="请输入教师姓名" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">所属学校 *</label>
                <select value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">请选择学校</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">任教科目</label>
                <input value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="多个科目用逗号分隔，如：语文,数学" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">角色</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="teacher">教师</option>
                  <option value="admin">管理员</option>
                </select>
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
