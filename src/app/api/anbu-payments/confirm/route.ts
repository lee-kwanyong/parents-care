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
  const expectedAmount = intent ? toNumber(intent.amount) : amount

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
      message: 'TOSS_SECRET_KEY가 없어 결제 승인을 완료할 수 없습니다. Vercel 환경변수에 TOSS_SECRET_KEY를 추가하세요.',
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
    await supabaseInsert('anbu_payment_events', {
      order_id: orderId,
      provider: 'toss',
      event_type: 'confirm_failed',
      status: 'failed',
      payload: { paymentKey, orderId, amount, toss: parsed }
    })

    await supabasePatch(
      'anbu_payment_intents?order_id=eq.' + encodeURIComponent(orderId),
      {
        status: 'confirm_failed',
        payload: {
          paymentKey,
          orderId,
          amount,
          toss: parsed
        }
      }
    )

    return NextResponse.json(
      {
        ok: false,
        message: '토스페이먼츠 결제 승인에 실패했습니다.',
        detail: parsed
      },
      { status: 400 }
    )
  }

  await supabasePatch(
    'anbu_payment_intents?order_id=eq.' + encodeURIComponent(orderId),
    {
      status: 'paid',
      paid_at: new Date().toISOString(),
      payload: {
        paymentKey,
        orderId,
        amount,
        toss: parsed
      }
    }
  )

  await supabaseInsert('anbu_payment_events', {
    order_id: orderId,
    provider: 'toss',
    event_type: 'confirm_success',
    status: 'paid',
    payload: { paymentKey, orderId, amount, toss: parsed }
  })

  if (intent) {
    await supabaseInsert('anbu_subscriptions', {
      family_code: intent.family_code || null,
      plan_name: intent.plan_name || intent.plan_id || '안부온',
      status: 'active',
      started_at: new Date().toISOString()
    })
  }

  return NextResponse.json({
    ok: true,
    message: '결제 승인이 완료되었습니다.',
    payment: parsed
  })
}
