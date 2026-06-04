"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { QuestionnaireModal } from "@/components/layout/questionnaire-modal"

/* ---- 3D Tilt Card with glare ---- */

function TiltCard({
  children,
  className,
  glowColor = "rgba(99,102,241,0.08)",
}: {
  children: React.ReactNode
  className?: string
  glowColor?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState("")
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })
  const rafRef = useRef<number>(0)

  const handleMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      setTransform(`perspective(800px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 6}deg) scale3d(1.01,1.01,1.01)`)
      setGlare({ x: x * 100, y: y * 100, opacity: 1 })
    })
  }, [])

  const handleLeave = useCallback(() => {
    setTransform("")
    setGlare((g) => ({ ...g, opacity: 0 }))
  }, [])

  return (
    <div
      ref={ref}
      className={cn("relative transition-transform duration-200 ease-out will-change-transform", className)}
      style={{ transform }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${glowColor}, transparent 60%)`,
          opacity: glare.opacity,
        }}
      />
    </div>
  )
}

/* ---- Elastic Button ---- */

function ElasticButton({
  children,
  onClick,
  className,
  variant = "primary",
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: "primary" | "secondary" | "ghost"
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null)
  const [scale, setScale] = useState(1)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() })
      setTimeout(() => setRipple(null), 600)
    }
    onClick?.()
  }

  return (
    <button
      ref={btnRef}
      className={cn(
        "relative overflow-hidden rounded-lg font-medium transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
        variant === "primary" && "bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 hover:shadow-primary/30",
        variant === "secondary" && "bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-100",
        variant === "ghost" && "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
        className,
      )}
      onClick={handleClick}
      onMouseEnter={() => setScale(1.02)}
      onMouseLeave={() => setScale(1)}
      style={{ transform: `scale(${scale})` }}
    >
      {children}
      {ripple && (
        <span
          className="pointer-events-none absolute rounded-full bg-white/30 animate-ping"
          style={{ left: ripple.x - 10, top: ripple.y - 10, width: 20, height: 20 }}
        />
      )}
    </button>
  )
}

/* ---- Animated Counter ---- */

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        let startTime: number
        let raf: number
        const step = (ts: number) => {
          if (!startTime) startTime = ts
          const progress = Math.min((ts - startTime) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(eased * value))
          if (progress < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value, duration])

  return <div ref={ref}>{count}</div>
}

/* ---- Reveal on scroll ---- */

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        !visible && "opacity-0 translate-y-6",
        visible && "opacity-100 translate-y-0",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ---- Metric Card ---- */

function MetricCard({
  label, value, sub, iconColor = "bg-primary-light",
}: {
  label: string; value: number | string; sub: string; iconColor?: string
}) {
  return (
    <TiltCard className="bg-white rounded-xl border border-gray-200 p-4 card-hover">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <div className={cn("w-4 h-4 rounded-full", iconColor)} />
      </div>
      <div className="text-2xl md:text-3xl font-bold text-gray-900">
        <AnimatedNumber value={Number(value) || 0} />
      </div>
      <span className="text-xs text-gray-400 mt-1 inline-block">{sub}</span>
    </TiltCard>
  )
}

/* ---- Asset Bar ---- */

function AssetBar({ label, value, color, max }: { label: string; value: number; color: string; max: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-600 font-medium">{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn("h-1.5 rounded-full transition-all duration-1000 ease-out", color)}
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}

/* ---- Main Page ---- */

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<{
    id: string; name: string; phone: string; role: string; points: number; hasQuestionnaire: boolean
  } | null>(null)
  const [stats, setStats] = useState<{
    articleTotal: number; articleRecent7d: number; weeklyPlanCount: number;
    ipTotal: number; ipWithoutPlan: number; publishCount: number;
    knowledgeCount: number; generationLogRecent7d: number;
    trend: { date: string; count: number }[];
    ipList: { id: string; name: string; industry: string; contentMix: string; articleCount: number; planCount: number; updatedAt: Date }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [scrollY, setScrollY] = useState(0)

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
      } catch { /* ignore */ }
      finally { setLoading(false) }
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

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm text-gray-400">加载中...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <Image src="/logo.png" alt="创世者Copilot" width={280} height={60} className="mx-auto mb-6" />
          <p className="text-gray-500 mb-6">登录后开始管理你的 IP 内容和 AI 创作</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <ElasticButton onClick={() => router.push("/login")} variant="primary" className="px-6 py-2.5 text-sm">登录</ElasticButton>
            <ElasticButton onClick={() => router.push("/register")} variant="secondary" className="px-6 py-2.5 text-sm">注册</ElasticButton>
          </div>
        </div>
      </div>
    )
  }

  const s = stats
  const trendMax = s?.trend?.length ? Math.max(...s.trend.map((t) => t.count), 1) : 1
  const assetMax = Math.max(s?.publishCount ?? 0, s?.weeklyPlanCount ?? 0, s?.ipTotal ?? 0, 1)

  return (
    <div className="flex h-screen bg-gray-50">
      <MobileNav user={{ name: user.name, points: user.points, role: user.role }} onLogout={handleLogout} />
      <div className="hidden md:block">
        <Sidebar user={{ name: user.name, points: user.points, role: user.role }} onLogout={handleLogout} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="hidden md:flex h-14 bg-white border-b border-gray-200 items-center justify-between px-4 md:px-6 flex-shrink-0">
          <span className="text-sm font-medium text-gray-900">工作区</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              {user.name} · <span className="text-primary font-semibold">{user.points}</span> 积分
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto md:pt-0 pt-[56px] pb-16 md:pb-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">

            {/* Section Label */}
            <Reveal>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs text-primary font-semibold tracking-wider">工作区总览</span>
              </div>
            </Reveal>

            {/* Hero Panel */}
            <Reveal delay={50}>
              <TiltCard className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] text-gray-400 tracking-widest">创世者科技</span>
                    <h1 className="text-lg md:text-xl font-bold text-gray-900 mt-1">先把账号是谁讲清楚，再让 AI 写。</h1>
                    <p className="text-xs text-gray-500 mt-1">注册后即可创建 IP、周策划、发布包，数据自动归入账号档案。</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    <ElasticButton onClick={() => router.push("/geo")} variant="secondary" className="px-4 py-2 text-xs">GEO 工作台</ElasticButton>
                    <ElasticButton onClick={() => router.push("/ip/archive")} variant="secondary" className="px-4 py-2 text-xs">发布归档</ElasticButton>
                  </div>
                </div>
              </TiltCard>
            </Reveal>

            {/* Metric Cards */}
            <Reveal delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <MetricCard iconColor="bg-primary/10" label="已生成文案" value={s?.articleTotal ?? 0} sub={`${s?.articleRecent7d ?? 0} / 7 天`} />
                <MetricCard iconColor="bg-primary/10" label="周策划" value={s?.weeklyPlanCount ?? 0} sub={`${(s?.ipTotal ?? 0) - (s?.ipWithoutPlan ?? 0)} 个账号已覆盖`} />
                <MetricCard iconColor="bg-purple-100" label="IP 账号" value={s?.ipTotal ?? 0} sub={`${s?.ipWithoutPlan ?? 0} 个待策划`} />
                <MetricCard iconColor="bg-primary/20" label="积分余额" value={user.points} sub="可用" />
              </div>
            </Reveal>

            {/* Chart Row */}
            <Reveal delay={200}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Production Trend */}
                <TiltCard className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5 card-hover">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-semibold text-gray-900">产出趋势</span>
                    <span className="text-xs text-gray-400">近 7 天</span>
                  </div>
                  {s?.trend && s.trend.length > 0 ? (
                    <div className="flex items-end gap-4 h-32">
                      {s.trend.map((d) => (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-xs text-gray-600 font-medium">{d.count}</span>
                          <div className="w-full bg-gray-100 rounded-md h-20 relative overflow-hidden">
                            <div
                              className="absolute bottom-0 w-full bg-primary rounded-md transition-all duration-1000 ease-out"
                              style={{ height: `${Math.max((d.count / trendMax) * 100, 4)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{d.date}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-gray-400 text-sm">暂无数据</div>
                  )}
                </TiltCard>

                {/* Asset Distribution */}
                <TiltCard className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-sm font-semibold text-gray-900">资产分布</span>
                    <span className="text-xs text-gray-400">{(s?.publishCount ?? 0) + (s?.weeklyPlanCount ?? 0) + (s?.ipTotal ?? 0)}</span>
                  </div>
                  <div className="space-y-5">
                    <AssetBar label="发布包" value={s?.publishCount ?? 0} color="bg-primary" max={assetMax} />
                    <AssetBar label="周策划" value={s?.weeklyPlanCount ?? 0} color="bg-primary-mid" max={assetMax} />
                    <AssetBar label="IP 账号" value={s?.ipTotal ?? 0} color="bg-purple-400" max={assetMax} />
                  </div>
                </TiltCard>
              </div>
            </Reveal>

            {/* IP Lookaboard + Quick Actions */}
            <Reveal delay={300}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* IP Table */}
                <TiltCard className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5 card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-900">账号看板</span>
                    <span className="text-xs text-gray-400">{s?.ipList.length ?? 0} 个 IP</span>
                  </div>
                  {s?.ipList && s.ipList.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[500px]">
                        <thead>
                          <tr className="border-b border-gray-200 text-xs text-gray-400">
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
                            <tr key={ip.id} className="border-b border-gray-100 last:border-0">
                              <td className="py-3 font-medium text-gray-900">
                                <button onClick={() => router.push(`/ip/${ip.id}/profile`)} className="hover:text-primary transition-colors">
                                  {ip.name}
                                </button>
                              </td>
                              <td className="py-3 text-gray-600">{ip.industry}</td>
                              <td className="py-3">
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold">{ip.contentMix}</span>
                              </td>
                              <td className="py-3 text-gray-400">{ip.planCount} 次</td>
                              <td className="py-3 text-gray-400 text-xs">{formatDate(ip.updatedAt)}</td>
                              <td className="py-3">
                                <button onClick={() => router.push(`/ip/${ip.id}/weekly-plan`)} className="bg-gray-50 text-gray-600 px-3 py-1 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors border border-gray-200">
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
                      <span className="text-gray-500 text-sm mb-4">还没有 IP 账号</span>
                      <ElasticButton onClick={() => router.push("/ip/create")} variant="primary" className="px-4 py-2 text-sm">创建第一个 IP</ElasticButton>
                    </div>
                  )}
                </TiltCard>

                {/* IP Health */}
                <TiltCard className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
                  <span className="text-sm font-semibold text-gray-900 mb-4 block">IP 健康度</span>
                  <div className="space-y-4">
                    {(s?.ipList || []).map((ip) => {
                      const health = (ip as any).health ?? 50
                      const color = health >= 70 ? "bg-green-500" : health >= 50 ? "bg-primary" : "bg-orange-500"
                      const textColor = health >= 70 ? "text-green-500" : health >= 50 ? "text-primary" : "text-orange-500"
                      return (
                        <div key={ip.id}>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-gray-700 font-medium">{ip.name}</span>
                            <span className={cn("font-bold", textColor)}>{health}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={cn("h-2 rounded-full transition-all duration-1000 ease-out", color)}
                              style={{ width: `${health}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </TiltCard>

                {/* Daily Tip */}
                {s?.dailyTip && (
                  <TiltCard className="bg-primary/5 rounded-xl border border-primary/15 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5-2 7H9c0-2-2-4-2-7a7 7 0 0 1 7-7z"/>
                          <path d="M9 18h6"/>
                          <path d="M12 22v-4"/>
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-primary block mb-1">今日提示</span>
                        <p className="text-xs text-gray-600 leading-relaxed">{s.dailyTip}</p>
                      </div>
                    </div>
                  </TiltCard>
                )}

                {/* Quick Actions */}
                <TiltCard className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
                  <span className="text-sm font-semibold text-gray-900">快捷动作</span>
                  <div className="mt-4 space-y-2">
                    <ElasticButton onClick={() => router.push("/ip/create")} variant="primary" className="w-full py-2.5 text-sm">创建 IP</ElasticButton>
                    <ElasticButton onClick={() => router.push("/geo")} variant="secondary" className="w-full py-2.5 text-sm">GEO 工作台</ElasticButton>
                    <ElasticButton onClick={() => router.push("/ip/archive")} variant="secondary" className="w-full py-2.5 text-sm">发布归档</ElasticButton>
                    <ElasticButton onClick={() => router.push("/account/recharge")} variant="secondary" className="w-full py-2.5 text-sm">积分充值</ElasticButton>
                  </div>
                </TiltCard>
              </div>
            </Reveal>
          </div>
        </main>
      </div>

      <QuestionnaireModal open={showQuestionnaire} onClose={() => setShowQuestionnaire(false)} onSubmit={handleQuestionnaireSubmit} />
    </div>
  )
}

function formatDate(d: Date) {
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
}
