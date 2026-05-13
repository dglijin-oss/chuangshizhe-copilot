import { prisma } from "./prisma";

const DAILY_QUOTA = parseInt(process.env.DAILY_AI_CREDITS || "10", 10);

export async function getCreditBalance(userId: string): Promise<number> {
  const result = await prisma.creditLedger.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum?.amount ?? 0;
}

export async function getTodayUsage(userId: string): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const result = await prisma.usageLog.aggregate({
    where: {
      userId,
      createdAt: { gte: todayStart },
    },
    _sum: { creditsUsed: true },
  });
  return result._sum?.creditsUsed ?? 0;
}

export async function deductCredit(
  userId: string,
  reason: string,
  profileId?: string
): Promise<{ success: boolean; balance: number }> {
  const balance = await getCreditBalance(userId);
  if (balance <= 0) return { success: false, balance: 0 };

  const newBalance = balance - 1;

  await prisma.$transaction([
    prisma.creditLedger.create({
      data: { userId, amount: -1, reason, balanceAfter: newBalance },
    }),
    prisma.usageLog.create({
      data: { userId, action: reason, creditsUsed: 1, profileId: profileId || undefined },
    }),
  ]);

  return { success: true, balance: newBalance };
}

export async function addCredit(
  userId: string,
  amount: number,
  reason: string
): Promise<number> {
  const balance = await getCreditBalance(userId);
  const newBalance = balance + amount;

  await prisma.creditLedger.create({
    data: { userId, amount, reason, balanceAfter: newBalance },
  });

  return newBalance;
}

export async function resetDailyCredits(userId: string): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const lastReset = await prisma.creditLedger.findFirst({
    where: { userId, reason: "daily_reset", createdAt: { gte: todayStart } },
    orderBy: { createdAt: "desc" },
  });

  if (lastReset) {
    return getCreditBalance(userId);
  }

  const balance = await getCreditBalance(userId);
  const newBalance = balance + DAILY_QUOTA;

  await prisma.creditLedger.create({
    data: { userId, amount: DAILY_QUOTA, reason: "daily_reset", balanceAfter: newBalance },
  });

  return newBalance;
}

export function getDailyQuota(): number {
  return DAILY_QUOTA;
}
