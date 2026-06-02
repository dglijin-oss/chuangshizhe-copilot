import { type NextRequest, NextResponse } from 'next/server'
import { prismaCore } from '@/lib/prisma'

export const SESSION_COOKIE = 'session-token'

/**
 * 从请求中提取用户
 */
export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prismaCore.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) return null
  return session.user
}

/**
 * 检查用户是否有指定产品权限
 * @param user 用户对象
 * @param product 产品ID
 */
export function hasProductAccess(user: { role: string; products: string[] }, product: string): boolean {
  // admin 拥有全部权限
  if (user.role === 'admin') return true
  return user.products.includes(product)
}

/**
 * 权限守卫中间件工厂
 * @param product 需要检查的产品ID
 * @returns 返回 (req, handler) 的中间件函数
 */
export function requireProductAccess(product: string) {
  return async function guard(
    req: NextRequest,
    handler: (user: any) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    if (!hasProductAccess(user, product)) {
      return NextResponse.json(
        { error: '您尚未开通该功能模块，请先开通后使用' },
        { status: 403 }
      )
    }
    return handler(user)
  }
}
