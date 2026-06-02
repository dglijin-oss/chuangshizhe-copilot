"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { FileText, ArrowRight, LogOut, Brain, PenTool, BarChart3, BookOpen, Sparkles } from "lucide-react"
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
  { icon: BarChart3, label: "GEO 增长", desc: "AI 地图内容 + 搜索优化，全域获客" },
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

/* ---- Feature Card ---- */

function FeatureCard({ icon: Icon, label, desc, index, color }: { icon: any; label: string; desc: string; index: number; color: string }) {
  const { ref, visible } = useInView()
  return (
    <div
      ref={ref}
      className={cn(
        "group relative bg-white/80 backdrop-blur rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300",
        !visible && "opacity-0 translate-y-4",
        visible && "animate-fade-in-up"
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors duration-300", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h4 className="text-sm font-bold text-gray-900 mb-1">{label}</h4>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}

/* ---- Stat Item ---- */

function StatItem({ value, suffix, label, index, animate }: { value: number; suffix: string; label: string; index: number; animate: boolean }) {
  const count = useCounter(value, 1500, animate)
  return (
    <div className="text-center group">
      <div className="text-3xl md:text-4xl font-bold text-white transition-transform duration-300 group-hover:scale-110">
        {count}{suffix}
      </div>
      <div className="text-xs text-white/60 mt-1 tracking-wider">{label}</div>
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
  icon: Icon,
  href,
  reversed,
}: {
  title: string;
  subtitle: string;
  desc: string;
  features: { icon: any; label: string; desc: string }[];
  accentColor: string;
  accentBg: string;
  icon: any;
  href: string;
  reversed?: boolean;
}) {
  const { ref, visible } = useInView()
  const router = useRouter()

  return (
    <section ref={ref} className="py-16 md:py-20">
      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto px-6",
        !visible && "reveal-hidden"
      )}>
        {/* Left: Info */}
        <div className={cn(reversed ? "lg:order-2" : "")}>
          <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4", accentBg, "text-gray-700")}>
            <Icon className="w-3.5 h-3.5" />
            {subtitle}
          </div>
          <h2 className={cn("text-2xl md:text-3xl font-bold mb-3", !visible && "opacity-0", visible && "animate-slide-left")}>
            {title}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {desc}
          </p>
          <button
            onClick={() => router.push(href)}
            className="group inline-flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <span className="text-primary">进入系统</span>
            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Right: Feature grid */}
        <div className={cn("grid grid-cols-2 gap-3", reversed ? "lg:order-1" : "")}>
          {features.map((f, i) => (
            <FeatureCard key={f.label} {...f} index={i} color={accentColor} />
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
  const stats = [
    { value: ipCount, suffix: "+", label: "IP 矩阵" },
    { value: 98, suffix: "项", label: "核心能力" },
    { value: 39, suffix: "+", label: "智能体" },
  ]

  useEffect(() => { setCounterStarted(true) }, [])

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
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-white/40 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F8FA]">
      {/* ===== Header ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <Image src="/logo.png" alt="创世者Copilot" width={140} height={30} className="object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-xs text-gray-500 hidden sm:inline">
                  {user.name} · <span className="text-primary font-medium">{user.points}</span> 积分
                </span>
                <button onClick={handleLogout} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 font-medium transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> 退出
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-xs text-gray-500 hover:text-gray-900 font-medium">登录</Link>
                <Link href="/register" className="text-xs text-primary hover:underline font-medium">注册</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #060E1A 0%, #0A1628 50%, #060E1A 100%)" }}>
        <div className="text-center px-6 max-w-4xl mx-auto">
          <div className="animate-fade-in">
            <Image src="/logo.png" alt="创世者Copilot" width={220} height={46} className="object-contain mx-auto mb-10 opacity-90" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in delay-200">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              创世者 Copilot
            </span>
          </h1>

          <div className="h-8 mb-10 animate-fade-in delay-500">
            <span className="text-lg md:text-xl text-white/60 font-light inline-block tracking-wide">
              {typewriterText}
              <span className="inline-block w-0.5 h-5 bg-blue-400/60 ml-0.5 align-middle" style={{ animation: "blink 1s step-end infinite" }} />
            </span>
          </div>

          <div className="animate-fade-in delay-700">
            {user ? (
              <button
                onClick={() => router.push("/")}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-10 py-3.5 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300"
              >
                进入工作台
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => router.push("/login")}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-10 py-3.5 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    登录
                  </button>
                  <button
                    onClick={() => router.push("/register")}
                    className="border border-white/20 text-white/80 px-10 py-3.5 rounded-full text-sm font-medium hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-sm"
                  >
                    注册
                  </button>
                </div>
                <div className="flex gap-4 mt-2">
                  <a
                    href="/downloads/windows-installer.exe"
                    className="inline-flex items-center gap-2 border border-white/20 text-white/70 px-6 py-2.5 rounded-full text-xs font-medium hover:bg-white/10 hover:text-white/90 transition-all duration-300 backdrop-blur-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 12V6.75a.75.75 0 0 1 .75-.75h6.75a.75.75 0 0 1 .75.75V12a.75.75 0 0 1-.75.75H3.75A.75.75 0 0 1 3 12Zm13.5 0V6.75a.75.75 0 0 1 .75-.75h6.75a.75.75 0 0 1 .75.75V12a.75.75 0 0 1-.75.75h-6.75a.75.75 0 0 1-.75-.75ZM3 17.25v-3.5a.75.75 0 0 1 .75-.75h6.75a.75.75 0 0 1 .75.75v3.5A.75.75 0 0 1 10.5 18H3.75a.75.75 0 0 1-.75-.75Zm13.5 0v-3.5a.75.75 0 0 1 .75-.75h6.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-.75.75h-6.75a.75.75 0 0 1-.75-.75Z"/></svg>
                    Windows 下载
                  </a>
                  <a
                    href="/downloads/android-apk.apk"
                    className="inline-flex items-center gap-2 border border-white/20 text-white/70 px-6 py-2.5 rounded-full text-xs font-medium hover:bg-white/10 hover:text-white/90 transition-all duration-300 backdrop-blur-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 11.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.86 3.22c-1.44-.65-3.03-1.01-4.72-1.01-1.69 0-3.28.36-4.72 1.01L5.15 7.71c-.16-.31-.54-.43-.86-.27-.31.16-.43.55-.27.86l1.84 3.18C2.62 13.27.34 16.16.05 19.6h23.9c-.29-3.44-2.57-6.33-6.35-8.12zM6.5 14.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
                    Android 下载
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== Stats Bar ===== */}
      <section className="relative py-12 bg-[#0A1628]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A3D62]/20 via-[#1B4332]/20 to-[#0A3D62]/20" />
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((s, i) => (
              <StatItem key={s.label} {...s} index={i} animate={counterStarted} />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </section>

      {/* ===== IP Content Workbench ===== */}
      <section className="bg-white">
        <ProductSection
          title="IP 内容工作台"
          subtitle="AI 内容引擎"
          desc="从选题策划到文案生成，从知识库沉淀到 GEO 增长。AI 驱动的全链路内容生产平台，让你的 IP 内容更有结构、更有效率、更有策略。"
          features={ipFeatures}
          accentColor="bg-[#0A3D62]"
          accentBg="bg-[#E8F1F5]"
          icon={FileText}
          href="/"
        />
      </section>

      {/* ===== Xuanxue Module ===== */}
      <section className="bg-linear-to-b from-white to-gray-50">
        <ProductSection
          title="玄学工作室"
          subtitle="传统绝学"
          desc="八字排盘、六爻纳甲、奇门遁甲、紫微斗数、风水堪舆等十大传统绝学。一键排盘，智能分析，积分计费，让玄学触手可及。"
          features={xuanxueFeatures}
          accentColor="bg-purple-600"
          accentBg="bg-purple-50"
          icon={Sparkles}
          href="/xuanxue"
          reversed
        />
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#0A1628] text-white/40 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs">
            创世者 Copilot · AI 驱动的内容生产与策划平台
          </p>
          <p className="text-xs mt-2 text-white/25">
            Powered by 广西创世者科技有限公司
          </p>
        </div>
      </footer>
    </div>
  )
}
