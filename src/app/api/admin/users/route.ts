import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCreditBalance, addCredit } from "@/lib/credits";

export async function GET(req: Request) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const detail = searchParams.get("detail");

  // 获取单个用户的完整数据（含所有 IP 档案详情）
  if (userId && detail === "1") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const profiles = await prisma.iPProfile.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        topics: true,
        corpusEntries: { orderBy: { createdAt: "desc" } },
        accountMemories: { orderBy: { createdAt: "desc" } },
        scripts: { orderBy: { createdAt: "desc" } },
      },
    });

    const profilesWithStats = await Promise.all(
      profiles.map(async (p) => ({
        id: p.id,
        name: p.name,
        founder: p.founder,
        personas: JSON.parse(p.personas || "[]"),
        personaExtra: p.personaExtra,
        industry: p.industry,
        products: JSON.parse(p.products || "[]"),
        customers: JSON.parse(p.customers || "[]"),
        customerExtra: p.customerExtra,
        goals: JSON.parse(p.goals || "[]"),
        goalExtra: p.goalExtra,
        forbidden: JSON.parse(p.forbidden || "[]"),
        forbiddenExtra: p.forbiddenExtra,
        mix: { traffic: p.mixTraffic, persona: p.mixPersona, product: p.mixProduct },
        knowledgeContent: p.knowledgeContent || null,
        feedScripts: p.feedScripts ? JSON.parse(p.feedScripts) : [],
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        // 统计
        topicCount: p.topics.length,
        corpusCount: p.corpusEntries.length,
        memoryCount: p.accountMemories.length,
        scriptCount: p.scripts.length,
        // 关联数据
        topics: p.topics,
        corpusEntries: p.corpusEntries,
        accountMemories: p.accountMemories,
        scripts: p.scripts,
      }))
    );

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        balance: await getCreditBalance(user.id),
        createdAt: user.createdAt.toISOString(),
      },
      profiles: profilesWithStats,
    });
  }

  // 默认：用户列表
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const usersWithStats = await Promise.all(
    users.map(async (u: any) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      balance: await getCreditBalance(u.id),
      profileCount: await prisma.iPProfile.count({ where: { userId: u.id } }),
      createdAt: u.createdAt.toISOString(),
    }))
  );

  return NextResponse.json(usersWithStats);
}

export async function PATCH(req: NextRequest) {
  await requireAdmin();
  const { userId, role, credits } = await req.json();

  if (role) {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  if (credits !== undefined) {
    await addCredit(userId, credits, "admin_adjust");
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "缺少用户 ID" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
