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

function sameKstDay(value: unknown, dayKey: string) {
  const raw = text(value)
  if (!raw) return false

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return false

  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date) === dayKey
}

function todayKey() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function groupCount(items: Row[], keyFn: (item: Row) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyFn(item) || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

function guideTemplates(origin: string) {
  return {
    guardian:
`[안부웍스 보호자 사용법]

1. 실증 참여 동의서를 먼저 확인합니다.
${origin}/consent?role=guardian

2. 부모님에게 부모님 앱 링크를 전달합니다.
${origin}/mobile/parent

3. 부모님이 버튼을 누르면 보호자 리포트에서 확인합니다.
${origin}/guardian/today

4. 부모님이 앱을 못 누르면 전화 확인 후 대신 기록합니다.
${origin}/guardian/proxy-checkin

응급상황은 앱보다 먼저 119 또는 의료기관에 연락해주세요.`,

    parent:
`[안부웍스 부모님 사용법]

1. 보호자가 보내준 링크를 누릅니다.
2. 오늘 상태에 맞는 버튼 하나만 누릅니다.
- 괜찮아요
- 밥을 못 먹었어요
- 약을 못 먹었어요
- 몸이 아파요
- 지금 도움이 필요해요

3. 완료 화면이 보이면 끝입니다.

응급상황이면 앱을 누르기보다 먼저 119 또는 의료기관에 연락해주세요.`,

    provider:
`[안부웍스 생활확인 파트너 사용법]

1. 요청함을 엽니다.
${origin}/provider/urgent-requests

2. 가능한 요청만 수락합니다.
3. 전화 확인 또는 생활확인 결과를 기록합니다.
4. 의료 판단, 의료행위, 응급구조는 하지 않습니다.
5. 응급상황이 의심되면 119 또는 의료기관 연락을 안내합니다.`,

    center:
`[방문요양센터/기관 안내]

안부웍스는 의료행위가 아니라, 어르신 안부 신호와 보호자 안심 리포트 흐름을 확인하는 비의료 생활확인 서비스입니다.

실증에서 확인하는 것:
1. 보호자가 부모님 안부를 쉽게 확인하는지
2. 부모님이 큰 버튼으로 상태를 보낼 수 있는지
3. 미응답 시 보호자 확인이 가능한지
4. 필요 시 방문확인·병원동행 수요가 있는지

서비스 소개:
${origin}

실증 참여 동의:
${origin}/consent`,

    ops:
`[운영실 실증 운영 순서]

1. 오늘 실증 운영센터를 엽니다.
${origin}/ops/today-runbook

2. 주의 항목만 먼저 처리합니다.
3. 부모님 앱에서 괜찮아요 1건을 테스트합니다.
${origin}/mobile/parent

4. 보호자 리포트가 열리는지 확인합니다.
${origin}/guardian/today

5. 문자 비용 보호센터에서 위험 대기열을 확인합니다.
${origin}/ops/sms-budget-guard

6. 미응답 가구를 확인합니다.
${origin}/ops/no-response

7. 실증 리포트를 저장합니다.
${origin}/ops/pilot-report`
  }
}

async function loadDashboard(request: NextRequest) {
  const origin = request.nextUrl.origin
  const today = todayKey()
  const eventResult = await rest('ops_training_guide_events?select=*&order=created_at.desc&limit=1000')
  const events = rows(eventResult)

  return {
    ok: true,
    origin,
    templates: guideTemplates(origin),
    metrics: {
      totalEvents: events.length,
      todayEvents: events.filter((item) => sameKstDay(item.created_at, today)).length,
      viewEvents: events.filter((item) => text(item.event_type) === 'view').length,
      copyEvents: events.filter((item) => text(item.event_type) === 'copy').length,
      audienceCounts: groupCount(events, (item) => text(item.audience)),
      eventTypeCounts: groupCount(events, (item) => text(item.event_type))
    },
    events: events.map((item) => ({
      id: text(item.id),
      eventType: text(item.event_type),
      audience: text(item.audience),
      guideKey: text(item.guide_key),
      source: text(item.source),
      path: text(item.path),
      copiedText: text(item.copied_text),
      createdBy: text(item.created_by),
      createdAt: text(item.created_at),
      createdKst: toKst(item.created_at)
    })),
    sourceErrors: {
      events: eventResult.ok ? null : eventResult.error
    }
  }
}

async function logEvent(body: Row, request: NextRequest) {
  const eventType = text(body.eventType) || 'view'
  const copiedText = text(body.copiedText)

  const result = await rest('ops_training_guide_events', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        event_type: eventType,
        audience: text(body.audience),
        guide_key: text(body.guideKey),
        source: text(body.source) || 'training_guide',
        path: text(body.path) || request.headers.get('referer') || '',
        copied_text: copiedText.slice(0, 5000),
        payload: {
          userAgent: request.headers.get('user-agent') || '',
          referrer: request.headers.get('referer') || '',
          createdAt: new Date().toISOString(),
          copiedLength: copiedText.length
        },
        created_by: text(body.createdBy) || 'public'
      }
    ])
  })

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '가이드 이벤트 기록에 실패했습니다.',
      detail: result.error
    }
  }

  return {
    ok: true,
    message: '가이드 이벤트가 기록되었습니다.',
    event: rows(result)[0]
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

  const data = await loadDashboard(request)
  return NextResponse.json(data, { status: responseStatus(data) })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const result = await logEvent(body, request)
  return NextResponse.json(result, { status: responseStatus(result) })
}
