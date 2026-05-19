"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function IpManagePage() {
  const router = useRouter()
  const [ips, setIps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/ip/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.ips) setIps(data.ips)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background-subtle flex items-center justify-center">
        <div className="text-sm text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-subtle">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-xs text-muted hover:text-primary transition-colors">← 返回</button>
            <span className="text-xs text-gray-400">创世者Copilot 工作台</span>
            <span className="text-sm font-bold">IP 档案管理</span>
          </div>
          <button
            onClick={() => router.push("/ip/create")}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            创建 IP
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 card-hover">
          <span className="text-xs text-primary font-medium tracking-wider">IP MANAGEMENT</span>
          <h1 className="text-base md:text-lg font-bold mt-2">管理所有 IP 的人设档案。</h1>
          <p className="text-xs text-muted mt-1">点击任意 IP 进入编辑页面，修改人设、行业、产品等核心信息。</p>
        </div>

        {ips.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 md:p-16 text-center">
            <p className="text-sm text-gray-400 mb-4">还没有 IP 账号，创建第一个开始吧。</p>
            <button
              onClick={() => router.push("/ip/create")}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              创建第一个 IP
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ips.map((ip) => (
              <div key={ip.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(10,61,98,0.08)] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold">{ip.name}</h3>
                  <span className="bg-primary-light text-primary px-2 py-0.5 rounded text-xs">{ip.industry || "未填写"}</span>
                </div>
                <div className="space-y-1.5 text-xs text-muted mb-4">
                  {ip.founderName && (
                    <div><span className="text-gray-400">创始人：</span>{ip.founderName}</div>
                  )}
                  {ip.products && (
                    <div><span className="text-gray-400">产品：</span>{ip.products}</div>
                  )}
                  {ip.targetClients && (
                    <div><span className="text-gray-400">客户：</span>{ip.targetClients}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/ip/${ip.id}/profile`)}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    编辑档案
                  </button>
                  <button
                    onClick={() => router.push(`/ip/${ip.id}/weekly-plan`)}
                    className="flex-1 border border-gray-200 text-muted py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    周策划
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
