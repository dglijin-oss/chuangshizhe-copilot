import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCreditBalance, addCredit } from "@/lib/credits";

export async function GET() {
  await requireAdmin();

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
