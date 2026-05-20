"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function GeoPage() {
  const [stats, setStats] = useState({
    articles: 0,
    published: 0,
    views: 0,
    consultations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/geo/stats")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setStats({
            articles: data.totalArticles || 0,
            published: data.published || 0,
            views: data.views || 0,
            consultations: data.consultations || 0,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const statsDisplay = [
    { label: "发布记录", value: loading ? "..." : String(stats.published) },
    { label: "已发布", value: loading ? "..." : String(stats.articles) },
    { label: "AI 引用", value: loading ? "..." : String(stats.views) },
    { label: "信任资产", value: loading ? "..." : String(stats.consultations) },
  ]

  const steps = [
    { num: "01", title: "账号知识库", desc: "统一公司、IP、资料和信任资产", href: "/assets/knowledge" },
    { num: "02", title: "信任与资料", desc: "在账号 Wiki 内沉淀可追溯信源", href: "/assets/knowledge" },
    { num: "03", title: "关键词库", desc: "保存长尾问句和用户意图", href: "/assets/keywords" },
    { num: "04", title: "生成规则", desc: "配置语气、长度、平台和问句模板", href: "/geo/rules" },
    { num: "05", title: "文章创作", desc: "调用资料库生成 GEO 长文", href: "/geo/article" },
    { num: "06", title: "接入自媒体", desc: "记录平台配置，预留发布 adapter", href: "/assets/integrations" },
    { num: "07", title: "发布与统计", desc: "追踪发布、收录、浏览和咨询", href: "/geo/publish" },
  ]

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 card-hover">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs text-primary font-medium">GEO 工作台</span>
        </div>
        <h1 className="text-lg md:text-xl font-bold">7 步玩转 GEO 内容增长</h1>
        <p className="text-sm text-muted mt-2">
          把账号知识库、关键词、生成规则、文章创作、发布记录和统计串成一条闭环。
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {statsDisplay.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 card-hover">
            <span className="text-xs text-muted">{s.label}</span>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {steps.map((step) => (
          <Link key={step.num} href={step.href} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(10,61,98,0.08)] transition-all cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {step.num}
              </div>
              <div>
                <span className="text-sm font-medium">{step.title}</span>
                <p className="text-xs text-gray-400 mt-1">{step.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Link href="/geo/article" className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          开始生成文章 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
