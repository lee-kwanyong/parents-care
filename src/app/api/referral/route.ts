import { NextRequest, NextResponse } from 'next/server'

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

    if (!response.ok) {
      return {
        ok: false,
        rows: [] as Row[],
        error: `${table}: ${response.status} ${raw.slice(0, 300)}`
      }
    }

    return {
      ok: true,
      rows: Array.isArray(parsed) ? parsed as Row[] : [],
      error: ''
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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const name = text(body.name).slice(0, 40)
  const phone = digits(body.phone).slice(0, 20)
  const planCode = cleanCode(body.planCode || 'post-discharge-14').toLowerCase()
  const planTitle = text(body.planTitle).slice(0, 80)
  const usedReferralCode = cleanCode(body.referralCode)
  const generatedCode = makeReferralCode(name, phone, text(body.generatedCode))
  const pointAmount = Math.max(0, Math.min(50000, Number(body.pointAmount) || 5000))
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

  const row = {
    family_code: `referral-${generatedCode.toLowerCase()}`,
    parent_name: name,
    guardian_name: name,
    signal_type: 'referral_apply',
    signal_label: '추천인 코드 신청',
    request_type: 'pricing_referral',
    risk_level: 'low',
    status: 'completed',
    payload: {
      source,
      name,
      phoneLast4: phone.slice(-4),
      planCode,
      planTitle,
      usedReferralCode,
      generatedReferralCode: generatedCode,
      pointAmount,
      pointPolicy: 'service_credit_only_no_cash_refund',
      note: '추천 성사 시 서비스 포인트 5,000P 지급',
      createdAt: new Date().toISOString()
    }
  }

  const insert = await insertRow('care_response_requests', row)

  return NextResponse.json({
    ok: true,
    persisted: insert.ok,
    referralCode: generatedCode,
    usedReferralCode,
    pointAmount,
    message: insert.ok
      ? '추천인 신청이 저장되었습니다.'
      : '추천인코드는 생성됐지만 서버 저장은 실패했습니다.',
    warning: insert.ok ? null : insert.error || '서버 저장 실패'
  })
}
