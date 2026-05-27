import { NextRequest, NextResponse } from 'next/server'
import { supabaseInsert, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const allowedPlans: Record<string, { name: string; amount: number }> = {
  free: { name: '무료', amount: 0 },
  basic: { name: '안부온 베이직', amount: 9900 },
  plus: { name: '안심케어 플러스', amount: 29900 }
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

  const orderId = `ANBU-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ''
  const secretKeyConfigured = Boolean(process.env.TOSS_SECRET_KEY)

  const saved = await supabaseInsert('anbu_payment_intents', {
    order_id: orderId,
    plan_id: planId,
    plan_name: plan.name,
    amount: plan.amount,
    currency: 'KRW',
    status: plan.amount === 0 ? 'free_plan_selected' : 'ready',
    provider: 'toss',
    payload: {
      planId,
      clientKeyConfigured: Boolean(clientKey),
      secretKeyConfigured
    }
  })

  return NextResponse.json({
    ok: true,
    orderId,
    planId,
    planName: plan.name,
    amount: plan.amount,
    currency: 'KRW',
    provider: 'toss',
    clientKey,
    clientKeyConfigured: Boolean(clientKey),
    secretKeyConfigured,
    saved,
    nextStep:
      plan.amount === 0
        ? '무료 요금제 선택을 저장했습니다.'
        : clientKey
          ? '결제창을 열 수 있습니다.'
          : '결제 키가 아직 없습니다. 지금은 결제 의도만 저장했습니다.'
  })
}
