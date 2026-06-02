"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { cn } from "@/lib/utils"

const founderTraits = ["说话直", "懂门店经营", "会算账", "有江湖气", "重视老客户", "对品质较真", "返乡创业", "不爱讲空话"]
const industries = ["餐饮", "家装建材", "本地生活服务", "美业", "教育培训", "农产品", "实体零售", "企业服务"]
const products = ["到店消费", "套餐团购", "会员卡", "加盟咨询", "私域服务", "定制方案", "本地配送", "课程培训"]
const targetClients = ["本地老板", "同城消费者", "想开店的人", "家庭决策者", "年轻上班族", "宝妈群体", "企业客户", "老客户复购"]
const accountGoals = ["涨同城精准粉", "建立创始人人设", "引导私域咨询", "提升门店到店", "解释产品价值", "招加盟/代理", "提高信任感"]
const contentBans = ["不要专家腔", "不要硬广", "不要过度承诺", "不要全国通用模板", "不要太油腻", "不要攻击同行", "不要虚假案例"]

type IpDetail = {
  id: string
  name: string
  founderName: string | null
  founderTraits: string[] | string | null
  industry: string | null
  products: string[] | string | null
  targetClients: string[] | string | null
  accountGoals: string[] | string | null
  contentBan: string[] | string | null
  contentMixFlow: number
  contentMixPersona: number
  contentMixProduct: number
  createdAt: string
  user: { name: string | null; phone: string } | null
  geoArticles: { id: string; title: string; status: string; createdAt: string }[]
  weeklyPlans: { id: string; weekStart: string; weekEnd: string; items: any[] }[]
}

