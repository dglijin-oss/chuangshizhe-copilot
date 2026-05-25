"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { FileText, ArrowRight, LogOut, Brain, PenTool, BarChart3, BookOpen } from "lucide-react"
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

const statsBase = [
  { value: 1500, suffix: "+", label: "IP 矩阵" },
  { value: 98, suffix: "项", label: "核心能力" },
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

/* ---- Interactive Neural Network Background ---- */

function NeuralNetworkBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const mouseActiveRef = useRef(false)
  const animRef = useRef<number>(0)
  const mouseLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let w = 0, h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    interface Node {
      bx: number; by: number;
      x: number; y: number;
      vx: number; vy: number;
      baseR: number;
      pulsePhase: number;
      pulseSpeed: number;
    }

    interface DataPulse {
      a: Node; b: Node;
      t: number;       // 0..1 progress along line
      speed: number;   // how fast it moves
      maxT: number;    // when to die
      brightness: number;
    }

    let nodes: Node[] = []
    let pulses: DataPulse[] = []
    let connections: [Node, Node][] = []
    let connectionDist = 180
    let mouseRadius = 350
    let spawnTimer = 0

    function buildNodes() {
      const spacing = 80
      const cols = Math.ceil(w / spacing) + 1
      const rows = Math.ceil(h / spacing) + 1

      nodes = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = (c + 0.5) * spacing + (Math.random() - 0.5) * 20
          const by = (r + 0.5) * spacing + (Math.random() - 0.5) * 20
          nodes.push({
            bx, by,
            x: bx, y: by,
            vx: 0, vy: 0,
            baseR: 0.8 + Math.random() * 1.2,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.003 + Math.random() * 0.008,
          })
        }
      }
      connectionDist = spacing * 2.2
      mouseRadius = spacing * 4
      pulses = []
      connections = []
    }

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const pw = parent.clientWidth
      const ph = parent.clientHeight
      if (!pw || !ph) return // skip if parent not rendered yet
      if (pw === w && ph === h) return // skip if size unchanged
      w = pw
      h = ph
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + "px"
      canvas.style.height = h + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildNodes()
    }
    resize()
    window.addEventListener("resize", resize)

    // Watch parent size changes with ResizeObserver
    const parent = canvas.parentElement
    if (parent) {
      const ro = new ResizeObserver(() => resize())
      ro.observe(parent)
      // cleanup added below
      ;(canvas as any).__resizeObserver = ro
    }

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      mouseActiveRef.current = true
      if (mouseLeaveTimerRef.current) {
        clearTimeout(mouseLeaveTimerRef.current)
        mouseLeaveTimerRef.current = null
      }
    }
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect()
        mouseRef.current = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
        mouseActiveRef.current = true
      }
    }
    const handleLeave = () => {
      mouseActiveRef.current = false
      mouseRef.current = { x: -9999, y: -9999 }
    }

    canvas.addEventListener("mousemove", handleMouse)
    canvas.addEventListener("touchmove", handleTouch, { passive: true })
    canvas.addEventListener("mouseleave", handleLeave)

    const animate = () => {
      ctx.clearRect(0, 0, w, h)
      const mouse = mouseRef.current
      const mouseActive = mouseActiveRef.current

      // Update nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]

        if (mouseActive) {
          // Mouse attraction
          const dx = mouse.x - n.x
          const dy = mouse.y - n.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouseRadius && dist > 0) {
            const force = 0.04 * (1 - dist / mouseRadius)
            n.vx += dx * force * 0.005
            n.vy += dy * force * 0.005
          }
          // Slight repulsion from other close nodes to prevent clumping
          for (let j = 0; j < nodes.length; j++) {
            if (j === i) continue
            const o = nodes[j]
            const ox = o.x - n.x
            const oy = o.y - n.y
            const odist = Math.sqrt(ox * ox + oy * oy)
            if (odist < 20 && odist > 0) {
              n.vx -= ox * 0.002
              n.vy -= oy * 0.002
            }
          }
        } else {
          // Return to base position (spring)
          n.vx += (n.bx - n.x) * 0.008
          n.vy += (n.by - n.y) * 0.008
        }

        // Damping
        n.vx *= 0.94
        n.vy *= 0.94

        // Move
        n.x += n.vx
        n.y += n.vy
        n.pulsePhase += n.pulseSpeed
      }

      // Draw connections & collect active edges for pulse spawning
      connections = []
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectionDist) {
            const t = 1 - dist / connectionDist
            let alpha = t * 0.2
            let lineWidth = 0.5
            if (mouseActive) {
              const midDist = Math.sqrt(
                Math.pow((a.x + b.x) / 2 - mouse.x, 2) +
                Math.pow((a.y + b.y) / 2 - mouse.y, 2)
              )
              if (midDist < mouseRadius) {
                const proximity = 1 - midDist / mouseRadius
                alpha = t * 0.15 + proximity * 0.35
                lineWidth = 0.5 + proximity * 1.5
                // Collect connections near mouse for pulse spawning
                if (Math.random() < 0.008) {
                  connections.push([a, b])
                }
              }
            } else {
              // Ambient pulses on random connections
              if (Math.random() < 0.001) {
                connections.push([a, b])
              }
            }
            ctx.strokeStyle = `rgba(80, 140, 220, ${alpha})`
            ctx.lineWidth = lineWidth
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // Spawn new data pulses
      spawnTimer++
      if (spawnTimer % 3 === 0 && connections.length > 0) {
        const [a, b] = connections[Math.floor(Math.random() * connections.length)]
        pulses.push({
          a, b,
          t: 0,
          speed: 0.008 + Math.random() * 0.015,
          maxT: 0.7 + Math.random() * 0.3,
          brightness: 0.6 + Math.random() * 0.4,
        })
      }

      // Update & draw data pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]
        p.t += p.speed
        if (p.t > p.maxT) {
          pulses.splice(i, 1)
          continue
        }
        const px = p.a.x + (p.b.x - p.a.x) * p.t
        const py = p.a.y + (p.b.y - p.a.y) * p.t
        const life = Math.sin((p.t / p.maxT) * Math.PI) // bell curve

        // Trail
        const trailLen = 12
        for (let tt = 1; tt <= trailLen; tt++) {
          const trailT = p.t - tt * 0.008
          if (trailT < 0) break
          const tx = p.a.x + (p.b.x - p.a.x) * trailT
          const ty = p.a.y + (p.b.y - p.a.y) * trailT
          const trailAlpha = (1 - tt / trailLen) * life * 0.15 * p.brightness
          ctx.beginPath()
          ctx.arc(tx, ty, 1, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(120, 180, 255, ${trailAlpha})`
          ctx.fill()
        }

        // Head glow
        const headR = 3 + life * 3
        ctx.beginPath()
        ctx.arc(px, py, headR * 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(100, 170, 255, ${life * 0.08 * p.brightness})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(px, py, headR, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180, 220, 255, ${life * 0.5 * p.brightness})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(px, py, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${life * 0.9 * p.brightness})`
        ctx.fill()
      }

      // Draw mouse-to-node connections
      if (mouseActive) {
        for (const n of nodes) {
          const dx = mouse.x - n.x
          const dy = mouse.y - n.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouseRadius) {
            const alpha = (1 - dist / mouseRadius) * 0.3
            ctx.strokeStyle = `rgba(10, 61, 98, ${alpha})`
            ctx.lineWidth = 0.8 + (1 - dist / mouseRadius) * 1.2
            ctx.beginPath()
            ctx.moveTo(mouse.x, mouse.y)
            ctx.lineTo(n.x, n.y)
            ctx.stroke()
          }
        }

        // Mouse hub glow
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(100, 160, 255, 0.5)"
        ctx.fill()
        // Outer ring pulse
        const ringAlpha = 0.1 + Math.sin(Date.now() * 0.003) * 0.05
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(100, 160, 255, ${ringAlpha})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Draw nodes
      for (const n of nodes) {
        const pulse = Math.sin(n.pulsePhase) * 0.5 + 0.5
        const r = n.baseR + pulse * 1
        const glow = n.baseR + pulse * 3

        // Outer glow
        ctx.beginPath()
        ctx.arc(n.x, n.y, glow, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(80, 140, 220, ${0.03 + pulse * 0.02})`
        ctx.fill()
        // Core
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 220, 255, ${0.25 + pulse * 0.35})`
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", resize)
      canvas.removeEventListener("mousemove", handleMouse)
      canvas.removeEventListener("touchmove", handleTouch)
      canvas.removeEventListener("mouseleave", handleLeave)
      if (mouseLeaveTimerRef.current) clearTimeout(mouseLeaveTimerRef.current)
      const ro = (canvas as any).__resizeObserver
      if (ro) ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
    />
  )
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#060E1A] via-[#0A1628] to-[#060E1A]">
        <NeuralNetworkBg />

        {/* Vignette overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(6,14,26,0.7) 100%)" }} />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="animate-fade-in">
            <Image src="/logo.png" alt="创世者Copilot" width={220} height={46} className="object-contain mx-auto mb-10 opacity-90" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-glow animate-fade-in delay-200">
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
              <div className="flex justify-center gap-4">
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
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 animate-bounce-down text-white/30">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2.5 bg-white/40 rounded-full" />
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
