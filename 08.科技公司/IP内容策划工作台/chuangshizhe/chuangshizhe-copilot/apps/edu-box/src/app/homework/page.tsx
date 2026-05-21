"use client"

import { useState, useEffect } from "react"
import { BookOpen, Plus, Pencil, Trash2, Eye, Sparkles, Loader2, X, Send, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface Submission {
  id: string
  student: { name: string }
  content: Record<string, unknown> | null
  score: number | null
  aiAnalysis: string | null
  teacherNote: string | null
  submittedAt: string
}

interface HomeworkDetail extends Homework {
  submissions?: Submission[]
}

interface Homework {
  id: string
  teacherId: string
  teacher: { name: string }
  classId: string
  class: { name: string; grade: string }
  title: string
  subject: string
  type: string
  content: Record<string, unknown>
  dueDate: string | null
  published: boolean
  createdAt: string
  updatedAt: string
  _count?: { submissions: number }
}

interface Teacher {
  id: string
  name: string
}

interface Class {
  id: string
  name: string
  grade: string
}

const typeMap: Record<string, { label: string; color: string }> = {
  normal: { label: "常规", color: "bg-blue-50 text-blue-600" },
  tiered: { label: "分层", color: "bg-purple-50 text-purple-600" },
  extension: { label: "拓展", color: "bg-amber-50 text-amber-600" },
}

const subjectColor: Record<string, string> = {
  "语文": "bg-red-50 text-red-600",
  "数学": "bg-blue-50 text-blue-600",
  "英语": "bg-green-50 text-green-600",
  "物理": "bg-purple-50 text-purple-600",
  "化学": "bg-amber-50 text-amber-600",
}

export default function HomeworkPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [filterClass, setFilterClass] = useState("")
  const [showModal, setShowModal] = useState<"add" | "ai" | null>(null)
  const [showDetail, setShowDetail] = useState<HomeworkDetail | null>(null)
  const [detailTab, setDetailTab] = useState<"questions" | "submissions">("questions")
  const [submissionGrading, setSubmissionGrading] = useState<Record<string, { score: string; note: string }>>({})
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    teacherId: "",
    classId: "",
    title: "",
    subject: "语文",
    type: "normal",
    dueDate: "",
  })
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function loadData() {
    setLoading(true)
    const [hwRes, tRes, cRes] = await Promise.all([
      fetch(`/api/homework${filterClass ? `?classId=${filterClass}` : ""}`, { credentials: "include" }),
      fetch("/api/teachers", { credentials: "include" }),
      fetch("/api/classes", { credentials: "include" }),
    ])
    if (hwRes.ok) { const d = await hwRes.json(); setHomeworks(d.homeworks || []) }
    if (tRes.ok) { const d = await tRes.json(); setTeachers(d.teachers || []) }
    if (cRes.ok) { const d = await cRes.json(); setClasses(d.classes || []) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [filterClass])

  function openAdd() {
    setEditId(null)
    setForm({ teacherId: teachers[0]?.id || "", classId: "", title: "", subject: "语文", type: "normal", dueDate: "" })
    setError("")
    setShowModal("add")
  }

  function openEdit(hw: Homework) {
    setEditId(hw.id)
    setForm({
      teacherId: hw.teacherId,
      classId: hw.classId,
      title: hw.title,
      subject: hw.subject,
      type: hw.type,
      dueDate: hw.dueDate ? new Date(hw.dueDate).toISOString().split("T")[0] : "",
    })
    setError("")
    setShowModal("add")
  }

  function openAI() {
    setForm({ teacherId: teachers[0]?.id || "", classId: "", title: "", subject: "语文", type: "normal", dueDate: "" })
    setError("")
    setShowModal("ai")
  }

  async function handleGenerate() {
    if (!form.teacherId) { setError("请选择教师"); return }
    if (!form.classId) { setError("请选择班级"); return }
    if (!form.title) { setError("请输入作业标题"); return }
    setGenerating(true)
    setError("")

    const res = await fetch("/api/homework/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const data = await res.json()
      const saveRes = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          teacherId: form.teacherId,
          classId: form.classId,
          title: form.title,
          subject: form.subject,
          type: form.type,
          content: data.content,
          dueDate: form.dueDate || null,
        }),
      })
      if (saveRes.ok) {
        setShowModal(null)
        loadData()
      }
    } else {
      const data = await res.json()
      setError(data.error || "生成失败")
    }
    setGenerating(false)
  }

  async function handleSubmit() {
    if (!form.teacherId) { setError("请选择教师"); return }
    if (!form.classId) { setError("请选择班级"); return }
    if (!form.title) { setError("请输入标题"); return }
    setSubmitting(true)
    setError("")

    const res = editId
      ? await fetch(`/api/homework/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        })
      : await fetch("/api/homework", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...form, content: { title: form.title } }),
        })

    if (res.ok) { setShowModal(null); loadData() }
    else { const d = await res.json(); setError(d.error || "操作失败") }
    setSubmitting(false)
  }

  async function openDetail(hw: Homework) {
    setDetailTab("questions")
    setSubmissionGrading({})
    const res = await fetch(`/api/homework/${hw.id}`, { credentials: "include" })
    if (res.ok) {
      const d = await res.json()
      setShowDetail({ ...hw, ...d.homework })
    } else {
      setShowDetail(hw)
    }
  }

  async function gradeSubmission(submissionId: string) {
    const grade = submissionGrading[submissionId]
    if (!grade) return
    await fetch(`/api/submissions/${submissionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        score: grade.score ? parseFloat(grade.score) : null,
        teacherNote: grade.note || null,
      }),
    })
    // Refresh detail
    if (showDetail) openDetail(showDetail)
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该作业？")) return
    await fetch(`/api/homework/${id}`, { method: "DELETE", credentials: "include" })
    loadData()
  }

  async function togglePublish(hw: Homework) {
    await fetch(`/api/homework/${hw.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ published: !hw.published }),
    })
    loadData()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">作业管理</h1>
          <p className="text-sm text-gray-500 mt-1">AI 生成作业与作业发布管理</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAI} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all">
            <Sparkles className="w-4 h-4" /> AI 生成作业
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
            <Plus className="w-4 h-4" /> 新建作业
          </button>
        </div>
      </div>

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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">标题</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">学科</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">班级</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">类型</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">截止日期</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">提交</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">状态</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">创建时间</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400">加载中...</td></tr>
            ) : homeworks.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <BookOpen className="w-10 h-10 text-gray-300" />
                  <p className="text-gray-400">暂无作业，试试 AI 生成吧</p>
                </div>
              </td></tr>
            ) : (
              homeworks.map((hw) => (
                <tr key={hw.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{hw.title}</td>
                  <td className="px-4 py-3"><span className={cn("px-2 py-0.5 text-xs rounded-full", subjectColor[hw.subject] || "bg-gray-50 text-gray-600")}>{hw.subject}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{hw.class.grade}{hw.class.name}</td>
                  <td className="px-4 py-3"><span className={cn("px-2 py-0.5 text-xs rounded-full", typeMap[hw.type]?.color)}>{typeMap[hw.type]?.label || hw.type}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{hw.dueDate ? new Date(hw.dueDate).toLocaleDateString("zh-CN") : "未设置"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" /> {hw._count?.submissions || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 text-xs rounded-full", hw.published ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500")}>
                      {hw.published ? "已发布" : "草稿"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(hw.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openDetail(hw)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mr-2">
                      <Eye className="w-3.5 h-3.5" /> 查看
                    </button>
                    <button onClick={() => openEdit(hw)} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:underline mr-2">
                      <Pencil className="w-3.5 h-3.5" /> 编辑
                    </button>
                    <button onClick={() => togglePublish(hw)} className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline mr-2">
                      <Send className="w-3.5 h-3.5" /> {hw.published ? "撤回" : "发布"}
                    </button>
                    <button onClick={() => handleDelete(hw.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal === "add" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold mb-4">{editId ? "编辑作业" : "新建作业"}</h2>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">教师 *</label>
                <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">班级 *</label>
                <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">请选择班级</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.grade}{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">标题 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="如：第一单元课后练习" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">学科</label>
                  <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    {["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">类型</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="normal">常规</option>
                    <option value="tiered">分层</option>
                    <option value="extension">拓展</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">截止日期</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">取消</button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50">{submitting ? "保存中..." : "保存"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showModal === "ai" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
          <div className="bg-white rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI 生成作业
              </h2>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <p className="text-xs text-gray-500 mb-4 bg-blue-50 px-3 py-2 rounded-lg">AI 生成作业将消耗 15 积分，生成后自动保存为草稿。</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">教师 *</label>
                <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">班级 *</label>
                <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">请选择班级</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.grade}{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">作业标题 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="如：《草船借箭》课后练习" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">学科</label>
                  <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    {["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">类型</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="normal">常规</option>
                    <option value="tiered">分层</option>
                    <option value="extension">拓展</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">截止日期</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">取消</button>
                <button onClick={handleGenerate} disabled={generating} className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> 生成中...</> : <><Sparkles className="w-4 h-4" /> 开始生成</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-base font-bold">{showDetail.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {showDetail.subject} · {showDetail.class.grade}{showDetail.class.name} · {showDetail.teacher.name} · {typeMap[showDetail.type]?.label}
                  {showDetail.dueDate ? ` · 截止 ${new Date(showDetail.dueDate).toLocaleDateString("zh-CN")}` : ""}
                </p>
              </div>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
              <button
                onClick={() => setDetailTab("questions")}
                className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors", detailTab === "questions" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700")}
              >
                作业题目 ({(showDetail as any).content?.questions?.length || 0} 道)
              </button>
              <button
                onClick={() => setDetailTab("submissions")}
                className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors", detailTab === "submissions" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700")}
              >
                学生提交 ({showDetail.submissions?.length || 0})
              </button>
            </div>

            <div className="p-6 overflow-auto flex-1 space-y-6">
              {detailTab === "questions" && (() => {
                const c = (showDetail as any).content
                if (!c || Object.keys(c).length === 0) return <p className="text-gray-400 text-sm">暂无内容</p>
                return (
                  <>
                    {/* Questions */}
                    {c.questions?.length > 0 && (
                      <div className="space-y-4">
                        {c.questions.map((q: any, i: number) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                              <span className={cn("px-2 py-0.5 text-xs rounded-full", q.difficulty === "基础" ? "bg-green-50 text-green-600" : q.difficulty === "中等" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600")}>
                                {q.difficulty || "未标注"}
                              </span>
                              <span className="text-xs text-gray-400">{q.type}</span>
                            </div>
                            <p className="text-sm text-gray-800 mb-3 ml-8">{q.question}</p>
                            {q.options && (
                              <div className="ml-8 grid grid-cols-2 gap-2 mb-3">
                                {q.options.map((opt: string, oi: number) => (
                                  <span key={oi} className="text-xs text-gray-600 px-3 py-1.5 bg-gray-50 rounded">{opt}</span>
                                ))}
                              </div>
                            )}
                            {q.answer && (
                              <div className="ml-8 flex gap-4 text-xs">
                                <span><span className="text-gray-500">答案：</span><span className="text-green-600 font-medium">{q.answer}</span></span>
                                {q.explanation && <span><span className="text-gray-500">解析：</span><span className="text-gray-600">{q.explanation}</span></span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {c.estimatedTime && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                        <span>预计完成时间：</span>
                        <span className="font-medium text-gray-700">{c.estimatedTime}</span>
                      </div>
                    )}
                    {typeof c === "string" && <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{c}</pre>}
                  </>
                )
              })()}

              {detailTab === "submissions" && (
                <div className="space-y-4">
                  {!showDetail.submissions || showDetail.submissions.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">暂无提交</p>
                  ) : (
                    showDetail.submissions.map((sub) => (
                      <div key={sub.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-medium text-sm">{sub.student.name}</span>
                            <span className="text-xs text-gray-400 ml-3">提交于 {new Date(sub.submittedAt).toLocaleString("zh-CN")}</span>
                          </div>
                          {sub.score != null && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full font-medium">{sub.score} 分</span>
                          )}
                        </div>
                        {sub.content && (
                          <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded mb-3">
                            {typeof sub.content === "string" ? sub.content : JSON.stringify(sub.content).slice(0, 200)}...
                          </div>
                        )}
                        {sub.aiAnalysis && (
                          <div className="text-xs bg-purple-50 text-purple-700 px-3 py-2 rounded mb-2">
                            <span className="font-medium">AI 分析：</span>{sub.aiAnalysis}
                          </div>
                        )}
                        {sub.teacherNote && (
                          <div className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded mb-3">
                            <span className="font-medium">教师评语：</span>{sub.teacherNote}
                          </div>
                        )}
                        {/* Grading form */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="number"
                            placeholder="分数"
                            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                            value={submissionGrading[sub.id]?.score || ""}
                            onChange={(e) => setSubmissionGrading({ ...submissionGrading, [sub.id]: { ...submissionGrading[sub.id] || { note: "" }, score: e.target.value } })}
                          />
                          <input
                            placeholder="教师评语"
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                            value={submissionGrading[sub.id]?.note || sub.teacherNote || ""}
                            onChange={(e) => setSubmissionGrading({ ...submissionGrading, [sub.id]: { ...submissionGrading[sub.id] || { score: "" }, note: e.target.value } })}
                          />
                          <button onClick={() => gradeSubmission(sub.id)} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-hover">保存</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
