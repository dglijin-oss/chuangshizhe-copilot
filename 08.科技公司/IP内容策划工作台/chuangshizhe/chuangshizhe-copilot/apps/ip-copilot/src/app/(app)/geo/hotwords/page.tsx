"use client"

import { useState, useEffect, useCallback } from "react"
import { useAiGeneration } from "@/hooks/use-ai-generation"

export default function HotwordsPage() {
  const [coreWord, setCoreWord] = useState("")
  const [industry, setIndustry] = useState("")
  const [region, setRegion] = useState("广西")
  const [generating, setGenerating] = useState(false)
  const [hotwords, setHotwords] = useState<{ dimension: string; keywords: string[] }[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [savedMatrices, setSavedMatrices] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [viewingMatrix, setViewingMatrix] = useState<any>(null)
  const { withProgress } = useAiGeneration()

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch("/api/ai/hotwords", { credentials: "include" })
      const data = await res.json()
      if (data.matrices) setSavedMatrices(data.matrices)
    } catch (e) {
      console.error("Failed to load history:", e)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleGenerate = async () => {
    if (!coreWord) return
    setGenerating(true)
    setHotwords([])
    setViewingMatrix(null)
    try {
      const data = await withProgress(
        fetch("/api/ai/hotwords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coreWord, industry, region }),
          credentials: "include",
        }).then((r) => r.json())
      )
      if (data.error) { setErrorMsg(data.error); return }
      if (data.hotwords) {
        setHotwords(data.hotwords)
        loadHistory() // Refresh history
      }
    } catch (e) {
      console.error("Failed to generate hotwords:", e)
    } finally {
      setGenerating(false)
    }
  }

  const handleLoadMatrix = (matrix: any) => {
    setViewingMatrix(matrix)
    setHotwords(matrix.data)
    setCoreWord(matrix.coreWord)
    setIndustry(matrix.industry || "")
    setRegion(matrix.region || "")
  }

  const handleDeleteMatrix = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("确认删除此热词矩阵？")) return
    try {
      await fetch(`/api/ai/hotwords?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      setSavedMatrices((prev) => prev.filter((m) => m.id !== id))
      if (viewingMatrix?.id === id) {
        setViewingMatrix(null)
        setHotwords([])
      }
    } catch (e) {
      console.error("Failed to delete matrix:", e)
    }
  }

  const totalKeywords = hotwords.reduce((sum, d) => sum + d.keywords.length, 0)

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <h1 className="text-base md:text-xl font-bold mb-2">热词关联</h1>
        <p className="text-xs text-muted mb-6">
          按 11 个维度生成 AI 搜索问句，选中后可加入关键词库或带入 GEO 文章。
        </p>
        {errorMsg && <p className="text-xs text-red-500 mb-4 bg-red-50 px-3 py-2 rounded-lg">{errorMsg}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">核心词</label>
            <input type="text" placeholder="例如：南宁全屋定制" value={coreWord}
              onChange={(e) => setCoreWord(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">行业</label>
            <input type="text" placeholder="例如：家装建材" value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">地域</label>
            <input type="text" placeholder="广西" value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !coreWord}
            className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {generating ? "生成中..." : "生成矩阵"}
          </button>
        </div>
      </div>

      {hotwords.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-primary font-medium">11 维搜索问句矩阵</span>
              <h3 className="text-sm font-bold mt-1">共 {hotwords.length} 个维度，{totalKeywords} 个问句</h3>
            </div>
            {viewingMatrix && (
              <span className="text-xs text-gray-400">保存于 {new Date(viewingMatrix.createdAt).toLocaleDateString("zh-CN")}</span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hotwords.map((dim, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium mb-2">{dim.dimension}</div>
                <ul className="space-y-1">
                  {dim.keywords.map((kw, j) => (
                    <li key={j} className="text-xs text-muted flex items-start gap-1.5">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      <span>{kw}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <h3 className="text-sm font-bold mb-4">已保存的热词矩阵</h3>
        {loadingHistory ? (
          <p className="text-xs text-gray-400">加载中...</p>
        ) : savedMatrices.length === 0 ? (
          <p className="text-xs text-gray-400">还没有保存的热词矩阵，点击上方"生成矩阵"开始。</p>
        ) : (
          <div className="space-y-2">
            {savedMatrices.map((m) => (
              <div
                key={m.id}
                onClick={() => handleLoadMatrix(m)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  viewingMatrix?.id === m.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/30"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.coreWord}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {m.industry && <span>{m.industry} · </span>}
                    {m.region && <span>{m.region} · </span>}
                    {Array.isArray(m.data) ? m.data.reduce((s: number, d: any) => s + d.keywords.length, 0) : 0} 个问句
                    <span className="ml-2">{new Date(m.createdAt).toLocaleDateString("zh-CN")}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteMatrix(m.id, e)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded transition-colors"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
