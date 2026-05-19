"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Copy, RefreshCw, Sparkles, Check, ArrowLeft, Wand2, Save, BookOpen, QrCode, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

// Rewrite presets for each section
const rewritePresets: Record<string, { label: string; prompt: string }[]> = {
  titleHook: [
    { label: "更抓人", prompt: "把标题和钩子改得更有冲突、更想点开，但不要标题党，不要虚构事实。" },
    { label: "更像本人", prompt: "把标题和钩子改得更像老板自己会说的话，去掉书面语和套话。" },
    { label: "更克制", prompt: "把标题和钩子改得更克制、更稳重，不要过度煽动情绪。" },
  ],
  script: [
    { label: "更口语", prompt: "把逐字稿改得更口语、更像真人对着手机说话，减少书面表达和专家腔。" },
    { label: "更有画面", prompt: "把逐字稿改得更有生活画面和具体细节，让用户拿起手机就知道怎么拍。" },
    { label: "更短更顺", prompt: "把逐字稿压短一点，逻辑更顺，每段更清楚，保留最有用的表达。" },
  ],
  description: [
    { label: "更像朋友圈", prompt: "把发布文案改得更像真人朋友圈或视频号配文，不要像营销号。" },
    { label: "更有转化", prompt: "把发布文案改得更容易引导咨询，但不要硬广，不要过度承诺。" },
    { label: "更同城", prompt: "把发布文案和标签改得更适合同城流量，更贴近本地用户会搜、会看的表达。" },
  ],
  tips: [
    { label: "更好拍", prompt: "告诉AI怎么改拍摄建议，比如:不要复杂布景;更适合门店老板一个人拍。" },
    { label: "更有现场", prompt: "把拍摄建议改得更有门店、街边、办公室或真实工作现场的画面感。" },
    { label: "更低成本", prompt: "把拍摄建议改得更低成本，不需要布景，不需要演员，普通老板也能拍。" },
  ],
}

