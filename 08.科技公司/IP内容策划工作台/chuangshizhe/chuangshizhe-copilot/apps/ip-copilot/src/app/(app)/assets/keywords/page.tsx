"use client"

import { useState, useEffect } from "react"
import { Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export default function KeywordsPage() {
  const [groupName, setGroupName] = useState("")
  const [keyword, setKeyword] = useState("")
  const [groups, setGroups] = useState<{ id: string; name: string; keywords: any[] }[]>([])
  const [hotKeywords, setHotKeywords] = useState<any[]>([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/assets/keywords")
      .then((res) => res.json())
      .then((data) => {
        if (data.groups) setGroups(data.groups)
        if (data.hotKeywords) setHotKeywords(data.hotKeywords)
      })
      .catch(() => {})
  }, [])

  const addGroup = async () => {
    if (!groupName.trim()) return
    const res = await fetch("/api/assets/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "group", name: groupName.trim() }),
    })
    const data = await res.json()
    if (data.group) {
      setGroups([{ ...data.group, keywords: [] }, ...groups])
      setGroupName("")
      setMessage("分组已创建")
    }
  }

  const addKeyword = async () => {
    if (!keyword.trim()) return
    const res = await fetch("/api/assets/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "keyword", content: keyword.trim() }),
    })
    const data = await res.json()
    if (data.keyword) {
      setKeyword("")
      setMessage("关键词已添加")
    }
  }

  const deleteItem = async (id: string, type: string) => {
    const res = await fetch(`/api/assets/keywords?id=${id}&type=${type}`, { method: "DELETE" })
    if (res.ok) {
      if (type === "group") setGroups(groups.filter((g) => g.id !== id))
      else setHotKeywords(hotKeywords.filter((k) => k.id !== id))
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 card-hover">
        <h1 className="text-lg md:text-xl font-bold mb-1">关键词库</h1>
        <p className="text-xs text-muted mb-6">沉淀 GEO 长尾词、问句和搜索意图。</p>

        {message && <p className="text-xs text-green-600 mb-3 bg-green-50 px-3 py-2 rounded-lg">{message}</p>}

        {/* Hot keywords pool */}
        <div className="border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-medium">GEO 热词池</span>
              <span className="text-xs text-gray-400 ml-2">{hotKeywords.length} 条</span>
            </div>
          </div>
          {hotKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {hotKeywords.map((k) => (
                <span key={k.id} className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full flex items-center gap-1">
                  {k.content}
                  <button onClick={() => deleteItem(k.id, "keyword")} className="text-gray-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <input type="text" placeholder="输入关键词或问句" value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            <button onClick={addKeyword} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors">
              <Plus className="w-4 h-4" /> 添加
            </button>
          </div>
        </div>

        {/* Groups */}
        <div className="flex gap-3 mb-4">
          <input type="text" placeholder="新分组名称" value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGroup()}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          <button onClick={addGroup} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            新增分组
          </button>
        </div>

        {groups.length > 0 && (
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                <div>
                  <span className="text-sm font-medium">{g.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{g.keywords?.length || 0} 个关键词</span>
                </div>
                <button onClick={() => deleteItem(g.id, "group")} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
