import { type NextRequest, NextResponse } from 'next/server'
import { runSkill } from '@/modules/xuanxue/lib/executor'
import { deductForSkill, checkBalance } from '@/modules/xuanxue/lib/billing'
import { prisma } from '@/lib/prisma'
import type { SkillId } from '@/modules/xuanxue/lib/types'

export const dynamic = 'force-dynamic'

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('session-token')?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) return null
  return session.user
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ skill: string }> }
) {
  try {
    const { skill } = await params
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const skillId = skill as SkillId
    const input = await req.json()

    // 检查余额
    const balanceCheck = await checkBalance(user.id, skillId)
    if (!balanceCheck.ok) {
      return NextResponse.json(
        { error: `积分不足，当前余额 ${balanceCheck.balance}，需要 ${balanceCheck.required}` },
        { status: 402 }
      )
    }

    // 执行技能
    const result = await runSkill(skillId, input)

    // 扣费
    const deducted = await deductForSkill(user.id, skillId)
    if (!deducted) {
      return NextResponse.json({ error: '扣费失败，请重试' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cost: balanceCheck.required,
      balance: balanceCheck.balance - balanceCheck.required,
      result,
    })
  } catch (error: any) {
    const { skill } = await params
    console.error(`[xuanxue][${skill}] error:`, error.message)
    return NextResponse.json(
      { error: error.message || '技能执行失败' },
      { status: 500 }
    )
  }
}
