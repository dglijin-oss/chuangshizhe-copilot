"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, RefreshCw } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", password: "", password2: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [captcha, setCaptcha] = useState<{ id: string; question: string } | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState("")

  const canSubmit = form.name && form.phone && form.password && form.password2 && form.password === form.password2 && captchaAnswer

  const fetchCaptcha = async () => {
    try {
      const res = await fetch("/api/auth/captcha")
      const data = await res.json()
      if (res.ok) {
        setCaptcha({ id: data.id, question: data.question })
        setCaptchaAnswer("")
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchCaptcha()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          password: form.password,
          captchaId: captcha?.id,
          captchaAnswer: Number(captchaAnswer),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "注册失败")
        // If captcha error, refresh captcha
        if (data.error?.includes("验证码")) {
          fetchCaptcha()
        }
        return
      }
      window.location.href = "/"
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-subtle flex items-center justify-center">
      <div className="flex gap-12 items-start max-w-3xl w-full px-6">
        <div className="flex-1 bg-primary-light rounded-2xl p-10 min-h-[400px] flex flex-col justify-between">
          <div>
            <Image src="/logo.png" alt="创世者Copilot" width={180} height={38} className="mb-8" />
            <span className="text-xs text-primary font-medium">IP 内容工作台</span>
            <h1 className="text-2xl font-bold mt-3 leading-snug">
              开启你的 AI 内容增长之旅
            </h1>
            <p className="text-xs text-muted mt-4">
              注册即可获得 110 积分，立即开始使用 AI 生成服务。
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="w-[340px] bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold mb-1">创建账号</h2>
          <p className="text-xs text-muted mb-5">注册后可使用 AI 生成服务，积分制计费。</p>

          {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">用户名</label>
              <input
                type="text"
                placeholder="请输入用户名"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">手机号</label>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">密码</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="请设置密码（至少6位）"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">确认密码</label>
              <div className="relative">
                <input
                  type={showPw2 ? "text" : "password"}
                  placeholder="请再次输入密码"
                  value={form.password2}
                  onChange={(e) => setForm({ ...form, password2: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPw2(!showPw2)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                >
                  {showPw2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Captcha */}
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">验证码</label>
              <div className="flex gap-2">
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 text-sm font-mono font-bold text-primary min-w-[120px] select-none">
                  {captcha?.question || "加载中..."}
                </div>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="p-2 text-gray-400 hover:text-primary transition-colors"
                  title="换一张"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  placeholder="答案"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
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
              {loading ? "注册中..." : "注册"}
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4 text-xs text-muted">
            <span>已有账号？</span>
            <Link href="/login" className="text-primary hover:text-primary-hover">去登录</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
