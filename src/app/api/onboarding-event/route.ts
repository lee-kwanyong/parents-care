import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

async function rest(path: string, init?: RequestInit): Promise<RestResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: 'SUPABASE_SERVICE_ROLE_KEY가 필요합니다.'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    cache: 'no-store'
  })

  const raw = await response.text()
  let parsed: unknown = null

  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = raw
  }

  return {
    ok: response.ok,
    status: response.status,
    data: parsed,
    error: response.ok ? null : parsed || raw
  }
}

function rows(result: RestResult): Row[] {
  return result.ok && Array.isArray(result.data) ? result.data as Row[] : []
}

async function insertEvent(body: Row, request: NextRequest) {
  const payload = body.payload && typeof body.payload === 'object' ? body.payload as Row : {}

  const result = await rest('user_onboarding_events', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        event_type: text(body.eventType) || 'view',
        role: text(body.role),
        source: text(body.source) || 'onboarding',
        path: text(body.path) || text(request.nextUrl.pathname),
        email: text(body.email),
        phone: phone(body.phone),
        family_code: text(body.familyCode),
        payload: {
          ...payload,
          userAgent: request.headers.get('user-agent') || '',
          referrer: request.headers.get('referer') || '',
          createdAt: new Date().toISOString()
        }
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '온보딩 이벤트가 기록되었습니다.' : '온보딩 이벤트 기록에 실패했습니다.',
    event: rows(result)[0],
    detail: result.error
  }
}

async function loadStats() {
  const result = await rest('user_onboarding_events?select=*&order=created_at.desc&limit=500')

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '온보딩 기록을 불러오지 못했습니다.',
      detail: result.error
    }
  }

  const items = rows(result)
  const roleCounts = items.reduce<Record<string, number>>((acc, item) => {
    const role = text(item.role) || 'unknown'
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})

  const eventCounts = items.reduce<Record<string, number>>((acc, item) => {
    const event = text(item.event_type) || 'unknown'
    acc[event] = (acc[event] || 0) + 1
    return acc
  }, {})

  return {
    ok: true,
    items: items.slice(0, 100),
    metrics: {
      total: items.length,
      roleCounts,
      eventCounts
    }
  }
}

export async function GET() {
  const data = await loadStats()
  return NextResponse.json(data, { status: data.ok ? 200 : data.status || 500 })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const result = await insertEvent(body, request)
  return NextResponse.json(result, { status: result.ok ? 200 : result.status || 500 })
}
