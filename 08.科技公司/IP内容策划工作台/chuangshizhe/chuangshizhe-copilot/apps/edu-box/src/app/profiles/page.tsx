"use client"

import { useState, useEffect } from "react"
import {
  BarChart3, Users, Eye, Sparkles, Loader2, X, Pencil,
  ChevronRight, TrendingUp, AlertCircle, BookOpen, CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  gender: string | null
  class: { name: string; grade: string }
  profile?: {
    academicLevel: string | null
    psychologicalNote: string | null
    behaviorNote: string | null
    strengths: string[]
    weaknesses: string[]
    lastAssessmentAt: string | null
  } | null
  _count: { submissions: number }
}

interface Class {
  id: string
  name: string
  grade: string
}

const levelMap: Record<string, { label: string; color: string; icon: typeof TrendingUp }> = {
  "优": { label: "优", color: "bg-green-50 text-green-600", icon: TrendingUp },
  "良": { label: "良", color: "bg-blue-50 text-blue-600", icon: TrendingUp },
  "中": { label: "中", color: "bg-amber-50 text-amber-600", icon: TrendingUp },
  "待提高": { label: "待提高", color: "bg-red-50 text-red-600", icon: AlertCircle },
}

export default function ProfilesPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [filterClass, setFilterClass] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({})
  const [error, setError] = useState("")

  async function loadData() {
    setLoading(true)
    const [sRes, cRes] = await Promise.all([
      fetch(`/api/profiles${filterClass ? `?classId=${filterClass}` : ""}`, { credentials: "include" }),
      fetch("/api/classes", { credentials: "include" }),
    ])
    if (sRes.ok) { const d = await sRes.json(); setStudents(d.students || []) }
    if (cRes.ok) { const d = await cRes.json(); setClasses(d.classes || []) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [filterClass])

  async function handleAnalyze(studentId: string) {
    setAnalyzing((prev) => ({ ...prev, [studentId]: true }))
    setError("")

    const res = await fetch("/api/profiles/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ studentId }),
    })

    if (res.ok) {
      loadData()
      if (selectedStudent?.id === studentId) {
        const d = await fetch(`/api/profiles/${studentId}`, { credentials: "include" }).then((r) => r.ok ? r.json() : null)
        if (d) setSelectedStudent(d.student)
      }
    } else {
      const d = await res.json()
      setError(d.error || "分析失败")
    }
    setAnalyzing((prev) => ({ ...prev, [studentId]: false }))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">学情档案</h1>
        <p className="text-sm text-gray-500 mt-1">学生学情分析与 AI 智能评估</p>
      </div>

      {error && (
        <div className="mb-4 text-xs text-red-500 bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 items-center">
        <span className="text-xs text-gray-500">班级筛选：</span>
        <button onClick={() => setFilterClass("")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", !filterClass ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
          全部
        </button>
        {classes.map((c) => (
          <button key={c.id} onClick={() => setFilterClass(c.id)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", filterClass === c.id ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
            {c.grade}{c.name}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">暂无学生数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => {
            const levelInfo = levelMap[s.profile?.academicLevel || ""]
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{s.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{s.class.grade}{s.class.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {levelInfo && (
                      <span className={cn("px-2 py-0.5 text-xs rounded-full flex items-center gap-1", levelInfo.color)}>
                        <levelInfo.icon className="w-3 h-3" />
                        {levelInfo.label}
                      </span>
                    )}
                  </div>
                </div>

                {s.profile ? (
                  <div className="space-y-2 text-xs">
                    {s.profile.strengths?.length > 0 && (
                      <div>
                        <span className="text-green-600 font-medium">优势：</span>
                        <span className="text-gray-600">{s.profile.strengths.slice(0, 2).join("、")}</span>
                      </div>
                    )}
                    {s.profile.weaknesses?.length > 0 && (
                      <div>
                        <span className="text-red-500 font-medium">薄弱：</span>
                        <span className="text-gray-600">{s.profile.weaknesses.slice(0, 2).join("、")}</span>
                      </div>
                    )}
                    {s.profile.lastAssessmentAt && (
                      <p className="text-gray-400 mt-1">最近评估 {new Date(s.profile.lastAssessmentAt).toLocaleDateString("zh-CN")}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-3">暂无评估数据</p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    <BookOpen className="w-3 h-3 inline mr-1" />
                    {s._count.submissions} 次作业
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAnalyze(s.id)}
                      disabled={analyzing[s.id]}
                      className="inline-flex items-center gap-1 text-xs text-purple-500 hover:underline disabled:opacity-50"
                    >
                      {analyzing[s.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI 评估
                    </button>
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Eye className="w-3 h-3" /> 详情
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onRefresh={() => loadData()}
        />
      )}
    </div>
  )
}

function StudentDetailModal({
  student,
  onClose,
  onRefresh,
}: {
  student: Student
  onClose: () => void
  onRefresh: () => void
}) {
  const [detail, setDetail] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    academicLevel: "",
    psychologicalNote: "",
    behaviorNote: "",
    strengths: [] as string[],
    weaknesses: [] as string[],
  })
  const [newStrength, setNewStrength] = useState("")
  const [newWeakness, setNewWeakness] = useState("")

  useEffect(() => {
    fetch(`/api/profiles/${student.id}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.student) {
          setDetail(d.student)
          const p = d.student.profile
          setForm({
            academicLevel: p?.academicLevel || "",
            psychologicalNote: p?.psychologicalNote || "",
            behaviorNote: p?.behaviorNote || "",
            strengths: p?.strengths || [],
            weaknesses: p?.weaknesses || [],
          })
        }
        setLoading(false)
      })
  }, [student.id])

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/profiles/${student.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setEditMode(false)
      onRefresh()
      // Re-fetch detail
      const d = await fetch(`/api/profiles/${student.id}`, { credentials: "include" }).then((r) => r.json())
      if (d.student) setDetail(d.student)
    }
    setSaving(false)
  }

  function addStrength() {
    if (!newStrength.trim()) return
    setForm({ ...form, strengths: [...form.strengths, newStrength.trim()] })
    setNewStrength("")
  }

  function addWeakness() {
    if (!newWeakness.trim()) return
    setForm({ ...form, weaknesses: [...form.weaknesses, newWeakness.trim()] })
    setNewWeakness("")
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-bold">{student.name}</h2>
            <p className="text-xs text-gray-500">{student.class.grade}{student.class.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {!editMode && (
              <button onClick={() => setEditMode(true)} className="text-gray-400 hover:text-gray-600"><Pencil className="w-4 h-4" /></button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 overflow-auto flex-1 space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : !detail?.profile && !editMode ? (
            <div className="text-center py-8">
              <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-3">暂无学情档案，试试 AI 评估</p>
            </div>
          ) : (
            <>
              {/* Academic Level */}
              <Section title="学业水平">
                {editMode ? (
                  <div className="flex gap-2">
                    {["优", "良", "中", "待提高"].map((l) => (
                      <button
                        key={l}
                        onClick={() => setForm({ ...form, academicLevel: l })}
                        className={cn("px-3 py-1.5 text-xs rounded-full border transition-colors",
                          form.academicLevel === l ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className={cn("px-3 py-1 text-xs rounded-full", levelMap[detail?.profile?.academicLevel || ""]?.color || "bg-gray-100 text-gray-500")}>
                    {detail?.profile?.academicLevel || "未评估"}
                  </span>
                )}
              </Section>

              {/* Strengths */}
              <Section title="优势/特长">
                {editMode ? (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.strengths.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-green-50 text-green-600 text-xs rounded-full flex items-center gap-1">
                          {s}
                          <button onClick={() => setForm({ ...form, strengths: form.strengths.filter((_, j) => j !== i) })} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={newStrength} onChange={(e) => setNewStrength(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStrength()} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary" placeholder="添加优势..." />
                      <button onClick={addStrength} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs">添加</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detail?.profile?.strengths?.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-green-50 text-green-600 text-xs rounded-full">{s}</span>
                    ))}
                    {(!detail?.profile?.strengths || detail.profile.strengths.length === 0) && <span className="text-xs text-gray-400">暂无</span>}
                  </div>
                )}
              </Section>

              {/* Weaknesses */}
              <Section title="薄弱点">
                {editMode ? (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.weaknesses.map((w, i) => (
                        <span key={i} className="px-3 py-1 bg-red-50 text-red-600 text-xs rounded-full flex items-center gap-1">
                          {w}
                          <button onClick={() => setForm({ ...form, weaknesses: form.weaknesses.filter((_, j) => j !== i) })} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={newWeakness} onChange={(e) => setNewWeakness(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addWeakness()} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary" placeholder="添加薄弱点..." />
                      <button onClick={addWeakness} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs">添加</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detail?.profile?.weaknesses?.map((w, i) => (
                      <span key={i} className="px-3 py-1 bg-red-50 text-red-600 text-xs rounded-full">{w}</span>
                    ))}
                    {(!detail?.profile?.weaknesses || detail.profile.weaknesses.length === 0) && <span className="text-xs text-gray-400">暂无</span>}
                  </div>
                )}
              </Section>

              {/* Psychological Note */}
              <Section title="心理状态">
                {editMode ? (
                  <textarea value={form.psychologicalNote} onChange={(e) => setForm({ ...form, psychologicalNote: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" rows={3} placeholder="心理状态分析..." />
                ) : (
                  <p className="text-sm text-gray-700">{detail?.profile?.psychologicalNote || "暂无分析"}</p>
                )}
              </Section>

              {/* Behavior Note */}
              <Section title="行为表现">
                {editMode ? (
                  <textarea value={form.behaviorNote} onChange={(e) => setForm({ ...form, behaviorNote: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" rows={3} placeholder="行为表现..." />
                ) : (
                  <p className="text-sm text-gray-700">{detail?.profile?.behaviorNote || "暂无记录"}</p>
                )}
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        {editMode && (
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button onClick={() => setEditMode(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">取消</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-primary" />
        {title}
      </h3>
      <div className="pl-3">{children}</div>
    </div>
  )
}
