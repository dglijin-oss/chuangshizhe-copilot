"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

export default function ItemLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          router.push("/login")
          return null
        }
        return res.json()
      })
      .then(() => setLoading(false))
      .catch(() => {
        router.push("/login")
        setLoading(false)
      })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background-subtle flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-subtle">
      {children}
    </div>
  )
}