export default function AdminIpDetailPage() {
  const params = useParams<{ userId: string; ipId: string }>()
  const router = useRouter()
  const { role } = useUser()
  const [ip, setIp] = useState<IpDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"profile" | "articles" | "plans">("profile")

  useEffect(() => {
    if (role !== "admin") { router.push("/dashboard") }
    fetch(`/api/admin/ip-users/${params.userId}/ips/${params.ipId}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => { setIp(data.ip); setLoading(false) })
      .catch(() => setLoading(false))
  }, [role, router, params.userId, params.ipId])

  if (loading) return <div className="p-4 md:p-6 text-gray-400">加载中...</div>
  if (!ip) return <div className="p-4 md:p-6 text-gray-400">IP 不存在</div>

  const parseTags = (val: any): string[] => {
    if (!val) return []
    if (Array.isArray(val)) return val
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val)
        if (Array.isArray(parsed)) return parsed
      } catch { /* not JSON */ }
      return val.split(",").filter(Boolean).map(s => s.trim())
    }
    return []
  }

  const hasTag = (val: any, tag: string) => parseTags(val).includes(tag)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("zh-CN")

  return (
    <div className="min-h-screen bg-background-subtle">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href={`/admin/ips/${params.userId}`} className="text-xs text-muted hover:text-primary transition-colors">← 返回 {ip.user?.name || "—"}</a>
            <span className="text-xs text-gray-400">管理后台</span>
            <span className="text-sm md:text-base font-bold">{ip.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>创建者：{ip.user?.name || ip.user?.phone || "—"}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "profile" as const, label: "IP 人设档案" },
            { key: "articles" as const, label: `GEO 文章 (${ip.geoArticles.length})` },
            { key: "plans" as const, label: `周策划 (${ip.weeklyPlans.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-primary text-white"
                  : "border border-gray-200 text-muted hover:border-primary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <>
            {/* Content Mix */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <span className="text-xs text-primary font-medium tracking-wider">CONTENT MIX</span>
              <h2 className="text-sm font-bold mt-1">默认每周内容配比</h2>
              <p className="text-xs text-gray-400 mt-1">{ip.contentMixFlow}:{ip.contentMixPersona}:{ip.contentMixProduct}</p>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <span className="text-xs text-primary font-medium tracking-wider">IP PROFILE</span>
              <h2 className="text-sm font-bold mt-1">基础信息</h2>

              <div className="mt-4 space-y-6">
                <div>
                  <label className="text-xs font-medium text-muted">IP 名称</label>
                  <p className="text-sm mt-1">{ip.name}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted">创始人姓名</label>
                  <p className="text-sm mt-1">{ip.founderName || "—"}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted">创始人人设特点</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {founderTraits.map(t => (
                      <span
                        key={t}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs border",
                          hasTag(ip.founderTraits, t)
                            ? "border-primary bg-primary-light text-primary"
                            : "border-gray-200 text-gray-300"
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {parseTags(ip.founderTraits).some(t => !founderTraits.includes(t)) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {parseTags(ip.founderTraits).filter(t => !founderTraits.includes(t)).map(t => (
                        <span key={t} className="px-3 py-1.5 rounded-lg text-xs border border-primary bg-primary-light text-primary">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted">行业</label>
                  <p className="text-sm mt-1">{ip.industry || "—"}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted">产品 / 服务</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parseTags(ip.products).length === 0 && <p className="text-sm text-gray-400">—</p>}
                    {parseTags(ip.products).map(t => (
                      <span
                        key={t}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs border",
                          products.includes(t)
                            ? "border-primary bg-primary-light text-primary"
                            : "border-gray-200 text-gray-300"
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted">目标客户</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parseTags(ip.targetClients).length === 0 && <p className="text-sm text-gray-400">—</p>}
                    {parseTags(ip.targetClients).map(t => (
                      <span
                        key={t}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs border",
                          targetClients.includes(t)
                            ? "border-primary bg-primary-light text-primary"
                            : "border-gray-200 text-gray-300"
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted">账号目标</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parseTags(ip.accountGoals).length === 0 && <p className="text-sm text-gray-400">—</p>}
                    {parseTags(ip.accountGoals).map(t => (
                      <span
                        key={t}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs border",
                          accountGoals.includes(t)
                            ? "border-primary bg-primary-light text-primary"
                            : "border-gray-200 text-gray-300"
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted">内容禁区</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parseTags(ip.contentBan).length === 0 && <p className="text-sm text-gray-400">—</p>}
                    {parseTags(ip.contentBan).map(t => (
                      <span
                        key={t}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs border",
                          contentBans.includes(t)
                            ? "border-red-200 bg-red-50 text-red-500"
                            : "border-gray-200 text-gray-300"
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <span className="text-xs text-primary font-medium tracking-wider">META</span>
              <h2 className="text-sm font-bold mt-1">其他信息</h2>
              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <p>创建日期：{fmtDate(ip.createdAt)}</p>
                <p>创建者：{ip.user?.name || ip.user?.phone || "—"}</p>
              </div>
            </div>
          </>
        )}

        {/* GEO Articles Tab */}
        {activeTab === "articles" && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <h2 className="text-sm font-bold">GEO 文章</h2>
            <p className="text-xs text-gray-400 mt-1">共 {ip.geoArticles.length} 篇</p>
            {ip.geoArticles.length === 0 ? (
              <p className="text-xs text-gray-400 mt-6 text-center">暂无文章</p>
            ) : (
              <div className="mt-4 space-y-2">
                {ip.geoArticles.map(article => (
                  <div key={article.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{article.title || "未命名"}</p>
                      <p className="text-xs text-gray-400 mt-1">{fmtDate(article.createdAt)}</p>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      article.status === "published" ? "bg-green-100 text-green-600" :
                      article.status === "draft" ? "bg-yellow-100 text-yellow-600" : "bg-gray-200 text-gray-400"
                    )}>
                      {article.status === "published" ? "已发布" : article.status === "draft" ? "草稿" : article.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Weekly Plans Tab */}
        {activeTab === "plans" && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <h2 className="text-sm font-bold">周策划</h2>
            <p className="text-xs text-gray-400 mt-1">共 {ip.weeklyPlans.length} 个</p>
            {ip.weeklyPlans.length === 0 ? (
              <p className="text-xs text-gray-400 mt-6 text-center">暂无周策划</p>
            ) : (
              <div className="mt-4 space-y-3">
                {ip.weeklyPlans.map(plan => {
                  const weekStart = new Date(plan.weekStart)
                  const weekEnd = new Date(plan.weekEnd)
                  const itemCounts = { traffic: 0, persona: 0, product: 0 }
                  plan.items?.forEach((item: any) => {
                    if (item.contentType in itemCounts) itemCounts[item.contentType as keyof typeof itemCounts]++
                  })
                  return (
                    <div key={plan.id} className="border border-gray-200 rounded-lg px-4 py-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-medium">
                          {weekStart.getMonth() + 1}月{weekStart.getDate()}日 - {weekEnd.getMonth() + 1}月{weekEnd.getDate()}日
                        </span>
                        <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded">
                          {itemCounts.traffic}:{itemCounts.persona}:{itemCounts.product}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {plan.items?.slice(0, 5).map((item: any, i: number) => (
                          <p key={i} className="text-xs text-muted truncate">{item.title}</p>
                        ))}
                        {plan.items?.length > 5 && (
                          <p className="text-xs text-gray-400">+{plan.items.length - 5} 条更多</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
