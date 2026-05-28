"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { QuestionnaireModal } from "@/components/layout/questionnaire-modal"

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<{
    id: string
    name: string
    phone: string
    role: string
    points: number
    hasQuestionnaire: boolean
  } | null>(null)
  const [stats, setStats] = useState<{
    articleTotal: number
    articleRecent7d: number
    weeklyPlanCount: number
    ipTotal: number
    ipWithoutPlan: number
    publishCount: number
    knowledgeCount: number
    generationLogRecent7d: number
    trend: { date: string; count: number }[]
    ipList: { id: string; name: string; industry: string; contentMix: string; articleCount: number; planCount: number; updatedAt: Date }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, statsRes] = await Promise.all([
          fetch("/api/auth/me", { credentials: "include" }),
          fetch("/api/dashboard/stats", { credentials: "include" }),
        ])
        if (!userRes.ok) { setLoading(false); return }
        const userData = await userRes.json()
        if (userData?.user) {
          setUser(userData.user)
          if (!userData.user.hasQuestionnaire) setShowQuestionnaire(true)
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    loadData()
    const interval = setInterval(() => {
      fetch("/api/auth/me", { credentials: "include" })
        .then(r => r.json())
        .then(d => { if (d?.user) setUser(d.user) })
        .catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/home"
  }

  async function handleQuestionnaireSubmit() {
    const res = await fetch("/api/auth/me", { credentials: "include" })
    const data = await res.json()
    if (data?.user) setUser(data.user)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-subtle flex items-center justify-center">
        <div className="text-sm text-gray-400">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background-subtle flex items-center justify-center">
        <div className="text-center px-4">
          <Image src="/logo.png" alt="创世者Copilot" width={280} height={60} className="mx-auto mb-6" />
          <p className="text-muted mb-6">登录后开始管理你的 IP 内容和 AI 创作</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button onClick={() => router.push("/login")} className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              登录
            </button>
            <button onClick={() => router.push("/register")} className="border border-gray-200 text-muted hover:bg-gray-50 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              注册
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4 text-xs text-gray-400 justify-center">
            <span>还没有账号？</span>
            <Link href="/register" className="text-primary hover:text-primary-hover">去注册</Link>
          </div>
        </div>
      </div>
    )
  }

  const s = stats
  const trendMax = s?.trend?.length ? Math.max(...s.trend.map((t) => t.count), 1) : 1

  return (
    <div className="flex h-screen bg-background-subtle">
      {/* Mobile navigation */}
      <MobileNav
        user={{ name: user.name, points: user.points, role: user.role }}
        onLogout={handleLogout}
      />

      <div className="hidden md:block">
        <Sidebar user={{ name: user.name, points: user.points, role: user.role }} onLogout={handleLogout} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-14 bg-white border-b border-gray-200 items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-title">工作区</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-body">
              {user.name} · <span className="text-primary font-medium">{user.points}</span> 积分
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-auto md:pt-0 pt-[56px] pb-16 md:pb-0">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-primary font-medium">工作区总览</span>
            </div>

            {/* HERO PANEL */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 card-hover">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-muted tracking-wider">创世者科技</span>
                  <h1 className="text-lg md:text-xl font-bold mt-1">先把账号是谁讲清楚，再让 AI 写。</h1>
                  <p className="text-xs text-muted mt-1">注册后即可创建 IP、周策划、发布包，数据自动归入账号档案。</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <button onClick={() => router.push("/geo")} className="border border-gray-200 text-muted px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                    GEO 工作台
                  </button>
                  <button onClick={() => router.push("/ip/archive")} className="border border-gray-200 text-muted px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                    发布归档
                  </button>
                </div>
              </div>
            </div>

            <h1 className="text-xl md:text-2xl font-bold mb-6">工作总览</h1>

            {/* METRIC CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              <MetricCard iconBg="bg-primary-light" label="已生成文案" value={String(s?.articleTotal ?? 0)} sub={`${s?.articleRecent7d ?? 0} / 7 天`} />
              <MetricCard iconBg="bg-primary-light" label="周策划" value={String(s?.weeklyPlanCount ?? 0)} sub={`${(s?.ipTotal ?? 0) - (s?.ipWithoutPlan ?? 0)} 个账号已覆盖`} />
              <MetricCard iconBg="bg-primary-light/50" label="IP 账号" value={String(s?.ipTotal ?? 0)} sub={`${s?.ipWithoutPlan ?? 0} 个待策划`} />
              <MetricCard iconBg="bg-gray-900" iconColor="text-white" label="积分余额" value={String(user.points)} sub="可用" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* PRODUCTION TREND */}
              <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5 card-hover">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-medium">产出趋势</span>
                  <span className="text-xs text-muted">近 7 天</span>
                </div>
                {s?.trend && s.trend.length > 0 ? (
                  <div className="flex items-end gap-3 h-32">
                    {s.trend.map((d) => (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-muted">{d.count}</span>
                        <div className="w-full bg-gray-200 rounded-t h-20 relative">
                          <div
                            className="absolute bottom-0 w-full bg-primary rounded-t transition-all"
                            style={{ height: `${Math.max((d.count / trendMax) * 100, 4)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{d.date}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
                    暂无数据
                  </div>
                )}
              </div>

              {/* ASSET DISTRIBUTION */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">资产分布</span>
                  <span className="text-xs text-muted">{(s?.publishCount ?? 0) + (s?.weeklyPlanCount ?? 0) + (s?.ipTotal ?? 0)}</span>
                </div>
                <div className="space-y-4">
                  <AssetBar label="发布包" value={s?.publishCount ?? 0} color="bg-primary" />
                  <AssetBar label="周策划" value={s?.weeklyPlanCount ?? 0} color="bg-primary-mid" />
                  <AssetBar label="IP 账号" value={s?.ipTotal ?? 0} color="bg-primary-light" />
                </div>
              </div>
            </div>

            {/* IP LOOKABOARD + QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">账号看板</span>
                  <span className="text-xs text-muted">{s?.ipList.length ?? 0} 个 IP</span>
                </div>
                {s?.ipList && s.ipList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs text-muted">
                          <th className="text-left py-2 font-medium">IP</th>
                          <th className="text-left py-2 font-medium">行业</th>
                          <th className="text-left py-2 font-medium">内容配比</th>
                          <th className="text-left py-2 font-medium">周策划</th>
                          <th className="text-left py-2 font-medium">最近更新</th>
                          <th className="text-left py-2 font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.ipList.map((ip) => (
                          <tr key={ip.id} className="border-b border-gray-200 last:border-0">
                            <td className="py-3 font-medium text-title">
                              <button
                                onClick={() => router.push(`/ip/${ip.id}/profile`)}
                                className="hover:text-primary transition-colors"
                              >
                                {ip.name}
                              </button>
                            </td>
                            <td className="py-3 text-body">{ip.industry}</td>
                            <td className="py-3">
                              <span className="bg-primary-light text-primary px-2 py-0.5 rounded text-xs font-medium">{ip.contentMix}</span>
                            </td>
                            <td className="py-3 text-muted">{ip.planCount} 次</td>
                            <td className="py-3 text-gray-400 text-xs">{formatDate(ip.updatedAt)}</td>
                            <td className="py-3">
                              <button
                                onClick={() => router.push(`/ip/${ip.id}/weekly-plan`)}
                                className="border border-gray-200 text-muted px-3 py-1 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                              >
                                生成周策划
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <span className="text-body text-sm mb-4">还没有 IP 账号</span>
                    <button onClick={() => router.push("/ip/create")} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      创建第一个 IP
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
                <span className="text-sm font-medium">快捷动作</span>
                <div className="mt-4 space-y-2">
                  <QuickActionBtn label="创建 IP" primary onClick={() => router.push("/ip/create")} />
                  <QuickActionBtn label="GEO 工作台" onClick={() => router.push("/geo")} />
                  <QuickActionBtn label="发布归档" onClick={() => router.push("/ip/archive")} />
                  <QuickActionBtn label="积分充值" onClick={() => router.push("/account/recharge")} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <QuestionnaireModal
        open={showQuestionnaire}
        onClose={() => setShowQuestionnaire(false)}
        onSubmit={handleQuestionnaireSubmit}
      />
    </div>
  )
}

function formatDate(d: Date) {
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
}

function MetricCard({
  iconBg, iconColor, label, value, sub,
}: {
  iconBg: string; iconColor?: string; label: string; value: string; sub: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 card-hover">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-4 h-4 rounded flex items-center justify-center", iconBg)}>
          <span className={cn("text-xs", iconColor)}>#</span>
        </div>
        <span className="text-xs text-muted">{label}</span>
      </div>
      <div className="text-2xl md:text-3xl font-bold">{value}</div>
      <span className="text-xs text-gray-400 mt-1 inline-block">{sub}</span>
    </div>
  )
}

function AssetBar({ label, value, color }: { label: string; value: number; color: string }) {
  const max = Math.max(value, 1)
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="text-gray-400">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={cn("h-1.5 rounded-full transition-all", color)} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  )
}

function QuickActionBtn({ label, primary, onClick }: { label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "w-full py-2.5 rounded-lg text-sm font-medium transition-colors text-center",
      primary ? "bg-primary hover:bg-primary-hover text-white" : "border border-gray-200 text-muted hover:bg-gray-50"
    )}>
      {label}
    </button>
  )
}
