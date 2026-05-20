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
