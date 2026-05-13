import { NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { resetDailyCredits, getDailyQuota } from "@/lib/credits";

export async function POST() {
  const user = await getSessionUserOrThrow();
  const newBalance = await resetDailyCredits(user.id);
  return NextResponse.json({ balance: newBalance, dailyQuota: getDailyQuota() });
}
