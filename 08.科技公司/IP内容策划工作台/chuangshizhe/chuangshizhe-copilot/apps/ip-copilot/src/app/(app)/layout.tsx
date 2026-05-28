"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { QuestionnaireModal } from "@/components/layout/questionnaire-modal"
import { AiGenerationProvider } from "@/hooks/use-ai-generation"
import { AiGenerationModal } from "@/components/ai-generation-modal"
import { UserContext } from "@/lib/user-context"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<{
    id: string
    name: string
    phone: string
    role: string
    points: number
    hasQuestionnaire: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)

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
          if (!data.user.hasQuestionnaire) {
            setShowQuestionnaire(true)
          }
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
    window.location.href = "/home"
  }

  async function handleQuestionnaireSubmit() {
    await refreshUser()
  }

  return (
    <AiGenerationProvider>
      <UserContext.Provider value={{ ...user, refresh: refreshUser }}>
        {/* Mobile navigation */}
        <MobileNav
          user={{ name: user.name, points: user.points, role: user.role }}
          onLogout={handleLogout}
        />

        <div className="flex h-screen bg-background-subtle">
          {/* Desktop sidebar */}
          <Sidebar user={{ name: user.name, points: user.points, role: user.role }} onLogout={handleLogout} className="hidden md:flex" />
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Desktop header */}
            <header className="hidden md:flex h-14 bg-white border-b border-gray-200 items-center justify-between px-6 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-title">工作区</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-body">
                  {user.name} · <span className="text-primary font-medium">{user.points}</span> 积分
                </span>
              </div>
            </header>
            <main className="flex-1 overflow-auto md:pt-0 pt-[56px] pb-16 md:pb-0">{children}</main>
          </div>

          <QuestionnaireModal
            open={showQuestionnaire}
            onClose={() => setShowQuestionnaire(false)}
            onSubmit={handleQuestionnaireSubmit}
          />
        </div>
      </UserContext.Provider>
      <AiGenerationModal />
    </AiGenerationProvider>
  )
}
