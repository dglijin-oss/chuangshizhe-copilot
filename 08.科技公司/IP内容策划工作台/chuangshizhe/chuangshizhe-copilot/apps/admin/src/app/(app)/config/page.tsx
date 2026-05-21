"use client"

import { useState, useEffect, useRef } from "react"

export default function ConfigPage() {
  const [qrValue, setQrValue] = useState("")
  const [packages] = useState([
    { amount: 10, points: 100, bonus: 0 },
    { amount: 20, points: 200, bonus: 0 },
    { amount: 30, points: 300, bonus: 0 },
    { amount: 50, points: 500, bonus: 100 },
    { amount: 100, points: 1000, bonus: 300 },
    { amount: 200, points: 2000, bonus: 1000 },
  ])
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/config", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        const qr = (d.config || []).find((c: any) => c.key === "wechat_qr")
        if (qr) setQrValue(qr.value || "")
      })
  }, [])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      setQrValue(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    await fetch("/api/config", {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "wechat_qr", value: qrValue }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Payment QR Code */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">微信收款码</h3>
        <div className="flex items-start gap-6">
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-hover">
              上传图片
            </button>
            {saved && <p className="text-xs text-green-600 mt-2">已保存</p>}
          </div>
          {qrValue && <img src={qrValue} alt="收款码" className="w-48 h-48 object-contain border border-gray-200 rounded-lg" />}
        </div>
      </div>

      {/* Packages */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">充值套餐（10分/元）</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {packages.map(p => (
            <div key={p.amount} className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-gray-900">¥{p.amount}</div>
              <div className="text-sm text-gray-500 mt-1">{p.points} 积分</div>
              {p.bonus > 0 && <div className="text-xs text-green-600 mt-1">+{p.bonus} 赠送</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
