import { NextRequest, NextResponse } from 'next/server'
import { supabaseInsert, supabasePatch, supabaseSelect, text, toNumber } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function tossAuthHeader() {
  const secretKey = process.env.TOSS_SECRET_KEY || ''
  if (!secretKey) return ''
  return 'Basic ' + Buffer.from(secretKey + ':').toString('base64')
}

async function getPaymentIntent(orderId: string) {
  const result = await supabaseSelect(
    'anbu_payment_intents?select=*&order_id=eq.' +
      encodeURIComponent(orderId) +
      '&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) {
    return null
  }

  return result.data[0] as Record<string, unknown>
}

async function activateSubscription(input: {
  familyCode: string
  planName: string
  orderId: string
}) {
  const startedAt = new Date()
  const endedAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000)

  return supabaseInsert('anbu_subscriptions', {
    family_code: input.familyCode,
    plan_name: input.planName,
    status: 'active',
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    payload: {
      source: 'payment-confirm',
      orderId: input.orderId
    }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const paymentKey = text(body.paymentKey)
  const orderId = text(body.orderId)
  const amount = toNumber(body.amount)

  if (!paymentKey || !orderId || amount <= 0) {
    return NextResponse.json(
      { ok: false, message: 'paymentKey, orderId, amount가 필요합니다.' },
      { status: 400 }
    )
  }

  const intent = await getPaymentIntent(orderId)

  if (!intent) {
    return NextResponse.json(
      { ok: false, message: '결제 의도를 찾지 못했습니다.' },
      { status: 404 }
    )
  }

  const expectedAmount = toNumber(intent.amount)

  if (expectedAmount !== amount) {
    await supabaseInsert('anbu_payment_events', {
      order_id: orderId,
      provider: 'toss',
      event_type: 'amount_mismatch',
      status: 'failed',
      payload: { paymentKey, orderId, amount, expectedAmount }
    })

    return NextResponse.json(
      {
        ok: false,
        message: '결제 금액이 서버 기록과 일치하지 않습니다.',
        amount,
        expectedAmount
      },
      { status: 400 }
    )
  }

  const authorization = tossAuthHeader()

  if (!authorization) {
    await supabaseInsert('anbu_payment_events', {
      order_id: orderId,
      provider: 'toss',
      event_type: 'confirm_missing_secret',
      status: 'pending',
      payload: { paymentKey, orderId, amount }
    })

    return NextResponse.json({
      ok: false,
      mode: 'missing-secret',
      message: 'TOSS_SECRET_KEY가 없어 결제 승인을 완료할 수 없습니다. 운영실 수동 활성화로 테스트하세요.',
      paymentKey,
      orderId,
      amount
    })
  }

  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount
    })
  })

  const responseText = await response.text()
  let parsed: unknown = null

  try {
    parsed = responseText ? JSON.parse(responseText) : null
  } catch {
    parsed = responseText
  }

  if (!response.ok) {
    await supabasePatch(
      'anbu_payment_intents?order_id=eq.' + encodeURIComponent(orderId),
      {
        status: 'confirm_failed',
        payload: {
          original: intent,
          toss: parsed
        }
      }
    )

    await supabaseInsert('anbu_payment_events', {
      order_id: orderId,
      provider: 'toss',
      event_type: 'confirm_failed',
      status: 'failed',
      payload: { paymentKey, orderId, amount, toss: parsed }
    })

    return NextResponse.json(
      {
        ok: false,
        message: '토스페이먼츠 결제 승인에 실패했습니다.',
        detail: parsed
      },
      { status: 400 }
    )
  }

  const familyCode = text(intent.family_code)
  const planName = text(intent.plan_name) || '안부온 베이직'

  const subscription = await activateSubscription({
    familyCode,
    planName,
    orderId
  })

  await supabasePatch(
    'anbu_payment_intents?order_id=eq.' + encodeURIComponent(orderId),
    {
      status: 'paid',
      paid_at: new Date().toISOString(),
      payload: {
        original: intent,
        paymentKey,
        toss: parsed,
        subscription
      }
    }
  )

  await supabaseInsert('anbu_payment_events', {
    order_id: orderId,
    provider: 'toss',
    event_type: 'confirm_success',
    status: 'paid',
    payload: { paymentKey, orderId, amount, toss: parsed, subscription }
  })

  return NextResponse.json({
    ok: true,
    message: '결제 승인이 완료되었고 구독이 활성화되었습니다.',
    payment: parsed,
    subscription
  })
}
