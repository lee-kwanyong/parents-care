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

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function bool(value: unknown) {
  return value === true || value === 'true'
}

function opsPassword() {
  return process.env.ANBU_OPS_PASSWORD || process.env.OPS_PASSWORD || process.env.ADMIN_CODE || '530868'
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

function payload(row: Row) {
  return row.payload && typeof row.payload === 'object' ? row.payload as Row : {}
}

function lowerBundle(row: Row) {
  return [
    row.title,
    row.body,
    row.template_code,
    row.reason,
    row.provider,
    row.target_url,
    row.to_name,
    row.to_phone
  ].map((value) => text(value).toLowerCase()).join(' ')
}

function isDummyPhone(row: Row) {
  const p = phone(row.to_phone)

  return [
    '',
    '01011111111',
    '01012345678',
    '01000000000',
    '01099999999',
    '01055555555'
  ].includes(p)
}

function isValidationOrSimulation(row: Row) {
  const provider = text(row.provider).toLowerCase()
  const reason = text(row.reason).toLowerCase()
  const template = text(row.template_code).toLowerCase()

  return (
    provider === 'validation' ||
    provider === 'simulation' ||
    reason.includes('simulation') ||
    template.includes('simulation') ||
    provider.includes('notification-dispatch-c')
  )
}

function isTestLike(row: Row) {
  const bundle = lowerBundle(row)
  const p = payload(row)

  return (
    bundle.includes('test') ||
    bundle.includes('테스트') ||
    bundle.includes('ops-test') ||
    bundle.includes('notification-test') ||
    bundle.includes('preflight') ||
    bundle.includes('demo') ||
    bundle.includes('샘플') ||
    text(p.do_not_retry) === 'true' ||
    bool(p.do_not_retry)
  )
}

function isOld(row: Row, hours = 24) {
  const raw = text(row.created_at)
  if (!raw) return false

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return false

  return Date.now() - date.getTime() > hours * 60 * 60 * 1000
}

function isPilotOrRealMessage(row: Row) {
  const bundle = lowerBundle(row)

  return (
    bundle.includes('private-pilot') ||
    bundle.includes('pilot') ||
    bundle.includes('guardian') ||
    bundle.includes('mobile-signal') ||
    bundle.includes('proxy_checkin') ||
    bundle.includes('message-automation') ||
    bundle.includes('ops-escalation') ||
    bundle.includes('실증') ||
    bundle.includes('부모님') ||
    bundle.includes('보호자')
  )
}

function candidateReasons(row: Row) {
  const reasons: string[] = []

  if (isTestLike(row)) reasons.push('테스트/샘플 문자')
  if (isDummyPhone(row)) reasons.push('더미 또는 번호 없음')
  if (isValidationOrSimulation(row)) reasons.push('검증/시뮬레이션 기록')
  if (isOld(row)) reasons.push('24시간 지난 과거 실패')
  if (bool(payload(row).do_not_retry)) reasons.push('재시도 금지 표시')

  return reasons
}

function shouldCancelUnsafeFailed(row: Row) {
  if (text(row.status) !== 'failed') return false

  const reasons = candidateReasons(row)

  return reasons.length > 0
}

function shouldCancelQueuedTest(row: Row) {
  if (text(row.status) !== 'queued') return false

  return isTestLike(row) || isDummyPhone(row) || isValidationOrSimulation(row)
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

async function loadOutbox() {
  const [outboxResult, runResult] = await Promise.all([
    rest('notification_outbox?select=*&order=created_at.desc&limit=2000'),
    rest('ops_notification_safety_runs?select=*&order=created_at.desc&limit=50')
  ])

  if (!outboxResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '알림 발송 기록을 불러오지 못했습니다.',
      detail: outboxResult.error
    }
  }

  const items = rows(outboxResult)

  const statusCounts = items.reduce<Record<string, number>>((acc, item) => {
    const status = text(item.status) || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const providerCounts = items.reduce<Record<string, number>>((acc, item) => {
    const provider = text(item.provider) || 'unknown'
    acc[provider] = (acc[provider] || 0) + 1
    return acc
  }, {})

  const unsafeFailed = items.filter(shouldCancelUnsafeFailed)
  const queuedTests = items.filter(shouldCancelQueuedTest)
  const realRecentFailed = items.filter((item) => {
    return text(item.status) === 'failed' &&
      !shouldCancelUnsafeFailed(item) &&
      isPilotOrRealMessage(item)
  })

  const recentReal = items.filter((item) => {
    return isPilotOrRealMessage(item) && !isTestLike(item) && !isValidationOrSimulation(item)
  })

  return {
    ok: true,
    metrics: {
      total: items.length,
      queued: statusCounts.queued || 0,
      sent: statusCounts.sent || 0,
      failed: statusCounts.failed || 0,
      cancelled: statusCounts.cancelled || 0,
      unsafeFailed: unsafeFailed.length,
      queuedTests: queuedTests.length,
      realRecentFailed: realRecentFailed.length,
      recentReal: recentReal.length,
      statusCounts,
      providerCounts
    },
    items: items.slice(0, 200).map((item) => ({
      id: text(item.id),
      toName: text(item.to_name),
      toPhone: text(item.to_phone),
      title: text(item.title),
      body: text(item.body),
      templateCode: text(item.template_code),
      reason: text(item.reason),
      status: text(item.status),
      provider: text(item.provider),
      createdKst: toKst(item.created_at),
      sentKst: toKst(item.sent_at),
      candidateReasons: candidateReasons(item),
      shouldCancelUnsafeFailed: shouldCancelUnsafeFailed(item),
      shouldCancelQueuedTest: shouldCancelQueuedTest(item),
      isPilotOrRealMessage: isPilotOrRealMessage(item),
      isTestLike: isTestLike(item)
    })),
    unsafeFailed: unsafeFailed.slice(0, 100).map((item) => ({
      id: text(item.id),
      toName: text(item.to_name),
      toPhone: text(item.to_phone),
      title: text(item.title),
      status: text(item.status),
      provider: text(item.provider),
      reason: text(item.reason),
      createdKst: toKst(item.created_at),
      candidateReasons: candidateReasons(item)
    })),
    queuedTests: queuedTests.slice(0, 100).map((item) => ({
      id: text(item.id),
      toName: text(item.to_name),
      toPhone: text(item.to_phone),
      title: text(item.title),
      status: text(item.status),
      provider: text(item.provider),
      reason: text(item.reason),
      createdKst: toKst(item.created_at),
      candidateReasons: candidateReasons(item)
    })),
    runs: rows(runResult)
  }
}

async function patchNotification(row: Row, action: string, createdBy: string) {
  const id = text(row.id)
  const nextPayload = {
    ...payload(row),
    do_not_retry: true,
    safety_action: action,
    safety_updated_by: createdBy,
    safety_updated_at: new Date().toISOString(),
    previous_status: text(row.status),
    cancel_reasons: candidateReasons(row)
  }

  return rest('notification_outbox?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      status: 'cancelled',
      payload: nextPayload
    })
  })
}

