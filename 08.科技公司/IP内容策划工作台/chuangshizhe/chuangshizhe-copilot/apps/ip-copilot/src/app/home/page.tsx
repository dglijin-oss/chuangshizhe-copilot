"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  FileText, ArrowRight, LogOut, Brain, PenTool, BarChart3,
  BookOpen, Sparkles, Globe, Sparkle, Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const taglines = [
  "AI 驱动的内容策划与生产引擎",
  "从选题到发布，全流程智能加速",
  "一个 IP，一套打法，一周一迭代",
]

const ipFeatures = [
  { icon: PenTool, label: "AI 文案生成", desc: "口播脚本、标题、钩子一键产出" },
  { icon: Brain, label: "智能周策划", desc: "流量型 / 人设型 / 产品型结构化排期" },
  { icon: BookOpen, label: "知识库编译", desc: "从素材到 Wiki，AI 自动沉淀知识" },
  { icon: Globe, label: "GEO 增长", desc: "AI 地图内容 + 搜索优化，全域获客" },
]

const xuanxueFeatures = [
  { icon: Sparkles, label: "十大玄学技能", desc: "八字、六爻、奇门、紫微、风水等一站式平台" },
  { icon: Brain, label: "智能排盘", desc: "自动排盘分析，五行大运、十神格局" },
  { icon: BarChart3, label: "占卜记录", desc: "每次占卜自动存档，随时查看历史" },
  { icon: BookOpen, label: "积分计费", desc: "按次扣费，统一走积分系统，灵活可控" },
]

/* ---- Hooks ---- */

function useTypewriter(texts: string[], speed = 80, deleteSpeed = 40, pause = 2000) {
  const [display, setDisplay] = useState("")
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[textIndex]
    let timer: ReturnType<typeof setTimeout>

    if (!deleting) {
      if (charIndex < current.length) {
        timer = setTimeout(() => setCharIndex((c) => c + 1), speed)
        setDisplay(current.slice(0, charIndex + 1))
      } else {
        timer = setTimeout(() => setDeleting(true), pause)
      }
    } else {
      if (charIndex > 0) {
        timer = setTimeout(() => setCharIndex((c) => c - 1), deleteSpeed)
        setDisplay(current.slice(0, charIndex - 1))
      } else {
        setDeleting(false)
        setTextIndex((i) => (i + 1) % texts.length)
      }
    }

    return () => clearTimeout(timer)
  }, [charIndex, deleting, textIndex, texts, speed, deleteSpeed, pause])

  return display
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

function useCounter(target: number, duration = 2000, start: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    let raf: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, start])
  return count
}

/* ---- 3D Tilt Card ---- */

