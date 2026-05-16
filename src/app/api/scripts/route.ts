import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserOrThrow } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUserOrThrow();
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");
  const topicId = searchParams.get("topicId");

  if (!profileId) {
    return NextResponse.json({ error: "缺少 profileId" }, { status: 400 });
  }

  // 验证档案归属
  const profile = await prisma.iPProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "档案不存在" }, { status: 404 });
  }

  const where: any = { profileId };
  if (topicId) where.topicId = topicId;

  const scripts = await prisma.script.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { version: "asc" }],
  });

  return NextResponse.json(scripts);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUserOrThrow();
  const body = await req.json();
  const { profileId, topicId, content, version } = body;

  if (!profileId || !content) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const profile = await prisma.iPProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "档案不存在" }, { status: 404 });
  }

  const script = await prisma.script.create({
    data: {
      profileId,
      topicId: topicId || null,
      content,
      version: version ?? 1,
    },
  });

  return NextResponse.json(script, { status: 201 });
}