async function cancelUnsafeFailed(body: Row) {
  const createdBy = text(body.createdBy) || '운영실'
  const outboxResult = await rest('notification_outbox?select=*&status=eq.failed&order=created_at.desc&limit=1000')

  if (!outboxResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '실패 문자 목록을 불러오지 못했습니다.',
      detail: outboxResult.error
    }
  }

  const candidates = rows(outboxResult).filter(shouldCancelUnsafeFailed)
  const results = []

  for (const item of candidates) {
    results.push(await patchNotification(item, 'cancel_unsafe_failed', createdBy))
  }

  const okCount = results.filter((item) => item.ok).length
  const failedCount = results.length - okCount
  const affectedIds = candidates.map((item) => text(item.id))

  await insertRows('ops_notification_safety_runs', [
    {
      action: 'cancel_unsafe_failed',
      status: failedCount > 0 ? 'warning' : 'ok',
      summary: `과거/테스트 실패 문자 ${okCount}건을 재시도 금지 처리했습니다.`,
      metrics: {
        target: candidates.length,
        ok: okCount,
        failed: failedCount
      },
      affected_ids: affectedIds,
      payload: {
        results: results.map((item) => ({
          ok: item.ok,
          status: item.status,
          error: item.error
        }))
      },
      created_by: createdBy
    }
  ])

  return {
    ok: failedCount === 0,
    status: failedCount === 0 ? 200 : 207,
    message: `과거/테스트 실패 문자 ${okCount}건을 재시도 금지 처리했습니다.`,
    metrics: {
      target: candidates.length,
      ok: okCount,
      failed: failedCount
    },
    affectedIds
  }
}

async function cancelQueuedTests(body: Row) {
  const createdBy = text(body.createdBy) || '운영실'
  const outboxResult = await rest('notification_outbox?select=*&status=eq.queued&order=created_at.desc&limit=1000')

  if (!outboxResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '발송 대기 문자 목록을 불러오지 못했습니다.',
      detail: outboxResult.error
    }
  }

  const candidates = rows(outboxResult).filter(shouldCancelQueuedTest)
  const results = []

  for (const item of candidates) {
    results.push(await patchNotification(item, 'cancel_queued_tests', createdBy))
  }

  const okCount = results.filter((item) => item.ok).length
  const failedCount = results.length - okCount
  const affectedIds = candidates.map((item) => text(item.id))

  await insertRows('ops_notification_safety_runs', [
    {
      action: 'cancel_queued_tests',
      status: failedCount > 0 ? 'warning' : 'ok',
      summary: `발송 대기 중인 테스트 문자 ${okCount}건을 취소했습니다.`,
      metrics: {
        target: candidates.length,
        ok: okCount,
        failed: failedCount
      },
      affected_ids: affectedIds,
      payload: {
        results: results.map((item) => ({
          ok: item.ok,
          status: item.status,
          error: item.error
        }))
      },
      created_by: createdBy
    }
  ])

  return {
    ok: failedCount === 0,
    status: failedCount === 0 ? 200 : 207,
    message: `발송 대기 중인 테스트 문자 ${okCount}건을 취소했습니다.`,
    metrics: {
      target: candidates.length,
      ok: okCount,
      failed: failedCount
    },
    affectedIds
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

  const data = await loadOutbox()
  return NextResponse.json(data, { status: responseStatus(data) })
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  let result

  if (action === 'cancelUnsafeFailed') result = await cancelUnsafeFailed(body)
  else if (action === 'cancelQueuedTests') result = await cancelQueuedTests(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
