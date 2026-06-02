"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function FengshuiPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    direction: '',
    question: '',
    year: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [pointsInfo, setPointsInfo] = useState<{ balance: number; cost: number } | null>(null)

  const canSubmit = form.direction

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const body: Record<string, any> = {
        direction: form.direction,
        question: form.question || undefined,
      }
      if (form.year) body.year = parseInt(form.year)

      const res = await fetch('/api/xuanxue/fengshui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        if (res.status === 402) { setError(data.error || '积分不足'); return }
        throw new Error(data.error || '分析失败')
      }

      setResult(data.result)
      if (data.balance !== undefined) setPointsInfo({ balance: data.balance, cost: data.cost || 10 })
    } catch (err: any) {
      setError(err.message || '分析失败，请重试')
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
          <div className="inline-flex items-center gap-2 text-sm text-stone-300 bg-stone-500/10 rounded-full px-4 py-1.5 mb-4">
            <span>🏔️</span> 风水堪舆
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">八宅风水 · 游年九星</h1>
          <p className="text-gray-400 text-sm">
            根据坐向分析九宫飞星、方位吉凶、布局建议
          </p>
          <div className="text-xs text-gray-500 mt-2">每次使用扣除 <span className="text-amber-400 font-medium">10 积分</span></div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">{error}</div>}

        {!result && (
          <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                房屋坐向 <span className="text-red-400">*</span>
              </label>
              <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-stone-500 transition-colors appearance-none" required>
                <option value="" className="bg-[#0D1F3C]">请选择坐向</option>
                <option value="坐北向南" className="bg-[#0D1F3C]">坐北向南（坎宅）</option>
                <option value="坐南向北" className="bg-[#0D1F3C]">坐南向北（离宅）</option>
                <option value="坐东向西" className="bg-[#0D1F3C]">坐东向西（震宅）</option>
                <option value="坐西向东" className="bg-[#0D1F3C]">坐西向东（兑宅）</option>
                <option value="坐东南向西北" className="bg-[#0D1F3C]">坐东南向西北（巽宅）</option>
                <option value="坐西北向东南" className="bg-[#0D1F3C]">坐西北向东南（乾宅）</option>
                <option value="坐东北向西南" className="bg-[#0D1F3C]">坐东北向西南（艮宅）</option>
                <option value="坐西南向东北" className="bg-[#0D1F3C]">坐西南向东北（坤宅）</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                建造年份（可选）
              </label>
              <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="如 2020" min="1900" max="2100"
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-stone-500 transition-colors" />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                具体需求（可选）
              </label>
              <input type="text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="如：卧室在哪个方位好？厨房位置是否合适？"
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-stone-500 transition-colors" />
            </div>

            <button type="submit" disabled={!canSubmit || loading}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-all ${
                canSubmit && !loading ? 'bg-stone-600 hover:bg-stone-500 text-white' : 'bg-white/10 text-gray-500 cursor-not-allowed'
              }`}>
              {loading ? '分析中...' : '开始分析 · 10 积分'}
            </button>
          </form>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-sm font-bold text-stone-300 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-stone-500 rounded-full" />风水分析结果
              </h3>
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {result.formatted || JSON.stringify(result, null, 2)}
              </div>
            </div>
            <div className="flex justify-center gap-3 pt-4">
              <button onClick={() => { setResult(null); setPointsInfo(null) }}
                className="bg-stone-600 hover:bg-stone-500 text-white px-8 py-2.5 rounded-full text-sm font-medium transition-colors">
                重新分析
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
