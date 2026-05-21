"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Users, Wallet, Settings, FileText, HardDrive, LogOut } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "数据看板", icon: LayoutDashboard },
  { href: "/users", label: "用户管理", icon: Users },
  { href: "/recharges", label: "充值管理", icon: Wallet },
  { href: "/systems", label: "系统注册", icon: HardDrive },
  { href: "/logs", label: "操作日志", icon: FileText },
  { href: "/config", label: "系统配置", icon: Settings },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ name: string; role: string; points: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setUser(d.user); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [loading, user, router])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    window.location.href = "/home"
  }

  if (loading || !user) return null

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-base font-bold text-gray-900">创世者 Admin</h1>
          <p className="text-xs text-gray-400 mt-0.5">统一管理后台</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <Icon className="w-4 h-4" /> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <div className="px-3 py-2 text-xs text-gray-400">
            {user.name} · {user.points} 积分
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> 退出登录
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="h-12 bg-white border-b border-gray-200 flex items-center px-6">
          <span className="text-sm text-gray-500">
            {navItems.find(n => n.href === pathname)?.label || "管理后台"}
          </span>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
