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

type Violation = {
  key: string
  type: string
  severity: 'warning' | 'critical'
  requestId?: string
  matchId?: string
  title: string
  message: string
  fixAction: string
  payload?: Row
}

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'OPS_SESSION_TOKEN',
  'ops_session_token',
  'ops_session'
]

const requestStatuses = new Set([
  'open',
  'dispatched',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
  'manual_needed',
  'expired'
])

const terminalRequestStatuses = new Set(['completed', 'cancelled', 'expired'])
const activeMatchStatuses = new Set(['notified', 'accepted', 'in_progress'])
const acceptedMatchStatuses = new Set(['accepted', 'in_progress'])

const allowedTransitions: Record<string, string[]> = {
  open: ['dispatched', 'manual_needed', 'cancelled', 'completed'],
  dispatched: ['accepted', 'manual_needed', 'expired', 'cancelled'],
  manual_needed: ['dispatched', 'cancelled', 'completed'],
  accepted: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  expired: []
}

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

function isExpired(value: unknown) {
  const raw = text(value)
  if (!raw) return false

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return false

  return Date.now() > d.getTime()
}

function ageMinutes(value: unknown) {
  const raw = text(value)
  if (!raw) return null

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null

  return Math.floor((Date.now() - d.getTime()) / 60000)
}

function isUrgent(row: Row) {
  return (
    text(row.request_type) === 'urgent_neighbor_help' ||
    text(row.signal_type) === 'urgent_neighbor_help' ||
    text(row.risk_level) === 'high'
  )
}

function isOpenStatus(status: string) {
  return ['open', 'dispatched', 'manual_needed', 'accepted', 'in_progress'].includes(status)
}

