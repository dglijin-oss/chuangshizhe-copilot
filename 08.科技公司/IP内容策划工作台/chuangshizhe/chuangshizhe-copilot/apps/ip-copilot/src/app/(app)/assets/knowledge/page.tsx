"use client"

import { useState, useEffect, useMemo } from "react"
import { RefreshCw, Save, Copy, Trash2, Search, Upload, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAiGeneration } from "@/hooks/use-ai-generation"

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState("wiki")
  const [stats, setStats] = useState<{ sourceCount: number; wikiCount: number; ipSubpageCount: number; snippetCount: number } | null>(null)
  const [wikiPages, setWikiPages] = useState<any[]>([])
  const [sources, setSources] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recompiling, setRecompiling] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [copyStatus, setCopyStatus] = useState("")
  const [updatingOverview, setUpdatingOverview] = useState(false)
  const [userName, setUserName] = useState("")
  const { withProgress } = useAiGeneration()

  // Wiki tab state
  const [pageType, setPageType] = useState("all")
  const [selectedPage, setSelectedPage] = useState<any>(null)
  const [wikiDraft, setWikiDraft] = useState("")
  const [wikiTitleDraft, setWikiTitleDraft] = useState("")

  // Import tab state
  const [importTitle, setImportTitle] = useState("")
  const [importText, setImportText] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [uploadProgress, setUploadProgress] = useState<{ pending: number; done: number } | null>(null)

  // Sources tab state
  const [sourceQuery, setSourceQuery] = useState("")

  // Search tab state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchPurpose, setSearchPurpose] = useState("agent_chat")

  const tabs = [
    { key: "wiki", label: "Wiki 页面" },
    { key: "sources", label: "原始来源" },
    { key: "import", label: "导入资料" },
    { key: "search", label: "全库搜索" },
    { key: "events", label: "编译日志" },
  ]

  const pageTypes = [
    { key: "all", label: "全部页面" },
    { key: "overview", label: "账号总览" },
    { key: "company_intro", label: "公司介绍" },
    { key: "product_service", label: "产品与服务" },
    { key: "customer_case", label: "客户案例" },
    { key: "trust_asset", label: "信任资产" },
    { key: "development", label: "发展历程" },
    { key: "content_rule", label: "内容规则" },
    { key: "ip_subpage", label: "IP 子页" },
    { key: "reference", label: "资料页" },
  ]

  const categoryLabels: Record<string, string> = {
    overview: "账号总览",
    ip_subpage: "IP 子页",
    trust_asset: "信任资产",
    company_intro: "公司介绍",
    product_service: "产品与服务",
    customer_case: "客户案例",
    development: "发展历程",
    content_rule: "内容规则",
    reference: "资料页",
  }
  const categoryColors: Record<string, string> = {
    overview: "bg-primary/10 text-primary",
    ip_subpage: "bg-primary-mid/10 text-primary-mid",
    trust_asset: "bg-primary-light text-primary",
    company_intro: "bg-primary/10 text-primary",
    product_service: "bg-primary/10 text-primary",
    customer_case: "bg-primary/10 text-primary",
    development: "bg-primary/10 text-primary",
    content_rule: "bg-primary/10 text-primary",
    reference: "bg-primary/10 text-primary",
  }
  const sourceTypeLabels: Record<string, string> = {
    ip_profile: "IP 档案",
    imported_file: "导入文件",
    imported_text: "导入文本",
    manual: "手动录入",
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (activeTab === "wiki") loadWikiPages()
    if (activeTab === "sources") loadSources()
    if (activeTab === "events") loadEvents()
  }, [activeTab, pageType])

  async function loadData() {
    setLoading(true)
    try {
      const userRes = await fetch("/api/auth/me", { credentials: "include" })
      if (userRes.ok) {
        const userData = await userRes.json()
        setUserName(userData?.user?.name || "")
      }
      await fetch("/api/account-knowledge/cleanup", { method: "POST" })
      await fetch("/api/account-knowledge/update-overview", { method: "POST" })
      const statsRes = await fetch("/api/account-knowledge/overview")
      if (statsRes.ok) setStats(await statsRes.json())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  async function handleUpdateOverview() {
    setUpdatingOverview(true)
    const res = await fetch("/api/account-knowledge/update-overview", { method: "POST" })
    const data = await res.json()
    if (data.page) {
      const statsRes = await fetch("/api/account-knowledge/overview")
      if (statsRes.ok) setStats(await statsRes.json())
      loadWikiPages()
    }
    setUpdatingOverview(false)
  }

  async function loadWikiPages() {
    const params = new URLSearchParams()
    if (pageType !== "all") params.set("category", pageType)
    const res = await fetch(`/api/account-knowledge/wiki-pages?${params}`)
    const data = await res.json()
    setWikiPages(data.pages ?? [])
  }

  async function loadSources() {
    const res = await fetch("/api/account-knowledge/sources")
    const data = await res.json()
    setSources(data.sources ?? [])
  }

  async function loadEvents() {
    const res = await fetch("/api/account-knowledge/events")
    const data = await res.json()
    setEvents(data.events ?? [])
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadData()
    await loadWikiPages()
    setRefreshing(false)
  }

  async function handleSelectPage(page: any) {
    setSelectedPage(page)
    setWikiDraft(page.content || "")
    setWikiTitleDraft(page.title || "")
  }

  async function handleSaveWiki() {
    if (!selectedPage) return
    setSaving(true)
    const method = selectedPage.id ? "PUT" : "POST"
    const body: any = { title: wikiTitleDraft, content: wikiDraft }
    if (selectedPage.id) body.id = selectedPage.id
    const res = await fetch("/api/account-knowledge/wiki-pages", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.page) {
      setSelectedPage(data.page)
      loadWikiPages()
    }
    setSaving(false)
  }

  async function handleDeleteWiki(id: string) {
    const res = await fetch(`/api/account-knowledge/wiki-pages?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      if (selectedPage?.id === id) { setSelectedPage(null); setWikiDraft(""); setWikiTitleDraft("") }
      loadWikiPages()
    }
  }

  async function handleDeleteSource(id: string) {
    const res = await fetch(`/api/account-knowledge/sources?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      loadSources()
      handleUpdateOverview()
    }
  }

  async function handleAnalyzeSource() {
    if (!importTitle || !importText) return
    setAnalyzing(true)
    const data = await withProgress(
      fetch("/api/account-knowledge/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: importTitle, content: importText, sourceType: "imported_text" }),
      }).then((r) => r.json())
    )
    if (data.source) {
      setAnalysisResult(data.source)
      loadSources()
      handleUpdateOverview()
    }
    setAnalyzing(false)
  }

  async function handleRecompile() {
    setRecompiling(true)
    const data = await withProgress(
      fetch("/api/account-knowledge/recompile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then((r) => r.json())
    )
    if (data.pages) {
      loadWikiPages()
      handleUpdateOverview()
    }
    setRecompiling(false)
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    const res = await fetch("/api/account-knowledge/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: searchQuery }),
    })
    const data = await res.json()
    setSearchResults(data.results ?? [])
  }

  function handleCopyMarkdown() {
    navigator.clipboard.writeText(wikiDraft).then(() => {
      setCopyStatus("已复制")
      setTimeout(() => setCopyStatus(""), 2000)
    }).catch(() => { /* ignore */ })
  }

  const filteredWikiPages = useMemo(() => {
    if (pageType === "all") return wikiPages
    return wikiPages.filter(p => p.category === pageType)
  }, [wikiPages, pageType])

  const filteredSources = useMemo(() => {
    if (!sourceQuery) return sources
    return sources.filter(s => s.title?.includes(sourceQuery) || s.content?.includes(sourceQuery))
  }, [sources, sourceQuery])

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="text-sm text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-muted font-medium tracking-wider">LLM Wiki</span>
            <h1 className="text-lg md:text-xl font-bold mt-1">账号知识库</h1>
            <p className="text-xs text-muted mt-2 max-w-2xl">
              统一管理公司资料、IP 子页、资料来源和信任资产，GEO、IP 文稿和智能体都会读取这里。
            </p>
          </div>
          <div className="flex gap-2 flex-wrap flex-shrink-0">
            <button
              onClick={handleUpdateOverview}
              disabled={updatingOverview}
              className={cn(
                "border border-gray-200 text-muted px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors hover:bg-gray-50",
                updatingOverview && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", updatingOverview && "animate-spin")} />
              更新总览
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn(
                "border border-gray-200 text-muted px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors hover:bg-gray-50",
                refreshing && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
              刷新
            </button>
            <button
              onClick={handleRecompile}
              disabled={recompiling}
              className={cn(
                "bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", recompiling && "animate-spin")} />
              重新编译 Wiki
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="来源" value={stats?.sourceCount ?? 0} />
        <StatCard label="Wiki 页面" value={stats?.wikiCount ?? 0} />
        <StatCard label="IP 子页" value={stats?.ipSubpageCount ?? 0} />
        <StatCard label="检索片段" value={stats?.snippetCount ?? 0} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 min-w-[80px] py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
              activeTab === tab.key ? "bg-primary text-white" : "text-muted hover:bg-gray-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Wiki 页面 */}
      {activeTab === "wiki" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5" style={{ minHeight: "500px" }}>
          {/* Left: Page List */}
          <div className="md:col-span-4 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
              <span className="text-base font-bold">Wiki 页面</span>
              <select
                value={pageType}
                onChange={(e) => setPageType(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-primary bg-white"
              >
                {pageTypes.map(pt => (
                  <option key={pt.key} value={pt.key}>{pt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredWikiPages.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">暂无 Wiki 页面</div>
              ) : (
                <div className="p-2">
                  {filteredWikiPages.filter(p => p.category === "overview").map((page) => (
                    <button
                      key={page.id}
                      onClick={() => handleSelectPage(page)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg transition-colors mb-0.5",
                        selectedPage?.id === page.id
                          ? "bg-primary-light"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="text-sm font-medium">{page.title}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        账号总览 · {formatDate(page.updatedAt)}
                      </div>
                    </button>
                  ))}
                  {filteredWikiPages.filter(p => p.category !== "overview").map((page) => (
                    <button
                      key={page.id}
                      onClick={() => handleSelectPage(page)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg transition-colors mb-0.5",
                        selectedPage?.id === page.id
                          ? "bg-primary-light"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="text-sm font-medium">{page.title}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {page.category === "ip_subpage"
                          ? `${userName || "用户"} · IP 子页（${page.title}）`
                          : `${categoryLabels[page.category] ?? page.category}`}
                        <span> · {formatDate(page.updatedAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Editor */}
          <div className="md:col-span-8 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            {selectedPage ? (
              <>
                {/* Editor Header */}
                <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold">{wikiTitleDraft}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {selectedPage.category === "ip_subpage"
                        ? `${userName || "用户"} · IP 子页（${selectedPage.title}）`
                        : `${categoryLabels[selectedPage.category] ?? selectedPage.category}`}
                      <span className="mx-1">·</span>
                      {selectedPage.ipId ? "IP 子页" : "账号总库"}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={handleCopyMarkdown}
                      className="border border-gray-200 text-muted px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copyStatus || "复制"}
                    </button>
                    <button
                      onClick={() => handleDeleteWiki(selectedPage.id)}
                      className="border border-gray-200 text-muted px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleSaveWiki}
                      disabled={saving}
                      className={cn(
                        "bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
                        saving && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? "保存中..." : "保存页面"}
                    </button>
                  </div>
                </div>

                {/* Editor Body: Split */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 md:divide-x divide-gray-200 overflow-hidden">
                  {/* Markdown Input */}
                  <div className="p-5 overflow-hidden flex flex-col">
                    <textarea
                      value={wikiDraft}
                      onChange={(e) => setWikiDraft(e.target.value)}
                      className="flex-1 resize-none text-sm font-mono focus:outline-none leading-relaxed"
                      placeholder="Markdown 内容..."
                    />
                  </div>
                  {/* Preview */}
                  <div className="p-5 overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      <h1 className="text-lg font-bold mb-4">{wikiTitleDraft}</h1>
                      {renderMarkdownPreview(wikiDraft)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                选择 Wiki 页面开始编辑
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: 原始来源 */}
      {activeTab === "sources" && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="搜索来源..."
              value={sourceQuery}
              onChange={(e) => setSourceQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="divide-y divide-gray-200">
            {filteredSources.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">暂无原始来源</div>
            ) : (
              filteredSources.map((source) => (
                <div key={source.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="bg-gray-200 text-muted px-2 py-0.5 rounded text-xs font-medium">
                          {sourceTypeLabels[source.sourceType] ?? source.sourceType}
                        </span>
                        <span className="text-sm font-medium">{source.title}</span>
                      </div>
                      <div className="text-xs text-body line-clamp-2">{source.content?.slice(0, 200)}</div>
                      <div className="text-xs text-gray-400 mt-2">{formatDate(source.createdAt)}</div>
                    </div>
                    <button onClick={() => handleDeleteSource(source.id)} className="text-gray-400 hover:text-red-500 ml-3 mt-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: 导入资料 */}
      {activeTab === "import" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
            <h3 className="text-sm font-bold mb-4">导入资料</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">资料标题</label>
                <input
                  type="text"
                  placeholder="例如：XX 公司产品手册"
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">资料内容</label>
                <textarea
                  placeholder="粘贴文本资料..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-48 resize-none focus:outline-none focus:border-primary"
                />
                <div className="mt-2">
                  <label className="text-xs text-gray-400 cursor-pointer border border-dashed border-gray-200 rounded-lg px-3 py-2 block text-center hover:bg-gray-50 transition-colors">
                    <Upload className="w-4 h-4 inline mr-1" />
                    或拖拽文件到此处
                    <input type="file" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (!importTitle) setImportTitle(file.name)
                      setAnalyzing(true)
                      setUploadProgress({ pending: 1, done: 0 })
                      try {
                        // Step 1: Upload file (async — saves to temp dir)
                        const formData = new FormData()
                        formData.append("files", file)
                        const uploadRes = await fetch("/api/corpus-feed/upload", {
                          method: "POST",
                          body: formData,
                        })
                        const uploadData = await uploadRes.json()
                        if (!uploadData.feeds?.[0]?.id) {
                          alert(uploadData.error || "上传失败")
                          setAnalyzing(false)
                          setUploadProgress(null)
                          return
                        }

                        const feedId = uploadData.feeds[0].id

                        // Step 2: Trigger processing
                        await fetch("/api/corpus-feed/process", { method: "POST" })

                        // Step 3: Poll for completion
                        let attempts = 0
                        const maxAttempts = 30
                        while (attempts < maxAttempts) {
                          await new Promise(r => setTimeout(r, 500))
                          const statusRes = await fetch(`/api/corpus-feed/process?id=${feedId}`)
                          const statusData = await statusRes.json()
                          const feed = statusData.feeds?.[0]
                          if (feed?.status === "analyzed") {
                            setImportText(feed.content || "")
                            setUploadProgress({ pending: 1, done: 1 })
                            break
                          }
                          if (feed?.status === "error") {
                            alert(`文件处理失败：${feed.suggestion || "未知错误"}`)
                            break
                          }
                          attempts++
                        }
                        if (attempts >= maxAttempts) {
                          alert("文件处理超时，请刷新后重试")
                        }
                      } catch {
                        alert("文件上传失败")
                      } finally {
                        setAnalyzing(false)
                        setUploadProgress(null)
                      }
                    }} />
                  </label>
                </div>
              </div>
              <button
                onClick={handleAnalyzeSource}
                disabled={analyzing || !importTitle || !importText}
                className={cn(
                  "w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-medium transition-colors",
                  (analyzing || !importTitle || !importText) && "opacity-50 cursor-not-allowed"
                )}
              >
                分析资料
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 flex flex-col card-hover">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">分析结果</span>
              {analysisResult && (
                <button
                  onClick={() => {
                    fetch("/api/account-knowledge/import", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ title: analysisResult.title, content: analysisResult.content, sourceType: "imported_text" }),
                    }).then(res => res.json()).then(data => {
                      if (data.source) {
                        setImportTitle("")
                        setImportText("")
                        setAnalysisResult(null)
                        loadSources()
                        handleUpdateOverview()
                      }
                    })
                  }}
                  className="border border-gray-200 text-muted px-2 py-1 rounded text-xs hover:bg-gray-50 transition-colors"
                >
                  确认保存
                </button>
              )}
            </div>
            <div className="flex-1 p-5 overflow-y-auto">
              {analysisResult ? (
                <div className="space-y-3">
                  <div className="text-xs text-gray-400">已分析 {analysisResult.content?.length || 0} 字符</div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-muted mb-1">标题</div>
                    <div className="text-sm font-medium">{analysisResult.title}</div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-muted mb-1">内容预览</div>
                    <div className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">{analysisResult.content?.slice(0, 500)}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  粘贴资料后点击「分析资料」查看结果
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: 全库搜索 */}
      {activeTab === "search" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-3">
              <select
                value={searchPurpose}
                onChange={(e) => setSearchPurpose(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="agent_chat">对话使用</option>
                <option value="content_gen">内容生成</option>
                <option value="seo">SEO 优化</option>
              </select>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="搜索知识库..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  className={cn(
                    "bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                    !searchQuery.trim() && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Search className="w-4 h-4" /> 搜索
                </button>
              </div>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
              <span className="text-xs text-gray-400">{searchResults.length} 个结果</span>
              <div className="mt-3 space-y-3">
                {searchResults.map((result, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                        result.type === "wiki"
                          ? (categoryColors[result.category] ?? "bg-gray-200")
                          : "bg-gray-200 text-muted"
                      )}>
                        {result.type === "wiki" ? (categoryLabels[result.category] ?? result.category) : (sourceTypeLabels[result.sourceType] ?? result.sourceType)}
                      </span>
                      <span className="text-sm font-medium">{result.title}</span>
                    </div>
                    <div className="text-xs text-muted mt-1 line-clamp-2">{result.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && searchResults.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center py-12 text-gray-400 text-sm">
              搜索知识库中的内容
            </div>
          )}
        </div>
      )}

      {/* Tab: 编译日志 */}
      {activeTab === "events" && (
        <div className="bg-white rounded-xl border border-gray-200 card-hover">
          <div className="p-4 space-y-0">
            {events.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">暂无编译日志</div>
            ) : (
              events.map((event, idx) => (
                <div key={event.id} className={cn(
                  "flex items-start gap-3 py-3",
                  idx < events.length - 1 && "border-b border-gray-200"
                )}>
                  <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{formatEventAction(event.action)}</div>
                    {event.detail && <div className="text-xs text-muted mt-0.5">{event.detail}</div>}
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(event.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}

function formatDate(d: string | Date | null) {
  if (!d) return ""
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
}

function formatEventAction(action: string) {
  const map: Record<string, string> = {
    ip_created: "IP 创建",
    source_imported: "来源导入",
    wiki_compiled: "Wiki 编译",
    wiki_recompiled: "Wiki 重新编译",
    page_updated: "页面更新",
    page_deleted: "页面删除",
  }
  return map[action] ?? action
}

function renderMarkdownPreview(text: string) {
  if (!text) return <span className="text-gray-400">暂无内容</span>
  const lines = text.split("\n")
  return lines.map((line, i) => {
    if (line.startsWith("# ")) return <h1 key={i} className="text-lg font-bold my-2">{line.slice(2)}</h1>
    if (line.startsWith("## ")) return <h2 key={i} className="text-base font-bold my-2 mt-4">{line.slice(3)}</h2>
    if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-bold my-1">{line.slice(4)}</h3>
    if (line.startsWith("- **")) {
      const match = line.match(/^- \*\*(.+?)\*\*: (.+)$/)
      if (match) return <div key={i} className="flex gap-2 my-0.5"><span className="font-semibold">{match[1]}:</span><span>{match[2]}</span></div>
    }
    if (line.startsWith("- ")) return <div key={i} className="ml-4 my-0.5">{line.slice(2)}</div>
    if (line.startsWith("**")) {
      const match = line.match(/^\*\*(.+?)\*\*: (.+)$/)
      if (match) return <div key={i} className="flex gap-2 my-0.5"><span className="font-semibold">{match[1]}:</span><span>{match[2]}</span></div>
    }
    if (line.trim() === "") return <br key={i} />
    return <div key={i} className="my-0.5">{line}</div>
  })
}
