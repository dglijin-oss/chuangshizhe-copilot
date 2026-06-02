import Anthropic from "@anthropic-ai/sdk"

export const client = new Anthropic({
  apiKey: process.env.ALIYUN_API_KEY,
  baseURL: "https://coding.dashscope.aliyuncs.com/apps/anthropic",
})

export const MODEL = "qwen3-max-2026-01-23"

export async function chat(messages: Anthropic.MessageCreateParamsNonStreaming["messages"], maxTokens = 4000) {
  const res = await client.messages.create({
    model: MODEL,
    messages,
    max_tokens: maxTokens,
  })
  // Handle different response formats across models and DashScope compatibility
  for (const block of res.content) {
    if (block.type === "text") return block.text
  }
  // Fallback: some models return content as a single string or different structure
  return ""
}
