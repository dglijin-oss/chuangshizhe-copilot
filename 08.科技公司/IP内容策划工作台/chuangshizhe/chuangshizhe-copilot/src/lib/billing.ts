import { prisma } from "./prisma"

/**
 * Deduct points from user after AI generation.
 * Uses atomic updateMany to prevent race conditions.
 * Returns true if deduction succeeded, false if user has insufficient points.
 */
export async function deductPoints(userId: string, points: number): Promise<boolean> {
  const result = await prisma.user.updateMany({
    where: { id: userId, points: { gte: points } },
    data: { points: { decrement: points } },
  })
  return result.count > 0
}

/**
 * Add points to user account (for recharge bonuses, rewards, etc.)
 * Uses atomic increment for safety.
 */
export async function addPoints(userId: string, points: number, reason?: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { points: { increment: points } },
  })

  // 可选：记录审计日志
  if (reason) {
    await prisma.generationLog.create({
      data: {
        userId,
        type: 'points:add',
        status: 'success',
        cost: -points, // 负数表示增加
        error: reason,
      },
    })
  }
}

/**
 * 检查用户每日使用配额
 * 返回 { allowed: boolean, used: number, limit: number }
 */
export async function checkDailyQuota(userId: string, product: string, limit: number = 100): Promise<{
  allowed: boolean
  used: number
  limit: number
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const used = await prisma.generationLog.count({
    where: {
      userId,
      type: { startsWith: `${product}:` },
      status: 'success',
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  })

  return {
    allowed: used < limit,
    used,
    limit,
  }
}

/**
 * 检查用户积分余额
 */
export async function getUserPoints(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  })
  return user?.points ?? 0
}
