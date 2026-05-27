import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlanForFamily, getDailyCheckCount } from '@/lib/anbu-plan-access'
import { notifyGuardianForCheckin } from '@/lib/anbu-notification-service'
import { supabaseRest, text } from '@/lib/anbu-supabase'
import type { DailyCareStatus, DailyCareType } from '@/lib/daily-care-engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const allowedTypes = new Set(['meal', 'medication', 'condition', 'safe_return', 'emergency'])
const allowedStatuses = new Set(['done', 'not_done', 'needs_help', 'unknown'])

export async function POST(request: NextRequest) {
  const role = request.cookies.get('pc_role')?.value || request.cookies.get('anbu_role')?.value || ''
  const familyCode =
    request.cookies.get('pc_parent_invite_code')?.value ||
    request.cookies.get('anbu_family_code')?.value ||
    ''

  if (role !== 'parent' || !familyCode) {
    return NextResponse.json(
      { ok: false, message: '먼저 부모님 연결코드로 접속해주세요.' },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))

  const elderName =
    text(request.cookies.get('pc_parent_name')?.value) ||
    text(body.elderName) ||
    '부모님'

  const checkType = text(body.checkType) as DailyCareType
  const careLabel = text(body.careLabel) || '오늘 확인'
  const status = text(body.status) as DailyCareStatus
  const memo = text(body.memo)

  if (!allowedTypes.has(checkType)) {
    return NextResponse.json({ ok: false, message: 'checkType이 올바르지 않습니다.' }, { status: 400 })
  }

  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ ok: false, message: 'status가 올바르지 않습니다.' }, { status: 400 })
  }

  const currentPlan = await getCurrentPlanForFamily(familyCode)
  const dailyCount = await getDailyCheckCount(familyCode)
  const dailyLimit = currentPlan.plan.limits.dailyChecks

  if (dailyCount >= dailyLimit) {
    return NextResponse.json(
      {
        ok: false,
        message: `오늘 안부 체크 한도 ${dailyLimit}회를 모두 사용했습니다. 더 자주 확인하려면 요금제를 업그레이드해주세요.`,
        plan: currentPlan.plan,
        usage: {
          dailyCount,
          dailyLimit,
          remainingDailyChecks: 0
        },
        upgradeUrl:
          currentPlan.plan.id === 'free'
            ? '/checkout?plan=basic'
            : currentPlan.plan.id === 'basic'
              ? '/checkout?plan=family'
              : '/checkout?plan=plus'
      },
      { status: 402 }
    )
  }

  const inserted = await supabaseRest('daily_care_checkins', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        family_code: familyCode,
        elder_name: elderName,
        check_type: checkType,
        care_label: careLabel,
        status,
        actor_role: 'parent',
        source: 'anbuon_parent_big_button',
        memo: memo || null,
        occurred_at: new Date().toISOString()
      }
    ])
  })

  if (!inserted.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '안부온 확인 저장에 실패했습니다. /setup/supabase에서 DB 설정을 확인해주세요.',
        detail: inserted.error
      },
      { status: 500 }
    )
  }

  const notification = await notifyGuardianForCheckin({
    familyCode,
    elderName,
    checkType,
    careLabel,
    status,
    memo
  }).catch((error) => ({
    ok: false,
    status: 'notification_error',
    message: error instanceof Error ? error.message : '알림 처리 중 오류가 발생했습니다.'
  }))

  return NextResponse.json({
    ok: true,
    checkin: Array.isArray(inserted.data) ? inserted.data[0] : inserted.data,
    plan: currentPlan.plan,
    usage: {
      dailyCheckCount: dailyCount + 1,
      dailyLimit,
      remainingDailyChecks: Math.max(dailyLimit - dailyCount - 1, 0)
    },
    notification
  })
}
