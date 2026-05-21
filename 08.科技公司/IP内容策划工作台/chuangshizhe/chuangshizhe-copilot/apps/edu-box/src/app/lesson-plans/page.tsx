"use client"

import { useState, useEffect } from "react"
import { FileText, Plus, Pencil, Trash2, Eye, Sparkles, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface LessonPlan {
  id: string
  teacherId: string
  teacher: { name: string }
  title: string
  subject: string
  grade: string
  unit: string | null
  agent: string
  tokensUsed: number
  status: string
  createdAt: string
  updatedAt: string
}

interface Teacher {
  id: string
  name: string
}

const subjects = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治", "音乐", "美术", "体育", "信息技术"]
const grades = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "七年级", "八年级", "九年级", "高一", "高二", "高三"]
interface LessonPlanDetail extends LessonPlan {
  objectives?: { knowledge?: string[]; ability?: string[]; emotion?: string[] }
  keyPoints?: string
  difficultPoints?: string
  methods?: string[]
  tools?: string[]
  process?: { step: string; time: string; teacherActivity: string; studentActivity: string; designIntent: string }[]
  boardDesign?: string
  reflection?: string
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-600" },
  published: { label: "已发布", color: "bg-green-50 text-green-600" },
  archived: { label: "已归档", color: "bg-orange-50 text-orange-600" },
}
const agentMap: Record<string, string> = {
  jiangxin: "匠心",
  wenqu: "问渠",
  mingjian: "明鉴",
  mingxin: "明心",
}

