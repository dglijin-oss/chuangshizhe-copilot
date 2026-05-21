"use client"

import { useState, useEffect } from "react"
import { School, Plus, Pencil, Trash2 } from "lucide-react"

interface ClassItem {
  id: string
  name: string
  grade: string
  schoolId: string
  school: { name: string }
  teacherId: string | null
  studentCount: number
  createdAt: string
}

interface School {
  id: string
  name: string
}

interface Teacher {
  id: string
  name: string
}

const grades = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "七年级", "八年级", "九年级", "高一", "高二", "高三"]

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    schoolId: "",
    grade: "一年级",
    teacherId: "",
    studentCount: 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function loadData() {
    setLoading(true)
    const [cRes, sRes, tRes] = await Promise.all([
      fetch("/api/classes", { credentials: "include" }),
      fetch("/api/schools", { credentials: "include" }),
      fetch("/api/teachers", { credentials: "include" }),
    ])
    if (cRes.ok) { const d = await cRes.json(); setClasses(d.classes || []) }
    if (sRes.ok) { const d = await sRes.json(); setSchools(d.schools || []) }
    if (tRes.ok) { const d = await tRes.json(); setTeachers(d.teachers || []) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function openAdd() {
    setEditId(null)
    setForm({ name: "", schoolId: schools[0]?.id || "", grade: "一年级", teacherId: "", studentCount: 0 })
    setError("")
    setShowModal(true)
  }

  function openEdit(c: ClassItem) {
    setEditId(c.id)
    setForm({
      name: c.name,
      schoolId: c.schoolId,
      grade: c.grade,
      teacherId: c.teacherId || "",
      studentCount: c.studentCount,
    })
    setError("")
    setShowModal(true)
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError("班级名称不能为空"); return }
    if (!form.schoolId) { setError("请选择学校"); return }
    setSubmitting(true)
    setError("")

    const body = {
      name: form.name,
      schoolId: form.schoolId,
      grade: form.grade,
      teacherId: form.teacherId || null,
      studentCount: form.studentCount,
    }

    const res = editId
      ? await fetch(`/api/classes/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        })
      : await fetch("/api/classes", {
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
    if (!confirm("确认删除该班级？请先删除关联的学生")) return
    const res = await fetch(`/api/classes/${id}`, { method: "DELETE", credentials: "include" })
    if (res.ok) { loadData() }
    else { const d = await res.json(); alert(d.error || "删除失败") }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">班级管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理各学校的班级信息</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
          <Plus className="w-4 h-4" /> 添加班级
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">班级名称</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">年级</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">学校</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">班主任</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">学生数</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">加载中...</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <School className="w-10 h-10 text-gray-300" />
                  <p className="text-gray-400">暂无班级</p>
                </div>
              </td></tr>
            ) : (
              classes.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-primary-light text-primary text-xs rounded-full">{c.grade}</span></td>
                  <td className="px-4 py-3 text-gray-500">{c.school.name}</td>
                  <td className="px-4 py-3 text-gray-500">{teachers.find((t) => t.id === c.teacherId)?.name || "-"}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{c.studentCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(c)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mr-3">
                      <Pencil className="w-3.5 h-3.5" /> 编辑
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline">
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
            <h2 className="text-base font-bold mb-4">{editId ? "编辑班级" : "添加班级"}</h2>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">班级名称 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="如：2024级3班" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">所属学校 *</label>
                <select value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">请选择学校</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">年级 *</label>
                  <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">学生数</label>
                  <input type="number" value={form.studentCount} onChange={(e) => setForm({ ...form, studentCount: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">班主任</label>
                <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">无</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
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
