import { NextRequest, NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORY_MAP: Record<string, string> = {
  fact_correction: "事实纠错",
  writing_preference: "写作偏好",
  expression_forbidden: "表达禁区",
  customer_insight: "客户洞察",
};

export async function GET(req: NextRequest) {
  const user = await getSessionUserOrThrow();

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");
  const category = searchParams.get("category");

  if (!profileId) {
    return NextResponse.json({ error: "缺少 profileId" }, { status: 400 });
  }

  const profile = await prisma.iPProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "无权访问该 IP 档案" }, { status: 403 });
  }

  const where: any = { profileId };
  if (category && category !== "all") where.category = category;

  const memories = await prisma.accountMemory.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(memories.map(m => ({
    ...m,
    categoryLabel: CATEGORY_MAP[m.category] || m.category,
  })));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUserOrThrow();

  const body = await req.json();
  const { profileId, category, content } = body;

  if (!profileId || !category || !content) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  const profile = await prisma.iPProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "无权访问该 IP 档案" }, { status: 403 });
  }

  const memory = await prisma.accountMemory.create({
    data: { profileId, category, content },
  });

  return NextResponse.json({
    ...memory,
    categoryLabel: CATEGORY_MAP[memory.category] || memory.category,
  });
}