function allowedTransition(from: string, to: string) {
  if (!requestStatuses.has(from) || !requestStatuses.has(to)) return false
  return (allowedTransitions[from] || []).includes(to)
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

async function patchById(table: string, id: string, patch: Row) {
  return rest(table + '?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })
}

async function patchByIds(table: string, ids: string[], patch: Row) {
  if (ids.length === 0) return { ok: true, status: 200, data: [], error: null } as RestResult

  return rest(table + '?id=in.(' + ids.map(encodeURIComponent).join(',') + ')', {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })
}

async function logTransition(input: {
  requestId?: string
  matchId?: string
  transitionType: string
  fromStatus?: string
  toStatus?: string
  reason: string
  payload?: Row
}) {
  await insertRows('care_state_transition_logs', [
    {
      request_id: input.requestId || null,
      match_id: input.matchId || null,
      actor_type: 'ops',
      actor_name: '상태 머신',
      transition_type: input.transitionType,
      from_status: input.fromStatus || null,
      to_status: input.toStatus || null,
      reason: input.reason,
      payload: input.payload || {}
    }
  ])

  if (input.requestId) {
    await insertRows('care_response_updates', [
      {
        request_id: input.requestId,
        actor_type: 'ops',
        actor_name: '상태 머신',
        update_type: input.transitionType,
        message: input.reason,
        payload: {
          fromStatus: input.fromStatus,
          toStatus: input.toStatus,
          matchId: input.matchId,
          ...(input.payload || {})
        }
      }
    ])

    await insertRows('ops_autopilot_logs', [
      {
        request_id: input.requestId,
        action_type: input.transitionType,
        actor_name: '상태 머신',
        message: input.reason,
        payload: {
          fromStatus: input.fromStatus,
          toStatus: input.toStatus,
          matchId: input.matchId,
          ...(input.payload || {})
        }
      }
    ])
  }
}

function analyze(requests: Row[], matches: Row[]) {
  const violations: Violation[] = []

  const matchesByRequest: Record<string, Row[]> = {}

  for (const match of matches) {
    const requestId = text(match.request_id)
    if (!requestId) continue

    matchesByRequest[requestId] = matchesByRequest[requestId] || []
    matchesByRequest[requestId].push(match)
  }

  for (const request of requests) {
    const requestId = text(request.id)
    const status = text(request.status) || 'open'
    const reqMatches = matchesByRequest[requestId] || []

    if (!requestStatuses.has(status)) {
      violations.push({
        key: `unknown-status-${requestId}`,
        type: 'unknown_request_status',
        severity: 'critical',
        requestId,
        title: '알 수 없는 사건 상태',
        message: `${status || '빈 상태'}는 상태 머신에 정의되지 않은 상태입니다.`,
        fixAction: 'manual_review',
        payload: { status }
      })
    }

    const activeMatches = reqMatches.filter((match) => activeMatchStatuses.has(text(match.match_status)))
    const acceptedMatches = reqMatches.filter((match) => acceptedMatchStatuses.has(text(match.match_status)))

    if (terminalRequestStatuses.has(status) && activeMatches.length > 0) {
      violations.push({
        key: `terminal-open-matches-${requestId}`,
        type: 'terminal_request_has_active_matches',
        severity: 'critical',
        requestId,
        title: '종료된 사건에 열린 배치가 남아 있습니다',
        message: `${status} 상태 사건에 active match ${activeMatches.length}건이 남아 있습니다.`,
        fixAction: 'closeTerminalOpenMatches',
        payload: {
          activeMatchIds: activeMatches.map((match) => text(match.id))
        }
      })
    }

    if (acceptedMatches.length > 1) {
      violations.push({
        key: `duplicate-accepted-${requestId}`,
        type: 'duplicate_accepted_matches',
        severity: 'critical',
        requestId,
        title: '한 사건에 여러 도움망이 동시에 수락되었습니다',
        message: `수락 또는 진행 중인 match가 ${acceptedMatches.length}건입니다. 가장 먼저 수락한 1건만 유지해야 합니다.`,
        fixAction: 'fixDuplicateAcceptances',
        payload: {
          acceptedMatchIds: acceptedMatches.map((match) => text(match.id))
        }
      })
    }

    if (['accepted', 'in_progress'].includes(status) && !text(request.accepted_by_provider_id) && acceptedMatches.length > 0) {
      violations.push({
        key: `missing-accepted-provider-${requestId}`,
        type: 'missing_accepted_provider',
        severity: 'warning',
        requestId,
        title: '사건 수락자 정보가 비어 있습니다',
        message: 'accepted 상태인데 accepted_by_provider_id가 없습니다.',
        fixAction: 'syncAcceptedProvider',
        payload: {
          acceptedMatchId: text(acceptedMatches[0].id),
          providerId: text(acceptedMatches[0].provider_id)
        }
      })
    }

    if (status === 'completed' && text(request.fast_dispatch_status) !== 'completed') {
      violations.push({
        key: `sync-completed-fast-status-${requestId}`,
        type: 'completed_fast_status_mismatch',
        severity: 'warning',
        requestId,
        title: '완료 사건의 빠른 배치 상태가 맞지 않습니다',
        message: '사건은 completed인데 fast_dispatch_status가 completed가 아닙니다.',
        fixAction: 'syncCompletedStatus'
      })
    }

    if (isUrgent(request) && ['open', 'dispatched'].includes(status) && acceptedMatches.length === 0) {
      const age = ageMinutes(request.created_at)
      if (typeof age === 'number' && age >= 10) {
        violations.push({
          key: `stale-urgent-${requestId}`,
          type: 'stale_urgent_unaccepted',
          severity: 'critical',
          requestId,
          title: '긴급 사건이 10분 이상 수락되지 않았습니다',
          message: `생성 후 ${age}분이 지났지만 수락된 도움망이 없습니다.`,
          fixAction: 'markStaleUrgentManual',
          payload: { ageMinutes: age }
        })
      }
    }
  }

  for (const match of matches) {
    const matchId = text(match.id)
    const status = text(match.match_status)

    if (status === 'notified' && isExpired(match.accept_token_expires_at)) {
      violations.push({
        key: `expired-match-token-${matchId}`,
        type: 'expired_notified_match',
        severity: 'warning',
        requestId: text(match.request_id),
        matchId,
        title: '수락 링크가 만료됐지만 요청 상태가 notified입니다',
        message: '1회용 수락 링크가 만료됐으므로 match_status를 expired로 정리해야 합니다.',
        fixAction: 'fixExpiredMatches',
        payload: {
          expiresAt: text(match.accept_token_expires_at)
        }
      })
    }
  }

  const metrics = {
    requests: requests.length,
    matches: matches.length,
    open: requests.filter((row) => text(row.status) === 'open').length,
    dispatched: requests.filter((row) => text(row.status) === 'dispatched').length,
    accepted: requests.filter((row) => text(row.status) === 'accepted').length,
    inProgress: requests.filter((row) => text(row.status) === 'in_progress').length,
    completed: requests.filter((row) => text(row.status) === 'completed').length,
    cancelled: requests.filter((row) => text(row.status) === 'cancelled').length,
    manualNeeded: requests.filter((row) => text(row.status) === 'manual_needed').length,
    expired: requests.filter((row) => text(row.status) === 'expired').length,
    violations: violations.length,
    critical: violations.filter((item) => item.severity === 'critical').length,
    warning: violations.filter((item) => item.severity === 'warning').length
  }

  return {
    violations,
    metrics
  }
}

async function loadData() {
  const [requestResult, matchResult, runResult, transitionResult] = await Promise.all([
    rest('care_response_requests?select=*&order=created_at.desc&limit=2000'),
    rest('care_response_matches?select=*&order=created_at.desc&limit=3000'),
    rest('ops_state_machine_runs?select=*&order=created_at.desc&limit=50'),
    rest('care_state_transition_logs?select=*&order=created_at.desc&limit=100')
  ])

  if (!requestResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '사건 목록을 불러오지 못했습니다.',
      detail: requestResult.error
    }
  }

  if (!matchResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '배치 매칭 목록을 불러오지 못했습니다.',
      detail: matchResult.error
    }
  }

  const requests = rows(requestResult)
  const matches = rows(matchResult)
  const result = analyze(requests, matches)

  return {
    ok: true,
    status: result.metrics.critical > 0 ? 'critical' : result.metrics.warning > 0 ? 'warning' : 'ok',
    generatedAt: new Date().toISOString(),
    rules: {
      requestStatuses: Array.from(requestStatuses),
      terminalRequestStatuses: Array.from(terminalRequestStatuses),
      allowedTransitions
    },
    metrics: result.metrics,
    violations: result.violations,
    requests: requests.slice(0, 100),
    matches: matches.slice(0, 200),
    runs: rows(runResult),
    transitions: rows(transitionResult)
  }
}