export default function ItemResultPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const itemId = params.id

  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingToKnowledge, setSavingToKnowledge] = useState(false)
  const [savedToKnowledge, setSavedToKnowledge] = useState(false)
  const [savingSection, setSavingSection] = useState("")

  // Editable fields
  const [title, setTitle] = useState("")
  const [hook, setHook] = useState("")
  const [script, setScript] = useState("")
  const [description, setDescription] = useState("")
  const [tagsText, setTagsText] = useState("")
  const [tipsText, setTipsText] = useState("")

  // Rewrite state
  const [activeRewriteSection, setActiveRewriteSection] = useState("")
  const [selectedPreset, setSelectedPreset] = useState("")
  const [rewriteInput, setRewriteInput] = useState("")
  const [rewriting, setRewriting] = useState(false)

  const contentTypeLabels: Record<string, string> = {
    traffic: "流量型",
    persona: "人设型",
    product: "产品型",
  }

  const loadItem = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/weekly-plan-items/${itemId}`)
      const data = await res.json()
      if (data.item) {
        setItem(data.item)
        if (data.item.generatedResult) {
          const result = data.item.generatedResult as Record<string, any>
          setTitle(result.title || "")
          setHook(result.hook || "")
          setScript(result.script || "")
          setDescription(result.description || "")
          setTagsText((result.tags || []).join(" "))
          setTipsText((result.tips || []).join("\n"))
        }
      }
    } catch {
      setError("加载发布包失败")
    } finally {
      setLoading(false)
    }
  }, [itemId])

  useEffect(() => { loadItem() }, [loadItem])

  const handleGenerate = async () => {
    setGenerating(true)
    setError("")
    try {
      const res = await fetch(`/api/weekly-plan-items/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "生成失败"); return }
      if (data.result) {
        setTitle(data.result.title || "")
        setHook(data.result.hook || "")
        setScript(data.result.script || "")
        setDescription(data.result.description || "")
        setTagsText((data.result.tags || []).join(" "))
        setTipsText((data.result.tips || []).join("\n"))
      }
      setItem(data.item)
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const result = {
      title,
      hook,
      script,
      description,
      tags: tagsText.split(/\s+/).filter(Boolean),
      tips: tipsText.split("\n").filter(Boolean),
    }
    const res = await fetch(`/api/weekly-plan-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generatedResult: result }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const handleCopyFull = async () => {
    const full = [
      title,
      "",
      hook,
      "",
      script,
      "",
      description,
      "",
      tagsText,
      "",
      tipsText,
    ].join("\n")
    try {
      await navigator.clipboard.writeText(full)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* ignore */ }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch { /* ignore */ }
  }

  const handleSaveToKnowledge = async () => {
    if (!title && !script) return
    setSavingToKnowledge(true)
    const ipId = item?.plan?.ip?.id
    const ipName = item?.plan?.ip?.name || ""
    const contentTypeLabel = contentTypeLabels[item?.contentType] || item?.contentType
    const weekStart = item?.plan?.weekStart || ""
    const parts = [
      `# ${title || "未命名发布包"}`,
      ``,
      `> ${contentTypeLabel}选题 | ${ipName} | ${weekStart ? "周：" + weekStart : ""}`,
      ``,
      `## 开头钩子`,
      hook || "",
      ``,
      `## 口播逐字稿`,
      script || "",
      ``,
      `## 发布文案`,
      description || "",
      ``,
      `## 标签`,
      tagsText || "",
      ``,
      `## 拍摄建议`,
      tipsText || "",
      ``,
      `## 选题理由`,
      item?.reason || "",
    ].join("\n")
    try {
      const res = await fetch("/api/account-knowledge/wiki-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[发布包] ${title || "未命名"}`,
          content: parts,
          category: "ip_subpage",
          ipId: ipId || null,
        }),
      })
      if (res.ok) {
        setSavedToKnowledge(true)
        setTimeout(() => setSavedToKnowledge(false), 2000)
      }
    } catch { /* ignore */ }
    setSavingToKnowledge(false)
  }

  const handleSaveSectionToKnowledge = async (section: string, sectionTitle: string, content: string) => {
    if (!content.trim()) return
    setSavingSection(section)
    const ipId = item?.plan?.ip?.id
    const ipName = item?.plan?.ip?.name || ""
    const pageTitle = `[发布包] ${title || "未命名"} - ${sectionTitle}`
    const parts = [
      `# ${title || "未命名发布包"}`,
      ``,
      `> ${contentTypeLabels[item?.contentType] || ""}选题 | ${ipName}`,
      ``,
      `## ${sectionTitle}`,
      content,
    ].join("\n")
    try {
      const res = await fetch("/api/account-knowledge/wiki-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pageTitle,
          content: parts,
          category: "ip_subpage",
          ipId: ipId || null,
        }),
      })
      if (res.ok) {
        setSavedToKnowledge(true)
        setTimeout(() => setSavedToKnowledge(false), 2000)
      }
    } catch { /* ignore */ }
    setSavingSection("")
  }

  const openRewrite = (section: string) => {
    setActiveRewriteSection(section)
    setSelectedPreset("")
    setRewriteInput("")
  }

  const selectPreset = (section: string, prompt: string) => {
    setActiveRewriteSection(section)
    setSelectedPreset(prompt)
    setRewriteInput(prompt)
  }

  const handleRewrite = async () => {
    if (!rewriteInput.trim()) return
    setRewriting(true)
    const section = activeRewriteSection
    try {
      let targetText = ""
      if (section === "titleHook") targetText = `${title}\n${hook}`
      else if (section === "script") targetText = script
      else if (section === "description") targetText = `${description}\n${tagsText}`
      else if (section === "tips") targetText = tipsText

      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: targetText, section, direction: rewriteInput, ipId: item?.plan?.ip?.id }),
      })
      const data = await res.json()
      if (data.text) {
        if (section === "titleHook") {
          const lines = data.text.split("\n").filter(Boolean)
          if (lines[0]) setTitle(lines[0])
          if (lines[1]) setHook(lines.slice(1).join("\n"))
        } else if (section === "script") {
          setScript(data.text)
        } else if (section === "description") {
          const lines = data.text.split("\n").filter(Boolean)
          if (lines[0]) setDescription(lines[0])
          if (lines[1]) setTagsText(lines.slice(1).join(" "))
        } else if (section === "tips") {
          setTipsText(data.text)
        }
      }
    } catch {
      setError("改写失败")
    } finally {
      setRewriting(false)
      setActiveRewriteSection("")
    }
  }

  const hasContent = title || hook || script || description || tagsText || tipsText

  if (loading) {
    return (
      <div className="min-h-screen bg-background-subtle flex items-center justify-center">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    )
  }

  if (error && !hasContent) {
    return (
      <div className="min-h-screen bg-background-subtle flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleGenerate}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              重试
            </button>
            <button
              onClick={() => router.back()}
              className="border border-gray-200 text-muted px-4 py-2 rounded-lg text-xs font-medium hover:bg-background-subtle transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-subtle">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-6">
            <span className="text-xs text-gray-400">创世者Copilot 工作台</span>
            <span className="text-sm font-bold text-title">{item?.plan?.ip?.name || "创世者Copilot"}</span>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={() => router.push("/")} className="text-xs text-muted hover:text-primary transition-colors">工作台</button>
            <button onClick={() => router.push(`/ip/${item?.plan?.ip?.id}/profile`)} className="text-xs text-muted hover:text-primary transition-colors">IP 知识库</button>
            <button onClick={() => router.push(`/ip/${item?.plan?.ip?.id}/weekly-plan`)} className="text-xs text-muted hover:text-primary transition-colors">返回周策划</button>
            <button className="text-xs text-primary font-medium hover:text-primary-hover transition-colors">加微信</button>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" })
                router.push("/login")
              }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              退出登录
            </button>
          </div>
          <button
            onClick={() => router.push("/account/profile")}
            className="border border-gray-200 text-muted px-3 py-1 rounded-lg text-xs hover:bg-background-subtle transition-colors"
          >
            个人中心
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
        {!hasContent ? (
          // No content yet
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-bold">这个选题还没有生成发布包。</h2>
            <p className="text-sm text-gray-400 mt-2 mb-6">点击按钮让 AI 基于 IP 档案和知识库生成完整发布包。</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={cn(
                "bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto transition-colors",
                generating && "opacity-50 cursor-not-allowed"
              )}
            >
              <Wand2 className="w-4 h-4" />
              {generating ? "AI 生成中…" : "AI 生成发布包"}
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <span className="text-xs text-primary font-medium tracking-wider">READY TO PUBLISH</span>
              <h1 className="text-2xl font-bold mt-2">{title}</h1>
            </div>

            {/* Hook */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <textarea
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                rows={3}
                className="w-full resize-none text-sm focus:outline-none leading-relaxed"
                placeholder="输入开头钩子..."
              />
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-xs px-3 py-1.5 rounded-lg font-medium",
                item?.contentType === "traffic" ? "bg-primary-light text-primary" :
                item?.contentType === "persona" ? "bg-[#e0f2fe] text-[#0284c7]" :
                "bg-[#dcfce7] text-[#16a34a]"
              )}>
                {contentTypeLabels[item?.contentType] || item?.contentType}
              </span>
              {item?.plan?.ip?.founderName && (
                <span className="text-xs bg-gray-100 text-muted px-3 py-1.5 rounded-lg">{item.plan.ip.founderName}</span>
              )}
              <span className="text-xs bg-gray-100 text-muted px-3 py-1.5 rounded-lg">{item?.title}</span>
            </div>

            {/* Title & Hook Rewrite */}
            <div className="bg-background-subtle rounded-xl border border-dashed border-gray-200 p-5">
              <div className="flex gap-2 mb-3">
                {rewritePresets.titleHook.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => selectPreset("titleHook", preset.prompt)}
                    className="bg-white border border-gray-200 text-muted px-3 py-1.5 rounded-lg text-xs hover:border-primary hover:text-primary transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <textarea
                value={activeRewriteSection === "titleHook" ? rewriteInput : ""}
                onChange={(e) => setRewriteInput(e.target.value)}
                placeholder="告诉 AI 怎么改标题和钩子，比如：更抓人、更像老板自己说的话..."
                rows={3}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleRewrite}
                disabled={rewriting || !rewriteInput.trim()}
                className={cn(
                  "mt-3 w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-medium transition-colors",
                  (rewriting || !rewriteInput.trim()) && "opacity-50 cursor-not-allowed"
                )}
              >
                {rewriting ? "AI 改写中…" : "让 AI 改这一块"}
              </button>
              <p className="text-xs text-primary mt-2">已选好改稿方向，可以直接让 AI 改，也可以再补充一句。</p>
              <button
                onClick={() => handleSaveSectionToKnowledge("titleHook", "标题与钩子", `${title}\n${hook}`)}
                disabled={savingSection === "titleHook"}
                className={cn(
                  "mt-3 border border-gray-200 text-muted px-4 py-2 rounded-lg text-xs font-medium hover:bg-white transition-colors flex items-center gap-1.5",
                  savingSection === "titleHook" && "opacity-50 cursor-not-allowed"
                )}
              >
                <BookOpen className="w-3.5 h-3.5" /> {savingSection === "titleHook" ? "保存中…" : "沉淀到知识库"}
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyFull}
                className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" /> 复制完整发布包
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="border border-gray-200 text-muted px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-background-subtle transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {saving ? "保存中…" : saved ? "已保存" : "保存修改"}
              </button>
              <button
                onClick={handleSaveToKnowledge}
                disabled={savingToKnowledge}
                className={cn(
                  "border border-gray-200 text-muted px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-background-subtle transition-colors flex items-center gap-1.5",
                  savingToKnowledge && "opacity-50 cursor-not-allowed"
                )}
              >
                <BookOpen className="w-4 h-4" /> {savingToKnowledge ? "保存中…" : savedToKnowledge ? "已沉淀" : "沉淀到知识库"}
              </button>
            </div>

            {/* Source Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <span className="text-xs text-primary font-medium tracking-wider">本条来源</span>
              <h3 className="text-sm font-bold mt-2">这条内容是怎么被选进本周的</h3>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                {item?.reason || "展示该 IP 的专业能力和观察，突出人设，让观众记住这个 IP。"}
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left: Script */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-primary font-medium tracking-wider">口播逐字稿</span>
                    <button
                      onClick={() => handleCopy(script)}
                      className="border border-gray-200 text-muted px-3 py-1.5 rounded-lg text-xs hover:bg-background-subtle transition-colors flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> 复制逐字稿
                    </button>
                  </div>
                  <div className="text-sm text-title leading-relaxed whitespace-pre-wrap">
                    {script || "暂无口播脚本"}
                  </div>
                </div>

                {/* Script Rewrite */}
                <div className="bg-background-subtle rounded-xl border border-dashed border-gray-200 p-5">
                  <div className="flex gap-2 mb-3">
                    {rewritePresets.script.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => selectPreset("script", preset.prompt)}
                        className="bg-white border border-gray-200 text-muted px-3 py-1.5 rounded-lg text-xs hover:border-primary hover:text-primary transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={activeRewriteSection === "script" ? rewriteInput : ""}
                    onChange={(e) => setRewriteInput(e.target.value)}
                    placeholder="告诉 AI 怎么改逐字稿，比如：别写成专家腔；把经营年限改为8年；语气更克制。"
                    rows={3}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleRewrite}
                    disabled={rewriting || !rewriteInput.trim() || activeRewriteSection !== "script"}
                    className={cn(
                      "mt-3 w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-medium transition-colors",
                      (rewriting || !rewriteInput.trim() || activeRewriteSection !== "script") && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {rewriting ? "AI 改写中…" : "让 AI 改这一块"}
                  </button>
                  <button
                    onClick={() => handleSaveSectionToKnowledge("script", "口播逐字稿", script)}
                    disabled={savingSection === "script"}
                    className={cn(
                      "mt-3 border border-gray-200 text-muted px-4 py-2 rounded-lg text-xs font-medium hover:bg-white transition-colors flex items-center gap-1.5",
                      savingSection === "script" && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> {savingSection === "script" ? "保存中…" : "沉淀到知识库"}
                  </button>
                </div>
              </div>

              {/* Right: Description */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-primary font-medium tracking-wider">发布文案</span>
                    <button
                      onClick={() => handleCopy(`${description}\n${tagsText}`)}
                      className="border border-gray-200 text-muted px-3 py-1.5 rounded-lg text-xs hover:bg-background-subtle transition-colors flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> 复制文案
                    </button>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full resize-none text-sm focus:outline-none leading-relaxed mb-3"
                    placeholder="输入发布文案..."
                  />
                  <textarea
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    rows={2}
                    className="w-full resize-none text-sm focus:outline-none leading-relaxed"
                    placeholder="#标签1 #标签2 #标签3"
                  />
                </div>

                {/* Description Rewrite */}
                <div className="bg-background-subtle rounded-xl border border-dashed border-gray-200 p-5">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {rewritePresets.description.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => selectPreset("description", preset.prompt)}
                        className="bg-white border border-gray-200 text-muted px-3 py-1.5 rounded-lg text-xs hover:border-primary hover:text-primary transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={activeRewriteSection === "description" ? rewriteInput : ""}
                    onChange={(e) => setRewriteInput(e.target.value)}
                    placeholder="告诉 AI 怎么改发布文案，比如：少一点营销感；更像朋友圈口吻；标签更偏同城老板。"
                    rows={3}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleRewrite}
                    disabled={rewriting || !rewriteInput.trim() || activeRewriteSection !== "description"}
                    className={cn(
                      "mt-3 w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-medium transition-colors",
                      (rewriting || !rewriteInput.trim() || activeRewriteSection !== "description") && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {rewriting ? "AI 改写中…" : "让 AI 改这一块"}
                  </button>
                  <button
                    onClick={() => handleSaveSectionToKnowledge("description", "发布文案", `${description}\n${tagsText}`)}
                    disabled={savingSection === "description"}
                    className={cn(
                      "mt-3 border border-gray-200 text-muted px-4 py-2 rounded-lg text-xs font-medium hover:bg-white transition-colors flex items-center gap-1.5",
                      savingSection === "description" && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> {savingSection === "description" ? "保存中…" : "沉淀到知识库"}
                  </button>
                </div>

                {/* Shooting Tips */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-primary font-medium tracking-wider">拍摄建议</span>
                    <button
                      onClick={() => handleCopy(tipsText)}
                      className="border border-gray-200 text-muted px-3 py-1.5 rounded-lg text-xs hover:bg-background-subtle transition-colors flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> 复制建议
                    </button>
                  </div>
                  <div className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                    {tipsText || "暂无拍摄建议"}
                  </div>

                  {/* Tips Rewrite */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-2 mb-3">
                      {rewritePresets.tips.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => selectPreset("tips", preset.prompt)}
                          className="bg-background-subtle border border-gray-200 text-muted px-3 py-1.5 rounded-lg text-xs hover:border-primary hover:text-primary transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={activeRewriteSection === "tips" ? rewriteInput : ""}
                      onChange={(e) => setRewriteInput(e.target.value)}
                      placeholder="告诉 AI 怎么改拍摄建议，比如：不要复杂布景；更适合门店老板一个人拍。"
                      rows={2}
                      className="w-full bg-background-subtle border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={handleRewrite}
                      disabled={rewriting || !rewriteInput.trim() || activeRewriteSection !== "tips"}
                      className={cn(
                        "mt-3 w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-medium transition-colors",
                        (rewriting || !rewriteInput.trim() || activeRewriteSection !== "tips") && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {rewriting ? "AI 改写中…" : "让 AI 改这一块"}
                    </button>
                    <button
                      onClick={() => handleSaveSectionToKnowledge("tips", "拍摄建议", tipsText)}
                      disabled={savingSection === "tips"}
                      className={cn(
                        "mt-3 border border-gray-200 text-muted px-4 py-2 rounded-lg text-xs font-medium hover:bg-background-subtle transition-colors flex items-center gap-1.5",
                        savingSection === "tips" && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <BookOpen className="w-3.5 h-3.5" /> {savingSection === "tips" ? "保存中…" : "沉淀到知识库"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Memory */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-primary font-medium tracking-wider">账号记忆</span>
                  <h3 className="text-sm font-bold mt-1">先改稿，再让 AI 提炼记忆。</h3>
                </div>
                <button
                  onClick={() => router.push(`/ip/${item?.plan?.ip?.id}/profile`)}
                  className="text-xs text-muted hover:text-primary transition-colors"
                >
                  管理全部记忆
                </button>
              </div>
              <p className="text-sm text-muted mt-3 leading-relaxed">
                每个文案模块后面的"沉淀到知识库"会对比 AI 原稿和你的改稿，自动生成可复用的记忆建议。你确认后，它才会真正进入这个 IP 的知识库。
              </p>
            </div>

            {/* Bottom CTA */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <span className="text-xs text-primary font-medium tracking-wider">PRIVATE CONVERSION</span>
              <div className="flex items-center justify-between mt-3">
                <h3 className="text-sm font-bold">单条发布包只是执行层，账号打法还可以继续往下拆。</h3>
                <div className="flex gap-2">
                  <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
                    <QrCode className="w-4 h-4" /> 打开二维码
                  </button>
                  <button className="border border-gray-200 text-muted px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-background-subtle transition-colors">
                    <MessageSquare className="w-4 h-4" /> 复制微信号
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
