"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TaiyiPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    date: '',
    hour: '',
    question: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [pointsInfo, setPointsInfo] = useState<{ balance: number; cost: number } | null>(null)

  const canSubmit = form.date && form.hour

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const body: Record<string, any> = {
        date: form.date,
        hour: parseInt(form.hour),
        question: form.question || undefined,
      }

      const res = await fetch('/api/xuanxue/taiyi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        if (res.status === 402) { setError(data.error || '积分不足'); return }
        throw new Error(data.error || '排盘失败')
      }

      setResult(data.result)
      if (data.balance !== undefined) setPointsInfo({ balance: data.balance, cost: data.cost || 10 })
    } catch (err: any) {
      setError(err.message || '排盘失败，请重试')
    } finally {
      setLoading(false)
    }
  }

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
          <div className="inline-flex items-center gap-2 text-sm text-amber-300 bg-amber-500/10 rounded-full px-4 py-1.5 mb-4">
            <span>⚡</span> 太乙神数
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">太乙神数排盘</h1>
          <p className="text-gray-400 text-sm">
            三式之首，国运天灾，格局分析，上古绝学
          </p>
          <div className="text-xs text-gray-500 mt-2">每次使用扣除 <span className="text-amber-400 font-medium">10 积分</span></div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">{error}</div>}

        {!result && (
          <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  日期 <span className="text-red-400">*</span>
                </label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  时辰 <span className="text-red-400">*</span>
                </label>
                <select value={form.hour} onChange={(e) => setForm({ ...form, hour: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none" required>
                  <option value="" className="bg-[#0D1F3C]">请选择时辰</option>
                  <option value="0" className="bg-[#0D1F3C]">子时 (23:00-01:00)</option>
                  <option value="1" className="bg-[#0D1F3C]">丑时 (01:00-03:00)</option>
                  <option value="3" className="bg-[#0D1F3C]">寅时 (03:00-05:00)</option>
                  <option value="5" className="bg-[#0D1F3C]">卯时 (05:00-07:00)</option>
                  <option value="7" className="bg-[#0D1F3C]">辰时 (07:00-09:00)</option>
                  <option value="9" className="bg-[#0D1F3C]">巳时 (09:00-11:00)</option>
                  <option value="11" className="bg-[#0D1F3C]">午时 (11:00-13:00)</option>
                  <option value="13" className="bg-[#0D1F3C]">未时 (13:00-15:00)</option>
                  <option value="15" className="bg-[#0D1F3C]">申时 (15:00-17:00)</option>
                  <option value="17" className="bg-[#0D1F3C]">酉时 (17:00-19:00)</option>
                  <option value="19" className="bg-[#0D1F3C]">戌时 (19:00-21:00)</option>
                  <option value="21" className="bg-[#0D1F3C]">亥时 (21:00-23:00)</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">所问之事（可选）</label>
              <input type="text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="简要描述要问的事情"
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors" />
            </div>

            <button type="submit" disabled={!canSubmit || loading}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-all ${
                canSubmit && !loading ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-white/10 text-gray-500 cursor-not-allowed'
              }`}>
              {loading ? '排盘中...' : '开始排盘 · 10 积分'}
            </button>
          </form>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-sm font-bold text-amber-300 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-amber-500 rounded-full" />排盘结果
              </h3>
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {result.formatted || JSON.stringify(result, null, 2)}
              </div>
            </div>
            <div className="flex justify-center gap-3 pt-4">
              <button onClick={() => { setResult(null); setPointsInfo(null) }}
                className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-2.5 rounded-full text-sm font-medium transition-colors">
                重新排盘
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
