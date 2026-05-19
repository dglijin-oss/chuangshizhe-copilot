import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ALIYUN_API_KEY,
  baseURL: "https://coding.dashscope.aliyuncs.com/apps/anthropic",
})

export const MODEL = "qwen3.6-plus"

export async function chat(messages: Anthropic.MessageCreateParamsNonStreaming["messages"], maxTokens = 4000) {
  const res = await client.messages.create({
    model: MODEL,
    messages,
    max_tokens: maxTokens,
  })
  // qwen3.6-plus returns thinking + text blocks; extract the text one
  for (const block of res.content) {
    if (block.type === "text") return block.text
  }
  return ""
}
