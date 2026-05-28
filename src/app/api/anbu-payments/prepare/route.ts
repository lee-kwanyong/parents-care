import { NextRequest, NextResponse } from 'next/server'
import { supabaseInsert, supabaseSelect, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const allowedPlans: Record<string, { name: string; amount: number }> = {
  basic: { name: '안부온 베이직', amount: 9900 },
  plus: { name: '안심케어 플러스', amount: 29900 }
}

async function findFamily(request: NextRequest, requestedCode = '') {
  const requested =
    requestedCode ||
    request.nextUrl.searchParams.get('familyCode') ||
    request.cookies.get('anbu_family_code')?.value ||
    request.cookies.get('pc_parent_invite_code')?.value ||
    ''

  if (requested) {
    const found = await supabaseSelect(
      'anbu_family_links?select=family_code,parent_name,guardian_name&family_code=eq.' +
        encodeURIComponent(requested) +
        '&limit=1'
    )

    if (found.ok && Array.isArray(found.data) && found.data[0]) {
      return found.data[0] as Record<string, unknown>
    }

    return {
      family_code: requested,
      parent_name: '부모님',
      guardian_name: '보호자'
    }
  }

  const latest = await supabaseSelect(
    'anbu_family_links?select=family_code,parent_name,guardian_name&link_status=eq.active&order=created_at.desc&limit=1'
  )

  if (latest.ok && Array.isArray(latest.data) && latest.data[0]) {
    return latest.data[0] as Record<string, unknown>
  }

  return null
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const planId = text(body.planId) || 'basic'
  const plan = allowedPlans[planId]

  if (!plan) {
    return NextResponse.json(
      { ok: false, message: '지원하지 않는 요금제입니다.' },
      { status: 400 }
    )
  }

  const family = await findFamily(request, text(body.familyCode))
  const familyCode = typeof family?.family_code === 'string' ? family.family_code : ''

  if (!familyCode) {
    return NextResponse.json(
      {
        ok: false,
        message: '부모님 연결코드가 필요합니다. 먼저 /family-link에서 부모님을 연결해주세요.'
      },
      { status: 400 }
    )
  }

  const orderId = `ANBU-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ''
  const secretKeyConfigured = Boolean(process.env.TOSS_SECRET_KEY)

  const saved = await supabaseInsert('anbu_payment_intents', {
    order_id: orderId,
    family_code: familyCode,
    plan_id: planId,
    plan_name: plan.name,
    amount: plan.amount,
    currency: 'KRW',
    provider: 'toss',
    status: 'ready',
    payload: {
      planId,
      family,
      clientKeyConfigured: Boolean(clientKey),
      secretKeyConfigured
    }
  })

  return NextResponse.json({
    ok: true,
    orderId,
    familyCode,
    planId,
    planName: plan.name,
    amount: plan.amount,
    currency: 'KRW',
    provider: 'toss',
    clientKey,
    clientKeyConfigured: Boolean(clientKey),
    secretKeyConfigured,
    successUrl: `${request.nextUrl.origin}/billing/success`,
    failUrl: `${request.nextUrl.origin}/billing/fail`,
    saved,
    nextStep: clientKey
      ? '결제창을 열 수 있습니다.'
      : 'Toss Client Key가 없어 결제창은 열 수 없습니다. 운영실 수동 활성화로 테스트할 수 있습니다.'
  })
}
