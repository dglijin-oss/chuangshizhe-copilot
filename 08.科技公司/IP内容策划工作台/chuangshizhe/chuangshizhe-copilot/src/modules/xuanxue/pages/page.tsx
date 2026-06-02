"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, CalendarDays, CircleDot, Flower2, Compass,
  Star, Orbit, Waves, Zap, Mountain, CalendarCheck, History
} from 'lucide-react'

const SKILLS = [
  {
    id: 'bazi',
    name: '八字排盘',
    icon: CalendarDays,
    desc: '四柱十神、五行旺衰、大运流年',
    color: 'from-red-500 to-orange-500',
    path: '/xuanxue/bazi',
  },
  {
    id: 'liuyao',
    name: '六爻纳甲',
    icon: CircleDot,
    desc: '铜钱起卦、断吉凶、应期推算',
    color: 'from-purple-500 to-pink-500',
    path: '/xuanxue/liuyao',
  },
  {
    id: 'qimen',
    name: '奇门遁甲',
    icon: Compass,
    desc: '时空定位、九宫飞星、断事吉凶',
    color: 'from-blue-500 to-cyan-500',
    path: '/xuanxue/qimen',
  },
  {
    id: 'ziwei',
    name: '紫微斗数',
    icon: Star,
    desc: '十二宫位、四化飞星、命盘详解',
    color: 'from-indigo-500 to-purple-500',
    path: '/xuanxue/ziwei',
  },
  {
    id: 'liuren',
    name: '大六壬',
    icon: Waves,
    desc: '四课三传、天地盘分析',
    color: 'from-teal-500 to-green-500',
    path: '/xuanxue/liuren',
  },
  {
    id: 'taiyi',
    name: '太乙神数',
    icon: Zap,
    desc: '国运天灾、格局分析',
    color: 'from-amber-500 to-yellow-500',
    path: '/xuanxue/taiyi',
  },
  {
    id: 'qizheng',
    name: '七政四余',
    icon: Orbit,
    desc: '星曜落宫、宫位分析',
    color: 'from-emerald-500 to-teal-500',
    path: '/xuanxue/qizheng',
  },
  {
    id: 'fengshui',
    name: '风水堪舆',
    icon: Mountain,
    desc: '八宅风水、游年九星、布局建议',
    color: 'from-stone-500 to-zinc-500',
    path: '/xuanxue/fengshui',
  },
  {
    id: 'ze-ri',
    name: '择日学',
    icon: CalendarCheck,
    desc: '婚嫁/开业/出行吉日历法',
    color: 'from-rose-500 to-pink-500',
    path: '/xuanxue/ze-ri',
  },
  {
    id: 'meihua',
    name: '梅花易数',
    icon: Flower2,
    desc: '以数起卦、时间起卦、简洁断卦',
    color: 'from-violet-500 to-purple-500',
    path: '/xuanxue/meihua',
  },
]

export default function XuanxuePage() {
  const router = useRouter()
  const [userPoints, setUserPoints] = useState<number | null>(null)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUserPoints(data.user.points)
          const hasXuanxue = data.user.role === 'admin' || (data.user.products || []).includes('xuanxue')
          setHasAccess(hasXuanxue)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#0D1F3C] to-[#112240] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/home" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            ← 返回首页
          </Link>
          {userPoints !== null && (
            <div className="text-xs text-gray-400">
              积分余额: <span className="text-amber-400 font-medium">{userPoints}</span>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="text-center py-16 px-6">
        <div className="inline-flex items-center gap-2 text-sm text-purple-300 bg-purple-500/10 rounded-full px-4 py-1.5 mb-6">
          <Sparkles className="w-4 h-4" />
          玄学工作室
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">十大玄学技能</h1>
        <p className="text-gray-400 max-w-xl mx-auto mb-8">
          八字、六爻、奇门、紫微、六壬、太乙、七政、风水、择日、梅花
          <br />
          十大传统绝学，一站式排盘占卜
        </p>
        <div className="text-xs text-gray-500">
          每次使用扣除 <span className="text-amber-400 font-medium">10 积分</span>
        </div>

        {/* 权限提示 */}
        {hasAccess === false && (
          <div className="mt-4 inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-300">
            ⚠️ 您尚未开通玄学模块，请联系管理员开通
          </div>
        )}
      </section>

      {/* Skills Grid */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SKILLS.map((skill) => {
            const Icon = skill.icon
            return (
              <button
                key={skill.id}
                onClick={() => {
                  if (hasAccess === false) return
                  router.push(skill.path)
                }}
                className={`group bg-white/5 border border-white/10 rounded-xl p-5 text-left transition-all duration-300 ${
                  hasAccess === false
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${skill.color} flex items-center justify-center mb-4 ${hasAccess !== false ? 'group-hover:scale-110 transition-transform' : ''}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold mb-1.5">{skill.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{skill.desc}</p>
                <div className="mt-3 text-xs text-gray-500 group-hover:text-purple-300 transition-colors">
                  10 积分/次 →
                </div>
              </button>
            )
          })}
        </div>

        {/* 快捷入口 */}
        <div className="mt-8 text-center">
          <Link
            href="/xuanxue/history"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <History className="w-4 h-4" />
            查看占卜历史
          </Link>
        </div>
      </section>
    </div>
  )
}
