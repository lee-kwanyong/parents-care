import { NextRequest, NextResponse } from 'next/server'
import { getPricingPlan } from '@/lib/anbu-pricing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanOrderId(value: unknown) {
  return text(value).replace(/[^\w-=]/g, '').slice(0, 90)
}

function cleanPaymentKey(value: unknown) {
  return text(value).slice(0, 240)
}

function supabaseBaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function tossSecretKey() {
  return process.env.TOSS_SECRET_KEY || process.env.TOSSPAYMENTS_SECRET_KEY || ''
}

function restBaseUrl() {
  const base = supabaseBaseUrl()
  return base ? `${base}/rest/v1` : ''
}

async function restRows(table: string, params: Record<string, string>) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [] as Row[],
      error: 'Supabase 환경변수가 설정되지 않았습니다.'
    }
  }

  const search = new URLSearchParams(params)

  try {
    const response = await fetch(`${base}/${table}?${search.toString()}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = []

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      parsed = []
    }

    return {
      ok: response.ok,
      rows: response.ok && Array.isArray(parsed) ? parsed as Row[] : [],
      error: response.ok ? '' : `${table}: ${response.status} ${raw.slice(0, 300)}`
    }
  } catch (error) {
    return {
      ok: false,
      rows: [] as Row[],
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

async function insertRow(table: string, row: Row) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [] as Row[],
      error: 'Supabase 환경변수가 설정되지 않았습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/${table}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(row),
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = []

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      parsed = []
    }

    return {
      ok: response.ok,
      rows: response.ok && Array.isArray(parsed) ? parsed as Row[] : [],
      error: response.ok ? '' : `${table}: ${response.status} ${raw.slice(0, 300)}`
    }
  } catch (error) {
    return {
      ok: false,
      rows: [] as Row[],
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

async function patchRows(table: string, filter: string, patch: Row) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [] as Row[],
      error: 'Supabase 환경변수가 설정되지 않았습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/${table}?${filter}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(patch),
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = []

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      parsed = []
    }

    return {
      ok: response.ok,
      rows: response.ok && Array.isArray(parsed) ? parsed as Row[] : [],
      error: response.ok ? '' : `${table}: ${response.status} ${raw.slice(0, 300)}`
    }
  } catch (error) {
    return {
      ok: false,
      rows: [] as Row[],
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

async function confirmTossPayment(input: {
  paymentKey: string
  orderId: string
  amount: number
}) {
  const secretKey = tossSecretKey()

  if (!secretKey) {
    return {
      ok: false,
      status: 500,
      data: null as unknown,
      error: {
        code: 'TOSS_SECRET_KEY_MISSING',
        message: 'TOSS_SECRET_KEY 환경변수가 필요합니다.'
      }
    }
  }

  const encodedSecret = Buffer.from(`${secretKey}:`).toString('base64')

  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encodedSecret}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      amount: input.amount
    }),
    cache: 'no-store'
  })

  const data = await response.json().catch(() => ({}))

  return {
    ok: response.ok,
    status: response.status,
    data,
    error: response.ok ? null : data
  }
}

async function confirmReferralIfNeeded(input: {
  order: Row
  payment: Row
}) {
  const usedReferralCode = text(input.order.used_referral_code)
  const generatedReferralCode = text(input.order.generated_referral_code)
  const applicationId = text(input.order.application_id)
  const orderId = text(input.order.order_id)
  const customerName = text(input.order.customer_name)
  const phoneLast4 = text(input.order.customer_phone_last4)
  const planCode = text(input.order.plan_code)
  const pointAmount = Number(input.order.point_amount) || 5000

  if (!usedReferralCode || usedReferralCode === generatedReferralCode) {
    return {
      ok: true,
      skipped: true,
      reason: 'no_referrer'
    }
  }

  const referral = await restRows('anbu_referral_codes', {
    select: 'id,referral_code,point_balance,status',
    referral_code: `eq.${usedReferralCode}`,
    limit: '1'
  })

  if (!referral.ok || !referral.rows[0] || text(referral.rows[0].status) !== 'active') {
    await insertRow('anbu_referral_events', {
      referrer_code: usedReferralCode,
      generated_referral_code: generatedReferralCode || null,
      application_id: applicationId || null,
      checkout_order_id: orderId,
      referee_name: customerName,
      referee_phone_last4: phoneLast4,
      plan_code: planCode,
      reward_points: pointAmount,
      event_status: 'invalid_code',
      metadata: {
        reason: '추천인코드가 없거나 비활성 상태입니다.'
      }
    })

    return {
      ok: false,
      skipped: false,
      reason: 'invalid_referral_code'
    }
  }

  await insertRow('anbu_referral_events', {
    referrer_code: usedReferralCode,
    generated_referral_code: generatedReferralCode || null,
    application_id: applicationId || null,
    checkout_order_id: orderId,
    referee_name: customerName,
    referee_phone_last4: phoneLast4,
    plan_code: planCode,
    reward_points: pointAmount,
    event_status: 'confirmed',
    confirmed_at: new Date().toISOString(),
    metadata: {
      paymentKey: text(input.payment.paymentKey || input.payment.payment_key),
      paymentStatus: 'DONE',
      policy: '추천 결제 완료로 5,000P 확정'
    }
  })

  await insertRow('anbu_point_ledger', {
    referral_code: usedReferralCode,
    amount: pointAmount,
    ledger_type: 'referral_reward',
    ledger_status: 'confirmed',
    related_application_id: applicationId || null,
    related_order_id: orderId,
    memo: `${customerName} 님 결제 완료로 추천 포인트 확정`,
    confirmed_at: new Date().toISOString(),
    metadata: {
      planCode,
      generatedReferralCode,
      pointPolicy: 'service_credit_only_no_cash_refund'
    }
  })

  const currentBalance = Number(referral.rows[0].point_balance) || 0

  await patchRows(
    'anbu_referral_codes',
    `referral_code=eq.${encodeURIComponent(usedReferralCode)}`,
    {
      point_balance: currentBalance + pointAmount,
      updated_at: new Date().toISOString()
    }
  )

  return {
    ok: true,
    skipped: false,
    reason: 'confirmed'
  }
}

async function activatePlan(input: {
  order: Row
  payment: Row
}) {
  const planCode = text(input.order.plan_code)
  const plan = getPricingPlan(planCode)
  const applicationId = text(input.order.application_id)
  const amount = Number(input.order.amount_krw) || plan.priceKrw
  const orderId = text(input.order.order_id)
  const paymentKey = text(input.payment.paymentKey || input.payment.payment_key)

  if (applicationId) {
    await patchRows(
      'anbu_plan_applications',
      `id=eq.${encodeURIComponent(applicationId)}`,
      {
        application_status: 'paid',
        updated_at: new Date().toISOString(),
        metadata: {
          orderId,
          paymentKey,
          paymentStatus: 'DONE',
          planCategory: plan.category
        }
      }
    )
  }

  if (plan.billingCycle === 'monthly') {
    const now = new Date()
    const nextMonth = new Date(now.getTime())
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    await insertRow('anbu_subscriptions', {
      application_id: applicationId || null,
      plan_code: plan.code,
      status: 'active',
      price_krw: amount,
      started_at: now.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
      metadata: {
        orderId,
        paymentKey,
        note: '토스 일반결제 1개월 활성화. 자동 정기결제는 빌링키 연동 후 별도 처리.'
      }
    })

    return
  }

  const now = new Date()
  const end = plan.durationDays
    ? new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
    : null

  await insertRow('anbu_care_pass_orders', {
    application_id: applicationId || null,
    plan_code: plan.code,
    status: 'active',
    price_krw: amount,
    free_pilot: false,
    start_at: now.toISOString(),
    end_at: end ? end.toISOString() : null,
    metadata: {
      orderId,
      paymentKey,
      planTitle: plan.title,
      planCategory: plan.category,
      partnerVisits: plan.partnerVisits || 0,
      officeChecks: plan.officeChecks || 0,
      note: `${plan.title} 결제 완료`
    }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const paymentKey = cleanPaymentKey(body.paymentKey)
  const orderId = cleanOrderId(body.orderId)
  const amount = Number(body.amount)

  if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      {
        ok: false,
        message: 'paymentKey, orderId, amount가 필요합니다.'
      },
      { status: 400 }
    )
  }

  const orderResult = await restRows('anbu_checkout_orders', {
    select: '*',
    order_id: `eq.${orderId}`,
    limit: '1'
  })

  if (!orderResult.ok || !orderResult.rows[0]) {
    return NextResponse.json(
      {
        ok: false,
        message: '결제 주문을 찾지 못했습니다.',
        detail: orderResult.error
      },
      { status: 404 }
    )
  }

  const order = orderResult.rows[0]
  const expectedAmount = Number(order.amount_krw)

  if (expectedAmount !== amount) {
    await patchRows(
      'anbu_checkout_orders',
      `order_id=eq.${encodeURIComponent(orderId)}`,
      {
        status: 'amount_mismatch',
        failed_code: 'AMOUNT_MISMATCH',
        failed_message: `요청 금액 ${amount}원과 주문 금액 ${expectedAmount}원이 다릅니다.`,
        updated_at: new Date().toISOString()
      }
    )

    return NextResponse.json(
      {
        ok: false,
        message: '결제 금액이 주문 금액과 다릅니다.',
        expectedAmount,
        receivedAmount: amount
      },
      { status: 400 }
    )
  }

  if (text(order.status) === 'paid' || text(order.toss_status) === 'DONE') {
    return NextResponse.json({
      ok: true,
      alreadyConfirmed: true,
      message: '이미 승인된 결제입니다.',
      orderId,
      paymentKey: text(order.payment_key),
      amount: expectedAmount
    })
  }

  const toss = await confirmTossPayment({
    paymentKey,
    orderId,
    amount
  })

  if (!toss.ok) {
    await patchRows(
      'anbu_checkout_orders',
      `order_id=eq.${encodeURIComponent(orderId)}`,
      {
        status: 'confirm_failed',
        payment_key: paymentKey,
        failed_code: text((toss.error as Row)?.code) || `HTTP_${toss.status}`,
        failed_message: text((toss.error as Row)?.message) || '토스 결제 승인 실패',
        raw_payload: toss.error as Row,
        updated_at: new Date().toISOString()
      }
    )

    return NextResponse.json(
      {
        ok: false,
        message: '토스 결제 승인에 실패했습니다.',
        detail: toss.error
      },
      { status: 400 }
    )
  }

  const payment = toss.data as Row
  const paymentStatus = text(payment.status) || 'UNKNOWN'
  const approvedAt = text(payment.approvedAt) || new Date().toISOString()
  const method = text(payment.method)

  await patchRows(
    'anbu_checkout_orders',
    `order_id=eq.${encodeURIComponent(orderId)}`,
    {
      status: paymentStatus === 'DONE' ? 'paid' : paymentStatus.toLowerCase(),
      payment_key: paymentKey,
      payment_method: method,
      toss_status: paymentStatus,
      approved_at: approvedAt,
      raw_payload: payment,
      updated_at: new Date().toISOString()
    }
  )

  await insertRow('anbu_payments', {
    application_id: text(order.application_id) || null,
    order_id: orderId,
    payment_key: paymentKey,
    provider: 'toss',
    provider_payment_id: paymentKey,
    payment_status: paymentStatus,
    amount_krw: amount,
    currency: 'KRW',
    method,
    paid_at: approvedAt,
    raw_payload: payment
  })

  await activatePlan({
    order,
    payment
  })

  const referral = await confirmReferralIfNeeded({
    order,
    payment
  })

  return NextResponse.json({
    ok: true,
    message: '결제가 정상 승인되었습니다.',
    payment,
    referral
  })
}
