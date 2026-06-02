"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { StickFigures } from "@/components/stick-figures"

export default function LoginPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [pwFocused, setPwFocused] = useState(false)
  const [form, setForm] = useState({ phone: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const canSubmit = form.phone && form.password

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: form.phone, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "登录失败"); return }
      window.location.href = "/dashboard"
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-subtle flex items-center justify-center">
      <div className="flex gap-12 items-start max-w-3xl w-full px-6">
        {/* Left branding */}
        <div className="flex-1 bg-primary-light rounded-2xl min-h-[480px] flex flex-col relative">
          <div className="p-10 pb-0 relative z-10">
            <Image src="/logo.png" alt="创世者Copilot" width={180} height={38} className="mb-8" />
            <span className="text-xs text-primary font-medium">IP 内容工作台</span>
            <h1 className="text-2xl font-bold mt-3 leading-snug">
              把灵感、知识库和发布包放在一个<br />工作台里。
            </h1>
            <p className="text-xs text-muted mt-4">
              登录后继续管理 IP 档案、周策划和完整发布包。
            </p>
          </div>
          <StickFigures
            phoneFocused={phoneFocused}
            passwordFocused={pwFocused}
          />
        </div>

        {/* Right login form */}
        <form onSubmit={onSubmit} className="w-[340px] bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold mb-1">欢迎回来</h2>
          <p className="text-xs text-muted mb-5">登录后可使用 AI 生成服务，积分制计费。</p>

          {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">手机号</label>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">密码</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="请输入密码"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={cn(
                "w-full py-2 rounded-lg text-sm font-medium transition-colors",
                canSubmit && !loading
                  ? "bg-primary hover:bg-primary-hover text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4 text-xs text-muted">
            <span>还没有账号？</span>
            <Link href="/register" className="text-primary hover:text-primary-hover">去注册</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