function TiltCard({
  children,
  className,
  glowColor = "rgba(99,102,241,0.15)",
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
      const rotateX = (0.5 - y) * 12
      const rotateY = (x - 0.5) * 12
      setTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`)
      setGlare({ x: x * 100, y: y * 100, opacity: 1 })
    })
  }, [])

  const handleLeave = useCallback(() => {
    setTransform("perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)")
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
      {/* Glare overlay */}
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

  const baseStyles = cn(
    "relative overflow-hidden rounded-full font-medium transition-all duration-300 ease-out",
    "hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
    variant === "primary" && "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40",
    variant === "secondary" && "bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-700",
    variant === "ghost" && "text-zinc-400 hover:text-white",
    className,
  )

  return (
    <button
      ref={btnRef}
      className={baseStyles}
      onClick={handleClick}
      onMouseEnter={() => setScale(1.03)}
      onMouseLeave={() => setScale(1)}
      style={{ transform: `scale(${scale})` }}
    >
      {children}
      {ripple && (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full bg-white/30 animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      )}
    </button>
  )
}

/* ---- Feature Card (3D tilt) ---- */

function FeatureCard({
  icon: Icon,
  label,
  desc,
  index,
  color,
  accentColor,
}: {
  icon: any
  label: string
  desc: string
  index: number
  color: string
  accentColor?: string
}) {
  const { ref, visible } = useInView()
  return (
    <TiltCard
      className={cn(
        "group bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-5",
        !visible && "opacity-0 translate-y-6",
        visible && "animate-fade-in-up",
      )}
      glowColor={accentColor || "rgba(99,102,241,0.15)"}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div
        ref={ref}
        className="flex items-center gap-4"
      >
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-500 group-hover:rotate-12",
            color,
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white mb-0.5">{label}</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    </TiltCard>
  )
}

/* ---- Stat Item with animated gradient border ---- */

function StatItem({ value, suffix, label, index, animate }: { value: number; suffix: string; label: string; index: number; animate: boolean }) {
  const count = useCounter(value, 2000, animate)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div ref={ref} className="relative group">
      {/* Animated gradient border */}
      <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative text-center px-8 py-4">
        <div className="text-3xl md:text-4xl font-bold text-white transition-transform duration-300 group-hover:scale-110">
          {count}<span className="text-indigo-400">{suffix}</span>
        </div>
        <div className="text-xs text-zinc-500 mt-1 tracking-wider">{label}</div>
      </div>
    </div>
  )
}

/* ---- Floating Orb Background ---- */

function FloatingOrbs() {
  return (
    <>
      <div
        className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, #6366F1, transparent 70%)",
          top: "10%",
          left: "20%",
          animation: "orb-float 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, #A855F7, transparent 70%)",
          top: "30%",
          right: "15%",
          animation: "orb-float 15s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, #34D399, transparent 70%)",
          bottom: "20%",
          left: "40%",
          animation: "orb-float 10s ease-in-out infinite 2s",
        }}
      />
    </>
  )
}

/* ---- Gradient Border Card ---- */

function GradientBorderCard({
  children,
  className,
  gradient = "from-indigo-500 to-purple-500",
}: {
  children: React.ReactNode
  className?: string
  gradient?: string
}) {
  return (
    <div className={cn("relative group", className)}>
      {/* Gradient border */}
      <div className={cn(
        "absolute -inset-px rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        gradient,
      )} />
      <div className="relative bg-zinc-900/80 backdrop-blur rounded-xl border border-zinc-800 group-hover:border-transparent transition-colors duration-500">
        {children}
      </div>
    </div>
  )
}

/* ---- Product Section ---- */

function ProductSection({
  title,
  subtitle,
  desc,
  features,
  accentColor,
  accentBg,
  accentBorder,
  icon: Icon,
  href,
  reversed,
}: {
  title: string
  subtitle: string
  desc: string
  features: { icon: any; label: string; desc: string }[]
  accentColor: string
  accentBg: string
  accentBorder: string
  icon: any
  href: string
  reversed?: boolean
}) {
  const { ref, visible } = useInView()
  const router = useRouter()

  return (
    <section ref={ref} className="py-16 md:py-20">
      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto px-6",
        !visible && "reveal-hidden",
      )}>
        {/* Left: Info */}
        <div className={cn(reversed ? "lg:order-2" : "")}>
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4",
            accentBg,
          )}>
            <Icon className="w-3.5 h-3.5" />
            {subtitle}
          </div>
          <h2 className={cn(
            "text-2xl md:text-3xl font-bold mb-3 text-white",
            !visible && "opacity-0",
            visible && "animate-slide-left",
          )}>
            {title}
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed mb-6">
            {desc}
          </p>
          <ElasticButton
            onClick={() => router.push(href)}
            className="inline-flex items-center gap-2 text-sm font-medium"
            variant={reversed ? "secondary" : "primary"}
          >
            <span>{reversed ? "进入玄学" : "进入系统"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </ElasticButton>
        </div>

        {/* Right: Feature grid */}
        <div className={cn("grid grid-cols-1 gap-3", reversed ? "lg:order-1" : "")}>
          {features.map((f, i) => (
            <FeatureCard
              key={f.label}
              {...f}
              index={i}
              color={accentColor}
              accentColor={accentBorder}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---- Main Page ---- */

export default function ProductsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; points: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const typewriterText = useTypewriter(taglines, 80, 40, 2500)
  const [ipCount] = useState(() => 1000 + Math.floor(Math.random() * 1000))
  const [counterStarted, setCounterStarted] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const stats = [
    { value: ipCount, suffix: "+", label: "IP 矩阵" },
    { value: 98, suffix: "项", label: "核心能力" },
    { value: 39, suffix: "+", label: "智能体" },
  ]

  useEffect(() => { setCounterStarted(true) }, [])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setUser(d.user)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    router.refresh()
    router.push("/home")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-indigo-500/40 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-white overflow-hidden">
      {/* ===== Animated Background ===== */}
      <div className="fixed inset-0 pointer-events-none">
        <FloatingOrbs />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            transform: `translateY(${scrollY * 0.05}px)`,
          }}
        />
      </div>

      {/* ===== Header ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <Image src="/logo.png" alt="创世者Copilot" width={140} height={30} className="object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-xs text-zinc-500 hidden sm:inline">
                  {user.name} · <span className="text-indigo-400 font-medium">{user.points}</span> 积分
                </span>
                <button onClick={handleLogout} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 font-medium transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> 退出
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-xs text-zinc-500 hover:text-white font-medium transition-colors">登录</Link>
                <Link href="/register" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">注册</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative min-h-screen flex items-center justify-center">
        <FloatingOrbs />
        <div className="text-center px-6 max-w-4xl mx-auto relative z-10">
          <div className="animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-10">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              <span className="text-sm text-zinc-500 font-medium tracking-wider">创世者 Copilot</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in delay-200">
            <span className="bg-gradient-to-r from-white via-zinc-200 to-white bg-clip-text text-transparent animate-gradient">
              创世者 Copilot
            </span>
          </h1>

          <div className="h-8 mb-10 animate-fade-in delay-500">
            <span className="text-lg md:text-xl text-zinc-500 font-light inline-block tracking-wide">
              {typewriterText}
              <span className="inline-block w-0.5 h-5 bg-indigo-400/60 ml-0.5 align-middle" style={{ animation: "blink 1s step-end infinite" }} />
            </span>
          </div>

          <div className="animate-fade-in delay-700">
            {user ? (
              <div className="flex flex-col items-center gap-5">
                <p className="text-sm text-zinc-600">选择要进入的产品</p>
                <div className="flex gap-4">
                  <ElasticButton
                    onClick={() => router.push("/")}
                    className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium"
                    variant="primary"
                  >
                    <FileText className="w-4 h-4" />
                    IP 内容工作台
                    <ArrowRight className="w-4 h-4" />
                  </ElasticButton>
                  <ElasticButton
                    onClick={() => router.push("/xuanxue")}
                    className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium"
                    variant="secondary"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    玄学工作室
                    <ArrowRight className="w-4 h-4" />
                  </ElasticButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4">
                  <ElasticButton
                    onClick={() => router.push("/login")}
                    className="px-10 py-3.5 text-sm font-medium"
                    variant="primary"
                  >
                    登录
                  </ElasticButton>
                  <ElasticButton
                    onClick={() => router.push("/register")}
                    className="px-10 py-3.5 text-sm font-medium"
                    variant="secondary"
                  >
                    注册
                  </ElasticButton>
                </div>
                <div className="flex gap-4 mt-2">
                  <a
                    href="/downloads/windows-installer.exe"
                    className="inline-flex items-center gap-2 border border-zinc-800 text-zinc-400 px-6 py-2.5 rounded-full text-xs font-medium hover:border-zinc-600 hover:text-white transition-all duration-300"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 12V6.75a.75.75 0 0 1 .75-.75h6.75a.75.75 0 0 1 .75.75V12a.75.75 0 0 1-.75.75H3.75A.75.75 0 0 1 3 12Zm13.5 0V6.75a.75.75 0 0 1 .75-.75h6.75a.75.75 0 0 1 .75.75V12a.75.75 0 0 1-.75.75h-6.75a.75.75 0 0 1-.75-.75ZM3 17.25v-3.5a.75.75 0 0 1 .75-.75h6.75a.75.75 0 0 1 .75.75v3.5A.75.75 0 0 1 10.5 18H3.75a.75.75 0 0 1-.75-.75Zm13.5 0v-3.5a.75.75 0 0 1 .75-.75h6.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-.75.75h-6.75a.75.75 0 0 1-.75-.75Z"/></svg>
                    Windows 下载
                  </a>
                  <a
                    href="/downloads/android-apk.apk"
                    className="inline-flex items-center gap-2 border border-zinc-800 text-zinc-400 px-6 py-2.5 rounded-full text-xs font-medium hover:border-zinc-600 hover:text-white transition-all duration-300"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 11.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.86 3.22c-1.44-.65-3.03-1.01-4.72-1.01-1.69 0-3.28.36-4.72 1.01L5.15 7.71c-.16-.31-.54-.43-.86-.27-.31.16-.43.55-.27.86l1.84 3.18C2.62 13.27.34 16.16.05 19.6h23.9c-.29-3.44-2.57-6.33-6.35-8.12zM6.5 14.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
                    Android 下载
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-down">
          <div className="w-6 h-10 rounded-full border-2 border-zinc-700 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 rounded-full bg-zinc-500 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ===== Stats Bar ===== */}
      <section className="relative py-12 bg-zinc-900/50 border-y border-zinc-800/50">
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((s, i) => (
              <StatItem key={s.label} {...s} index={i} animate={counterStarted} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== IP Content Workbench ===== */}
      <section className="bg-[#09090B]">
        <ProductSection
          title="IP 内容工作台"
          subtitle="AI 内容引擎"
          desc="从选题策划到文案生成，从知识库沉淀到 GEO 增长。AI 驱动的全链路内容生产平台，让你的 IP 内容更有结构、更有效率、更有策略。"
          features={ipFeatures}
          accentColor="bg-indigo-600"
          accentBg="bg-indigo-500/10 text-indigo-400"
          accentBorder="rgba(99,102,241,0.15)"
          icon={FileText}
          href="/"
        />
      </section>

      {/* ===== Xuanxue Module ===== */}
      <section className="bg-zinc-900/30">
        <ProductSection
          title="玄学工作室"
          subtitle="传统绝学"
          desc="八字排盘、六爻纳甲、奇门遁甲、紫微斗数、风水堪舆等十大传统绝学。一键排盘，智能分析，积分计费，让玄学触手可及。"
          features={xuanxueFeatures}
          accentColor="bg-purple-600"
          accentBg="bg-purple-500/10 text-purple-400"
          accentBorder="rgba(168,85,247,0.15)"
          icon={Sparkles}
          href="/xuanxue"
          reversed
        />
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-zinc-900/50 border-t border-zinc-800/50 text-zinc-600 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs">
            创世者 Copilot · AI 驱动的内容生产与策划平台
          </p>
          <p className="text-xs mt-2 text-zinc-700">
            Powered by 广西创世者科技有限公司
          </p>
        </div>
      </footer>
    </div>
  )
}
