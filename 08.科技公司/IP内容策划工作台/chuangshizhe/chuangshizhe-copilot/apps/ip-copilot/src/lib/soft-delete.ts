/**
 * Soft delete helper — all queries that read user-facing data
 * should include `where: { deletedAt: null }` to hide soft-deleted records.
 *
 * Usage in any API route:
 *   import { whereActive } from "@/lib/soft-delete"
 *   const ips = await prismaIp.ip.findMany({ where: { userId: user.id, ...whereActive } })
 */

export const whereActive = { deletedAt: null }

/**
 * Combine a user-provided `where` clause with the soft-delete filter.
 *
 * Usage:
 *   where: softDelete({ userId: user.id, status: "active" })
 *   // becomes: { userId: user.id, status: "active", deletedAt: null }
 */
export function softDelete(where: Record<string, unknown> = {}) {
  return { ...where, ...whereActive }
}
