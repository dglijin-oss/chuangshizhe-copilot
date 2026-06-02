"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LiuyaoPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    question: '',
    method: 'coin' as 'coin' | 'number' | 'time',
    numbers: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [pointsInfo, setPointsInfo] = useState<{ balance: number; cost: number } | null>(null)

  const canSubmit = form.question

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const body: Record<string, any> = {
        question: form.question,
        method: form.method,
      }
      if (form.method === 'number' && form.numbers) {
        body.numbers = form.numbers
      }

      const res = await fetch('/api/xuanxue/liuyao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        if (res.status === 402) { setError(data.error || '积分不足'); return }
        throw new Error(data.error || '占卜失败')
      }

      setResult(data.result)
      if (data.balance !== undefined) {
        setPointsInfo({ balance: data.balance, cost: data.cost || 10 })
      }
    } catch (err: any) {
      setError(err.message || '占卜失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#0D1F3C] to-[#112240] text-white">
      <header className="sticky top-0 z-50 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/xuanxue" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            ← 返回玄学工作室
          </Link>
          {pointsInfo && (
            <div className="text-xs text-gray-400">
              本次消耗 <span className="text-amber-400 font-medium">{pointsInfo.cost}</span> 积分 ·
              余额 <span className="text-amber-400 font-medium">{pointsInfo.balance}</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-sm text-purple-300 bg-purple-500/10 rounded-full px-4 py-1.5 mb-4">
            <span>🪙</span> 六爻纳甲
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">铜钱起卦 · 数字起卦</h1>
          <p className="text-gray-400 text-sm">
            专注一事，诚心发问，以铜钱或数字起卦，断吉凶、应期、趋避
          </p>
          <div className="text-xs text-gray-500 mt-2">
            每次使用扣除 <span className="text-amber-400 font-medium">10 积分</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">
            {error}
          </div>
        )}

        {!result && (
          <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                要问的事情 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="如：我今年的财运如何？这个项目投资可行吗？"
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                起卦方式
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'coin', label: '铜钱起卦' },
                  { value: 'number', label: '数字起卦' },
                  { value: 'time', label: '时间起卦' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, method: opt.value as any })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      form.method === opt.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {form.method === 'number' && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  输入数字（3-6 位）
                </label>
                <input
                  type="text"
                  value={form.numbers}
                  onChange={(e) => setForm({ ...form, numbers: e.target.value })}
                  placeholder="如：368 或 7259"
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-all ${
                canSubmit && !loading
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? '起卦中...' : '开始起卦 · 10 积分'}
            </button>
          </form>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full" />占卜结果
              </h3>
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {result.formatted || JSON.stringify(result, null, 2)}
              </div>
            </div>
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => { setResult(null); setPointsInfo(null) }}
                className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                重新起卦
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
