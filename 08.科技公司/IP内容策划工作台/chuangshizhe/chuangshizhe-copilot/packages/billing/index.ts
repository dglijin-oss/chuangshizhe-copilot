/**
 * @chuangshizhe/billing — 共享积分计费模块
 *
 * 所有函数接受 PrismaClient 参数，不硬编码导入。
 */

import type { PrismaClient } from "@chuangshizhe/database/client-core"

export interface DeductOptions {
  userId: string
  points: number
  product?: string
  reason?: string
}

export interface RechargeOptions {
  userId: string
  amount: number
  points: number
  bonus?: number
  payMethod?: string
}

/**
 * 原子扣积分：使用 updateMany + where 条件确保原子性，防止竞态。
 * 如果用户积分不足，updateMany 返回 count=0，函数返回 false。
 */
export async function deductPoints(
  prisma: PrismaClient,
  { userId, points, product, reason }: DeductOptions,
): Promise<boolean> {
  const result = await prisma.user.updateMany({
    where: { id: userId, points: { gte: points } },
    data: { points: { decrement: points } },
  })
  return result.count > 0
}

/** 只读检查用户是否有足够积分 */
export async function checkPoints(
  prisma: PrismaClient,
  userId: string,
  required: number,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  })
  return user != null && user.points >= required
}

/** 创建待支付充值订单 */
export async function createRecharge(
  prisma: PrismaClient,
  { userId, amount, points, bonus = 0, payMethod = "wechat" }: RechargeOptions,
) {
  return prisma.pointsRecharge.create({
    data: { userId, amount, points, bonus, payMethod, status: "pending" },
  })
}

/** 确认充值：更新状态为已支付，并给用户加积分 */
export async function confirmRecharge(
  prisma: PrismaClient,
  rechargeId: string,
): Promise<{ success: boolean; error?: string }> {
  const recharge = await prisma.pointsRecharge.findUnique({
    where: { id: rechargeId },
  })
  if (!recharge) return { success: false, error: "订单不存在" }
  if (recharge.status === "completed") return { success: false, error: "订单已确认" }

  // 在事务中更新状态和加积分
  await prisma.$transaction([
    prisma.pointsRecharge.update({
      where: { id: rechargeId },
      data: { status: "completed" },
    }),
    prisma.user.update({
      where: { id: recharge.userId },
      data: { points: { increment: recharge.points + recharge.bonus } },
    }),
  ])

  return { success: true }
}
