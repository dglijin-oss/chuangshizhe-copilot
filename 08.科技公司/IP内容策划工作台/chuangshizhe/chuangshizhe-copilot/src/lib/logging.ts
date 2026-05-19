import { prisma } from "./prisma"

/**
 * Log an AI generation request to the GenerationLog table.
 * Silently ignores errors to not block the main flow.
 */
export async function logGeneration(
  userId: string,
  type: string,
  model: string,
  status: string,
  tokens: number,
  cost: number,
  duration: number,
  error?: string,
) {
  try {
    await prisma.generationLog.create({
      data: { userId, type, model, status, tokens, cost, duration, error },
    })
  } catch { /* ignore */ }
}
