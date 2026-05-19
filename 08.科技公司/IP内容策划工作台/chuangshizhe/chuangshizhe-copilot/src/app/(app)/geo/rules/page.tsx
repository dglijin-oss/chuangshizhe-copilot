"use client"

import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const articleTypes = ["品宣文章", "数据图表", "榜单评测", "攻略指南", "深度专题", "问答 QA", "客户案例"]
const tones = ["专业", "亲和", "幽默", "权威", "接地气"]
const lengths = ["800 字", "1200 字", "1500 字", "2000 字", "3000 字"]

export default function RulesPage() {
  const [rules, setRules] = useState<{ id: string; name: string; articleType: string; tone: string; targetLength: number; targetQuestions: string | null }[]>([])
  const [form, setForm] = useState({
    name: "", type: "品宣文章", tone: "专业", length: "1200 字", targetQuestions: "", extraRules: "",
  })
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/geo/rules")
      .then((res) => res.json())
      .then((data) => { if (data.rules) setRules(data.rules) })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!form.name) { setMessage("规则名称必填"); return }
    setMessage("")
    const res = await fetch("/api/geo/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        articleType: form.type,
        tone: form.tone,
        targetLength: parseInt(form.length),
        targetQuestions: form.targetQuestions,
        extraRules: form.extraRules,
      }),
    })
    const data = await res.json()
    if (data.rule) {
      setRules([data.rule, ...rules])
      setForm({ name: "", type: "品宣文章", tone: "专业", length: "1200 字", targetQuestions: "", extraRules: "" })
      setMessage("规则保存成功")
    } else {
      setMessage(data.error || "保存失败")
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/geo/rules?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setRules(rules.filter((r) => r.id !== id))
    }
  }

  const handleApply = (rule: { articleType: string; tone: string; targetLength: number; targetQuestions: string | null }) => {
    window.opener?.postMessage({
      type: "apply-rule",
      data: { articleType: rule.articleType, tone: rule.tone, length: rule.targetLength, targetQuestions: rule.targetQuestions },
    }, "*")
    setMessage("规则已发送，请返回文章页使用")
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 card-hover">
        <h1 className="text-lg md:text-xl font-bold mb-1">生成规则</h1>
        <p className="text-xs text-muted mb-6">保存常用 GEO 文章规则，生成时一键套用。</p>

        {message && (
          <p className={cn("text-xs mb-4 px-3 py-2 rounded-lg", message.includes("成功") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500")}>
            {message}
          </p>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input type="text" placeholder="规则名称" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary">
              {articleTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary">
              {tones.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary">
              {lengths.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea placeholder="默认目标问句，每行一个" value={form.targetQuestions}
              onChange={(e) => setForm({ ...form, targetQuestions: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:border-primary" />
            <textarea placeholder="额外生成规则" value={form.extraRules}
              onChange={(e) => setForm({ ...form, extraRules: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:border-primary" />
          </div>
          <button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            保存规则
          </button>
        </div>
      </div>

      {rules.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 card-hover">
          <h2 className="text-base font-bold mb-4">已保存的规则</h2>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                <div>
                  <span className="text-sm font-medium">{rule.name}</span>
                  <span className="text-xs text-gray-400 ml-3">{rule.articleType} · {rule.tone} · {rule.targetLength}字</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApply(rule)} className="text-xs text-primary hover:text-primary-hover px-3 py-1 rounded border border-primary transition-colors">
                    套用
                  </button>
                  <button onClick={() => handleDelete(rule.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
