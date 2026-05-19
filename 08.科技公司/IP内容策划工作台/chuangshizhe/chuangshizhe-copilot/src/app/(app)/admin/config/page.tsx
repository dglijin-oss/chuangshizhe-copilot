"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function AdminConfigPage() {
  const { role } = useUser()
  const router = useRouter()
  const [packages, setPackages] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role !== "admin") { router.push("/") }
    fetch("/api/admin/config")
      .then(res => res.json())
      .then(data => {
        setPackages(data.packages || [])
        setModels(data.models || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [role, router])

  if (loading) return <div className="p-4 md:p-6 text-gray-400">加载中...</div>

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-6">系统配置</h1>

      {/* Recharge Packages */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
        <span className="text-xs text-primary font-medium">RECHARGE PACKAGES</span>
        <h2 className="text-sm font-bold mt-2 mb-4">充值套餐</h2>
        <p className="text-xs text-gray-400 mb-4">当前套餐配置（修改需要更新代码）</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg: any, i: number) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="text-lg font-bold">¥{pkg.price}</div>
              <div className="text-sm mt-1">到账 {pkg.points + pkg.bonus} 积分</div>
              {pkg.bonus > 0 && <div className="text-xs text-primary mt-1">{pkg.label}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* AI Models */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <span className="text-xs text-primary font-medium">AI MODELS</span>
        <h2 className="text-sm font-bold mt-2 mb-4">可用模型</h2>
        <div className="space-y-2">
          {models.map((m: any, i: number) => (
            <div key={i} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
              <span className="text-sm font-medium">{m.name}</span>
              <span className="text-xs text-gray-400">{m.key}</span>
              <span className="text-xs text-primary">¥{m.pricePerK}/K tokens</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
