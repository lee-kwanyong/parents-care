import { NextRequest, NextResponse } from 'next/server'
import { firstRow, supabaseRest, text } from '@/lib/anbu-supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type PaymentOrderRow = {
  id: string
  family_code?: string | null
  order_id: string
  order_name: string
  plan_id: string
  plan_name: string
  amount: number
  billing_cycle: string
  plan_type: string
  payment_status: string
}

function parseAmount(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

async function updateOrder(orderId: string, patch: Record<string, unknown>) {
  return supabaseRest('anbu_payment_orders?order_id=eq.' + encodeURIComponent(orderId), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      ...patch,
      updated_at: new Date().toISOString()
    })
  })
}

async function createSubscription(order: PaymentOrderRow) {
  if (order.plan_type !== 'subscription') return null

  const now = new Date()
  const nextMonth = new Date(now)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  return supabaseRest('anbu_subscriptions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        family_code: order.family_code || null,
        plan_id: order.plan_id,
        plan_name: order.plan_name,
        subscription_status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        last_order_id: order.order_id
      }
    ])
  })
}

async function confirmWithToss(input: {
  paymentKey: string
  orderId: string
  amount: number
}) {
  const secretKey = process.env.TOSS_SECRET_KEY || ''

  if (!secretKey) {
    return {
      ok: false,
      status: 'config_missing',
      data: null,
      error: 'TOSS_SECRET_KEY 환경변수가 필요합니다.'
    }
  }

  const authorization = Buffer.from(secretKey + ':').toString('base64')

  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + authorization,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      amount: input.amount
    })
  })

  const bodyText = await response.text()
  let parsed: unknown = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return {
    ok: response.ok,
    status: response.ok ? 'paid' : 'failed',
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const paymentKey = text(body.paymentKey)
  const orderId = text(body.orderId)
  const amount = parseAmount(body.amount)

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json(
      { ok: false, message: 'paymentKey, orderId, amount가 필요합니다.' },
      { status: 400 }
    )
  }

  const orderResult = await supabaseRest(
    'anbu_payment_orders?select=*&order_id=eq.' +
      encodeURIComponent(orderId) +
      '&limit=1'
  )

  if (!orderResult.ok) {
    return NextResponse.json(
      { ok: false, message: '주문 정보를 확인하지 못했습니다.', detail: orderResult.error },
      { status: 500 }
    )
  }

  const order = firstRow<PaymentOrderRow>(orderResult.data)

  if (!order) {
    return NextResponse.json({ ok: false, message: '주문을 찾지 못했습니다.' }, { status: 404 })
  }

  if (Number(order.amount) !== amount) {
    await updateOrder(orderId, {
      payment_status: 'failed',
      failed_at: new Date().toISOString(),
      failure_reason: '결제 요청 금액과 주문 금액이 일치하지 않습니다.',
      raw_response: { requestedAmount: amount, orderAmount: order.amount }
    })

    return NextResponse.json(
      { ok: false, message: '결제 금액이 주문 금액과 일치하지 않습니다.' },
      { status: 400 }
    )
  }

  if (order.payment_status === 'paid') {
    return NextResponse.json({
      ok: true,
      message: '이미 승인된 결제입니다.',
      order
    })
  }

  const toss = await confirmWithToss({ paymentKey, orderId, amount })

  if (!toss.ok) {
    await updateOrder(orderId, {
      payment_key: paymentKey,
      payment_status: toss.status,
      failed_at: new Date().toISOString(),
      failure_reason: typeof toss.error === 'string' ? toss.error : JSON.stringify(toss.error),
      raw_response: toss.error || {}
    })

    return NextResponse.json(
      {
        ok: false,
        message:
          toss.status === 'config_missing'
            ? '토스페이먼츠 시크릿 키가 없어 결제를 승인하지 못했습니다. /setup/payments에서 환경변수를 확인하세요.'
            : '토스페이먼츠 결제 승인에 실패했습니다.',
        detail: toss.error
      },
      { status: 500 }
    )
  }

  const updated = await updateOrder(orderId, {
    payment_key: paymentKey,
    payment_status: 'paid',
    paid_at: new Date().toISOString(),
    raw_response: toss.data || {}
  })

  const subscription = await createSubscription(order)

  return NextResponse.json({
    ok: true,
    message: '결제가 승인되었습니다.',
    payment: toss.data,
    order: Array.isArray(updated.data) ? updated.data[0] : updated.data,
    subscription: subscription?.ok ? subscription.data : null
  })
}
