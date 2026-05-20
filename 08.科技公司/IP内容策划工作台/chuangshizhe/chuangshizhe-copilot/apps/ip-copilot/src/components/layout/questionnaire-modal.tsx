"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuestionnaireModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: () => void
}

const questions = [
  {
    id: "01",
    question: "你现在主要做什么行业？",
    options: ["餐饮门店", "服装美业", "家装建材", "教育培训", "本地生活服务", "企业服务", "其他"],
  },
  {
    id: "02",
    question: "你现在的业务体量大概是？",
    options: ["刚起步", "单店稳定经营", "多店/多团队", "年营收百万级", "年营收千万级", "还没正式开始"],
  },
  {
    id: "03",
    question: "你在公司里的角色是？",
    options: ["创始人/老板", "合伙人", "市场负责人", "运营负责人", "销售负责人", "内容操盘手", "自由职业者"],
  },
  {
    id: "04",
    question: "你现在团队大概多少人？",
    options: ["只有我自己", "2-5人", "6-10人", "11-30人", "31-100人", "100人以上"],
  },
  {
    id: "05",
    question: "你的客户主要在哪里？",
    options: ["同城本地", "广西区域", "全国线上", "县城/乡镇", "商圈周边", "暂时不清楚"],
  },
  {
    id: "06",
    question: "你最想先做好哪个平台？",
    options: ["视频号", "抖音", "小红书", "快手", "公众号/私域", "还没确定"],
  },
  {
    id: "07",
    question: "你现在大概多久发一次内容？",
    options: ["几乎不发", "每月1-3条", "每周1-2条", "每周3-5条", "每天都发", "团队代运营"],
  },
  {
    id: "08",
    question: "你做账号最想先解决什么？",
    options: ["让更多人知道我", "获得咨询线索", "提升成交信任", "打造老板人设", "招聘/招商", "沉淀私域"],
  },
  {
    id: "09",
    question: "你做内容最大的卡点是？",
    options: ["不知道拍什么", "不会写脚本", "拍出来不像自己", "没有稳定更新", "流量太少", "转化太弱"],
  },
  {
    id: "10",
    question: "你的主要客户更像哪一类？",
    options: ["普通消费者", "本地老板", "宝妈/家庭用户", "年轻女性", "企业客户", "加盟/代理客户", "高净值客户"],
  },
  {
    id: "11",
    question: "你的客单价大概在哪个区间？",
    options: ["100元以内", "100-500元", "500-2000元", "2000-10000元", "1万元以上", "不固定/看项目"],
  },
  {
    id: "12",
    question: "客户一般多久会成交？",
    options: ["当天就能买", "3天内", "1-2周", "1个月左右", "超过1个月", "主要靠长期信任"],
  },
  {
    id: "13",
    question: "你以前用 AI 做内容的频率？",
    options: ["没用过", "偶尔试过", "经常用但不稳定", "团队已经在用", "只用来找灵感", "主要靠人工"],
  },
  {
    id: "14",
    question: "用一句话介绍你的产品/服务",
    type: "text",
    placeholder: "比如：我帮广西本地餐饮老板做门店引流和短视频获客。",
  },
  {
    id: "15",
    question: "补充信息",
    type: "text",
    placeholder: "还有什么想补充的？比如账号现状、近期目标、特殊要求等。",
    optional: true,
  },
]

export function QuestionnaireModal({ open, onClose, onSubmit }: QuestionnaireModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  if (!open) return null

  const selectedCount = Object.keys(answers).filter(k => k !== "15" || answers[k]).length
  const requiredCount = questions.filter(q => !q.optional).length
  const progress = Math.min(selectedCount, requiredCount)

  const handleSelect = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  const handleText = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async () => {
    if (progress < requiredCount) return
    setSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || "提交失败")
        return
      }
      onClose()
      onSubmit?.()
    } catch {
      setSubmitError("网络错误，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-[680px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex items-start md:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-primary font-medium">STARTER BRIEF</span>
            <h2 className="text-base md:text-lg font-bold mt-1">先了解你的账号，再开始策划。</h2>
            <p className="text-xs text-gray-400 mt-1">
              完成这份入门问卷后，系统会奖励 10 积分。后续 AI 会更懂你的行业、客户和内容目标。
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 md:px-6 py-3 bg-primary-light">
          <span className="text-xs text-primary font-medium">
            {progress}/{requiredCount} 必填已完成
          </span>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${(progress / requiredCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-6">
          {questions.map((q) => (
            <div key={q.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-primary font-bold text-sm">{q.id}</span>
                <span className="text-sm font-medium">{q.question}</span>
                {q.optional && (
                  <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">选填</span>
                )}
              </div>
              {q.type === "text" ? (
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => handleText(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:border-primary"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {q.options!.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSelect(q.id, opt)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                        answers[q.id] === opt
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 text-muted hover:border-primary"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 bg-primary-light">
          <span className="text-xs text-gray-400">
            {progress}/{requiredCount} 必填已完成，补充信息可不填。
          </span>
          {submitError && <span className="text-xs text-red-500">{submitError}</span>}
          <button
            onClick={handleSubmit}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              progress >= requiredCount && !submitting
                ? "bg-primary text-white hover:bg-primary-hover"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
            disabled={progress < requiredCount || submitting}
          >
            {submitting ? "提交中..." : "提交问卷，领取 10 积分"}
          </button>
        </div>
      </div>
    </div>
  )
}