async function fixExpiredMatches() {
  const matchResult = await rest('care_response_matches?select=*&match_status=eq.notified&order=created_at.desc&limit=3000')
  const matches = rows(matchResult).filter((match) => isExpired(match.accept_token_expires_at))

  const ids = matches.map((match) => text(match.id)).filter(Boolean)

  const patch = await patchByIds('care_response_matches', ids, {
    match_status: 'expired',
    note: '상태 머신이 만료된 1회용 수락 링크를 expired로 정리했습니다.',
    updated_at: new Date().toISOString()
  })

  for (const match of matches) {
    await logTransition({
      requestId: text(match.request_id),
      matchId: text(match.id),
      transitionType: 'match_expired',
      fromStatus: text(match.match_status),
      toStatus: 'expired',
      reason: '1회용 수락 링크가 만료되어 배치 요청을 expired로 정리했습니다.',
      payload: {
        expiresAt: text(match.accept_token_expires_at)
      }
    })
  }

  return {
    action: 'fixExpiredMatches',
    ok: patch.ok,
    count: ids.length,
    detail: patch.error
  }
}

async function closeTerminalOpenMatches() {
  const [requestResult, matchResult] = await Promise.all([
    rest('care_response_requests?select=*&order=created_at.desc&limit=2000'),
    rest('care_response_matches?select=*&order=created_at.desc&limit=3000')
  ])

  const requests = rows(requestResult)
  const matches = rows(matchResult)

  const terminalRequestIds = new Set(
    requests
      .filter((request) => terminalRequestStatuses.has(text(request.status)))
      .map((request) => text(request.id))
  )

  const targets = matches.filter((match) => {
    return terminalRequestIds.has(text(match.request_id)) && activeMatchStatuses.has(text(match.match_status))
  })

  const ids = targets.map((match) => text(match.id)).filter(Boolean)

  const patch = await patchByIds('care_response_matches', ids, {
    match_status: 'declined',
    declined_at: new Date().toISOString(),
    note: '사건이 이미 종료되어 상태 머신이 열린 배치를 자동 마감했습니다.',
    updated_at: new Date().toISOString()
  })

  for (const match of targets) {
    await logTransition({
      requestId: text(match.request_id),
      matchId: text(match.id),
      transitionType: 'match_closed_after_terminal_request',
      fromStatus: text(match.match_status),
      toStatus: 'declined',
      reason: '종료된 사건에 남아 있던 열린 배치를 자동 마감했습니다.'
    })
  }

  return {
    action: 'closeTerminalOpenMatches',
    ok: patch.ok,
    count: ids.length,
    detail: patch.error
  }
}

