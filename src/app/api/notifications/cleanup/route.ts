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

function isArchived(row: Row) {
  return Boolean(text(row.archived_at))
}

function isTest(row: Row) {
  const reason = text(row.reason).toLowerCase()
  const template = text(row.template_code).toLowerCase()
  const sourceKey = text(row.source_key).toLowerCase()
  const title = text(row.title).toLowerCase()
  const body = text(row.body).toLowerCase()

  return (
    reason.includes('test') ||
    template.includes('test') ||
    sourceKey.includes('test') ||
    title.includes('테스트') ||
    body.includes('테스트')
  )
}

function isStaleQueued(row: Row, hours = 24) {
  if (text(row.status) !== 'queued') return false
  const created = new Date(text(row.created_at))
  if (Number.isNaN(created.getTime())) return false
  return Date.now() - created.getTime() > hours * 60 * 60 * 1000
}

function classify(row: Row) {
  if (isArchived(row)) return 'archived'
  if (text(row.status) === 'cancelled') return 'cancelled'
  if (isTest(row)) return 'test'
  if (isStaleQueued(row)) return 'stale'
  if (text(row.status) === 'queued') return 'queued'
  if (text(row.status) === 'failed') return 'failed'
  if (text(row.status) === 'sent') return 'sent'
  return 'other'
}

function enrich(row: Row) {
  return {
    ...row,
    cleanup_bucket: text(row.cleanup_bucket) || classify(row),
    is_test: isTest(row),
    is_stale_queued: isStaleQueued(row),
    is_archived: isArchived(row)
  }
}

function metrics(items: Row[]) {
  const active = items.filter((row) => !isArchived(row))

  return {
    total: items.length,
    active: active.length,
    archived: items.filter(isArchived).length,
    queued: active.filter((row) => text(row.status) === 'queued').length,
    sent: active.filter((row) => text(row.status) === 'sent').length,
    failed: active.filter((row) => text(row.status) === 'failed').length,
    cancelled: active.filter((row) => text(row.status) === 'cancelled').length,
    tests: active.filter(isTest).length,
    staleQueued: active.filter((row) => isStaleQueued(row)).length,
    cleanupNeeded: active.filter((row) => isTest(row) || text(row.status) === 'failed' || isStaleQueued(row)).length
  }
}

async function loadAll() {
  const [outboxResult, runResult] = await Promise.all([
    rest('notification_outbox?select=*&order=created_at.desc&limit=1000'),
    rest('ops_notification_cleanup_runs?select=*&order=created_at.desc&limit=100')
  ])

  if (!outboxResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '알림 기록을 불러오지 못했습니다.',
      detail: outboxResult.error
    }
  }

  const items = rows(outboxResult).map(enrich)

  return {
    ok: true,
    items,
    logs: rows(runResult),
    metrics: metrics(items)
  }
}

function idListPath(ids: string[]) {
  return 'id=in.(' + ids.map(encodeURIComponent).join(',') + ')'
}

async function patchIds(ids: string[], patch: Row) {
  if (ids.length === 0) {
    return {
      ok: true,
      status: 200,
      data: [],
      error: null
    }
  }

  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100))

  const results = []

  for (const chunk of chunks) {
    const result = await rest('notification_outbox?' + idListPath(chunk), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    results.push(result)

    if (!result.ok) return result
  }

  return {
    ok: true,
    status: 200,
    data: results.flatMap((result) => rows(result)),
    error: null
  }
}

async function logCleanup(input: {
  actionType: string
  affectedCount: number
  message: string
  payload?: Row
}) {
  await rest('ops_notification_cleanup_runs', {
    method: 'POST',
    body: JSON.stringify([
      {
        action_type: input.actionType,
        affected_count: input.affectedCount,
        actor_name: '운영실',
        message: input.message,
        payload: input.payload || {}
      }
    ])
  })
}

async function archiveRows(actionType: string, rowsToArchive: Row[], reason: string) {
  const ids = rowsToArchive.map((row) => text(row.id)).filter(Boolean)

  const result = await patchIds(ids, {
    archived_at: new Date().toISOString(),
    archived_by: '운영실',
    archived_reason: reason,
    cleanup_bucket: 'archived',
    cleanup_note: reason
  })

  await logCleanup({
    actionType,
    affectedCount: ids.length,
    message: `${ids.length}건을 보관 처리했습니다.`,
    payload: { reason, ids }
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : result.status || 500,
    message: `${ids.length}건을 보관 처리했습니다.`,
    affectedCount: ids.length,
    detail: result.error
  }
}

async function cancelRows(actionType: string, rowsToCancel: Row[], reason: string) {
  const ids = rowsToCancel.map((row) => text(row.id)).filter(Boolean)

  const result = await patchIds(ids, {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancelled_reason: reason,
    cleanup_bucket: 'cancelled',
    cleanup_note: reason
  })

  await logCleanup({
    actionType,
    affectedCount: ids.length,
    message: `${ids.length}건을 취소 처리했습니다.`,
    payload: { reason, ids }
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : result.status || 500,
    message: `${ids.length}건을 취소 처리했습니다.`,
    affectedCount: ids.length,
    detail: result.error
  }
}

async function runAction(action: string, body: Row) {
  const data = await loadAll()

  if (!data.ok) return data

  const items = data.items as Row[]
  const active = items.filter((row) => !isArchived(row))

  if (action === 'archiveTests') {
    return archiveRows('archive_tests', active.filter(isTest), '테스트 알림 보관')
  }

  if (action === 'archiveSent') {
    return archiveRows('archive_sent', active.filter((row) => text(row.status) === 'sent'), '발송 완료 알림 보관')
  }

  if (action === 'archiveFailed') {
    return archiveRows('archive_failed', active.filter((row) => text(row.status) === 'failed'), '실패 알림 보관')
  }

  if (action === 'cancelStaleQueued') {
    const hours = Number(body.hours) || 24
    return cancelRows('cancel_stale_queued', active.filter((row) => isStaleQueued(row, hours)), `${hours}시간 초과 대기 알림 취소`)
  }

  if (action === 'archiveOne') {
    const id = text(body.id)
    const row = active.find((item) => text(item.id) === id)
    return archiveRows('archive_one', row ? [row] : [], text(body.reason) || '개별 알림 보관')
  }

  if (action === 'cancelOne') {
    const id = text(body.id)
    const row = active.find((item) => text(item.id) === id)
    return cancelRows('cancel_one', row ? [row] : [], text(body.reason) || '개별 알림 취소')
  }

  if (action === 'restoreOne') {
    const id = text(body.id)
    const result = await patchIds([id], {
      archived_at: null,
      archived_by: null,
      archived_reason: null,
      cleanup_bucket: null,
      cleanup_note: null
    })

    await logCleanup({
      actionType: 'restore_one',
      affectedCount: result.ok ? 1 : 0,
      message: result.ok ? '알림 1건을 복구했습니다.' : '알림 복구에 실패했습니다.',
      payload: { id }
    })

    return {
      ok: result.ok,
      status: result.ok ? 200 : result.status || 500,
      message: result.ok ? '알림 1건을 복구했습니다.' : '알림 복구에 실패했습니다.',
      detail: result.error
    }
  }

  return {
    ok: false,
    status: 400,
    message: '알 수 없는 action입니다.'
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

  const data = await loadAll()
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

  const result = await runAction(action, body)
  return NextResponse.json(result, { status: responseStatus(result) })
}
