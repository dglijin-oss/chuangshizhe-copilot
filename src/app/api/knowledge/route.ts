import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserOrThrow } from "@/lib/auth";
import { deductCredit, getCreditBalance } from "@/lib/credits";

export async function GET(req: Request) {
  const user = await getSessionUserOrThrow();
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");

  if (!profileId) {
    return NextResponse.json({ error: "缺少 profileId" }, { status: 400 });
  }

  const profile = await prisma.iPProfile.findFirst({
    where: { id: profileId, userId: user.id },
    select: {
      id: true,
      name: true,
      knowledgeContent: true,
      feedScripts: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "档案不存在" }, { status: 404 });
  }

  return NextResponse.json({
    profileId: profile.id,
    name: profile.name,
    knowledgeContent: profile.knowledgeContent || null,
    feedScripts: profile.feedScripts ? JSON.parse(profile.feedScripts) : [],
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUserOrThrow();
  const body = await req.json();
  const { profileId, knowledgeContent, feedScripts } = body;

  if (!profileId) {
    return NextResponse.json({ error: "缺少 profileId" }, { status: 400 });
  }

  const profile = await prisma.iPProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "档案不存在" }, { status: 404 });
  }

  const updated = await prisma.iPProfile.update({
    where: { id: profileId },
    data: {
      ...(knowledgeContent !== undefined ? { knowledgeContent } : {}),
      ...(feedScripts !== undefined ? { feedScripts: JSON.stringify(feedScripts) } : {}),
    },
  });

  return NextResponse.json({
    profileId: updated.id,
    name: updated.name,
    knowledgeContent: updated.knowledgeContent,
    feedScripts: updated.feedScripts ? JSON.parse(updated.feedScripts) : [],
  });
}

// 保存脚本修改到知识库（记忆迭代核心功能）
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
  const { profileId, scriptContent } = body;

  if (!profileId || !scriptContent) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const profile = await prisma.iPProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "档案不存在" }, { status: 404 });
  }

  await deductCredit(user.id, "save_to_knowledge", profileId);

  // 将修改后的脚本内容萃取为知识，追加到知识库
  const prompt = `你是一个 IP 知识库管理员。以下是一条经过用户修改的短视频脚本。
请从这条脚本中萃取以下信息，并输出为结构化的 JSON：
1. 人设特征（性格、语气、表达风格）
2. 话术技巧（开头钩子方式、结尾引导方式、过渡技巧）
3. 风格偏好（正式/口语化/故事化/干货化）
4. 新增禁忌或避坑点

【IP 名称】${profile.name}
【当前知识库】${profile.knowledgeContent || "暂无"}

【修改后的脚本】
${scriptContent}

【输出格式】
严格按 JSON 格式输出，不要任何其他文字：
{
  "personaTraits": [],
  "speechTechniques": [],
  "stylePreferences": [],
  "newForbidden": []
}`;

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
          { role: "system", content: "你是 IP 知识库管理员，擅长从脚本中萃取知识。输出必须是 JSON。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    let extractedKnowledge = "";
    if (res.ok) {
      const data = await res.json();
      extractedKnowledge = data.choices?.[0]?.message?.content || "";
    }

    // 更新知识库：追加萃取内容
    const currentKnowledge = profile.knowledgeContent || "【IP 知识库 v1】\n";
    const newKnowledge = `${currentKnowledge}\n\n【迭代更新 ${new Date().toLocaleString("zh-CN")}】\n${extractedKnowledge || "用户手动修改了脚本，请以此版本为准。"}`;

    // 更新投喂脚本列表
    const currentFeeds = profile.feedScripts ? JSON.parse(profile.feedScripts) : [];
    currentFeeds.push({
      content: scriptContent,
      updatedAt: new Date().toISOString(),
      source: "user_edit",
    });

    const updated = await prisma.iPProfile.update({
      where: { id: profileId },
      data: {
        knowledgeContent: newKnowledge,
        feedScripts: JSON.stringify(currentFeeds),
      },
    });

    return NextResponse.json({
      ok: true,
      knowledgeContent: updated.knowledgeContent,
      extractedKnowledge: extractedKnowledge || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "保存知识库失败" },
      { status: 500 }
    );
  }
}