async function fixDuplicateAcceptances() {
  const [requestResult, matchResult] = await Promise.all([
    rest('care_response_requests?select=*&order=created_at.desc&limit=2000'),
    rest('care_response_matches?select=*&order=created_at.desc&limit=3000')
  ])

  const requests = rows(requestResult)
  const matches = rows(matchResult)

  const matchesByRequest: Record<string, Row[]> = {}

  for (const match of matches) {
    const requestId = text(match.request_id)
    matchesByRequest[requestId] = matchesByRequest[requestId] || []
    matchesByRequest[requestId].push(match)
  }

  const results = []

  for (const request of requests) {
    const requestId = text(request.id)
    const acceptedMatches = (matchesByRequest[requestId] || [])
      .filter((match) => acceptedMatchStatuses.has(text(match.match_status)))
      .sort((a, b) => {
        const left = new Date(text(a.accepted_at || a.updated_at || a.created_at)).getTime()
        const right = new Date(text(b.accepted_at || b.updated_at || b.created_at)).getTime()
        return left - right
      })

    if (acceptedMatches.length <= 1) continue

    const keep = acceptedMatches[0]
    const close = acceptedMatches.slice(1)
    const closeIds = close.map((match) => text(match.id)).filter(Boolean)

    const patch = await patchByIds('care_response_matches', closeIds, {
      match_status: 'declined',
      declined_at: new Date().toISOString(),
      note: '다른 도움망이 먼저 수락하여 상태 머신이 중복 수락을 마감했습니다.',
      updated_at: new Date().toISOString()
    })

    if (!text(request.accepted_by_provider_id)) {
      await patchById('care_response_requests', requestId, {
        accepted_by_provider_id: text(keep.provider_id),
        accepted_at: text(keep.accepted_at) || new Date().toISOString(),
        fast_dispatch_status: 'accepted',
        updated_at: new Date().toISOString()
      })
    }

    for (const match of close) {
      await logTransition({
        requestId,
        matchId: text(match.id),
        transitionType: 'duplicate_acceptance_closed',
        fromStatus: text(match.match_status),
        toStatus: 'declined',
        reason: '중복 수락이 감지되어 가장 빠른 수락 1건만 유지하고 나머지를 마감했습니다.',
        payload: {
          keptMatchId: text(keep.id)
        }
      })
    }

    results.push({
      requestId,
      keptMatchId: text(keep.id),
      closed: closeIds.length,
      ok: patch.ok
    })
  }

  return {
    action: 'fixDuplicateAcceptances',
    ok: results.every((item) => item.ok),
    count: results.reduce((sum, item) => sum + item.closed, 0),
    results
  }
}

