"use client"

import { useState, useEffect } from "react"
import { Sparkles, ChevronDown, Check, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"

const articleTypes = ["品宣文章", "数据图表", "榜单评测", "攻略指南", "深度专题", "问答 QA", "客户案例"]
const tones = ["专业", "亲和", "幽默", "权威", "接地气"]
const lengths = ["800 字", "1200 字", "1500 字", "2000 字", "3000 字"]

export default function GeoArticlePage() {
  const [collapsed, setCollapsed] = useState(false)
  const [topicType, setTopicType] = useState("品宣文章")
  const [formData, setFormData] = useState({
    topic: "",
    keywords: "",
    platform: "",
    tone: "专业",
    length: "1200 字",
    targetQuestions: "",
  })
  const [articleContent, setArticleContent] = useState("")
  const [generating, setGenerating] = useState(false)
  const [topicInput, setTopicInput] = useState("")
  const [topics, setTopics] = useState<{ topic: string; keywords: string; questions: string[] }[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedRule, setSelectedRule] = useState("")
  const [rules, setRules] = useState<{ id: string; name: string; tone: string }[]>([])
  const [knowledgeCount, setKnowledgeCount] = useState(0)
  const [completionPercent, setCompletionPercent] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch("/api/geo/rules").then((r) => r.ok ? r.json() : { rules: [] }),
      fetch("/api/assets/knowledge").then((r) => r.ok ? r.json() : { entries: [] }),
    ]).then(([rulesData, kbData]) => {
      setRules(rulesData.rules || [])
      const count = kbData.entries ? kbData.entries.length : 0
      setKnowledgeCount(count)
      setCompletionPercent(Math.min(count * 20, 100))
    }).catch(() => {})
  }, [])

  const handleGenerateTopics = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: "", productDesc: topicInput }),
      })
      const data = await res.json()
      if (data.topics) setTopics(data.topics)
    } catch (e) {
      console.error("Failed to generate topics:", e)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateArticle = async () => {
    if (!formData.topic || !formData.keywords) return
    setGenerating(true)
    setArticleContent("")
    setSaved(false)
    try {
      const res = await fetch("/api/ai/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: formData.topic,
          keywords: formData.keywords,
          platform: formData.platform,
          tone: formData.tone,
          length: formData.length,
          targetQuestions: formData.targetQuestions,
        }),
      })
      const data = await res.json()
      if (data.content) setArticleContent(data.content)
    } catch (e) {
      console.error("Failed to generate article:", e)
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveArticle = async () => {
    if (!articleContent) return
    setSaving(true)
    try {
      const lengthNum = parseInt(formData.length) || 1200
      const res = await fetch("/api/geo/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: formData.topic,
          keywords: formData.keywords,
          platform: formData.platform,
          tone: formData.tone,
          length: lengthNum,
          targetQuestions: formData.targetQuestions,
          articleType: topicType,
          content: articleContent,
        }),
      })
      const data = await res.json()
      if (data.article) {
        setSaved(true)
      }
    } catch (e) {
      console.error("Failed to save article:", e)
    } finally {
      setSaving(false)
    }
  }

  const handleTopicSelect = (t: { topic: string; keywords: string; questions: string[] }) => {
    setFormData({
      ...formData,
      topic: t.topic,
      keywords: t.keywords,
      targetQuestions: t.questions.join("\n"),
    })
    setCollapsed(true)
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 card-hover">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs text-primary font-medium">GEO 内容引擎</span>
        </div>
        <span className="text-xs text-primary font-medium">GEO ARTICLE WORKFLOW</span>
        <h2 className="text-base font-bold mt-2">
          像写完整发布包一样，生成一篇可沉淀、可发布、可追踪的 GEO 长文。
        </h2>
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className={cn("text-xs px-2 py-1 rounded", completionPercent >= 60 ? "bg-green-100 text-green-700" : "bg-primary-light text-primary")}>资料完善度 {completionPercent}%</span>
          {knowledgeCount === 0 && <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded">未完善账号知识库</span>}
          {knowledgeCount > 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">知识库 {knowledgeCount} 条</span>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 card-hover">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-primary font-medium">AI TOPIC FINDER</span>
            <h3 className="text-sm font-bold mt-1">智能选题</h3>
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="text-xs text-gray-400 hover:text-gray-900">
            {collapsed ? "展开" : "收起"}
          </button>
        </div>
        {!collapsed && (
          <div className="flex gap-3 mt-4">
            <input
              type="text"
              placeholder="可选：补充行业/产品描述"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleGenerateTopics}
              disabled={generating}
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              {generating ? "生成中..." : "AI 生成选题"}
            </button>
          </div>
        )}

        {topics.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <span className="text-xs text-muted mb-3 block">AI 选题结果（点击使用）</span>
            <div className="space-y-2">
              {topics.map((t, i) => (
                <button
                  key={i}
                  onClick={() => handleTopicSelect(t)}
                  className="w-full text-left border border-gray-200 rounded-lg p-3 hover:border-primary/30 transition-colors"
                >
                  <div className="text-sm font-medium">{t.topic}</div>
                  <div className="text-xs text-gray-400 mt-1">{t.keywords}</div>
                  {t.questions.length > 0 && (
                    <div className="text-xs text-muted mt-1">{t.questions.join(" | ")}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-primary font-medium">ARTICLE BRIEF</span>
              <h3 className="text-sm font-bold mt-1">先把这篇文章的打法说清楚。</h3>
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {articleTypes.map((type) => (
              <button
                key={type}
                onClick={() => setTopicType(type)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition-colors",
                  topicType === type
                    ? "bg-primary text-white"
                    : "border border-gray-200 text-muted hover:border-primary"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted">文章主题 <span className="text-red-500">*</span></label>
                <input type="text" placeholder="例如：南宁性价比高的女装店推荐" value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">关键词 <span className="text-red-500">*</span></label>
                <input type="text" placeholder="南宁女装,性价比,服装推荐" value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted">发布平台 <span className="text-red-500">*</span></label>
                <select value={formData.platform} onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary bg-white">
                  <option value="">选择平台</option>
                  <option value="toutiao">头条号</option>
                  <option value="zhihu">知乎</option>
                  <option value="xiaohongshu">小红书</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">语气风格</label>
                <select value={formData.tone} onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary bg-white">
                  {tones.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">目标字数</label>
                <select value={formData.length} onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary bg-white">
                  {lengths.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted">要覆盖的目标问句 <span className="text-red-500">*</span></label>
              <textarea placeholder="每行一个问句" value={formData.targetQuestions}
                onChange={(e) => setFormData({ ...formData, targetQuestions: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 h-24 resize-none focus:outline-none focus:border-primary" />
            </div>

            <div className="flex gap-3 pt-2 flex-wrap">
              <button
                onClick={handleGenerateArticle}
                disabled={generating}
                className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {generating ? "生成中..." : "生成文章"}
              </button>
              {articleContent && (
                <button
                  onClick={handleSaveArticle}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? "保存中..." : saved ? "已保存" : "保存到数据库"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 h-fit card-hover">
          <span className="text-xs text-primary font-medium">生成设置</span>
          <h3 className="text-sm font-bold mt-2">资料、规则和发布去向。</h3>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted">套用生成规则</label>
              <select value={selectedRule} onChange={(e) => setSelectedRule(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:border-primary">
                <option value="">不使用预设</option>
                {rules.map((r) => <option key={r.id} value={r.id}>{r.name}（{r.tone}）</option>)}
              </select>
            </div>
            <p className="text-xs text-gray-400">
              {rules.length === 0 ? "暂无生成规则，" : `已配置 ${rules.length} 条规则，`}
              {knowledgeCount === 0 ? "请先到账号知识库完善资料。" : "知识库已有基础资料。"}
            </p>
          </div>
        </div>
      </div>

      {articleContent && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-green-600 font-medium">GENERATED</span>
              <h3 className="text-sm font-bold mt-1">生成结果</h3>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(articleContent)}
              className="text-xs text-muted hover:text-primary transition-colors"
            >
              复制全文
            </button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{articleContent}</div>
        </div>
      )}
    </div>
  )
}
