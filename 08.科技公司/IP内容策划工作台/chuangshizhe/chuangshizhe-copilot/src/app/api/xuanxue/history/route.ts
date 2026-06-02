import { type NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const skillId = searchParams.get('skillId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // TODO: 从数据库查询记录
    return NextResponse.json({
      success: true,
      records: [],
      total: 0,
    })
  } catch (error: any) {
    console.error('[xuanxue][history] error:', error.message)
    return NextResponse.json(
      { error: error.message || '查询失败' },
      { status: 500 }
    )
  }
}
