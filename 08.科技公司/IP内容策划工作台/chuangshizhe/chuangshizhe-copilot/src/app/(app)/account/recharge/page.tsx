"use client"

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { cn } from "@/lib/utils"

const packages = [
  { price: 10, points: 100, bonus: 0, aiGens: "~10 次 AI 生成" },
  { price: 20, points: 200, bonus: 0, aiGens: "~20 次 AI 生成" },
  { price: 30, points: 300, bonus: 0, aiGens: "~30 次 AI 生成" },
  { price: 50, points: 500, bonus: 100, aiGens: "~60 次 AI 生成", label: "多送 100 积分" },
  { price: 100, points: 1000, bonus: 300, aiGens: "~130 次 AI 生成", label: "多送 300 积分" },
  { price: 200, points: 2000, bonus: 1000, aiGens: "~300 次 AI 生成", label: "多送 1000 积分" },
]

export default function RechargePage() {
  const { points } = useUser()
  const [selected, setSelected] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [order, setOrder] = useState<{ id: string; amount: number; points: number; qrUrl?: string } | null>(null)
  const [error, setError] = useState("")
  const pkg = packages[selected]

  async function handlePayment() {
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch("/api/billing/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: pkg.price, points: pkg.points + pkg.bonus }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "创建订单失败"); return }
      setOrder(data.order)
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  if (order) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <span className="text-xs text-primary font-medium">PAYMENT PENDING</span>
          <h2 className="text-lg font-bold mt-2">微信扫码支付 ¥{order.amount}</h2>
          <p className="text-sm text-muted mt-1">到账 {order.points} 积分</p>

          <div className="bg-gray-200 rounded-xl w-64 h-64 mx-auto my-6 flex items-center justify-center">
            <span className="text-sm text-gray-400">请联系管理员配置支付二维码</span>
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <p>订单号：{order.id}</p>
            <p>支付完成后积分将自动到账，如未到账请联系客服</p>
          </div>

          <button
            onClick={() => setOrder(null)}
            className="mt-6 border border-gray-200 text-muted px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            返回选择金额
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {error && <p className="text-xs text-red-500 mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
        <span className="text-xs text-primary font-medium">STEP 1</span>
        <h2 className="text-sm font-bold mt-1 mb-4">选择本次充值金额</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-3">
            <span className="text-xs text-gray-400">当前积分</span>
            <div className="text-xl font-bold mt-1">{points}</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-3">
            <span className="text-xs text-gray-400">本次到账</span>
            <div className="text-xl font-bold mt-1">{pkg.points + pkg.bonus} 积分</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
          {packages.map((p, i) => (
            <button key={p.price} onClick={() => setSelected(i)}
              className={cn("rounded-xl border p-4 text-left transition-all relative",
                selected === i ? "border-primary bg-primary-light" : "border-gray-200 bg-white hover:border-primary")}>
              {p.label && <span className="absolute top-2 right-2 text-[10px] text-primary bg-primary-light px-1.5 py-0.5 rounded">{p.label}</span>}
              <div className="text-lg font-bold">¥{p.price}</div>
              <div className="text-sm mt-1">到账 {p.points + p.bonus} 积分</div>
              <div className="text-xs text-gray-400 mt-0.5">{p.aiGens}</div>
            </button>
          ))}
        </div>

        <div className="border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-primary font-medium">PAYMENT</span>
              <div className="text-sm font-bold mt-1">确认后进入微信支付，请支付 ¥{pkg.price}</div>
            </div>
          </div>
          <button
            onClick={handlePayment}
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? "创建订单中..." : "确认金额，生成订单"}
          </button>
        </div>
      </div>
    </div>
  )
}
