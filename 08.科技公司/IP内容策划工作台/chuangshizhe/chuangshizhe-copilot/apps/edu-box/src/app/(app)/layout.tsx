"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { UserContext } from "@/lib/user-context"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<{
    id: string
    name: string
    phone: string
    role: string
    points: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" })
    const data = await res.json()
    if (data?.user) setUser(data.user)
  }, [])

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          router.push("/login")
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
        }
        setLoading(false)
      })
      .catch(() => {
        router.push("/login")
        setLoading(false)
      })
  }, [router])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background-subtle flex items-center justify-center">
        <div className="text-sm text-gray-400">加载中...</div>
      </div>
    )
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    const origin = window.location.origin
    const mainOrigin = origin.replace(/:\d+$/, "") + ":3000"
    window.location.href = `${mainOrigin}/home`
  }

  return (
    <UserContext.Provider value={{ ...user, refresh: refreshUser, hasQuestionnaire: false }}>
      <div className="flex h-screen bg-background-subtle">
        <Sidebar user={{ name: user.name, points: user.points, role: user.role }} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-title">启明盒子</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-body">
                {user.name} · <span className="text-primary font-medium">{user.points}</span> 积分
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </UserContext.Provider>
  )
}
