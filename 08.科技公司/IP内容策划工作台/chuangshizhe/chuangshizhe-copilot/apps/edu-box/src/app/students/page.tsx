"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Pencil, Trash2 } from "lucide-react"

interface Student {
  id: string
  name: string
  classId: string
  schoolId: string
  gender: string | null
  birthDate: string | null
  parentName: string | null
  parentPhone: string | null
  healthNote: string | null
  createdAt: string
  class: { name: string; school: { name: string } }
}

interface School {
  id: string
  name: string
}

interface ClassItem {
  id: string
  name: string
  schoolId: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    schoolId: "",
    classId: "",
    gender: "",
    birthDate: "",
    parentName: "",
    parentPhone: "",
    healthNote: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function loadData() {
    setLoading(true)
    const [sRes, scRes, cRes] = await Promise.all([
      fetch("/api/students", { credentials: "include" }),
      fetch("/api/schools", { credentials: "include" }),
      fetch("/api/classes", { credentials: "include" }),
    ])
    if (sRes.ok) { const d = await sRes.json(); setStudents(d.students || []) }
    if (scRes.ok) { const d = await scRes.json(); setSchools(d.schools || []) }
    if (cRes.ok) { const d = await cRes.json(); setClasses(d.classes || []) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function openAdd() {
    setEditId(null)
    setForm({ name: "", schoolId: schools[0]?.id || "", classId: "", gender: "", birthDate: "", parentName: "", parentPhone: "", healthNote: "" })
    setError("")
    setShowModal(true)
  }

  function openEdit(s: Student) {
    setEditId(s.id)
    setForm({
      name: s.name,
      schoolId: s.schoolId,
      classId: s.classId,
      gender: s.gender || "",
      birthDate: s.birthDate ? s.birthDate.split("T")[0] : "",
      parentName: s.parentName || "",
      parentPhone: s.parentPhone || "",
      healthNote: s.healthNote || "",
    })
    setError("")
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError("学生姓名不能为空"); return }
    if (!form.classId) { setError("请选择班级"); return }
    setSubmitting(true)
    setError("")

    const body = {
      name: form.name,
      schoolId: form.schoolId,
      classId: form.classId,
      gender: form.gender || null,
      birthDate: form.birthDate || null,
      parentName: form.parentName || null,
      parentPhone: form.parentPhone || null,
      healthNote: form.healthNote || null,
    }

    const res = editId
      ? await fetch(`/api/students/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) })
      : await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) })

    if (res.ok) { setShowModal(false); loadData() }
    else { const d = await res.json(); setError(d.error || "操作失败") }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该学生？")) return
    const res = await fetch(`/api/students/${id}`, { method: "DELETE", credentials: "include" })
    if (res.ok) { loadData() }
    else { const d = await res.json(); alert(d.error || "删除失败") }
  }

  const filteredClasses = form.schoolId ? classes.filter((c) => c.schoolId === form.schoolId) : []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">学生管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理学生信息和家长联系方式</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
          <Plus className="w-4 h-4" /> 添加学生
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">姓名</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">性别</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">班级</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">学校</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">家长</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">健康备注</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">加载中...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-10 h-10 text-gray-300" />
                  <p className="text-gray-400">暂无学生</p>
                </div>
              </td></tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.gender || "-"}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-primary-light text-primary text-xs rounded-full">{s.class.name}</span></td>
                  <td className="px-4 py-3 text-gray-500">{s.class.school.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.parentName ? `${s.parentName} ${s.parentPhone || ""}` : "-"}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{s.healthNote || "-"}</td>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold mb-4">{editId ? "编辑学生" : "添加学生"}</h2>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">姓名 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="请输入学生姓名" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">所属学校 *</label>
                  <select value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value, classId: "" })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="">请选择</option>
                    {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">班级 *</label>
                  <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="">请选择</option>
                    {filteredClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">性别</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="">未选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">出生日期</label>
                  <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">家长姓名</label>
                  <input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">家长电话</label>
                  <input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">健康备注</label>
                <textarea value={form.healthNote} onChange={(e) => setForm({ ...form, healthNote: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" rows={2} placeholder="过敏史、既往病史等" />
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
