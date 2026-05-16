import { NextRequest, NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { deductCredit, getCreditBalance } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

const MAX_CONTENT_LENGTH = 8000;

export async function POST(req: NextRequest) {
  const user = await getSessionUserOrThrow();

  const body = await req.json();
  const { profileId, corpusIds } = body;

  if (!profileId) {
    return NextResponse.json({ error: "缺少 profileId" }, { status: 400 });
  }

  // 验证 profile 归属
  const profile = await prisma.iPProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "无权访问该 IP 档案" }, { status: 403 });
  }

  // 查询待分析的语料
  const where: any = { profileId, status: { in: ["pending", "ready"] } };
  if (corpusIds && corpusIds.length > 0) {
    where.id = { in: corpusIds };
  }

  const entries = await prisma.corpusEntry.findMany({ where });

  if (entries.length === 0) {
    return NextResponse.json({ results: [] });
  }

  // 检查余额（每个语料扣 1 credit）
  const balance = await getCreditBalance(user.id);
  if (balance < entries.length) {
    return NextResponse.json(
      { error: `余额不足，需要 ${entries.length} 次，剩余 ${balance} 次` },
      { status: 402 }
    );
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  const baseUrl = process.env.DASHSCOPE_BASE_URL || "https://coding.dashscope.aliyuncs.com/v1";
  const model = process.env.DASHSCOPE_MODEL || "qwen-plus";

  if (!apiKey) {
    return NextResponse.json({ error: "未配置 DASHSCOPE_API_KEY" }, { status: 500 });
  }

  const results: any[] = [];

  for (const entry of entries) {
    // 扣减 credit
    await deductCredit(user.id, "analyze_corpus", profileId);

    // 更新状态为分析中
    await prisma.corpusEntry.update({
      where: { id: entry.id },
      data: { status: "analyzing" },
    });

    const content = (entry.fileContent || "").slice(0, MAX_CONTENT_LENGTH);

    const prompt = `你是短视频内容知识库专家。请分析以下语料材料，自动萃取人设、话术、风格、禁忌等关键信息。

【IP 档案】
- IP 名称：${profile.name}
- 创始人：${profile.founder}
- 行业：${profile.industry}
- 人设特点：${(JSON.parse(profile.personas || "[]") as string[]).join("、")} ${profile.personaExtra || ""}
- 产品服务：${(JSON.parse(profile.products || "[]") as string[]).join("、")}
- 目标客户：${(JSON.parse(profile.customers || "[]") as string[]).join("、")}
- 账号目标：${(JSON.parse(profile.goals || "[]") as string[]).join("、")}
- 内容禁区：${(JSON.parse(profile.forbidden || "[]") as string[]).join("、")}

【待分析语料】
文件名：${entry.fileName}
类型：${entry.fileType}
内容：
---
${content}
---

【任务】
1. 判断该语料是否对 IP 内容创作有价值
2. 如果有价值，提取以下信息（尽可能提取）：
   - 人设特征：创始人的性格特点、身份标签、口头禅、个人故事
   - 话术技巧：开头钩子方式、产品卖点表达、结尾引导方式、转化技巧
   - 风格偏好：语言风格（口语化/正式/幽默/严肃）、句式特点、节奏
   - 禁忌避坑：不该说的话、不合适的语气、不推荐的内容方向
3. 生成一段 50 字以内的摘要
4. 提取 3-8 个关键词标签
5. 给出置信度评分（0-100）

【输出格式】
严格按以下 JSON 格式输出，不要输出任何其他内容：
{
  "valuable": true,
  "confidence": 85,
  "summary": "摘要内容",
  "keyPoints": ["信息点1", "信息点2"],
  "tags": ["标签1", "标签2", "标签3"],
  "aiFeedback": "判断理由",
  "personaTraits": ["特征1", "特征2"],
  "speechTechniques": ["技巧1", "技巧2"],
  "stylePreferences": ["风格1"],
  "forbiddenItems": ["禁忌1"]
}`;

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
            { role: "system", content: "你是专业的短视频内容知识库专家，擅长从历史语料中提取关键信息。输出必须是纯 JSON，不要任何解释文字。" },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 1500,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        results.push({ corpusId: entry.id, error: "AI 分析失败" });
        await prisma.corpusEntry.update({
          where: { id: entry.id },
          data: { status: "pending" },
        });
        continue;
      }

      const aiContent = data.choices?.[0]?.message?.content || "";
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        results.push({ corpusId: entry.id, error: "AI 返回格式异常" });
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 如果提取到了萃取信息，追加到 IP 知识库
      let knowledgeUpdate: any = {};
      const hasExtracted = (parsed.personaTraits?.length > 0 || parsed.speechTechniques?.length > 0 ||
        parsed.stylePreferences?.length > 0 || parsed.forbiddenItems?.length > 0);

      if (hasExtracted) {
        const extractionText = [
          parsed.personaTraits?.length > 0 ? `【人设特征】${parsed.personaTraits.join("、")}` : "",
          parsed.speechTechniques?.length > 0 ? `【话术技巧】${parsed.speechTechniques.join("、")}` : "",
          parsed.stylePreferences?.length > 0 ? `【风格偏好】${parsed.stylePreferences.join("、")}` : "",
          parsed.forbiddenItems?.length > 0 ? `【禁忌避坑】${parsed.forbiddenItems.join("、")}` : "",
        ].filter(Boolean).join("\n");

        const currentKnowledge = profile.knowledgeContent || "【IP 知识库 v1】\n";
        const appendText = `\n\n【语料萃取 ${new Date().toLocaleString("zh-CN")} | ${entry.fileName}】\n${extractionText}`;
        knowledgeUpdate = { knowledgeContent: currentKnowledge + appendText };
      }

      await prisma.$transaction([
        prisma.corpusEntry.update({
          where: { id: entry.id },
          data: {
            status: parsed.valuable ? "ready" : "ready",
            summary: parsed.summary || "",
            tags: JSON.stringify(parsed.tags || []),
            aiFeedback: parsed.aiFeedback || "",
          },
        }),
        ...(Object.keys(knowledgeUpdate).length > 0
          ? [prisma.iPProfile.update({
              where: { id: profileId },
              data: knowledgeUpdate,
            })]
          : []),
      ]);

      results.push({
        corpusId: entry.id,
        summary: parsed.summary,
        tags: parsed.tags || [],
        confidence: parsed.confidence,
        valuable: parsed.valuable,
      });
    } catch (err: any) {
      results.push({ corpusId: entry.id, error: err.message });
      await prisma.corpusEntry.update({
        where: { id: entry.id },
        data: { status: "pending" },
      });
    }
  }

  return NextResponse.json({ results });
}
