"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function AdminConfigPage() {
  const { role } = useUser()
  const router = useRouter()
  const [packages, setPackages] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [savingQr, setSavingQr] = useState(false)
  const [saveError, setSaveError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (role !== "admin") { router.push("/") }
    Promise.all([
      fetch("/api/admin/config", { credentials: "include" }).then(r => r.json()),
      fetch("/api/admin/payment-config", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
    ]).then(([configData, paymentData]) => {
      setPackages(configData.packages || [])
      setModels(configData.models || [])
      setQrDataUrl(paymentData.qrDataUrl || "")
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [role, router])

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setQrDataUrl(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const saveQr = async () => {
    setSavingQr(true)
    setSaveError("")
    try {
      console.log("Saving QR, dataUrl length:", qrDataUrl?.length)
      const res = await fetch("/api/admin/payment-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrDataUrl }),
        credentials: "include",
      })
      console.log("Response status:", res.status)
      const data = await res.json()
      console.log("Response data:", data)
      if (!res.ok) { setSaveError(data.error || `请求失败 (${res.status})`); return }
      alert("支付二维码已保存")
      setSaveError("")
    } catch (err) {
      console.error("Save QR error:", err)
      setSaveError(err instanceof Error ? err.message : "未知错误")
    } finally {
      setSavingQr(false)
    }
  }

  if (loading) return <div className="p-4 md:p-6 text-gray-400">加载中...</div>

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-6">系统配置</h1>

      {/* Payment QR Code */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
        <span className="text-xs text-primary font-medium">PAYMENT QR</span>
        <h2 className="text-sm font-bold mt-2 mb-4">微信支付收款码</h2>
        <p className="text-xs text-gray-400 mb-4">用户上传的收款码将显示在充值页面中。支持微信个人收款码截图。</p>
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="收款码" className="w-48 h-48 object-contain border border-gray-200 rounded-lg" />
            ) : (
              <div className="w-48 h-48 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                未配置
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleQrUpload}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white file:hover:bg-primary-hover"
            />
            <button
              onClick={saveQr}
              disabled={!qrDataUrl || savingQr}
              className={cn("px-6 py-2 rounded-lg text-sm font-medium transition-colors",
                qrDataUrl ? "bg-primary hover:bg-primary-hover text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed")}
            >
              {savingQr ? "保存中..." : "保存收款码"}
            </button>
            {saveError && <p className="text-xs text-red-500">{saveError}</p>}
            <p className="text-xs text-gray-400 mt-2">提示：截图微信支付收款码后上传即可</p>
          </div>
        </div>
      </div>

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
