import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserOrThrow } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUserOrThrow();
  const { id } = await params;

  const profile = await prisma.iPProfile.findFirst({
    where: { id, userId: user.id },
  });

  if (!profile) {
    return NextResponse.json({ error: "档案不存在" }, { status: 404 });
  }

  const topics = await prisma.topic.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    profile: {
      id: profile.id,
      name: profile.name,
      founder: profile.founder,
      personas: JSON.parse(profile.personas || "[]"),
      personaExtra: profile.personaExtra,
      industry: profile.industry,
      products: JSON.parse(profile.products || "[]"),
      customers: JSON.parse(profile.customers || "[]"),
      customerExtra: profile.customerExtra,
      goals: JSON.parse(profile.goals || "[]"),
      goalExtra: profile.goalExtra,
      forbidden: JSON.parse(profile.forbidden || "[]"),
      forbiddenExtra: profile.forbiddenExtra,
      mix: { traffic: profile.mixTraffic, persona: profile.mixPersona, product: profile.mixProduct },
      createdAt: profile.createdAt.toISOString(),
    },
    topics: topics.map((t: any) => ({
      id: t.id,
      type: t.type,
      title: t.title,
      description: t.description,
      script: t.script,
      publishCopy: t.publishCopy,
      shootingTips: t.shootingTips,
      weekKey: t.weekKey,
    })),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUserOrThrow();
  const { id } = await params;

  const profile = await prisma.iPProfile.findFirst({
    where: { id, userId: user.id },
  });

  if (!profile) {
    return NextResponse.json({ error: "档案不存在" }, { status: 404 });
  }

  await prisma.iPProfile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
