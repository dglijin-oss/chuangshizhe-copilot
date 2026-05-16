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
  const { profileId, topicId } = body;

  if (!profileId) {
    return NextResponse.json({ error: "缺少 profileId" }, { status: 400 });
  }

  const profile = await prisma.iPProfile.findFirst({
    where: { id: profileId, userId: user.id },
    include: { scripts: topicId ? { where: { topicId } } : false },
  });
  if (!profile) {
    return NextResponse.json({ error: "档案不存在" }, { status: 404 });
  }

  // 获取 topic 信息（如果有）
  let topicInfo = "";
  if (topicId) {
    const topic = await prisma.topic.findFirst({
      where: { id: topicId, profileId },
    });
    if (topic) {
      topicInfo = `
【选题信息】
- 类型：${topic.type}
- 标题：${topic.title}
- 描述：${topic.description}`;
    }
  }

  // 获取记忆上下文
  let memoryContext = "";
  const memories = await prisma.accountMemory.findMany({
    where: { profileId },
  });
  if (memories.length > 0) {
    const byCategory: Record<string, string[]> = {};
    memories.forEach((m) => {
      if (!byCategory[m.category]) byCategory[m.category] = [];
      byCategory[m.category].push(m.content);
    });
    memoryContext = "\n【账号记忆】\n" + Object.entries(byCategory).map(([cat, items]) =>
      `- ${cat}：${items.join("；")}`
    ).join("\n");
  }

  // 获取已确认语料
  let corpusContext = "";
  const confirmedCorpus = await prisma.corpusEntry.findMany({
    where: { profileId, status: "confirmed" },
    take: 10,
  });
  if (confirmedCorpus.length > 0) {
    corpusContext = "\n【语料库摘要】\n" + confirmedCorpus.map((c) =>
      `- ${c.fileName}：${c.summary || ""}`
    ).join("\n");
  }

  // 获取知识库内容
  let knowledgeContext = "";
  if (profile.knowledgeContent) {
    knowledgeContext = `\n【IP 知识库】\n${profile.knowledgeContent}`;
  }

  const prompt = `你是短视频脚本创作专家。根据以下 IP 档案和选题，生成 3 个差异化的脚本版本。

【IP 档案】
- IP 名称：${profile.name}
- 创始人：${profile.founder}
- 行业：${profile.industry}
- 人设特点：${JSON.parse(profile.personas || "[]").join("、")} ${profile.personaExtra || ""}
- 产品服务：${JSON.parse(profile.products || "[]").join("、")}
- 目标客户：${JSON.parse(profile.customers || "[]").join("、")} ${profile.customerExtra || ""}
- 账号目标：${JSON.parse(profile.goals || "[]").join("、")} ${profile.goalExtra || ""}
- 内容禁区：${JSON.parse(profile.forbidden || "[]").join("、")} ${profile.forbiddenExtra || ""}${topicInfo}${knowledgeContext}${memoryContext}${corpusContext}

【要求】
1. 版本 1：标准版，完整呈现选题核心观点
2. 版本 2：故事版，用创始人真实故事切入，更有温度
3. 版本 3：干货版，直接给方法/知识，专业权威感强
4. 每个脚本 200-300 字，适合 30-45 秒视频
5. 结构：开头钩子（3 秒抓人）+ 正文（核心内容）+ 结尾引导（关注/评论/行动）
6. 严格遵守内容禁区，参考账号记忆中的偏好
7. 三个版本要有明显差异，不是简单改几个词

【输出格式】
严格按以下 JSON 数组格式输出，不要输出任何其他内容：
[
  {
    "version": 1,
    "label": "标准版",
    "content": "完整脚本内容..."
  },
  {
    "version": 2,
    "label": "故事版",
    "content": "完整脚本内容..."
  },
  {
    "version": 3,
    "label": "干货版",
    "content": "完整脚本内容..."
  }
]`;

  // 扣除 1 次
  await deductCredit(user.id, "generate_scripts", profileId);

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
          { role: "system", content: "你是专业的短视频脚本创作专家，擅长为一个 IP 创建多个差异化版本。输出必须是纯 JSON 数组，不要任何解释文字。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 4000,
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
    const aiContent = data.choices?.[0]?.message?.content || "";
    const jsonMatch = aiContent.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return NextResponse.json({ error: "AI 返回格式异常，请重试" }, { status: 500 });
    }

    const scripts = JSON.parse(jsonMatch[0]) as Array<{ version: number; label: string; content: string }>;

    // 保存到数据库
    const savedScripts = [];
    for (const s of scripts) {
      const created = await prisma.script.create({
        data: {
          profileId,
          topicId: topicId || null,
          content: s.content,
          version: s.version,
        },
      });
      savedScripts.push(created);
    }

    return NextResponse.json({ scripts: savedScripts, rawContent: aiContent });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "请求 DashScope 时出错" },
      { status: 500 }
    );
  }
}
