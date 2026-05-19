"use client"

import { useState, useEffect } from "react"
import { Check, X, Loader2 } from "lucide-react"
import { useAiGeneration } from "@/hooks/use-ai-generation"

const TIPS = [
  "这需要几分钟，请稍候...",
  "AI 正在分析内容...",
  "正在生成结构化数据...",
  "正在匹配知识库信息...",
  "正在优化输出格式...",
]

export function AiGenerationModal() {
  const { state, progress, errorMessage, reset } = useAiGeneration()
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    if (state !== "generating") return
    const timer = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 3000)
    return () => clearInterval(timer)
  }, [state])

  if (state === "idle") return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl w-full max-w-[400px] overflow-hidden shadow-2xl">
        {state === "generating" && (
          <div className="px-6 py-8">
            <div className="flex items-center gap-3 mb-5">
              <Loader2 className="w-6 h-6 text-primary animate-spin shrink-0" />
              <h3 className="text-sm font-semibold text-title">创世者Copilot AI 正在运算...</h3>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="h-2 bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(progress, 2)}%` }}
              />
            </div>
            <p className="text-xs text-muted">{TIPS[tipIndex]}</p>
          </div>
        )}

        {state === "success" && (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-title">运算完成</h3>
          </div>
        )}

        {state === "error" && (
          <div className="px-6 py-8">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <X className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-title text-center mb-2">运算出错</h3>
            {errorMessage && (
              <p className="text-xs text-muted text-center mb-4">{errorMessage}</p>
            )}
            <button
              onClick={reset}
              className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
