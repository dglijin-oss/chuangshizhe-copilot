"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen, Brain, FileText, BarChart3, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

function TypewriterText({ text, speed = 100 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("")
  const [cursor, setCursor] = useState(true)

  useEffect(() => {
    let i = 0
    setDisplayed("")
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  useEffect(() => {
    const blink = setInterval(() => setCursor(c => !c), 400)
    return () => clearInterval(blink)
  }, [])

  return (
    <span>
      {displayed}
      <span className={cursor ? "opacity-100" : "opacity-0"}>|</span>
    </span>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; points: number } | null>(null)
  const [loading, setLoading] = useState(true)

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
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="text-sm text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Image src="/logo.png" alt="创世者Copilot" width={140} height={30} />
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">
                {user.name} · <span className="text-blue-600 font-medium">{user.points}</span> 积分
              </span>
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900">
                退出
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
                登录
              </Link>
              <Link href="/register" className="text-sm text-blue-600 hover:underline">
                注册
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#0A1628] to-[#0D1F3C] text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <Image src="/logo.png" alt="创世者Copilot" width={180} height={40} className="mx-auto mb-8" />
          <h1 className="text-5xl md:text-6xl font-bold mb-6">创世者 Copilot</h1>
          <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10">
            <TypewriterText text="「创世者 Copilot」——全球首个面向 AI 一人公司的全生命周期创业孵化生态母体。它不是一个简单的工具平台，而是一个能够自我进化、无限连接、批量孵化超级个体的创业操作系统。" speed={50} />
          </p>

          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => router.push("/login")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-full text-sm font-medium transition-colors"
            >
              登录
            </button>
            <button
              onClick={() => router.push("/register")}
              className="border border-gray-600 hover:border-gray-400 text-gray-300 px-10 py-3 rounded-full text-sm font-medium transition-colors"
            >
              注册
            </button>
          </div>

          <div className="flex justify-center gap-4">
            <a href="http://111.228.45.216/downloads/windows-installer.exe" className="border border-gray-700 hover:border-gray-500 text-gray-400 px-6 py-2.5 rounded-full text-xs flex items-center gap-2 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Windows 下载
            </a>
            <a href="http://111.228.45.216/downloads/android-apk.apk" className="border border-gray-700 hover:border-gray-500 text-gray-400 px-6 py-2.5 rounded-full text-xs flex items-center gap-2 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Android 下载
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#0D1F3C] text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold">1750+</div>
              <div className="text-sm text-gray-400 mt-1">IP 矩阵</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">98项</div>
              <div className="text-sm text-gray-400 mt-1">核心能力</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">39+</div>
              <div className="text-sm text-gray-400 mt-1">智能体</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Left: Title & Description */}
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1.5 mb-4">
                <FileText className="w-3.5 h-3.5" /> AI 内容引擎
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">IP 内容工作台</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                从选题策划到文案生成，从知识库沉淀到 GEO 增长。AI 驱动的全链路内容生产平台，让你的 IP 内容更有结构、更有效率、更有策略。
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                进入系统 <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              <FeatureCard
                icon={<FileText className="w-5 h-5" />}
                title="AI 文案生成"
                desc="口播脚本、标题、钩子一键产出"
              />
              <FeatureCard
                icon={<Brain className="w-5 h-5" />}
                title="智能周策划"
                desc="流量型 / 人设型 / 产品型结构化排期"
              />
              <FeatureCard
                icon={<BookOpen className="w-5 h-5" />}
                title="知识库编译"
                desc="从素材到 Wiki，AI 自动沉淀知识"
              />
              <FeatureCard
                icon={<BarChart3 className="w-5 h-5" />}
                title="GEO 增长"
                desc="AI 地图内容 + 搜索优化，全域获客"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Xuanxue Section */}
      <section className="bg-linear-to-b from-[#0A1628] to-[#0D1F3C] text-white">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 rounded-full px-3 py-1.5 mb-4">
                <Sparkles className="w-3.5 h-3.5" /> 玄学工作室
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">十大玄学技能</h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                八字排盘、六爻占卜、奇门遁甲、紫微斗数、大六壬、太乙神数、
                七政四余、风水堪舆、择日学、梅花易数
              </p>
              <button
                onClick={() => router.push("/xuanxue")}
                className="inline-flex items-center gap-2 text-sm text-purple-400 font-medium hover:text-purple-300"
              >
                进入玄学工作室 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniSkillCard icon="🔮" name="八字排盘" />
              <MiniSkillCard icon="☯️" name="六爻占卜" />
              <MiniSkillCard icon="" name="奇门遁甲" />
              <MiniSkillCard icon="⭐" name="紫微斗数" />
              <MiniSkillCard icon="🌊" name="大六壬" />
              <MiniSkillCard icon="⚡" name="太乙神数" />
            </div>
          </div>
        </div>
      </section>

      {/* Empty Section for spacing */}
      <div className="h-1"></div>
    </div>
  )
}

function MiniSkillCard({ icon, name }: { icon: string; name: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center hover:bg-white/10 transition-colors">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs text-gray-400">{name}</div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="w-10 h-10 rounded-lg bg-[#1A3A5C] text-white flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  )
}
