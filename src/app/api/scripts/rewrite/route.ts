import { NextRequest, NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const body = await req.json();
  const { scriptId, instruction, profileId } = body;

  if (!instruction) {
    return NextResponse.json({ error: "缺少改写指令" }, { status: 400 });
  }

  // 获取原始脚本
  let originalScript: any;
  if (scriptId) {
    originalScript = await prisma.script.findFirst({
      where: { id: scriptId, profile: { userId: user.id } },
    });
    if (!originalScript) {
      return NextResponse.json({ error: "脚本不存在" }, { status: 404 });
    }
  }

  // 获取 profile 上下文
  const profile = await prisma.iPProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "档案不存在" }, { status: 404 });
  }

  await deductCredit(user.id, "rewrite_script", profileId);

  const prompt = `你是短视频脚本编辑专家。根据以下 IP 档案和原始脚本，按照用户的改写指令进行改写。

【IP 档案】
- IP 名称：${profile.name}
- 人设特点：${JSON.parse(profile.personas || "[]").join("、")} ${profile.personaExtra || ""}
- 内容禁区：${JSON.parse(profile.forbidden || "[]").join("、")} ${profile.forbiddenExtra || ""}

【原始脚本】
${originalScript ? originalScript.content : "无原始脚本，请直接根据 IP 档案创作。"}

【改写指令】
${instruction}

【要求】
1. 保持 IP 人设一致性
2. 严格遵守内容禁区
3. 改写后的脚本仍然适合 30-45 秒视频（200-300 字）
4. 只输出改写后的脚本正文，不要任何其他文字`;

  const apiKey = process.env.DASHSCOPE_API_KEY;
  const baseUrl = process.env.DASHSCOPE_BASE_URL || "https://coding.dashscope.aliyuncs.com/v1";
  const model = process.env.DASHSCOPE_MODEL || "qwen-plus";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "你是专业的短视频脚本编辑专家。只输出改写后的脚本正文。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
    const rewritten = data.choices?.[0]?.message?.content || "";

    // 保存为新版本
    const newScript = await prisma.script.create({
      data: {
        profileId,
        topicId: originalScript?.topicId || null,
        content: rewritten,
        version: originalScript ? originalScript.version + 1 : 1,
      },
    });

    return NextResponse.json({ script: newScript });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "请求 DashScope 时出错" },
      { status: 500 }
    );
  }
}
