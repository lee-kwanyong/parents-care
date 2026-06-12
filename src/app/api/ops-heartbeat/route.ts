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

type RunMetrics = {
  queued: number
  sent: number
  failed: number
  openIncidents: number
  urgent: number
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

function secretList() {
  return [
    process.env.CRON_SECRET || '',
    process.env.OPS_AUTOPILOT_SECRET || '',
    process.env.RESPONSE_ESCALATION_SECRET || ''
  ].filter(Boolean)
}

function hasSecret(request: NextRequest) {
  const secrets = secretList()
  if (secrets.length === 0) return false

  const queryToken = text(request.nextUrl.searchParams.get('token'))
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')

  return secrets.includes(queryToken) || secrets.includes(auth)
}

function authorized(request: NextRequest) {
  return isOpsAuthed(request) || hasSecret(request)
}

function internalSecret() {
  return process.env.OPS_AUTOPILOT_SECRET || process.env.RESPONSE_ESCALATION_SECRET || process.env.CRON_SECRET || ''
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
      error: 'Supabase 환경변수가 없습니다.'
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

function isOpenStatus(status: string) {
  return ['open', 'dispatched', 'manual_needed', 'accepted', 'in_progress'].includes(status)
}

async function loadMetrics(): Promise<RunMetrics> {
  const [outboxResult, requestResult] = await Promise.all([
    rest('notification_outbox?select=status&order=created_at.desc&limit=1000'),
    rest('care_response_requests?select=status,risk_level,request_type&order=created_at.desc&limit=1000')
  ])

  const outbox = rows(outboxResult)
  const requests = rows(requestResult)

  return {
    queued: outbox.filter((row) => text(row.status) === 'queued').length,
    sent: outbox.filter((row) => text(row.status) === 'sent').length,
    failed: outbox.filter((row) => text(row.status) === 'failed').length,
    openIncidents: requests.filter((row) => isOpenStatus(text(row.status))).length,
    urgent: requests.filter((row) => isOpenStatus(text(row.status)) && (text(row.risk_level) === 'high' || text(row.request_type) === 'urgent_neighbor_help')).length
  }
}

async function callJson(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store'
  })

  const raw = await response.text()
  let data: unknown = raw

  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    data = raw
  }

  return {
    ok: response.ok,
    status: response.status,
    data
  }
}

async function insertRun(row: Row) {
  const result = await rest('ops_heartbeat_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([row])
  })

  return rows(result)[0]
}

async function patchRun(id: string, patch: Row) {
  if (!id) return

  await rest('ops_heartbeat_runs?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    body: JSON.stringify(patch)
  })
}

async function logHeartbeat(message: string, payload: Row) {
  await rest('ops_autopilot_logs', {
    method: 'POST',
    body: JSON.stringify([
      {
        request_id: null,
        action_type: 'ops_heartbeat',
        actor_name: '안부웍스 자동운영',
        message,
        payload
      }
    ])
  })
}

