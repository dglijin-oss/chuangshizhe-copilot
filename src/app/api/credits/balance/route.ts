import { NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { getCreditBalance, getTodayUsage, getDailyQuota, resetDailyCredits } from "@/lib/credits";

export async function GET() {
  const user = await getSessionUserOrThrow();

  const balance = await getCreditBalance(user.id);
  const usedToday = await getTodayUsage(user.id);
  const dailyQuota = getDailyQuota();

  return NextResponse.json({ balance, usedToday, dailyQuota });
}
