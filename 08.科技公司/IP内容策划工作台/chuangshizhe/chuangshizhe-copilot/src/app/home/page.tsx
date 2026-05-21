"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { FileText, School, ArrowRight, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const products = [
  {
    id: "ip-copilot",
    name: "IP 内容工作台",
    desc: "AI 驱动的 IP 内容策划与生产平台，覆盖文案生成、周策划、GEO 增长等全链路",
    href: "http://localhost:3000/",
    icon: FileText,
    color: "from-[#0A3D62] to-[#3C6382]",
    lightBg: "bg-[#E8F1F5]",
  },
  {
    id: "edu-box",
    name: "启明盒子",
    desc: "教育 AI 协同平台，教案生成、作业管理、学情分析、研学项目管理一体化",
    href: "http://localhost:3001",
    icon: School,
    color: "from-[#1B4332] to-[#2D6A4F]",
    lightBg: "bg-[#D8F3DC]",
  },
]

export default function ProductsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; points: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [enterLoading, setEnterLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setUser(d.user)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleEnter(href: string) {
    if (href.startsWith("http")) {
      window.open(href, "_blank")
      return
    }
    if (user) {
      router.push(href)
      return
    }
    router.push("/login")
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-subtle flex items-center justify-center">
        <div className="text-sm text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-subtle">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Image src="/logo.png" alt="创世者Copilot" width={160} height={34} />
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">
                {user.name} · <span className="text-primary font-medium">{user.points}</span> 积分
              </span>
              <button onClick={handleLogout} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 font-medium">
                <LogOut className="w-3.5 h-3.5" /> 退出
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 font-medium">
                登录
              </Link>
              <Link href="/register" className="text-sm text-primary hover:underline font-medium">
                注册
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">创世者 Copilot</h1>
          <p className="text-gray-500 mt-3">AI 驱动的内容生产与教育协同平台</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {products.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden card-hover group"
              >
                {/* Banner */}
                <div className={`h-2 bg-gradient-to-r ${p.color}`} />
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", p.lightBg)}>
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{p.name}</h2>
                      <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEnter(p.href)}
                    disabled={!!enterLoading}
                    className="mt-4 flex items-center gap-1.5 text-sm text-primary font-medium hover:underline disabled:opacity-50"
                  >
                    进入
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Auth buttons below cards */}
        {!user && (
          <div className="text-center mt-10">
            <p className="text-sm text-gray-500 mb-4">登录后使用 AI 生成服务，积分制计费</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => router.push("/login")}
                className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                登录
              </button>
              <button
                onClick={() => router.push("/register")}
                className="border border-gray-200 text-gray-500 hover:bg-gray-50 px-8 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                注册
              </button>
            </div>
          </div>
        )}

        {user && (
          <div className="text-center mt-10">
            <p className="text-sm text-gray-500">已登录，点击上方产品卡片即可进入对应系统</p>
          </div>
        )}
      </main>
    </div>
  )
}
