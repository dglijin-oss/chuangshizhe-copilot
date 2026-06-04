import { type NextRequest, NextResponse } from 'next/server'
import { runSkill } from '../../lib/executor'
import { deductForSkill, checkBalance, getUserPoints } from '../../lib/billing'
import { prisma, prismaXuanxue } from '@/lib/prisma'
import { getUserFromRequest, hasProductAccess } from '../../lib/auth-guard'
import type { SkillId } from '../../lib/types'

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

    // 权限检查
    if (!hasProductAccess(user, 'xuanxue')) {
      return NextResponse.json(
        { error: '您尚未开通玄学模块，请先开通后使用' },
        { status: 403 }
      )
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

    // 记录审计日志
    const pointsAfter = balanceCheck.balance - balanceCheck.required
    await prisma.generationLog.create({
      data: {
        userId: user.id,
        type: `xuanxue:${skillId}`,
        status: 'success',
        cost: balanceCheck.required,
      },
    })

    // 保存占卜记录
    await prismaXuanxue.divinationRecord.create({
      data: {
        userId: user.id,
        skillId: skillId,
        input: JSON.stringify(input),
        output: JSON.stringify(result),
        pointsCost: balanceCheck.required,
      },
    })

    return NextResponse.json({
      success: true,
      cost: balanceCheck.required,
      balance: pointsAfter,
      result,
    })
  } catch (error: any) {
    const { skill } = await params
    console.error(`[xuanxue][${skill}] error:`, error.message)

    // 记录失败日志
    try {
      const user = await getUserFromRequest(req)
      if (user) {
        await prisma.generationLog.create({
          data: {
            userId: user.id,
            type: `xuanxue:${skill}`,
            status: 'error',
            error: error.message,
          },
        })
      }
    } catch (logErr) {
      console.error('[xuanxue][log] failed to create error log:', logErr)
    }

    return NextResponse.json(
      { error: error.message || '技能执行失败' },
      { status: 500 }
    )
  }
}
