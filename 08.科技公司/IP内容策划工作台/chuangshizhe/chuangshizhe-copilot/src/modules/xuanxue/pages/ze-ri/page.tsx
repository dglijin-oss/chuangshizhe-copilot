"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ZeRiPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    event: '',
    startDate: '',
    endDate: '',
    person: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [pointsInfo, setPointsInfo] = useState<{ balance: number; cost: number } | null>(null)

  const canSubmit = form.event && form.startDate

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const body: Record<string, any> = {
        event: form.event,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        person: form.person || undefined,
      }

      const res = await fetch('/api/xuanxue/ze-ri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        if (res.status === 402) { setError(data.error || '积分不足'); return }
        throw new Error(data.error || '查询失败')
      }

      setResult(data.result)
      if (data.balance !== undefined) setPointsInfo({ balance: data.balance, cost: data.cost || 10 })
    } catch (err: any) {
      setError(err.message || '查询失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const eventOptions = [
    '婚嫁', '开业', '搬家', '出行', '动土', '装修',
    '签约', '面试', '考试', '祭祀', '安葬', '其他',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#0D1F3C] to-[#112240] text-white">
      <header className="sticky top-0 z-50 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/xuanxue" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">← 返回玄学工作室</Link>
          {pointsInfo && (
            <div className="text-xs text-gray-400">本次消耗 <span className="text-amber-400 font-medium">{pointsInfo.cost}</span> 积分 · 余额 <span className="text-amber-400 font-medium">{pointsInfo.balance}</span></div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-sm text-rose-300 bg-rose-500/10 rounded-full px-4 py-1.5 mb-4">
            <span>📅</span> 择日学
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">择吉查询 · 吉日查询</h1>
          <p className="text-gray-400 text-sm">
            婚嫁、开业、搬家、出行等吉日查询，避开凶日
          </p>
          <div className="text-xs text-gray-500 mt-2">每次使用扣除 <span className="text-amber-400 font-medium">10 积分</span></div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">{error}</div>}

        {!result && (
          <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                事件类型 <span className="text-red-400">*</span>
              </label>
              <select value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors appearance-none" required>
                <option value="" className="bg-[#0D1F3C]">请选择事件类型</option>
                {eventOptions.map((e) => (
                  <option key={e} value={e} className="bg-[#0D1F3C]">{e}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  开始日期 <span className="text-red-400">*</span>
                </label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  结束日期（可选）
                </label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                当事人信息（可选）
              </label>
              <input type="text" value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })}
                placeholder="如：新郎生辰、公司名称等"
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors" />
            </div>

            <button type="submit" disabled={!canSubmit || loading}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-all ${
                canSubmit && !loading ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-white/10 text-gray-500 cursor-not-allowed'
              }`}>
              {loading ? '查询中...' : '开始查询 · 10 积分'}
            </button>
          </form>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-sm font-bold text-rose-300 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-rose-500 rounded-full" />择日结果
              </h3>
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {result.formatted || JSON.stringify(result, null, 2)}
              </div>
            </div>
            <div className="flex justify-center gap-3 pt-4">
              <button onClick={() => { setResult(null); setPointsInfo(null) }}
                className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-2.5 rounded-full text-sm font-medium transition-colors">
                重新查询
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