export default function LessonPlansPage() {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("")
  const [showModal, setShowModal] = useState<"add" | "ai" | null>(null)
  const [showDetail, setShowDetail] = useState<LessonPlanDetail | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    teacherId: "",
    title: "",
    subject: "语文",
    grade: "七年级",
    unit: "",
    agent: "jiangxin",
  })
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function loadData() {
    setLoading(true)
    const [lpRes, tRes] = await Promise.all([
      fetch(`/api/lesson-plans${filterStatus ? `?status=${filterStatus}` : ""}`, { credentials: "include" }),
      fetch("/api/teachers", { credentials: "include" }),
    ])
    if (lpRes.ok) { const d = await lpRes.json(); setLessonPlans(d.lessonPlans || []) }
    if (tRes.ok) { const d = await tRes.json(); setTeachers(d.teachers || []) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [filterStatus])

  function openAdd() {
    setEditId(null)
    setForm({ teacherId: teachers[0]?.id || "", title: "", subject: "语文", grade: "七年级", unit: "", agent: "jiangxin" })
    setError("")
    setShowModal("add")
  }

  function openEdit(lp: LessonPlan) {
    setEditId(lp.id)
    setForm({
      teacherId: lp.teacherId,
      title: lp.title,
      subject: lp.subject,
      grade: lp.grade,
      unit: lp.unit || "",
      agent: lp.agent,
    })
    setError("")
    setShowModal("add")
  }

  function openAI() {
    setForm({ teacherId: teachers[0]?.id || "", title: "", subject: "语文", grade: "七年级", unit: "", agent: "jiangxin" })
    setError("")
    setShowModal("ai")
  }

  async function handleGenerate() {
    if (!form.teacherId) { setError("请选择教师"); return }
    if (!form.title) { setError("请输入教案标题"); return }
    setGenerating(true)
    setError("")

    const res = await fetch("/api/lesson-plans/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const data = await res.json()
      // Auto-save generated lesson plan
      const saveRes = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          teacherId: form.teacherId,
          title: form.title,
          subject: form.subject,
          grade: form.grade,
          unit: form.unit || null,
          content: data.content,
          objectives: data.content.objectives,
          agent: form.agent,
          tokensUsed: data.tokensUsed,
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
    if (!form.title) { setError("请输入标题"); return }
    setSubmitting(true)
    setError("")

    const res = editId
      ? await fetch(`/api/lesson-plans/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        })
      : await fetch("/api/lesson-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...form, content: { title: form.title } }),
        })

    if (res.ok) { setShowModal(null); loadData() }
    else { const d = await res.json(); setError(d.error || "操作失败") }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("确认删除该教案？")) return
    await fetch(`/api/lesson-plans/${id}`, { method: "DELETE", credentials: "include" })
    loadData()
  }

  async function openDetail(lp: LessonPlan) {
    const res = await fetch(`/api/lesson-plans/${lp.id}`, { credentials: "include" })
    if (res.ok) {
      const d = await res.json()
      setShowDetail({ ...lp, ...d.lessonPlan })
    } else {
      setShowDetail(lp)
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/lesson-plans/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    })
    loadData()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">教案管理</h1>
          <p className="text-sm text-gray-500 mt-1">AI 生成教案与教案管理</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAI} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all">
            <Sparkles className="w-4 h-4" /> AI 生成教案
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
            <Plus className="w-4 h-4" /> 新建教案
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilterStatus("")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", !filterStatus ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
          全部
        </button>
        {Object.entries(statusMap).map(([key, val]) => (
          <button key={key} onClick={() => setFilterStatus(key)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", filterStatus === key ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
            {val.label}
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
              <th className="text-left px-4 py-3 font-medium text-gray-500">年级</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">教师</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">智能体</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">状态</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">创建时间</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">加载中...</td></tr>
            ) : lessonPlans.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-10 h-10 text-gray-300" />
                  <p className="text-gray-400">暂无教案，试试 AI 生成吧</p>
                </div>
              </td></tr>
            ) : (
              lessonPlans.map((lp) => (
                <tr key={lp.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{lp.title}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{lp.subject}</span></td>
                  <td className="px-4 py-3 text-gray-500">{lp.grade}</td>
                  <td className="px-4 py-3 text-gray-500">{lp.teacher.name}</td>
                  <td className="px-4 py-3 text-gray-500">{agentMap[lp.agent] || lp.agent}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 text-xs rounded-full", statusMap[lp.status]?.color)}>
                      {statusMap[lp.status]?.label || lp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(lp.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openDetail(lp)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mr-2">
                      <Eye className="w-3.5 h-3.5" /> 查看
                    </button>
                    <button onClick={() => openEdit(lp)} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:underline mr-2">
                      <Pencil className="w-3.5 h-3.5" /> 编辑
                    </button>
                    {lp.status === "draft" && (
                      <button onClick={() => updateStatus(lp.id, "published")} className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline mr-2">
                        发布
                      </button>
                    )}
                    {lp.status === "published" && (
                      <button onClick={() => updateStatus(lp.id, "draft")} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:underline mr-2">
                        撤回
                      </button>
                    )}
                    <button onClick={() => handleDelete(lp.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline">
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
            <h2 className="text-base font-bold mb-4">{editId ? "编辑教案" : "新建教案"}</h2>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">教师 *</label>
                <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">标题 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="请输入教案标题" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">学科</label>
                  <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">年级</label>
                  <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">章节/单元</label>
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="可选" />
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
                AI 生成教案
              </h2>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <p className="text-xs text-gray-500 mb-4 bg-blue-50 px-3 py-2 rounded-lg">AI 生成教案将消耗 20 积分，生成后自动保存为草稿。</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">教师 *</label>
                <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">教案标题 *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="如：《草船借箭》教学设计" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">学科</label>
                  <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">年级</label>
                  <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">智能体</label>
                  <select value={form.agent} onChange={(e) => setForm({ ...form, agent: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    {Object.entries(agentMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">章节/单元（可选）</label>
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
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
                  {showDetail.subject} · {showDetail.grade} · {showDetail.teacher.name} · {agentMap[showDetail.agent]}
                  {showDetail.unit ? ` · ${showDetail.unit}` : ""}
                </p>
              </div>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-auto flex-1 space-y-6">
              {(() => {
                const c = (showDetail as any).content
                if (!c || Object.keys(c).length === 0) return <p className="text-gray-400 text-sm">暂无内容</p>
                return (
                  <>
                    {/* Objectives */}
                    {c.objectives && (
                      <Section title="教学目标">
                        {c.objectives.knowledge?.length > 0 && <SubSection title="知识目标" items={c.objectives.knowledge} />}
                        {c.objectives.ability?.length > 0 && <SubSection title="能力目标" items={c.objectives.ability} />}
                        {c.objectives.emotion?.length > 0 && <SubSection title="情感目标" items={c.objectives.emotion} />}
                      </Section>
                    )}
                    {/* Key/Difficult Points */}
                    {(c.keyPoints || c.difficultPoints) && (
                      <Section title="重难点">
                        {c.keyPoints && <Field label="重点" value={c.keyPoints} />}
                        {c.difficultPoints && <Field label="难点" value={c.difficultPoints} />}
                      </Section>
                    )}
                    {/* Methods */}
                    {c.methods?.length > 0 && (
                      <Section title="教学方法">
                        <div className="flex flex-wrap gap-2">{c.methods.map((m: string, i: number) => <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full">{m}</span>)}</div>
                      </Section>
                    )}
                    {/* Tools */}
                    {c.tools?.length > 0 && (
                      <Section title="教具准备">
                        <div className="flex flex-wrap gap-2">{c.tools.map((t: string, i: number) => <span key={i} className="px-3 py-1 bg-amber-50 text-amber-600 text-xs rounded-full">{t}</span>)}</div>
                      </Section>
                    )}
                    {/* Process */}
                    {c.process?.length > 0 && (
                      <Section title="教学过程">
                        <div className="space-y-4">
                          {c.process.map((step: any, i: number) => (
                            <div key={i} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                <span className="font-medium text-sm">{step.step}</span>
                                <span className="text-xs text-gray-400 ml-auto">{step.time}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="font-medium text-gray-500">教师活动</span>
                                  <p className="text-gray-700 mt-0.5">{step.teacherActivity}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">学生活动</span>
                                  <p className="text-gray-700 mt-0.5">{step.studentActivity}</p>
                                </div>
                              </div>
                              {step.designIntent && (
                                <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                                  <span className="font-medium text-gray-500">设计意图：</span>
                                  <span className="text-gray-600">{step.designIntent}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                    {/* Board Design */}
                    {c.boardDesign && <Section title="板书设计"><p className="text-sm text-gray-700">{c.boardDesign}</p></Section>}
                    {/* Reflection */}
                    {c.reflection && <Section title="教学反思"><p className="text-sm text-gray-700">{c.reflection}</p></Section>}
                    {/* Fallback for raw/unknown structure */}
                    {typeof c === "string" && <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{c}</pre>}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
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

function SubSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-2">
      <span className="text-xs font-medium text-gray-500">{title}</span>
      <ul className="mt-1 space-y-1">
        {items.map((item, i) => <li key={i} className="text-sm text-gray-700 before:content-['·'] before:text-primary before:mr-1">{item}</li>)}
      </ul>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1">
      <span className="text-xs font-medium text-gray-500">{label}：</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  )
}