async function markStaleUrgentManual() {
  const requestResult = await rest('care_response_requests?select=*&order=created_at.desc&limit=2000')
  const matchResult = await rest('care_response_matches?select=*&order=created_at.desc&limit=3000')

  const requests = rows(requestResult)
  const matches = rows(matchResult)

  const acceptedByRequest = new Set(
    matches
      .filter((match) => acceptedMatchStatuses.has(text(match.match_status)))
      .map((match) => text(match.request_id))
  )

  const targets = requests.filter((request) => {
    const status = text(request.status)
    const age = ageMinutes(request.created_at)

    return (
      isUrgent(request) &&
      ['open', 'dispatched'].includes(status) &&
      !acceptedByRequest.has(text(request.id)) &&
      typeof age === 'number' &&
      age >= 10
    )
  })

  const results = []

  for (const request of targets) {
    const fromStatus = text(request.status)
    const requestId = text(request.id)

    const patch = await patchById('care_response_requests', requestId, {
      status: 'manual_needed',
      fast_dispatch_status: 'stale_manual_needed',
      state_reason: '긴급 사건이 10분 이상 수락되지 않아 운영실 수동 연결 필요로 전환했습니다.',
      last_transition_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    await logTransition({
      requestId,
      transitionType: 'stale_urgent_manual_needed',
      fromStatus,
      toStatus: 'manual_needed',
      reason: '긴급 사건이 10분 이상 수락되지 않아 운영실 수동 연결 필요로 전환했습니다.',
      payload: {
        ageMinutes: ageMinutes(request.created_at)
      }
    })

    results.push({
      requestId,
      ok: patch.ok,
      fromStatus,
      toStatus: 'manual_needed'
    })
  }

  return {
    action: 'markStaleUrgentManual',
    ok: results.every((item) => item.ok),
    count: results.length,
    results
  }
}

async function syncCompletedStatus() {
  const requestResult = await rest('care_response_requests?select=*&status=eq.completed&order=created_at.desc&limit=2000')
  const requests = rows(requestResult).filter((request) => text(request.fast_dispatch_status) !== 'completed')

  const results = []

  for (const request of requests) {
    const requestId = text(request.id)

    const patch = await patchById('care_response_requests', requestId, {
      fast_dispatch_status: 'completed',
      last_transition_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    await logTransition({
      requestId,
      transitionType: 'sync_completed_fast_dispatch_status',
      fromStatus: text(request.fast_dispatch_status),
      toStatus: 'completed',
      reason: '완료된 사건의 fast_dispatch_status를 completed로 동기화했습니다.'
    })

    results.push({
      requestId,
      ok: patch.ok
    })
  }

  return {
    action: 'syncCompletedStatus',
    ok: results.every((item) => item.ok),
    count: results.length,
    results
  }
}

async function syncAcceptedProvider() {
  const [requestResult, matchResult] = await Promise.all([
    rest('care_response_requests?select=*&order=created_at.desc&limit=2000'),
    rest('care_response_matches?select=*&order=created_at.desc&limit=3000')
  ])

  const requests = rows(requestResult)
  const matches = rows(matchResult)

  const matchesByRequest: Record<string, Row[]> = {}

  for (const match of matches) {
    const requestId = text(match.request_id)
    matchesByRequest[requestId] = matchesByRequest[requestId] || []
    matchesByRequest[requestId].push(match)
  }

  const results = []

  for (const request of requests) {
    const status = text(request.status)

    if (!['accepted', 'in_progress'].includes(status)) continue
    if (text(request.accepted_by_provider_id)) continue

    const acceptedMatch = (matchesByRequest[text(request.id)] || []).find((match) => acceptedMatchStatuses.has(text(match.match_status)))

    if (!acceptedMatch) continue

    const requestId = text(request.id)

    const patch = await patchById('care_response_requests', requestId, {
      accepted_by_provider_id: text(acceptedMatch.provider_id),
      accepted_at: text(acceptedMatch.accepted_at) || new Date().toISOString(),
      fast_dispatch_status: 'accepted',
      last_transition_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    await logTransition({
      requestId,
      matchId: text(acceptedMatch.id),
      transitionType: 'sync_accepted_provider',
      toStatus: 'accepted',
      reason: 'accepted 상태 사건에 누락된 accepted_by_provider_id를 동기화했습니다.'
    })

    results.push({
      requestId,
      matchId: text(acceptedMatch.id),
      ok: patch.ok
    })
  }

  return {
    action: 'syncAcceptedProvider',
    ok: results.every((item) => item.ok),
    count: results.length,
    results
  }
}

async function transitionRequest(body: Row) {
  const requestId = text(body.requestId)
  const toStatus = text(body.toStatus)
  const reason = text(body.reason) || '운영실 수동 상태 전환'

  if (!requestId || !toStatus) {
    return {
      ok: false,
      status: 400,
      message: 'requestId와 toStatus가 필요합니다.'
    }
  }

  if (!requestStatuses.has(toStatus)) {
    return {
      ok: false,
      status: 400,
      message: '정의되지 않은 상태입니다.'
    }
  }

  const requestResult = await rest('care_response_requests?select=*&id=eq.' + encodeURIComponent(requestId) + '&limit=1')
  const request = rows(requestResult)[0]

  if (!request) {
    return {
      ok: false,
      status: 404,
      message: '사건을 찾지 못했습니다.'
    }
  }

  const fromStatus = text(request.status) || 'open'

  if (!allowedTransition(fromStatus, toStatus)) {
    return {
      ok: false,
      status: 400,
      message: `${fromStatus} → ${toStatus} 전환은 허용되지 않습니다.`,
      allowed: allowedTransitions[fromStatus] || []
    }
  }

  const now = new Date().toISOString()
  const patch: Row = {
    status: toStatus,
    state_reason: reason,
    last_transition_at: now,
    updated_at: now
  }

  if (toStatus === 'cancelled') patch.cancelled_at = now
  if (toStatus === 'expired') patch.expired_at = now
  if (toStatus === 'completed') {
    patch.completed_at = text(request.completed_at) || now
    patch.fast_dispatch_status = 'completed'
  }

  const result = await patchById('care_response_requests', requestId, patch)

  await logTransition({
    requestId,
    transitionType: 'manual_request_transition',
    fromStatus,
    toStatus,
    reason,
    payload: {
      patch
    }
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: `${fromStatus} → ${toStatus} 상태로 전환했습니다.`,
    request: rows(result)[0],
    detail: result.error
  }
}

async function runAllFixes() {
  const results = []

  results.push(await fixExpiredMatches())
  results.push(await closeTerminalOpenMatches())
  results.push(await fixDuplicateAcceptances())
  results.push(await syncAcceptedProvider())
  results.push(await markStaleUrgentManual())
  results.push(await syncCompletedStatus())

  const data = await loadData()

  const runResult = await rest('ops_state_machine_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        action_type: 'run_all_fixes',
        status: data.ok ? data.status : 'unknown',
        summary: '상태 머신 자동 정리를 실행했습니다.',
        metrics: data.ok && 'metrics' in data ? data.metrics : {},
        violations: data.ok && 'violations' in data ? data.violations : [],
        fix_results: results,
        payload: {
          generatedAt: new Date().toISOString()
        },
        created_by: '운영실'
      }
    ])
  })

  return {
    ok: results.every((item) => item.ok !== false) && runResult.ok,
    status: runResult.ok ? 200 : 500,
    message: '상태 머신 자동 정리를 실행했습니다.',
    results,
    run: rows(runResult)[0],
    detail: runResult.error
  }
}

async function saveAuditSnapshot() {
  const data = await loadData()

  if (!data.ok) return data

  const result = await rest('ops_state_machine_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        action_type: 'audit_snapshot',
        status: data.status,
        summary:
          data.status === 'ok'
            ? '상태 머신 위반이 없습니다.'
            : '상태 머신 위반이 감지되었습니다.',
        metrics: data.metrics,
        violations: data.violations,
        fix_results: [],
        payload: {
          generatedAt: data.generatedAt
        },
        created_by: '운영실'
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: '상태 머신 점검 스냅샷을 저장했습니다.',
    run: rows(result)[0],
    detail: result.error
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

  const data = await loadData()
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

  if (action === 'runAllFixes') result = await runAllFixes()
  else if (action === 'saveAuditSnapshot') result = await saveAuditSnapshot()
  else if (action === 'fixExpiredMatches') result = await fixExpiredMatches()
  else if (action === 'closeTerminalOpenMatches') result = await closeTerminalOpenMatches()
  else if (action === 'fixDuplicateAcceptances') result = await fixDuplicateAcceptances()
  else if (action === 'syncAcceptedProvider') result = await syncAcceptedProvider()
  else if (action === 'markStaleUrgentManual') result = await markStaleUrgentManual()
  else if (action === 'syncCompletedStatus') result = await syncCompletedStatus()
  else if (action === 'transitionRequest') result = await transitionRequest(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
