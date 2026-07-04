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

async function upsertRow(table: string, row: Row, onConflict: string) {
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
    const response = await fetch(`${base}/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation'
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

function makeReferralCode(name: string, phone: string, provided: string) {
  const existing = cleanCode(provided)

  if (existing) return existing

  const cleanName = name
    .replace(/[^가-힣a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase()

  const last4 = digits(phone).slice(-4) || Math.random().toString().slice(2, 6)

  return `ANBU${last4}${cleanName ? '-' + cleanName : ''}`
}

async function saveFallback(input: {
  name: string
  phone: string
  planCode: string
  planTitle: string
  usedReferralCode: string
  generatedCode: string
  pointAmount: number
  source: string
}) {
  return insertRow('care_response_requests', {
    family_code: `referral-${input.generatedCode.toLowerCase()}`,
    parent_name: input.name,
    guardian_name: input.name,
    signal_type: 'referral_apply',
    signal_label: '추천인 코드 신청',
    request_type: 'pricing_referral',
    risk_level: 'low',
    status: 'completed',
    payload: {
      source: input.source,
      name: input.name,
      phoneLast4: digits(input.phone).slice(-4),
      planCode: input.planCode,
      planTitle: input.planTitle,
      usedReferralCode: input.usedReferralCode,
      generatedReferralCode: input.generatedCode,
      pointAmount: input.pointAmount,
      pointPolicy: 'service_credit_only_no_cash_refund',
      note: '추천 결제 완료 시 서비스 포인트 5,000P 지급',
      backend: 'fallback_care_response_requests',
      createdAt: new Date().toISOString()
    }
  })
}

async function saveDedicated(input: {
  name: string
  phone: string
  planCode: string
  planTitle: string
  planPriceKrw: number
  planCategory: string
  usedReferralCode: string
  generatedCode: string
  pointAmount: number
  source: string
}) {
  const phoneLast4 = digits(input.phone).slice(-4)

  const ownCode = await upsertRow(
    'anbu_referral_codes',
    {
      referral_code: input.generatedCode,
      owner_name: input.name,
      owner_phone_last4: phoneLast4,
      status: 'active',
      metadata: {
        source: input.source,
        pointPolicy: 'service_credit_only_no_cash_refund'
      },
      updated_at: new Date().toISOString()
    },
    'referral_code'
  )

  if (!ownCode.ok) {
    return {
      ok: false,
      error: ownCode.error,
      applicationId: '',
      source: 'dedicated_failed'
    }
  }

  const application = await insertRow('anbu_plan_applications', {
    applicant_name: input.name,
    applicant_phone: digits(input.phone),
    applicant_phone_last4: phoneLast4,
    plan_code: input.planCode,
    plan_title: input.planTitle,
    plan_price_krw: input.planPriceKrw,
    application_status: 'submitted',
    used_referral_code: input.usedReferralCode || null,
    generated_referral_code: input.generatedCode,
    point_amount: input.pointAmount,
    source: input.source,
    metadata: {
      category: input.planCategory,
      pointPolicy: 'service_credit_only_no_cash_refund',
      paymentStatus: 'not_paid_yet'
    }
  })

  if (!application.ok) {
    return {
      ok: false,
      error: application.error,
      applicationId: '',
      source: 'dedicated_failed'
    }
  }

  const applicationId = text(application.rows[0]?.id)

  if (input.usedReferralCode && input.usedReferralCode !== input.generatedCode) {
    await insertRow('anbu_referral_events', {
      referrer_code: input.usedReferralCode,
      generated_referral_code: input.generatedCode,
      application_id: applicationId || null,
      referee_name: input.name,
      referee_phone_last4: phoneLast4,
      plan_code: input.planCode,
      reward_points: input.pointAmount,
      event_status: 'pending',
      metadata: {
        policy: '유료 결제 완료 시 5,000P 지급',
        cashRefund: false
      }
    })

    await insertRow('anbu_point_ledger', {
      referral_code: input.usedReferralCode,
      amount: input.pointAmount,
      ledger_type: 'referral_reward',
      ledger_status: 'pending',
      related_application_id: applicationId || null,
      memo: `${input.name} 님 신청으로 추천 포인트 대기`,
      metadata: {
        planCode: input.planCode,
        generatedReferralCode: input.generatedCode
      }
    })
  }

  return {
    ok: true,
    applicationId,
    source: 'dedicated'
  }
}

export async function GET(request: NextRequest) {
  const code = cleanCode(request.nextUrl.searchParams.get('code'))

  if (!code) {
    return NextResponse.json({
      ok: true,
      message: '추천인코드 조회에는 code 파라미터가 필요합니다.'
    })
  }

  const result = await restRows('anbu_referral_codes', {
    select: 'referral_code,owner_name,owner_phone_last4,status,point_balance,created_at',
    referral_code: `eq.${code}`,
    limit: '1'
  })

  if (!result.ok || !result.rows[0]) {
    return NextResponse.json({
      ok: false,
      found: false,
      code,
      message: '추천인코드를 찾지 못했습니다.'
    })
  }

  return NextResponse.json({
    ok: true,
    found: true,
    code,
    referral: result.rows[0]
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const name = text(body.name).slice(0, 40)
  const phone = digits(body.phone).slice(0, 20)
  const plan = getPricingPlan(body.planCode)
  const usedReferralCode = cleanCode(body.referralCode)
  const generatedCode = makeReferralCode(name, phone, text(body.generatedCode))
  const pointAmount = Math.max(0, Math.min(50000, Number(body.pointAmount) || ANBU_REFERRAL_POINT))
  const source = text(body.source) || 'pricing_page'

  if (!name || phone.length < 8) {
    return NextResponse.json(
      {
        ok: false,
        message: '이름과 연락처가 필요합니다.'
      },
      { status: 400 }
    )
  }

  const dedicated = await saveDedicated({
    name,
    phone,
    planCode: plan.code,
    planTitle: plan.title,
    planPriceKrw: plan.priceKrw,
    planCategory: plan.category,
    usedReferralCode,
    generatedCode,
    pointAmount,
    source
  })

  if (dedicated.ok) {
    return NextResponse.json({
      ok: true,
      persisted: true,
      backend: dedicated.source,
      applicationId: dedicated.applicationId,
      referralCode: generatedCode,
      usedReferralCode,
      pointAmount,
      pointStatus: usedReferralCode ? 'pending_until_paid_conversion' : 'none',
      plan,
      message: '신청과 추천인코드가 백엔드에 저장되었습니다.'
    })
  }

  const fallback = await saveFallback({
    name,
    phone,
    planCode: plan.code,
    planTitle: plan.title,
    usedReferralCode,
    generatedCode,
    pointAmount,
    source
  })

  return NextResponse.json({
    ok: true,
    persisted: fallback.ok,
    backend: fallback.ok ? 'fallback' : 'local_code_only',
    referralCode: generatedCode,
    usedReferralCode,
    pointAmount,
    pointStatus: usedReferralCode ? 'pending_until_paid_conversion' : 'none',
    plan,
    message: fallback.ok
      ? '전용 백엔드 테이블이 없어 기존 기록 테이블에 임시 저장했습니다.'
      : '추천인코드는 생성됐지만 서버 저장은 실패했습니다.',
    warning: fallback.ok ? dedicated.error : fallback.error || dedicated.error
  })
}
