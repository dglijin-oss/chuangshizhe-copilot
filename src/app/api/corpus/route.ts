import { NextRequest, NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSessionUserOrThrow();

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");

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

  const status = searchParams.get("status");
  const where: any = { profileId };
  if (status) where.status = status;

  const entries = await prisma.corpusEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries.map(e => ({
    ...e,
    tags: e.tags ? JSON.parse(e.tags) : [],
  })));
}