async function runHeartbeat(request: NextRequest, options?: { autoSend?: boolean; source?: string }) {
  const startedAt = Date.now()
  const startedIso = new Date(startedAt).toISOString()
  const before = await loadMetrics()

  const autoSend =
    options?.autoSend === true ||
    text(request.nextUrl.searchParams.get('autoSend')) === 'true' ||
    process.env.OPS_HEARTBEAT_AUTO_SEND === 'true'

  const source =
    options?.source ||
    text(request.nextUrl.searchParams.get('source')) ||
    'manual'

  const run = await insertRun({
    run_source: source,
    status: 'running',
    auto_send: autoSend,
    queued_before: before.queued,
    sent_before: before.sent,
    failed_before: before.failed,
    open_incidents_before: before.openIncidents,
    urgent_before: before.urgent,
    started_at: startedIso,
    payload: {
      source,
      autoSend
    }
  })

  const runId = text(run?.id)
  const origin = request.nextUrl.origin
  const secret = internalSecret()
  const cookie = request.headers.get('cookie') || ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (secret) headers.Authorization = 'Bearer ' + secret
  if (cookie) headers.cookie = cookie

  let autopilotResult: unknown = null
  let escalationResult: unknown = null
  let dispatchResult: unknown = null

  try {
    autopilotResult = await callJson(origin + '/api/ops-autopilot', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'runAutopilot',
        autoSend: false
      })
    })

    escalationResult = await callJson(origin + '/api/response-escalation?action=run' + (secret ? '&token=' + encodeURIComponent(secret) : ''), {
      method: 'GET',
      headers
    })

    if (autoSend) {
      dispatchResult = await callJson(origin + '/api/notifications/dispatch', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'dispatchQueued',
          limit: 50
        })
      })
    }

    const after = await loadMetrics()
    const finishedAt = Date.now()
    const ok =
      Boolean((autopilotResult as { ok?: boolean }).ok) &&
      Boolean((escalationResult as { ok?: boolean }).ok) &&
      (!autoSend || Boolean((dispatchResult as { ok?: boolean }).ok))

    const message = ok
      ? '자동운영 Heartbeat가 정상 실행되었습니다.'
      : '자동운영 Heartbeat 실행 중 일부 작업이 실패했습니다.'

    await patchRun(runId, {
      status: ok ? 'success' : 'partial_failed',
      autopilot_ok: Boolean((autopilotResult as { ok?: boolean }).ok),
      escalation_ok: Boolean((escalationResult as { ok?: boolean }).ok),
      dispatch_ok: autoSend ? Boolean((dispatchResult as { ok?: boolean }).ok) : false,
      queued_after: after.queued,
      sent_after: after.sent,
      failed_after: after.failed,
      open_incidents_after: after.openIncidents,
      urgent_after: after.urgent,
      message,
      finished_at: new Date(finishedAt).toISOString(),
      duration_ms: finishedAt - startedAt,
      payload: {
        source,
        autoSend,
        before,
        after,
        autopilotResult,
        escalationResult,
        dispatchResult
      }
    })

    await logHeartbeat(message, {
      source,
      autoSend,
      before,
      after,
      autopilotResult,
      escalationResult,
      dispatchResult
    })

    return {
      ok,
      message,
      source,
      autoSend,
      before,
      after,
      autopilotResult,
      escalationResult,
      dispatchResult
    }
  } catch (error) {
    const after = await loadMetrics().catch(() => before)
    const finishedAt = Date.now()
    const message = error instanceof Error ? error.message : 'Heartbeat 실행 중 오류가 발생했습니다.'

    await patchRun(runId, {
      status: 'failed',
      queued_after: after.queued,
      sent_after: after.sent,
      failed_after: after.failed,
      open_incidents_after: after.openIncidents,
      urgent_after: after.urgent,
      message,
      finished_at: new Date(finishedAt).toISOString(),
      duration_ms: finishedAt - startedAt,
      payload: {
        source,
        autoSend,
        before,
        after,
        error: message,
        autopilotResult,
        escalationResult,
        dispatchResult
      }
    })

    await logHeartbeat('자동운영 Heartbeat 실행 실패: ' + message, {
      source,
      autoSend,
      before,
      after,
      error: message
    })

    return {
      ok: false,
      status: 500,
      message,
      source,
      autoSend,
      before,
      after
    }
  }
}

async function loadStatus() {
  const [runsResult, logResult] = await Promise.all([
    rest('ops_heartbeat_runs?select=*&order=created_at.desc&limit=100'),
    rest('ops_autopilot_logs?select=*&action_type=eq.ops_heartbeat&order=created_at.desc&limit=50')
  ])

  const metrics = await loadMetrics()
  const runs = rows(runsResult)

  return {
    ok: true,
    autoSendEnabled: process.env.OPS_HEARTBEAT_AUTO_SEND === 'true',
    metrics,
    runs,
    logs: rows(logResult),
    lastRun: runs[0] || null,
    config: {
      hasCronSecret: Boolean(process.env.CRON_SECRET),
      hasAutopilotSecret: Boolean(process.env.OPS_AUTOPILOT_SECRET),
      hasEscalationSecret: Boolean(process.env.RESPONSE_ESCALATION_SECRET)
    }
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증 또는 Cron Secret이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const action = text(request.nextUrl.searchParams.get('action'))

  if (action === 'run') {
    const result = await runHeartbeat(request, {
      source: text(request.nextUrl.searchParams.get('source')) || 'manual',
      autoSend: text(request.nextUrl.searchParams.get('autoSend')) === 'true'
    })

    return NextResponse.json(result, { status: responseStatus(result) })
  }

  const result = await loadStatus()
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증 또는 Cron Secret이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'runHeartbeat') {
    const result = await runHeartbeat(request, {
      source: text(body.source) || 'manual',
      autoSend: bool(body.autoSend)
    })

    return NextResponse.json(result, { status: responseStatus(result) })
  }

  return NextResponse.json(
    {
      ok: false,
      message: '알 수 없는 action입니다.'
    },
    { status: 400 }
  )
}
