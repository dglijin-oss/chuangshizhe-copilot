"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const founderTraits = ["说话直", "懂门店经营", "会算账", "有江湖气", "重视老客户", "对品质较真", "返乡创业", "不爱讲空话"]
const industries = ["餐饮", "家装建材", "本地生活服务", "美业", "教育培训", "农产品", "实体零售", "企业服务"]
const products = ["到店消费", "套餐团购", "会员卡", "加盟咨询", "私域服务", "定制方案", "本地配送", "课程培训"]
const targetClients = ["本地老板", "同城消费者", "想开店的人", "家庭决策者", "年轻上班族", "宝妈群体", "企业客户", "老客户复购"]
const accountGoals = ["涨同城精准粉", "建立创始人人设", "引导私域咨询", "提升门店到店", "解释产品价值", "招加盟/代理", "提高信任感"]
const contentBans = ["不要专家腔", "不要硬广", "不要过度承诺", "不要全国通用模板", "不要太油腻", "不要攻击同行", "不要虚假案例"]

export default function CreateIpPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "", founderName: "", founderTraits: [] as string[], industry: "",
    products: [] as string[], targetClients: [] as string[], accountGoals: [] as string[],
    contentBan: [] as string[], contentMixFlow: "4", contentMixPersona: "2", contentMixProduct: "1",
  })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(false)
  const [description, setDescription] = useState("")
  const [aiFilling, setAiFilling] = useState(false)
  const [aiFilled, setAiFilled] = useState(false)

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

  const handleSubmit = async () => {
    if (!form.name) { setError("请输入 IP 名称"); return }
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch("/api/ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "创建失败"); return }
      setCreated(true)
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAiFill = async () => {
    if (!description) { setError("请先输入描述"); return }
    setError("")
    setAiFilling(true)
    try {
      const res = await fetch("/api/ai/ipbrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      if (data.profile) {
        const p = data.profile
        setForm((prev) => ({
          ...prev,
          name: p.name || prev.name,
          founderName: p.founderName || prev.founderName,
          industry: p.industry || prev.industry,
          founderTraits: Array.isArray(p.founderTraits) ? p.founderTraits : prev.founderTraits,
          products: Array.isArray(p.products) ? p.products : prev.products,
          targetClients: Array.isArray(p.targetClients) ? p.targetClients : prev.targetClients,
          accountGoals: Array.isArray(p.accountGoals) ? p.accountGoals : prev.accountGoals,
          contentBan: Array.isArray(p.contentBan) ? p.contentBan : prev.contentBan,
        }))
        setAiFilled(true)
        setTimeout(() => {
          document.getElementById("knowledge-base-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 100)
      } else {
        setError("AI 未能解析出人设信息，请尝试换一种描述方式")
      }
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setAiFilling(false)
    }
  }

  if (created) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-lg font-bold mb-2">IP 档案创建成功！</h2>
          <p className="text-sm text-muted mb-6">{form.name}</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button onClick={() => router.push("/")} className="border border-gray-200 text-muted px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              返回首页
            </button>
            <button
              onClick={() => {
                setCreated(false)
                setForm({ name: "", founderName: "", founderTraits: [], industry: "", products: [], targetClients: [], accountGoals: [], contentBan: [], contentMixFlow: "4", contentMixPersona: "2", contentMixProduct: "1" })
                setDescription("")
              }}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              继续创建
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 card-hover">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs text-primary font-medium">创建新策划方案</span>
        </div>
        <h1 className="text-base md:text-lg font-bold">先把这个账号是谁，讲清楚。</h1>
        <p className="text-xs text-muted mt-1">知识库只录一次，后面每周选题池和单条发布包都会基于它来生成。</p>
      </div>

      {error && <p className="text-xs text-red-500 mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* AI AUTO-FILL */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 card-hover">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div>
            <span className="text-xs text-primary font-medium">AI AUTO-FILL</span>
            <h2 className="text-sm font-bold mt-1">用一段话描述这个 IP，AI 自动提取人设信息</h2>
          </div>
          <button
            onClick={handleAiFill}
            disabled={aiFilling || !description}
            className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {aiFilling ? "分析中..." : "AI 自动填充"}
          </button>
        </div>
        <textarea
          placeholder="例如：老韦，40岁，在广西梧州做六堡茶15年，说话很直接，主要做线下门店和私域客户，想通过抖音扩大影响力，目标是招加盟代理..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div id="knowledge-base-section" className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
            <span className="text-xs text-primary font-medium">KNOWLEDGE BASE</span>
            <h2 className="text-sm font-bold mt-1">这个 IP 的底层资料。</h2>
            {aiFilled && (
              <p className="text-xs text-green-600 mt-1 bg-green-50 px-3 py-1.5 rounded-lg inline-block">✓ AI 已自动填充下方字段，请检查并调整</p>
            )}

            <div className="mt-4 space-y-6">
              {/* IP 名称 */}
              <div>
                <label className="text-xs font-medium text-muted">IP 名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="比如：老韦的广西餐饮号"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary"
                />
              </div>

              {/* 创始人姓名 */}
              <div>
                <label className="text-xs font-medium text-muted">创始人姓名</label>
                <input
                  type="text"
                  placeholder="比如：韦总"
                  value={form.founderName}
                  onChange={(e) => setForm({ ...form, founderName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary"
                />
              </div>

              {/* 创始人人设特点 */}
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
                  placeholder="可以补充一句更具体的人设，比如：对员工要求高，但对老客户很讲义气。"
                  value={form.founderTraits.join("，")}
                  onChange={(e) => syncTextareaToArray("founderTraits", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 h-16 resize-none focus:outline-none focus:border-primary"
                />
              </div>

              {/* 行业 */}
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
                  placeholder="比如：连锁餐饮 / 家装 / 门店零售"
                  value={form.industry && !industries.includes(form.industry) ? form.industry : ""}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 focus:outline-none focus:border-primary"
                />
              </div>

              {/* 产品/服务 */}
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
                  placeholder="可以补充具体产品名、价格带、服务流程。"
                  value={form.products.join("，")}
                  onChange={(e) => syncTextareaToArray("products", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 h-16 resize-none focus:outline-none focus:border-primary"
                />
              </div>

              {/* 目标客户 */}
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
                  placeholder="可以补充年龄、城市、消费能力或真实痛点。"
                  value={form.targetClients.join("，")}
                  onChange={(e) => syncTextareaToArray("targetClients", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 h-16 resize-none focus:outline-none focus:border-primary"
                />
              </div>

              {/* 账号目标 */}
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
                  placeholder="可以补充阶段目标，比如先涨同城精准粉，后面转私域咨询。"
                  value={form.accountGoals.join("，")}
                  onChange={(e) => syncTextareaToArray("accountGoals", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 h-16 resize-none focus:outline-none focus:border-primary"
                />
              </div>

              {/* 内容禁区 */}
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
                  placeholder="可以补充不能碰的话题、品牌语气、合规边界。"
                  value={form.contentBan.join("，")}
                  onChange={(e) => syncTextareaToArray("contentBan", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 h-16 resize-none focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* CONTENT MIX */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
            <span className="text-xs text-primary font-medium">CONTENT MIX</span>
            <h2 className="text-sm font-bold mt-1">默认每周内容配比</h2>
            <p className="text-xs text-muted mt-1">4:2:1</p>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="text-xs text-muted">流量型</label>
                <input
                  type="number"
                  value={form.contentMixFlow}
                  onChange={(e) => setForm({ ...form, contentMixFlow: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted">人设型</label>
                <input
                  type="number"
                  value={form.contentMixPersona}
                  onChange={(e) => setForm({ ...form, contentMixPersona: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted">产品型</label>
                <input
                  type="number"
                  value={form.contentMixProduct}
                  onChange={(e) => setForm({ ...form, contentMixProduct: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 h-fit card-hover">
          <span className="text-xs text-primary font-medium">IP RULES</span>
          <h2 className="text-sm font-bold mt-2">先把"谁在说"写清楚，再让 agent 去写。</h2>
          <ul className="mt-4 space-y-3 text-xs text-muted">
            <li className="flex gap-2"><span className="text-primary">•</span> 创始人特点决定人设型内容怎么立得住。</li>
            <li className="flex gap-2"><span className="text-primary">•</span> 行业、产品、客户决定产品型内容不会写偏。</li>
            <li className="flex gap-2"><span className="text-primary">•</span> 账号目标和内容禁区，决定整周内容不会跑成别人的号。</li>
          </ul>
        </div>
      </div>

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl px-6 py-3 shadow-lg z-50 flex items-center gap-4">
        <span className="text-xs text-gray-400">填完后点击创建</span>
        <button
          onClick={handleSubmit}
          disabled={submitting || !form.name}
          className={cn(
            "bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors",
            (submitting || !form.name) && "opacity-50 cursor-not-allowed"
          )}
        >
          {submitting ? "创建中..." : "创建 IP 档案"}
        </button>
      </div>
    </div>
  )
}
