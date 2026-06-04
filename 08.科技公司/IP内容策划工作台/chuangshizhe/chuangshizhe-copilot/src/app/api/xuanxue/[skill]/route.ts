import { type NextRequest, NextResponse } from 'next/server'
import { runSkill } from '@/modules/xuanxue/lib/executor'
import { deductForSkill, checkBalance } from '@/modules/xuanxue/lib/billing'
import { prismaCore } from '@/lib/prisma'
import { getUserFromRequest, hasProductAccess } from '@/modules/xuanxue/lib/auth-guard'
import type { SkillId } from '@/modules/xuanxue/lib/types'

export const dynamic = 'force-dynamic'

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

    // TODO: 恢复权限检查（待 admin 给用户开通 xuanxue 产品后启用）
    // if (!hasProductAccess(user, 'xuanxue')) {
    //   return NextResponse.json({ error: '您尚未开通玄学模块' }, { status: 403 })
    // }

    const skillId = skill as SkillId
    const input = await req.json()

    const balanceCheck = await checkBalance(user.id, skillId)
    if (!balanceCheck.ok) {
      return NextResponse.json(
        { error: `积分不足，当前余额 ${balanceCheck.balance}，需要 ${balanceCheck.required}` },
        { status: 402 }
      )
    }

    const result = await runSkill(skillId, input)

    const deducted = await deductForSkill(user.id, skillId)
    if (!deducted) {
      return NextResponse.json({ error: '扣费失败，请重试' }, { status: 500 })
    }

    await prismaCore.generationLog.create({
      data: {
        userId: user.id,
        type: `xuanxue:${skillId}`,
        status: 'success',
        cost: balanceCheck.required,
      },
    })

    // TODO: 写入 DivinationRecord（待数据库迁移）
    // await prisma.divinationRecord.create({...})

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
