import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { proxyStreamHermes } from "@/lib/hermes"

/**
 * Prompt templates for each scrape feature.
 * Each template receives a {params} object at runtime.
 */
const TEMPLATES: Record<string, (params: Record<string, string>) => Array<{ role: string; content: string }>> = {
  "douyin-script": (params) => [
    {
      role: "system",
      content: `你是短视频文案分析专家，擅长提取抖音视频内容并分析文案结构。
请使用你的技能获取视频内容，然后按以下结构输出：
1. 提取视频完整字幕/口播文案
2. 分析文案结构（开头钩子、主体内容、结尾引导）
3. 提炼核心卖点和情绪触发点
4. 输出可直接复用的文案模板`,
    },
    {
      role: "user",
      content: `请帮我提取以下抖音视频的文案内容：${params.url || "未提供链接"}`,
    },
  ],

  "competitor-analysis": (params) => [
    {
      role: "system",
      content: `你是竞品分析专家，擅长拆解对标账号的内容策略和人设定位。
请使用你的技能获取账号信息和内容，然后分析：
1. 账号人设定位（标签、语气、视觉风格）
2. 近 10 条内容的主题分类和爆文特征
3. 更新频率和发布时间规律
4. 评论区用户画像和核心需求
5. 给出可借鉴的差异化策略建议`,
    },
    {
      role: "user",
      content: `请帮我拆解分析以下对标账号：${params.url || "未提供链接"}\n\n关注方向：${params.focus || "不限"}`,
    },
  ],

  "xiaohongshu-batch": (params) => [
    {
      role: "system",
      content: `你是小红书内容转写专家，擅长批量抓取和分析小红书笔记。
请使用你的技能逐篇获取笔记内容，对每篇笔记输出：
1. 提取正文内容（保留原文案风格）
2. 提取标题结构和关键词
3. 分析配图/视频的内容要点
4. 转写为可直接发布的文案

请在每篇笔记之间用分隔线区分。`,
    },
    {
      role: "user",
      content: `请帮我转写以下小红书笔记：\n${params.urls || "未提供链接"}\n\n${params.requirements || "无特殊要求"}`,
    },
  ],

  "persona-distillation": (params) => [
    {
      role: "system",
      content: `你是人物画像蒸馏专家，擅长从采访/视频/文字稿中提取人物特征。
请使用你的技能获取素材内容，然后分析：
1. 人物的核心观点和价值主张
2. 语言特征（口头禅、表达习惯、语速节奏）
3. 高频词汇和句式结构
4. 金句/名场面
5. 输出可直接用于 AI 口播训练的人物画像模板`,
    },
    {
      role: "user",
      content: `请帮我从以下素材中蒸馏人物画像：\n${params.content || "未提供素材"}`,
    },
  ],

  "trending-topics": (params) => [
    {
      role: "system",
      content: `你是热点选题专家，擅长从各平台热榜中筛选匹配 IP 定位的选题。
请使用你的技能获取热榜数据，然后：
1. 列出当前热榜 TOP 20
2. 按内容领域分类
3. 标注哪些选题适合该 IP 定位
4. 给出每个匹配选题的切入角度建议`,
    },
    {
      role: "user",
      content: `平台：${params.platform || "全平台"}\nIP 定位：${params.ipPosition || "不限"}\n时间范围：${params.timeRange || "近 24 小时"}`,
    },
  ],

  "comment-analysis": (params) => [
    {
      role: "system",
      content: `你是用户画像分析专家，擅长从评论区提取用户特征和需求。
请使用你的技能抓取评论内容，然后分析：
1. 评论情感分布（正面/中性/负面占比）
2. 用户高频提问和需求痛点
3. 用户画像推断（年龄、性别、职业、地域）
4. 爆款评论特征分析
5. 给出内容优化建议`,
    },
    {
      role: "user",
      content: `请帮我分析以下内容的评论区：${params.url || "未提供链接"}\n\n关注重点：${params.focus || "不限"}`,
    },
  ],
}

export const FEATURE_META = {
  "douyin-script": {
    name: "抖音视频文案提取",
    icon: "🎬",
    color: "bg-red-50 border-red-200",
    description: "输入视频链接，提取完整口播文案并分析结构",
    fields: [{ key: "url", label: "抖音视频链接", placeholder: "https://www.douyin.com/video/...", required: true }],
  },
  "competitor-analysis": {
    name: "对标账号拆解分析",
    icon: "📊",
    color: "bg-blue-50 border-blue-200",
    description: "输入对标账号主页，分析人设、内容策略和爆文特征",
    fields: [
      { key: "url", label: "对标账号主页链接", placeholder: "https://www.douyin.com/user/...", required: true },
      { key: "focus", label: "关注方向（可选）", placeholder: "如：爆款视频特征、人设定位、更新频率" },
    ],
  },
  "xiaohongshu-batch": {
    name: "小红书批量转写",
    icon: "📝",
    color: "bg-pink-50 border-pink-200",
    description: "批量输入笔记链接，逐篇转写为结构化内容",
    fields: [
      { key: "urls", label: "笔记链接（每行一个）", placeholder: "https://www.xiaohongshu.com/...", required: true, type: "textarea" },
      { key: "requirements", label: "特殊要求（可选）", placeholder: "如：保留原文风格、提取关键词" },
    ],
  },
  "persona-distillation": {
    name: "人物蒸馏",
    icon: "🧬",
    color: "bg-purple-50 border-purple-200",
    description: "输入采访/视频素材，蒸馏人物画像和语言特征",
    fields: [{ key: "content", label: "素材内容或链接", placeholder: "粘贴文字稿或视频链接", required: true, type: "textarea" }],
  },
  "trending-topics": {
    name: "热点选题采集",
    icon: "🔥",
    color: "bg-orange-50 border-orange-200",
    description: "抓取各平台热榜，按 IP 定位筛选匹配选题",
    fields: [
      { key: "platform", label: "平台", placeholder: "如：抖音、小红书、全平台" },
      { key: "ipPosition", label: "IP 定位", placeholder: "如：六堡茶专家、AI 助农" },
      { key: "timeRange", label: "时间范围", placeholder: "如：近 24 小时、近 7 天" },
    ],
  },
  "comment-analysis": {
    name: "评论区用户画像",
    icon: "💬",
    color: "bg-green-50 border-green-200",
    description: "抓取视频/笔记评论区，分析用户画像和需求",
    fields: [
      { key: "url", label: "视频/笔记链接", placeholder: "https://...", required: true },
      { key: "focus", label: "关注重点（可选）", placeholder: "如：用户痛点、情感倾向" },
    ],
  },
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = (await req.json()) as { feature: string; params: Record<string, string> }
  const { feature, params } = body

  if (!feature || !TEMPLATES[feature]) {
    return NextResponse.json({ error: "不支持的功能类型" }, { status: 400 })
  }

  const messages = TEMPLATES[feature](params || {})
  const stream = proxyStreamHermes({ messages })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
