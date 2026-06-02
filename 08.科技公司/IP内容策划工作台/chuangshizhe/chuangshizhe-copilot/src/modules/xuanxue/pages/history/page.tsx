"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SKILL_NAMES } from '../../lib/types'

interface HistoryRecord {
  id: string
  skillId: string
  createdAt: string
  pointsCost: number
  summary: string
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const params = new URLSearchParams()
        if (filter !== 'all') params.set('skillId', filter)
        params.set('limit', '50')

        const res = await fetch(`/api/xuanxue/history?${params.toString()}`, {
          credentials: 'include',
        })
        const data = await res.json()
        if (res.ok) {
          setRecords(data.records || [])
        } else {
          setError(data.error || '加载失败')
        }
      } catch (err: any) {
        setError(err.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [filter])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#0D1F3C] to-[#112240] text-white">
      <header className="sticky top-0 z-50 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/xuanxue" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            ← 返回玄学工作室
          </Link>
          <div className="text-xs text-gray-400">占卜历史记录</div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-sm text-gray-300 bg-white/5 rounded-full px-4 py-1.5 mb-4">
            <span>📜</span> 占卜历史
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">历史查询</h1>
          <p className="text-gray-400 text-sm">查看过往所有的占卜排盘记录</p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === 'all' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            全部
          </button>
          {Object.entries(SKILL_NAMES).map(([id, name]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === id ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Records */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-400 text-sm">暂无占卜记录</p>
            <Link href="/xuanxue" className="mt-4 inline-block text-sm text-purple-400 hover:text-purple-300 transition-colors">
              开始第一次占卜 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-white">{SKILL_NAMES[record.skillId as keyof typeof SKILL_NAMES] || record.skillId}</span>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{record.summary}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                    <div className="text-xs text-amber-400 mt-1">-{record.pointsCost} 积分</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
