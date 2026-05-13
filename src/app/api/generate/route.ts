import { NextRequest, NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { deductCredit, getCreditBalance } from "@/lib/credits";

export async function POST(req: NextRequest) {
  const user = await getSessionUserOrThrow();

  const balance = await getCreditBalance(user.id);
  if (balance <= 0) {
    return NextResponse.json(
      { error: "今日免费次数已用完，请明天再来" },
      { status: 402 }
    );
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  const baseUrl = process.env.DASHSCOPE_BASE_URL || "https://coding.dashscope.aliyuncs.com/v1";
  const model = process.env.DASHSCOPE_MODEL || "qwen-plus";

  if (!apiKey) {
    return NextResponse.json({ error: "未配置 DASHSCOPE_API_KEY" }, { status: 500 });
  }

  const body = await req.json();

  // 先扣除次数
  await deductCredit(user.id, "generate_topics");

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: body.messages || [],
        temperature: body.temperature ?? 0.8,
        max_tokens: body.max_tokens ?? 4000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `DashScope 请求失败: ${res.status} ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "请求 DashScope 时出错" },
      { status: 500 }
    );
  }
}
