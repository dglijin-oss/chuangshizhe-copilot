import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, hasProductAccess } from '../../lib/auth-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    if (!hasProductAccess(user, 'xuanxue')) {
      return NextResponse.json({ error: '您尚未开通玄学模块' }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const skillId = searchParams.get('skillId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, any> = { userId: user.id }
    if (skillId && skillId !== 'all') {
      where.skillId = skillId
    }

    const [records, total] = await Promise.all([
      prisma.divinationRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.divinationRecord.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      records: records.map(r => ({
        id: r.id,
        skillId: r.skillId,
        createdAt: r.createdAt.toISOString(),
        pointsCost: r.pointsCost,
        summary: r.input.slice(0, 100), // 前100字符作为摘要
      })),
      total,
    })
  } catch (error: any) {
    console.error('[xuanxue][history] error:', error.message)
    return NextResponse.json(
      { error: error.message || '查询失败' },
      { status: 500 }
    )
  }
}
