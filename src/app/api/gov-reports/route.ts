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

function numberValue(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
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

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function startOfWeek(date: Date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = (day + 6) % 7
  d.setDate(d.getDate() - diff)
  return d
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function periodRange(request: NextRequest) {
  const now = new Date()
  const period = text(request.nextUrl.searchParams.get('period')) || 'week'
  const startParam = text(request.nextUrl.searchParams.get('start'))
  const endParam = text(request.nextUrl.searchParams.get('end'))

  if (period === 'custom' && startParam && endParam) {
    return {
      period,
      start: startOfDay(new Date(startParam)),
      end: endOfDay(new Date(endParam))
    }
  }

  if (period === 'today') {
    return {
      period,
      start: startOfDay(now),
      end: endOfDay(now)
    }
  }

  if (period === 'month') {
    return {
      period,
      start: startOfMonth(now),
      end: endOfDay(now)
    }
  }

  if (period === 'last30') {
    const start = startOfDay(now)
    start.setDate(start.getDate() - 29)

    return {
      period,
      start,
      end: endOfDay(now)
    }
  }

  return {
    period: 'week',
    start: startOfWeek(now),
    end: endOfDay(now)
  }
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

function dateLabel(value: unknown) {
  const d = new Date(text(value))
  if (Number.isNaN(d.getTime())) return ''
  return dateKey(d)
}

function within(value: unknown, start: Date, end: Date) {
  const d = new Date(text(value))
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime()
}

function isOpenStatus(status: string) {
  return ['open', 'dispatched', 'manual_needed', 'accepted', 'in_progress'].includes(status)
}

function requestTypeLabel(type: string) {
  if (type === 'meal_delivery') return '식사 미확인'
  if (type === 'medication_reminder') return '복약 미확인'
  if (type === 'urgent_neighbor_help') return '도움 요청'
  if (type === 'care_partner_check') return '몸 상태 확인'
  if (type === 'pharmacy_call') return '약국 상담'
  return '안부 확인'
}

function statusLabel(status: string) {
  if (status === 'open') return '새 사건'
  if (status === 'dispatched') return '도움망 전파'
  if (status === 'manual_needed') return '수동 연결'
  if (status === 'accepted') return '수락됨'
  if (status === 'in_progress') return '확인 중'
  if (status === 'completed') return '완료'
  if (status === 'cancelled') return '취소'
  if (status === 'sent') return '발송 완료'
  if (status === 'failed') return '실패'
  if (status === 'queued') return '대기'
  return status || '기타'
}

function avg(values: number[]) {
  const valid = values.filter((n) => Number.isFinite(n) && n >= 0)
  if (valid.length === 0) return 0
  return Math.round(valid.reduce((sum, n) => sum + n, 0) / valid.length)
}

function minutesBetween(start: unknown, end: unknown) {
  const s = new Date(text(start))
  const e = new Date(text(end))
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000))
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

function breakdown(rowsInput: Row[], key: string, labeler?: (value: string) => string) {
  const map: Record<string, number> = {}

  for (const row of rowsInput) {
    const raw = text(row[key]) || 'unknown'
    const label = labeler ? labeler(raw) : raw
    map[label] = (map[label] || 0) + 1
  }

  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

function dailySeries(start: Date, end: Date, requests: Row[], outbox: Row[]) {
  const result: Array<{
    date: string
    signals: number
    urgent: number
    completed: number
    smsSent: number
    smsFailed: number
  }> = []

  const cursor = startOfDay(start)

  while (cursor.getTime() <= end.getTime()) {
    const key = dateKey(cursor)
    const requestRows = requests.filter((row) => dateLabel(row.created_at) === key)
    const outboxRows = outbox.filter((row) => dateLabel(row.created_at) === key || dateLabel(row.sent_at) === key)

    result.push({
      date: key,
      signals: requestRows.length,
      urgent: requestRows.filter((row) => text(row.risk_level) === 'high' || text(row.request_type) === 'urgent_neighbor_help').length,
      completed: requestRows.filter((row) => text(row.status) === 'completed').length,
      smsSent: outboxRows.filter((row) => text(row.status) === 'sent').length,
      smsFailed: outboxRows.filter((row) => text(row.status) === 'failed').length
    })

    cursor.setDate(cursor.getDate() + 1)

    if (result.length > 62) break
  }

  return result
}

async function buildReport(request: NextRequest) {
  const range = periodRange(request)

  const [
    householdResult,
    requestResult,
    matchResult,
    outboxResult,
    providerResult,
    heartbeatResult,
    logResult,
    snapshotResult
  ] = await Promise.all([
    rest('care_households?select=*&order=created_at.desc&limit=5000'),
    rest('care_response_requests?select=*&order=created_at.desc&limit=5000'),
    rest('care_response_matches?select=*&order=created_at.desc&limit=5000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=5000'),
    rest('care_providers?select=*&order=created_at.desc&limit=3000'),
    rest('ops_heartbeat_runs?select=*&order=created_at.desc&limit=1000'),
    rest('ops_autopilot_logs?select=*&order=created_at.desc&limit=3000'),
    rest('gov_report_snapshots?select=*&order=created_at.desc&limit=30')
  ])

  const households = rows(householdResult)
  const requests = rows(requestResult)
  const matches = rows(matchResult)
  const outbox = rows(outboxResult)
  const providers = rows(providerResult)
  const heartbeats = rows(heartbeatResult)
  const logs = rows(logResult)
  const snapshots = rows(snapshotResult)

  const requestsInRange = requests.filter((row) => within(row.created_at, range.start, range.end))
  const matchesInRange = matches.filter((row) => within(row.created_at || row.notified_at, range.start, range.end))
  const outboxInRange = outbox.filter((row) => within(row.created_at, range.start, range.end) || within(row.sent_at, range.start, range.end))
  const heartbeatsInRange = heartbeats.filter((row) => within(row.created_at || row.started_at, range.start, range.end))
  const logsInRange = logs.filter((row) => within(row.created_at, range.start, range.end))

  const openRequestsAll = requests.filter((row) => isOpenStatus(text(row.status)))
  const urgentRequestsAll = openRequestsAll.filter((row) => text(row.risk_level) === 'high' || text(row.request_type) === 'urgent_neighbor_help')

  const completedInRange = requests.filter((row) => text(row.status) === 'completed' && within(row.completed_at || row.updated_at || row.created_at, range.start, range.end))
  const manualNeededAll = openRequestsAll.filter((row) => text(row.status) === 'manual_needed')
  const dispatchedInRange = requestsInRange.filter((row) => text(row.status) === 'dispatched' || text(row.dispatch_scope).includes('provider'))

  const acceptedMatches = matchesInRange.filter((row) =>
    ['accepted', 'in_progress', 'completed'].includes(text(row.match_status)) || Boolean(text(row.accepted_at))
  )

  const requestById: Record<string, Row> = {}
  for (const row of requests) {
    const id = text(row.id)
    if (id) requestById[id] = row
  }

  const acceptMinutes = acceptedMatches
    .map((match) => {
      const req = requestById[text(match.request_id)]
      if (!req) return 0
      return minutesBetween(req.created_at, match.accepted_at || match.created_at)
    })
    .filter(Boolean)

  const completionMinutes = completedInRange
    .map((row) => minutesBetween(row.created_at, row.completed_at || row.updated_at))
    .filter(Boolean)

  const sentSms = outboxInRange.filter((row) => text(row.status) === 'sent')
  const failedSms = outboxInRange.filter((row) => text(row.status) === 'failed')
  const queuedSms = outbox.filter((row) => text(row.status) === 'queued')

  const householdByFamily: Record<string, Row> = {}
  for (const household of households) {
    const familyCode = text(household.family_code)
    if (familyCode) householdByFamily[familyCode] = household
  }

  const riskMap: Record<string, Row> = {}

  for (const req of requestsInRange) {
    const familyCode = text(req.family_code) || 'unknown'
    const household = householdByFamily[familyCode] || {}

    const current = riskMap[familyCode] || {
      family_code: familyCode,
      parent_name: text(household.parent_name) || text(req.parent_name) || '대상자',
      guardian_name: text(household.guardian_name) || text(req.guardian_name),
      service_area: text(household.service_area) || text(req.service_area),
      risk_group: text(household.risk_group) || 'B',
      signal_count: 0,
      urgent_count: 0,
      open_count: 0,
      completed_count: 0,
      last_signal_label: '',
      last_signal_at: ''
    }

    current.signal_count = numberValue(current.signal_count) + 1

    if (text(req.risk_level) === 'high' || text(req.request_type) === 'urgent_neighbor_help') {
      current.urgent_count = numberValue(current.urgent_count) + 1
    }

    if (isOpenStatus(text(req.status))) {
      current.open_count = numberValue(current.open_count) + 1
    }

    if (text(req.status) === 'completed') {
      current.completed_count = numberValue(current.completed_count) + 1
    }

    if (!text(current.last_signal_at) || new Date(text(req.created_at)).getTime() > new Date(text(current.last_signal_at)).getTime()) {
      current.last_signal_label = text(req.signal_label) || requestTypeLabel(text(req.request_type))
      current.last_signal_at = text(req.created_at)
    }

    riskMap[familyCode] = current
  }

  const riskHouseholds = Object.values(riskMap)
    .sort((a, b) => {
      if (numberValue(b.urgent_count) !== numberValue(a.urgent_count)) return numberValue(b.urgent_count) - numberValue(a.urgent_count)
      if (numberValue(b.open_count) !== numberValue(a.open_count)) return numberValue(b.open_count) - numberValue(a.open_count)
      return numberValue(b.signal_count) - numberValue(a.signal_count)
    })
    .slice(0, 30)

  const activeHouseholds = households.filter((row) => text(row.household_status) !== 'archived')
  const groupA = activeHouseholds.filter((row) => text(row.risk_group) === 'A')
  const groupB = activeHouseholds.filter((row) => text(row.risk_group) === 'B')
  const consentApproved = activeHouseholds.filter((row) => text(row.consent_status) === 'approved')
  const availableProviders = providers.filter((row) => text(row.available_status) === 'available')

  const metrics = {
    totalHouseholds: households.length,
    activeHouseholds: activeHouseholds.length,
    groupA: groupA.length,
    groupB: groupB.length,
    consentApproved: consentApproved.length,
    consentPending: activeHouseholds.length - consentApproved.length,

    signals: requestsInRange.length,
    urgentSignals: requestsInRange.filter((row) => text(row.risk_level) === 'high' || text(row.request_type) === 'urgent_neighbor_help').length,
    mealSignals: requestsInRange.filter((row) => text(row.request_type) === 'meal_delivery').length,
    medicationSignals: requestsInRange.filter((row) => text(row.request_type) === 'medication_reminder').length,
    conditionSignals: requestsInRange.filter((row) => text(row.request_type) === 'care_partner_check').length,
    helpSignals: requestsInRange.filter((row) => text(row.request_type) === 'urgent_neighbor_help').length,

    openIncidents: openRequestsAll.length,
    urgentOpenIncidents: urgentRequestsAll.length,
    completedIncidents: completedInRange.length,
    manualNeeded: manualNeededAll.length,
    dispatched: dispatchedInRange.length,

    providers: providers.length,
    availableProviders: availableProviders.length,
    matches: matchesInRange.length,
    acceptedMatches: acceptedMatches.length,
    matchAcceptanceRate: pct(acceptedMatches.length, matchesInRange.length),
    avgAcceptMinutes: avg(acceptMinutes),
    avgCompletionMinutes: avg(completionMinutes),

    smsQueued: queuedSms.length,
    smsSent: sentSms.length,
    smsFailed: failedSms.length,
    smsSuccessRate: pct(sentSms.length, sentSms.length + failedSms.length),

    heartbeatRuns: heartbeatsInRange.length,
    heartbeatSuccess: heartbeatsInRange.filter((row) => text(row.status) === 'success').length,
    heartbeatFailed: heartbeatsInRange.filter((row) => ['failed', 'partial_failed'].includes(text(row.status))).length,
    autopilotLogs: logsInRange.length
  }

  const summaryLines = [
    `관리 대상자는 총 ${metrics.activeHouseholds}명이며, A그룹 고위험 ${metrics.groupA}명, B그룹 일반관리 ${metrics.groupB}명입니다.`,
    `기간 내 안부 신호는 ${metrics.signals}건, 긴급 신호는 ${metrics.urgentSignals}건 발생했습니다.`,
    `현재 열린 사건은 ${metrics.openIncidents}건이며, 이 중 긴급 사건은 ${metrics.urgentOpenIncidents}건입니다.`,
    `도움망 요청 수락률은 ${metrics.matchAcceptanceRate}%이고, 평균 수락 시간은 ${metrics.avgAcceptMinutes}분입니다.`,
    `문자 발송 성공률은 ${metrics.smsSuccessRate}%이며, 발송 완료 ${metrics.smsSent}건, 실패 ${metrics.smsFailed}건입니다.`
  ]

  const report = {
    ok: true,
    period: range.period,
    range: {
      start: dateKey(range.start),
      end: dateKey(range.end)
    },
    generatedAt: new Date().toISOString(),
    title: `안부웍스 지자체 운영보고서 · ${dateKey(range.start)} ~ ${dateKey(range.end)}`,
    summary: summaryLines.join('\n'),
    summaryLines,
    metrics,
    typeBreakdown: breakdown(requestsInRange, 'request_type', requestTypeLabel),
    statusBreakdown: breakdown(requestsInRange, 'status', statusLabel),
    smsBreakdown: breakdown(outboxInRange, 'status', statusLabel),
    daily: dailySeries(range.start, range.end, requestsInRange, outboxInRange),
    riskHouseholds,
    snapshots,
    rawCounts: {
      households: households.length,
      requests: requests.length,
      matches: matches.length,
      outbox: outbox.length,
      providers: providers.length,
      heartbeats: heartbeats.length,
      logs: logs.length
    }
  }

  return report
}

async function saveSnapshot(request: NextRequest) {
  const report = await buildReport(request)

  if (!report.ok) return report

  const result = await rest('gov_report_snapshots', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        report_type: 'ops_report',
        period_key: report.period,
        period_start: report.range.start,
        period_end: report.range.end,
        title: report.title,
        summary: report.summary,
        metrics: report.metrics,
        payload: report,
        created_by: '운영실'
      }
    ])
  })

  const snapshot = rows(result)[0]

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '운영보고서 스냅샷을 저장했습니다.' : '운영보고서 저장에 실패했습니다.',
    snapshot,
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

  const report = await buildReport(request)
  return NextResponse.json(report, { status: responseStatus(report) })
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

  if (action === 'saveSnapshot') {
    const result = await saveSnapshot(request)
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
