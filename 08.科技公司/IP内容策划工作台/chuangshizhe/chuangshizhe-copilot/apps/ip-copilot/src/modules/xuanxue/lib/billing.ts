import { prismaIp as prisma } from '@/lib/prisma'
import { deductPoints as coreDeductPoints } from '@/lib/billing'
import type { SkillId } from './types'

// 技能定价配置（积分）
const SKILL_PRICING: Record<SkillId, number> = {
  bazi: 10,
  liuyao: 10,
  qimen: 10,
  meihua: 10,
  qizheng: 10,
  ziwei: 10,
  liuren: 10,
  taiyi: 10,
  fengshui: 10,
  'ze-ri': 10,
}

/**
 * 获取技能价格
 */
export function getSkillPrice(skillId: SkillId): number {
  return SKILL_PRICING[skillId] || 10
}

/**
 * 扣费
 * @param userId 用户ID
 * @param skillId 技能ID
 * @returns 是否扣费成功
 */
export async function deductForSkill(userId: string, skillId: SkillId): Promise<boolean> {
  const cost = getSkillPrice(skillId)
  return await coreDeductPoints(userId, cost)
}

/**
 * 检查用户余额
 */
export async function getUserPoints(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  })
  return user?.points ?? 0
}

/**
 * 检查余额是否足够
 */
export async function checkBalance(userId: string, skillId: SkillId): Promise<{
  ok: boolean
  balance: number
  required: number
}> {
  const cost = getSkillPrice(skillId)
  const balance = await getUserPoints(userId)

  return {
    ok: balance >= cost,
    balance,
    required: cost,
  }
}
