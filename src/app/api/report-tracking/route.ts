import { createHash, timingSafeEqual } from 'crypto'
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

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'OPS_SESSION_TOKEN',
  'ops_session_token',
  'ops_session'
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function bool(value: unknown) {
  return value === true || value === 'true'
}

function opsPassword() {
  return process.env.ANBU_OPS_PASSWORD || process.env.OPS_PASSWORD || ''
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || process.env.OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
}

function tokenFor(password: string) {
  return createHash('sha256').update(password + ':' + authSecret()).digest('hex')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function isOpsAuthed(request: NextRequest) {
  const password = opsPassword()
  if (!password) return false

  const expected = tokenFor(password)

  for (const name of OPS_COOKIE_NAMES) {
    const token = request.cookies.get(name)?.value || ''
    if (!token) continue

    try {
      if (safeEqual(token, expected)) return true
    } catch {
      continue
    }
  }

  return false
}

function hasSecret(request: NextRequest) {
  const secrets = [
    process.env.CRON_SECRET || '',
    process.env.OPS_AUTOPILOT_SECRET || '',
    process.env.RESPONSE_ESCALATION_SECRET || ''
  ].filter(Boolean)

  if (secrets.length === 0) return false

  const queryToken = text(request.nextUrl.searchParams.get('token'))
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')

  return secrets.includes(queryToken) || secrets.includes(auth)
}

function authorized(request: NextRequest) {
  return isOpsAuthed(request) || hasSecret(request)
}

function responseStatus(result: unknown) {
  const maybe = result as { ok?: boolean; status?: number }
  return maybe.ok ? 200 : maybe.status || 500
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

async function insertRows(table: string, values: Row[]) {
  if (values.length === 0) {
    return {
      ok: true,
      status: 200,
      data: [],
      error: null
    } as RestResult
  }

  return rest(table, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(values)
  })
}

function toKst(value: unknown) {
  const raw = text(value)
  if (!raw) return ''

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function isWithin(value: unknown, hours: number) {
  const raw = text(value)
  if (!raw) return false

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return false

  return Date.now() - date.getTime() <= hours * 60 * 60 * 1000
}

function groupCount(items: Row[], keyFn: (item: Row) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyFn(item) || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

async function logEvent(body: Row, request: NextRequest) {
  const payload = body.payload && typeof body.payload === 'object' ? body.payload as Row : {}

  const eventType = text(body.eventType) || 'report_event'
  const familyCode = text(body.familyCode).replace(/[^0-9A-Za-z]/g, '').slice(0, 20)

  const insertResult = await insertRows('guardian_report_events', [
    {
      event_type: eventType,
      family_code: familyCode || null,
      source: text(body.source) || 'guardian_report',
      path: text(body.path) || request.headers.get('referer') || '',
      status: text(body.status),
      parent_name: text(body.parentName),
      guardian_name: text(body.guardianName),
      message: text(body.message),
      payload: {
        ...payload,
        userAgent: request.headers.get('user-agent') || '',
        referrer: request.headers.get('referer') || '',
        createdAt: new Date().toISOString(),
        hasFamilyCode: Boolean(familyCode),
        last4Provided: bool(body.last4Provided)
      }
    }
  ])

  return {
    ok: insertResult.ok,
    status: insertResult.ok ? 200 : 500,
    message: insertResult.ok ? '리포트 이벤트가 기록되었습니다.' : '리포트 이벤트 기록에 실패했습니다.',
    event: rows(insertResult)[0],
    detail: insertResult.error
  }
}

async function loadDashboard() {
  const [eventResult, familyResult, signalResult, messageResult] = await Promise.all([
    rest('guardian_report_events?select=*&order=created_at.desc&limit=2000'),
    rest('anbu_family_links?select=family_code,guardian_name,parent_name,created_at&order=created_at.desc&limit=2000'),
    rest('care_response_requests?select=family_code,signal_type,status,created_at&order=created_at.desc&limit=2000'),
    rest('notification_outbox?select=family_code,status,created_at&order=created_at.desc&limit=2000')
  ])

  if (!eventResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '리포트 조회 이벤트를 불러오지 못했습니다.',
      detail: eventResult.error
    }
  }

  const events = rows(eventResult)
  const families = rows(familyResult)
  const signals = rows(signalResult)
  const messages = rows(messageResult)

  const successEvents = events.filter((item) => text(item.event_type) === 'report_lookup_success')
  const failedEvents = events.filter((item) => ['report_lookup_failed', 'report_lookup_validation_failed'].includes(text(item.event_type)))
  const copiedEvents = events.filter((item) => text(item.event_type) === 'parent_app_link_copied')
  const uniqueFamiliesViewed = new Set(successEvents.map((item) => text(item.family_code)).filter(Boolean))
  const familiesWithSignals = new Set(signals.map((item) => text(item.family_code)).filter(Boolean))
  const familiesWithSentMessages = new Set(messages.filter((item) => text(item.status) === 'sent').map((item) => text(item.family_code)).filter(Boolean))

  const metrics = {
    totalEvents: events.length,
    events24h: events.filter((item) => isWithin(item.created_at, 24)).length,
    pageViews: events.filter((item) => text(item.event_type) === 'view_report_page').length,
    lookupAttempts: events.filter((item) => text(item.event_type).includes('report_lookup')).length,
    lookupSuccess: successEvents.length,
    lookupFailed: failedEvents.length,
    parentLinkCopied: copiedEvents.length,
    uniqueFamiliesViewed: uniqueFamiliesViewed.size,
    totalFamilies: families.length,
    familiesWithSignals: familiesWithSignals.size,
    familiesWithSentMessages: familiesWithSentMessages.size,
    successRate: events.filter((item) => text(item.event_type).includes('report_lookup')).length
      ? Math.round((successEvents.length / events.filter((item) => text(item.event_type).includes('report_lookup')).length) * 100)
      : 0,
    eventTypeCounts: groupCount(events, (item) => text(item.event_type)),
    familyCounts: groupCount(events.filter((item) => text(item.family_code)), (item) => text(item.family_code))
  }

  const normalizedEvents = events.slice(0, 300).map((item) => ({
    id: text(item.id),
    eventType: text(item.event_type),
    familyCode: text(item.family_code),
    source: text(item.source),
    path: text(item.path),
    status: text(item.status),
    parentName: text(item.parent_name),
    guardianName: text(item.guardian_name),
    message: text(item.message),
    createdKst: toKst(item.created_at),
    payload: item.payload && typeof item.payload === 'object' ? item.payload : {}
  }))

  return {
    ok: true,
    metrics,
    events: normalizedEvents,
    generatedAt: new Date().toISOString()
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const data = await loadDashboard()
  return NextResponse.json(data, { status: responseStatus(data) })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const result = await logEvent(body, request)
  return NextResponse.json(result, { status: responseStatus(result) })
}
