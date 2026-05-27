import { NextRequest, NextResponse } from 'next/server'
import { createFreeTrialSubscription } from '@/lib/anbu-plan-access'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode =
    typeof body.familyCode === 'string' && body.familyCode.trim()
      ? body.familyCode.trim()
      : request.cookies.get('anbu_family_code')?.value ||
        request.cookies.get('pc_parent_invite_code')?.value ||
        ''

  if (!familyCode) {
    return NextResponse.json(
      {
        ok: false,
        message: '부모님 연결코드가 필요합니다. 먼저 /family-link에서 부모님을 연결해주세요.'
      },
      { status: 400 }
    )
  }

  const result = await createFreeTrialSubscription(familyCode)

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '무료 체험 구독 생성에 실패했습니다. Supabase anbu_subscriptions 테이블을 확인해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    created: result.created,
    subscription: result.subscription,
    plan: result.plan
  })
}
