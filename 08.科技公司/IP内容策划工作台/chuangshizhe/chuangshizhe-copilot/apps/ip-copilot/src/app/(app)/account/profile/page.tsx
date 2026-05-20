"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { cn } from "@/lib/utils"

type Tab = "info" | "points" | "logout"

export default function PersonalCenterPage() {
  const router = useRouter()
  const { name, phone, points, refresh } = useUser()
  const [activeTab, setActiveTab] = useState<Tab>("info")

  const tabs: { key: Tab; label: string; danger?: boolean }[] = [
    { key: "info", label: "账户信息" },
    { key: "points", label: "积分明细" },
    { key: "logout", label: "退出登录", danger: true },
  ]

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 card-hover">
        <h1 className="text-lg md:text-xl font-bold">个人中心</h1>
        <p className="text-xs text-muted mt-1">管理账户信息与积分记录。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-3 h-fit">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1",
                activeTab === tab.key
                  ? tab.danger ? "bg-red-50 text-red-500" : "bg-primary text-white"
                  : tab.danger ? "text-red-500 hover:bg-red-50" : "text-muted hover:bg-gray-50")}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3">
          {activeTab === "info" && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
              <span className="text-xs text-primary font-medium">ACCOUNT</span>
              <h2 className="text-sm font-bold mt-2 mb-5">账户信息</h2>
              <div className="space-y-4">
                <InfoRow label="手机号" value={phone || "未设置"} />
                <InfoRow label="用户名" value={name} />
                <InfoRow label="当前积分" value={String(points)} highlight />
              </div>
            </div>
          )}

          {activeTab === "points" && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
              <h2 className="text-sm font-bold mb-4">积分明细</h2>
              <div className="text-center py-12 text-gray-400 text-sm">暂无积分记录</div>
            </div>
          )}

          {activeTab === "logout" && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
              <h2 className="text-sm font-bold mb-4">退出登录</h2>
              <p className="text-xs text-muted mb-4">确定要退出当前账号吗？</p>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                确认退出
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={cn("text-sm", highlight ? "text-primary font-bold" : "")}>{value}</span>
    </div>
  )
}
