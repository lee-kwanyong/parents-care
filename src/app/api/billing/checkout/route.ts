import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ANBU_REFERRAL_POINT, getPricingPlan } from '@/lib/anbu-pricing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function digits(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function cleanCode(value: unknown) {
  return text(value).replace(/[^\w-]/g, '').slice(0, 60).toUpperCase()
}

function siteUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin
  ).replace(/\/$/, '')
}

function tossClientKey() {
  return process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ''
}

function supabaseBaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function restBaseUrl() {
  const base = supabaseBaseUrl()
  return base ? `${base}/rest/v1` : ''
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

async function upsertReferralCode(input: {
  referralCode: string
  ownerName: string
  phoneLast4: string
}) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) return { ok: false }

  const response = await fetch(`${base}/anbu_referral_codes?on_conflict=referral_code`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      referral_code: input.referralCode,
      owner_name: input.ownerName,
      owner_phone_last4: input.phoneLast4,
      status: 'active',
      metadata: {
        createdFrom: 'checkout'
      },
      updated_at: new Date().toISOString()
    }),
    cache: 'no-store'
  })

  return { ok: response.ok }
}

function makeReferralCode(name: string, phone: string) {
  const cleanName = name.replace(/[^가-힣a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
  const last4 = digits(phone).slice(-4) || Math.random().toString().slice(2, 6)
  return `ANBU${last4}${cleanName ? '-' + cleanName : ''}`
}

function makeOrderId() {
  return `ANBU_PAY_${Date.now().toString(36)}_${randomUUID().replace(/-/g, '').slice(0, 18)}`
}

function makeCustomerKey() {
  return `ANBU_CUST_${randomUUID().replace(/-/g, '').slice(0, 26)}`
}

export async function POST(request: NextRequest) {
  const clientKey = tossClientKey()

  if (!clientKey) {
    return NextResponse.json(
      {
        ok: false,
        message: 'NEXT_PUBLIC_TOSS_CLIENT_KEY 환경변수가 필요합니다.'
      },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => ({}))

  const customerName = text(body.customerName || body.name).slice(0, 80)
  const customerEmail = text(body.customerEmail || body.email).slice(0, 120)
  const customerPhone = digits(body.customerPhone || body.phone).slice(0, 15)
  const usedReferralCode = cleanCode(body.referralCode)
  const plan = getPricingPlan(body.planCode)
  const generatedReferralCode = cleanCode(body.generatedReferralCode) || makeReferralCode(customerName, customerPhone)
  const pointAmount = ANBU_REFERRAL_POINT

  if (!customerName || customerPhone.length < 8) {
    return NextResponse.json(
      {
        ok: false,
        message: '결제를 위해 이름과 연락처가 필요합니다.'
      },
      { status: 400 }
    )
  }

  if (!plan.purchasable || plan.priceKrw <= 0) {
    return NextResponse.json(
      {
        ok: false,
        message: '결제 가능한 요금제가 아닙니다.'
      },
      { status: 400 }
    )
  }

  const orderId = makeOrderId()
  const customerKey = makeCustomerKey()
  const orderName = `${plan.title} - 안부웍스`
  const phoneLast4 = customerPhone.slice(-4)

  await upsertReferralCode({
    referralCode: generatedReferralCode,
    ownerName: customerName,
    phoneLast4
  })

  const application = await insertRow('anbu_plan_applications', {
    applicant_name: customerName,
    applicant_phone: customerPhone,
    applicant_phone_last4: phoneLast4,
    applicant_email: customerEmail || null,
    plan_code: plan.code,
    plan_title: plan.title,
    plan_price_krw: plan.priceKrw,
    application_status: 'checkout_created',
    used_referral_code: usedReferralCode || null,
    generated_referral_code: generatedReferralCode,
    point_amount: pointAmount,
    source: 'checkout',
    metadata: {
      orderId,
      billingCycle: plan.billingCycle,
      category: plan.category,
      durationDays: plan.durationDays || 0,
      partnerVisits: plan.partnerVisits || 0
    }
  })

  const applicationId = application.ok && application.rows[0] ? text(application.rows[0].id) : ''

  const order = await insertRow('anbu_checkout_orders', {
    order_id: orderId,
    application_id: applicationId || null,
    customer_key: customerKey,
    customer_name: customerName,
    customer_email: customerEmail || null,
    customer_phone: customerPhone,
    customer_phone_last4: phoneLast4,
    plan_code: plan.code,
    plan_title: plan.title,
    order_name: orderName,
    amount_krw: plan.priceKrw,
    currency: 'KRW',
    status: 'ready',
    used_referral_code: usedReferralCode || null,
    generated_referral_code: generatedReferralCode,
    point_amount: pointAmount,
    metadata: {
      applicationInsertOk: application.ok,
      applicationInsertError: application.error || '',
      nonMedicalNotice: true,
      category: plan.category,
      billingCycle: plan.billingCycle,
      durationDays: plan.durationDays || 0,
      partnerVisits: plan.partnerVisits || 0,
      officeChecks: plan.officeChecks || 0
    }
  })

  if (!order.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '결제 주문 생성에 실패했습니다. Supabase에 결제 테이블 migration이 적용됐는지 확인해주세요.',
        detail: order.error
      },
      { status: 500 }
    )
  }

  const base = siteUrl(request)

  return NextResponse.json({
    ok: true,
    clientKey,
    order: {
      orderId,
      orderName,
      amount: plan.priceKrw,
      currency: 'KRW',
      customerName,
      customerEmail,
      customerMobilePhone: customerPhone,
      customerKey,
      planCode: plan.code,
      planTitle: plan.title,
      generatedReferralCode,
      usedReferralCode,
      successUrl: `${base}/checkout/success`,
      failUrl: `${base}/checkout/fail`
    }
  })
}
