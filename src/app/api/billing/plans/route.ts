import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

const fallbackPlans = [
  {
    planCode: 'post-discharge-14',
    title: '퇴원 후 14일 케어',
    description: '퇴원 후 14일 집중 안부확인과 안부완료 리포트',
    priceKrw: 49000,
    displayPrice: '14일 무료 실증',
    regularPrice: '49,000원 예정',
    billingCycle: 'one_time',
    trialDays: 14,
    isActive: true
  },
  {
    planCode: 'monthly-report-9900',
    title: '안부완료 리포트',
    description: '월 9,900원 안부완료 리포트 구독',
    priceKrw: 9900,
    displayPrice: '월 9,900원',
    regularPrice: '월 9,900원',
    billingCycle: 'monthly',
    trialDays: 0,
    isActive: true
  }
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function parsePayload(value: unknown): Row {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Row

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Row
        : {}
    } catch {
      return {}
    }
  }

  return {}
}

function supabaseBaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

async function restRows(table: string, params: Record<string, string>) {
  const base = supabaseBaseUrl()
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
    const response = await fetch(`${base}/rest/v1/${table}?${search.toString()}`, {
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

    if (!response.ok) {
      return {
        ok: false,
        rows: [] as Row[],
        error: raw.slice(0, 240)
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
      error: error instanceof Error ? error.message : 'fetch failed'
    }
  }
}

export async function GET() {
  const result = await restRows('anbu_product_plans', {
    select: '*',
    is_active: 'eq.true',
    order: 'price_krw.asc'
  })

  if (!result.ok || result.rows.length === 0) {
    return NextResponse.json({
      ok: true,
      source: 'fallback',
      plans: fallbackPlans
    })
  }

  return NextResponse.json({
    ok: true,
    source: 'database',
    plans: result.rows.map((row) => {
      const metadata = parsePayload(row.metadata)

      return {
        planCode: text(row.plan_code),
        title: text(row.title),
        description: text(row.description),
        priceKrw: Number(row.price_krw) || 0,
        displayPrice: text(metadata.displayPrice) || `${Number(row.price_krw || 0).toLocaleString('ko-KR')}원`,
        regularPrice: text(metadata.regularPrice),
        billingCycle: text(row.billing_cycle),
        trialDays: Number(row.trial_days) || 0,
        isActive: row.is_active !== false,
        metadata
      }
    })
  })
}
