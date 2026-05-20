"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const founderTraits = ["说话直", "懂门店经营", "会算账", "有江湖气", "重视老客户", "对品质较真", "返乡创业", "不爱讲空话"]
const industries = ["餐饮", "家装建材", "本地生活服务", "美业", "教育培训", "农产品", "实体零售", "企业服务"]
const products = ["到店消费", "套餐团购", "会员卡", "加盟咨询", "私域服务", "定制方案", "本地配送", "课程培训"]
const targetClients = ["本地老板", "同城消费者", "想开店的人", "家庭决策者", "年轻上班族", "宝妈群体", "企业客户", "老客户复购"]
const accountGoals = ["涨同城精准粉", "建立创始人人设", "引导私域咨询", "提升门店到店", "解释产品价值", "招加盟/代理", "提高信任感"]
const contentBans = ["不要专家腔", "不要硬广", "不要过度承诺", "不要全国通用模板", "不要太油腻", "不要攻击同行", "不要虚假案例"]

const memoryCategories = [
  { key: "fact_correction", label: "事实纠错" },
  { key: "writing_preference", label: "写作偏好" },
  { key: "expression_restriction", label: "表达禁区" },
  { key: "customer_insight", label: "客户洞察" },
]

export default function IpProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const ipId = params.id
  const fileInputRef = useRef<HTMLInputElement>(null)

  // IP Form state
  const [form, setForm] = useState({
    name: "", founderName: "", founderTraits: [] as string[], industry: "",
    products: [] as string[], targetClients: [] as string[], accountGoals: [] as string[],
    contentBan: [] as string[], contentMixFlow: "4", contentMixPersona: "2", contentMixProduct: "1",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  // Weekly plans
  const [weeklyPlans, setWeeklyPlans] = useState<any[]>([])
  const [plansLoading, setPlansLoading] = useState(false)

  // Account memory
  const [memories, setMemories] = useState<any[]>([])
  const [activeMemoryCategory, setActiveMemoryCategory] = useState("fact_correction")
  const [memoryInput, setMemoryInput] = useState("")
  const [savingMemory, setSavingMemory] = useState(false)
  const [memorySaving, setMemorySaving] = useState(false)

  // Corpus feed
  const [corpusContent, setCorpusContent] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeResult, setAnalyzeResult] = useState<any>(null)
  const [adoptedIndices, setAdoptedIndices] = useState<Set<number>>(new Set())
  const [savingAll, setSavingAll] = useState(false)
  const [toast, setToast] = useState("")
  const memorySectionRef = useRef<HTMLDivElement>(null)

  // Memory editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  // ========== IP Form ==========
  const toggleTag = (key: keyof typeof form, value: string) => {
    const current = form[key] as string[]
    setForm((prev) => ({
      ...prev,
      [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    }))
  }

  const syncTextareaToArray = (key: keyof typeof form, text: string) => {
    const items = text
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    setForm((prev) => ({ ...prev, [key]: items }))
  }

  const loadIp = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ip/${ipId}`, { credentials: "include" })
      const data = await res.json()
      if (data.ip) {
        const ip = data.ip
        setForm({
          name: ip.name || "",
          founderName: ip.founderName || "",
          founderTraits: Array.isArray(ip.founderTraits) ? ip.founderTraits : (ip.founderTraits || "").split(",").filter(Boolean),
          industry: ip.industry || "",
          products: Array.isArray(ip.products) ? ip.products : (ip.products || "").split(",").filter(Boolean),
          targetClients: Array.isArray(ip.targetClients) ? ip.targetClients : (ip.targetClients || "").split(",").filter(Boolean),
          accountGoals: Array.isArray(ip.accountGoals) ? ip.accountGoals : (ip.accountGoals || "").split(",").filter(Boolean),
          contentBan: Array.isArray(ip.contentBan) ? ip.contentBan : (ip.contentBan || "").split(",").filter(Boolean),
          contentMixFlow: String(ip.contentMixFlow || 4),
          contentMixPersona: String(ip.contentMixPersona || 2),
          contentMixProduct: String(ip.contentMixProduct || 1),
        })
      }
    } catch {
      setError("加载失败")
    } finally {
      setLoading(false)
    }
  }, [ipId])

  const loadWeeklyPlans = useCallback(async () => {
    setPlansLoading(true)
    try {
      const res = await fetch(`/api/ip/${ipId}/weekly-plans`, { credentials: "include" })
      const data = await res.json()
      if (data.plans) setWeeklyPlans(data.plans)
    } catch { /* ignore */ }
    setPlansLoading(false)
  }, [ipId])

  const loadMemories = useCallback(async () => {
    try {
      const res = await fetch(`/api/account-memory?ipId=${ipId}`, { credentials: "include" })
      const data = await res.json()
      if (data.memories) setMemories(data.memories)
    } catch { /* ignore */ }
  }, [ipId])

  useEffect(() => {
    loadIp()
    loadWeeklyPlans()
    loadMemories()
  }, [loadIp, loadWeeklyPlans, loadMemories])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/ip/${ipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "保存失败"); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteIp = async () => {
    if (!confirm(`确定删除 IP「${form.name}」？此 IP 的所有周策划、发布包、知识库内容将一并删除，不可恢复。`)) return
    try {
      const res = await fetch(`/api/ip/${ipId}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.ok) {
        router.push("/ip/manage")
      } else {
        const data = await res.json()
        alert(data.error || "删除失败")
      }
    } catch {
      alert("网络错误，请稍后重试")
    }
  }

  const handleSaveToKnowledge = async () => {
    setSaving(true)
    const ipName = form.name
    const parts = [
      `# ${ipName}`,
      ``,
      `## 基础信息`,
      `- **创始人**: ${form.founderName || "未填写"}`,
      `- **人设特点**: ${form.founderTraits.join("、") || "未填写"}`,
      `- **行业**: ${form.industry || "未填写"}`,
      `- **产品/服务**: ${form.products.join("、") || "未填写"}`,
      `- **目标客户**: ${form.targetClients.join("、") || "未填写"}`,
      `- **账号目标**: ${form.accountGoals.join("、") || "未填写"}`,
      `- **内容禁区**: ${form.contentBan.join("、") || "无"}`,
      ``,
      `## 内容配比`,
      `流量型:${form.contentMixFlow} : 人设型:${form.contentMixPersona} : 产品型:${form.contentMixProduct}`,
    ].join("\n")
    try {
      await fetch("/api/account-knowledge/wiki-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[IP档案] ${ipName}`,
          content: parts,
          category: "ip_subpage",
          ipId,
        }),
        credentials: "include",
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* ignore */ }
    setSaving(false)
  }

  // ========== Account Memory ==========
  const handleAddMemory = async () => {
    if (!memoryInput.trim()) return
    setSavingMemory(true)
    try {
      const res = await fetch("/api/account-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ipId,
          category: activeMemoryCategory,
          content: memoryInput.trim(),
        }),
        credentials: "include",
      })
      if (res.ok) {
        setMemoryInput("")
        loadMemories()
        showToast("已添加到记忆库")
      }
    } catch { /* ignore */ }
    setSavingMemory(false)
  }

  const handleDeleteMemory = async (id: string) => {
    try {
      await fetch(`/api/account-memory?id=${id}`, { method: "DELETE", credentials: "include" })
      if (editingId === id) { setEditingId(null); setEditContent("") }
      loadMemories()
      showToast("已删除")
    } catch { /* ignore */ }
  }

  const handleEditMemory = (m: any) => {
    setEditingId(m.id)
    setEditContent(m.content)
    setEditCategory(m.category)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent("")
    setEditCategory("")
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !editingId) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/account-memory?id=${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim(), category: editCategory }),
        credentials: "include",
      })
      if (res.ok) {
        setEditingId(null)
        setEditContent("")
        setEditCategory("")
        loadMemories()
        showToast("已更新")
      }
    } catch { /* ignore */ }
    setSavingEdit(false)
  }

  // ========== Corpus Feed ==========
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setAnalyzing(true)
    try {
      const formData = new FormData()
      for (const file of files) formData.append("files", file)

      const res = await fetch(`/api/corpus-feed/upload?ipId=${ipId}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "上传失败")
        setAnalyzing(false)
        e.target.value = ""
        return
      }

      for (const f of data.files || []) {
        if (f.error) {
          alert(`${f.fileName}: ${f.error}`)
        } else {
          setCorpusContent((prev) => prev + (prev ? "\n\n" : "") + `--- ${f.fileName} ---\n${f.text}`)
        }
      }
    } catch {
      alert("上传失败，请重试")
    }
    setAnalyzing(false)
    e.target.value = ""
  }

  const handleAnalyze = async () => {
    if (!corpusContent.trim()) return
    setAnalyzing(true)
    try {
      const res = await fetch("/api/corpus-feed/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: corpusContent.trim() }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.result) setAnalyzeResult(data.result)
    } catch { /* ignore */ }
    setAnalyzing(false)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  const scrollToMemory = () => {
    memorySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleSaveSuggestion = async (category: string, content: string, index: number) => {
    try {
      const res = await fetch("/api/account-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipId, category, content }),
        credentials: "include",
      })
      if (!res.ok) {
        const data = await res.json()
        showToast(`保存失败：${data.error}`)
        return
      }
      setAdoptedIndices((prev) => new Set(prev).add(index))
      setActiveMemoryCategory(category)
      loadMemories()
      scrollToMemory()
      showToast("已保存到账号记忆库")
    } catch (err) {
      showToast("网络错误，请重试")
    }
  }

  const handleAdoptAll = async () => {
    if (!analyzeResult?.suggestions?.length) return
    setSavingAll(true)
    let successCount = 0
    let failCount = 0
    const categories = new Set<string>()
    for (let i = 0; i < analyzeResult.suggestions.length; i++) {
      const s = analyzeResult.suggestions[i]
      try {
        const res = await fetch("/api/account-memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ipId, category: s.category, content: s.content }),
          credentials: "include",
        })
        if (res.ok) {
          successCount++
          categories.add(s.category)
          setAdoptedIndices((prev) => new Set(prev).add(i))
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }
    if (categories.size > 0) {
      setActiveMemoryCategory(Array.from(categories)[0])
    }
    loadMemories()
    setSavingAll(false)
    if (successCount > 0) {
      scrollToMemory()
      showToast(`已采纳 ${successCount} 条到账号记忆库${failCount > 0 ? `，${failCount} 条失败` : ""}`)
    } else if (failCount > 0) {
      showToast(`${failCount} 条全部保存失败`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-subtle flex items-center justify-center">
        <div className="text-sm text-gray-400">加载中...</div>
      </div>
    )
  }

  const filteredMemories = memories.filter((m) => m.category === activeMemoryCategory)

  return (
    <div className="min-h-screen bg-background-subtle">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-xs text-muted hover:text-primary transition-colors">← 返回</button>
            <span className="text-xs text-gray-400">创世者Copilot 工作台</span>
            <span className="text-sm md:text-base font-bold">{form.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/ip/${ipId}/weekly-plan`)}
              className="text-xs text-muted hover:text-primary transition-colors"
            >
              周策划
            </button>
            <button
              onClick={() => router.push("/")}
              className="text-xs text-muted hover:text-primary transition-colors"
            >
              工作台
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              {saving ? "保存中…" : saved ? "已保存" : "保存修改"}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        {toast && (
          <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-lg text-sm shadow-lg z-50 animate-fade-in">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <span className="text-xs text-primary font-medium tracking-wider">IP PROFILE</span>
          <h1 className="text-base md:text-lg font-bold mt-2">管理这个 IP 的人设档案。</h1>
          <p className="text-xs text-gray-400 mt-1">所有周策划和发布包都会基于这里的信息生成，修改后新内容会自动应用新人设。</p>
        </div>

        {/* ===== Content Mix ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <span className="text-xs text-primary font-medium tracking-wider">CONTENT MIX</span>
          <h2 className="text-sm font-bold mt-1">默认每周内容配比</h2>
          <p className="text-xs text-gray-400 mt-1">{form.contentMixFlow}:{form.contentMixPersona}:{form.contentMixProduct}</p>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-xs text-muted">流量型</label>
              <input
                type="number"
                min="0"
                value={form.contentMixFlow}
                onChange={(e) => setForm({ ...form, contentMixFlow: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted">人设型</label>
              <input
                type="number"
                min="0"
                value={form.contentMixPersona}
                onChange={(e) => setForm({ ...form, contentMixPersona: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted">产品型</label>
              <input
                type="number"
                min="0"
                value={form.contentMixProduct}
                onChange={(e) => setForm({ ...form, contentMixProduct: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              {saving ? "保存中…" : saved ? "已保存" : "保存修改"}
            </button>
            <button
              onClick={handleSaveToKnowledge}
              disabled={saving}
              className={cn(
                "border border-gray-200 text-muted px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              保存知识库
            </button>
            <button
              onClick={() => router.push(`/ip/${ipId}/weekly-plan`)}
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              生成本周选题池 →
            </button>
          </div>
        </div>

        {/* ===== Knowledge Base ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <span className="text-xs text-primary font-medium tracking-wider">KNOWLEDGE BASE</span>
          <h2 className="text-sm font-bold mt-1">这个 IP 的底层资料。</h2>

          <div className="mt-4 space-y-6">
            <div>
              <label className="text-xs font-medium text-muted">IP 名称 <span className="text-[#ef4444]">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">创始人姓名</label>
              <input
                type="text"
                value={form.founderName}
                onChange={(e) => setForm({ ...form, founderName: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">创始人人设特点</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {founderTraits.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag("founderTraits", t)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                      form.founderTraits.includes(t)
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 text-muted hover:border-primary"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                value={form.founderTraits.join("，")}
                onChange={(e) => syncTextareaToArray("founderTraits", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 h-16 resize-none focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">行业</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {industries.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, industry: form.industry === t ? "" : t })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                      form.industry === t
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 text-muted hover:border-primary"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={form.industry && !industries.includes(form.industry) ? form.industry : ""}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">产品 / 服务</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {products.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag("products", t)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                      form.products.includes(t)
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 text-muted hover:border-primary"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                value={form.products.join("，")}
                onChange={(e) => syncTextareaToArray("products", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 h-16 resize-none focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">目标客户</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {targetClients.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag("targetClients", t)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                      form.targetClients.includes(t)
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 text-muted hover:border-primary"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                value={form.targetClients.join("，")}
                onChange={(e) => syncTextareaToArray("targetClients", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 h-16 resize-none focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">账号目标</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {accountGoals.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag("accountGoals", t)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                      form.accountGoals.includes(t)
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 text-muted hover:border-primary"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                value={form.accountGoals.join("，")}
                onChange={(e) => syncTextareaToArray("accountGoals", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 h-16 resize-none focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">内容禁区</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {contentBans.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag("contentBan", t)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                      form.contentBan.includes(t)
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 text-muted hover:border-primary"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                value={form.contentBan.join("，")}
                onChange={(e) => syncTextareaToArray("contentBan", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 h-16 resize-none focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* ===== Account Memory ===== */}
        <div ref={memorySectionRef} className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <span className="text-xs text-primary font-medium tracking-wider">ACCOUNT MEMORY</span>
          <h2 className="text-sm font-bold mt-1">账号记忆库</h2>
          <p className="text-xs text-gray-400 mt-1">{memories.length} 条</p>
          <p className="text-xs text-muted mt-2 leading-relaxed">
            每次你发现 AI 写错、写偏、或者有新的偏好，都可以沉淀成一条记忆。后续周策划和单条发布包都会参考它。
          </p>

          {/* Category Tabs */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {memoryCategories.map((cat) => {
              const count = memories.filter((m) => m.category === cat.key).length
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveMemoryCategory(cat.key)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-medium transition-colors",
                    activeMemoryCategory === cat.key
                      ? "bg-primary text-white"
                      : "border border-gray-200 text-muted hover:border-primary"
                  )}
                >
                  {cat.label} {count > 0 && `(${count})`}
                </button>
              )
            })}
          </div>

          {/* Memory Input */}
          <div className="mt-4">
            <textarea
              value={memoryInput}
              onChange={(e) => setMemoryInput(e.target.value)}
              placeholder="比如：不要把创始人写成加盟商；发布文案要更像老板本人说话；不要虚构门店数量。"
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleAddMemory}
              disabled={savingMemory || !memoryInput.trim()}
              className={cn(
                "mt-3 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors",
                (savingMemory || !memoryInput.trim()) && "opacity-50 cursor-not-allowed"
              )}
            >
              {savingMemory ? "保存中…" : "加入账号记忆库"}
            </button>
          </div>

          {/* Memory List */}
          <div className="mt-4 space-y-2">
            {filteredMemories.length === 0 && (
              <div className="bg-gray-50 rounded-lg px-4 py-6 text-center">
                <p className="text-xs text-gray-400">当前分类暂无记忆</p>
                <p className="text-xs text-gray-400 mt-1">投喂语料分析后采纳，或手动添加记忆</p>
              </div>
            )}
            {filteredMemories.map((m) => {
              const isEditing = editingId === m.id
              const catLabel = memoryCategories.find((c) => c.key === m.category)?.label || m.category
              if (isEditing) {
                return (
                  <div key={m.id} className="bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded">{catLabel}</span>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-0.5 focus:outline-none"
                      >
                        {memoryCategories.map((cat) => (
                          <option key={cat.key} value={cat.key}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={savingEdit || !editContent.trim()}
                        className={cn(
                          "bg-primary hover:bg-primary-hover text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                          (savingEdit || !editContent.trim()) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {savingEdit ? "保存中…" : "保存"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="border border-gray-200 text-muted px-3 py-1 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )
              }
              return (
                <div key={m.id} className="flex items-start justify-between bg-gray-50 rounded-lg px-4 py-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded flex-shrink-0">{catLabel}</span>
                      <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString("zh-CN")}</span>
                    </div>
                    <p className="text-sm text-body">{m.content}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-3 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditMemory(m)}
                      className="text-xs text-gray-400 hover:text-primary transition-colors px-2 py-1"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ===== Corpus Feed ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <span className="text-xs text-primary font-medium tracking-wider">CORPUS FEED</span>
          <h2 className="text-sm font-bold mt-1">投喂历史语料</h2>
          <p className="text-xs text-gray-400 mt-1">支持批量上传</p>
          <p className="text-xs text-muted mt-2 leading-relaxed">
            上传这个 IP 以前拍过的脚本、访谈、账号资料，AI 会先分析哪些信息值得进入知识库。你确认后才会保存。
          </p>

          <div className="mt-4">
            <div
              onClick={handleFileSelect}
              className="border-2 border-dashed border-gray-200 rounded-lg p-4 md:p-8 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <p className="text-sm md:text-base font-medium">选择一个或多个历史脚本/资料文件</p>
              <p className="text-xs text-gray-400 mt-1">支持 .txt、.md、.docx、.pdf、.pptx</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.docx,.pdf,.pptx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <textarea
              value={corpusContent}
              onChange={(e) => setCorpusContent(e.target.value)}
              placeholder="也可以直接把历史脚本、账号介绍、访谈内容粘贴到这里。"
              rows={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-3 resize-none focus:outline-none focus:border-primary"
            />

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !corpusContent.trim()}
              className={cn(
                "mt-3 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                (analyzing || !corpusContent.trim()) && "opacity-50 cursor-not-allowed"
              )}
            >
              {analyzing ? "分析中…" : "分析并提炼知识库建议"}
            </button>
          </div>

          {/* Analysis Result */}
          {analyzeResult && (
            <div className="mt-6 space-y-4">
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-primary font-medium mb-1">分析摘要</p>
                <p className="text-sm text-body">{analyzeResult.summary}</p>
              </div>

              {analyzeResult.suggestions && analyzeResult.suggestions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-primary font-medium">提炼建议</p>
                    <button
                      onClick={handleAdoptAll}
                      disabled={savingAll}
                      className={cn(
                        "bg-primary hover:bg-primary-hover text-white text-xs px-3 py-1.5 rounded-lg transition-colors",
                        savingAll && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {savingAll ? "采纳中…" : "全部采纳并保存到知识库"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {analyzeResult.suggestions.map((s: any, i: number) => {
                      const catLabel = memoryCategories.find((c) => c.key === s.category)?.label || s.category
                      const adopted = adoptedIndices.has(i)
                      return (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded">{catLabel}</span>
                            <p className="text-sm text-body">{s.content}</p>
                          </div>
                          {!adopted ? (
                            <button
                              onClick={() => handleSaveSuggestion(s.category, s.content, i)}
                              className="bg-primary hover:bg-primary-hover text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                            >
                              采纳
                            </button>
                          ) : (
                            <span className="bg-green-50 text-green-600 text-xs px-3 py-1.5 rounded-lg flex-shrink-0">已采纳</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {analyzeResult && analyzeResult.keyInsights && analyzeResult.keyInsights.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400">{analyzeResult.keyInsights.join(" · ")}</p>
            </div>
          )}
        </div>

        {/* ===== Weekly Plan History ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-primary font-medium tracking-wider">WEEKLY PLANS</span>
              <h2 className="text-sm font-bold mt-1">已生成的周策划</h2>
            </div>
            <button
              onClick={() => router.push(`/ip/${ipId}/weekly-plan`)}
              className="text-xs text-muted hover:text-primary transition-colors"
            >
              生成新策划 →
            </button>
          </div>

          {plansLoading ? (
            <p className="text-xs text-gray-400 mt-4">加载中...</p>
          ) : weeklyPlans.length === 0 ? (
            <p className="text-xs text-gray-400 mt-4">还没有生成过周策划</p>
          ) : (
            <div className="mt-4 space-y-3">
              {weeklyPlans.map((plan) => {
                const weekStart = new Date(plan.weekStart)
                const weekEnd = new Date(plan.weekEnd)
                const itemCounts = { traffic: 0, persona: 0, product: 0 }
                plan.items?.forEach((item: any) => {
                  if (item.contentType in itemCounts) itemCounts[item.contentType as keyof typeof itemCounts]++
                })
                return (
                  <div key={plan.id} className="border border-gray-200 rounded-lg px-4 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium">
                          {weekStart.getMonth() + 1}月{weekStart.getDate()}日 - {weekEnd.getMonth() + 1}月{weekEnd.getDate()}日
                        </span>
                        <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded">
                          {itemCounts.traffic}:{itemCounts.persona}:{itemCounts.product}
                        </span>
                      </div>
                      <button
                        onClick={() => router.push(`/ip/${ipId}/weekly-plan`)}
                        className="text-xs text-muted hover:text-primary transition-colors"
                      >
                        查看 →
                      </button>
                    </div>
                    <div className="space-y-1">
                      {plan.items?.slice(0, 3).map((item: any, i: number) => (
                        <p key={i} className="text-xs text-muted truncate">{item.title}</p>
                      ))}
                      {plan.items?.length > 3 && (
                        <p className="text-xs text-gray-400">+{plan.items.length - 3} 条更多选题</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ===== Bottom Sticky Save Bar ===== */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 md:px-6 py-4 flex items-center justify-between sticky bottom-4 shadow-lg">
          <span className="text-xs text-gray-400">所有修改需要点击下方按钮保存</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors",
              saving && "opacity-50 cursor-not-allowed"
            )}
          >
            {saving ? "保存中…" : saved ? "已保存 ✓" : "保存修改"}
          </button>
        </div>
      </div>
    </div>
  )
}
