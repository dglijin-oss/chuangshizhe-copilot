import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCreditBalance, getTodayUsage, getDailyQuota } from "@/lib/credits";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const balance = await getCreditBalance(user.id);
  const usedToday = await getTodayUsage(user.id);

  return NextResponse.json({
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
    credits: { balance, usedToday, dailyQuota: getDailyQuota() },
  });
}
