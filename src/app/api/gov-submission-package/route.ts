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

type FileItem = {
  name: string
  label: string
  mime: string
  content: string
  rows: number
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
      error: '제출 패키지는 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.'
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

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10)
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

function csvEscape(value: unknown) {
  return '"' + String(value ?? '').replace(/"/g, '""') + '"'
}

function makeCsv(headers: string[], rowItems: Array<Array<unknown>>) {
  return [
    headers.map(csvEscape).join(','),
    ...rowItems.map((row) => row.map(csvEscape).join(','))
  ].join('\n')
}

function checklistItem(id: string, title: string, ok: boolean, detail: string) {
  return {
    id,
    title,
    ok,
    detail,
    status: ok ? 'ready' : 'need_check'
  }
}

function fileItem(name: string, label: string, mime: string, content: string, rows: number): FileItem {
  return {
    name,
    label,
    mime,
    content,
    rows
  }
}

async function buildPackage(request: NextRequest) {
  const range = periodRange(request)

  const [
    householdResult,
    requestResult,
    matchResult,
    providerResult,
    outboxResult,
    reportResult,
    privacyLogResult,
    consentResult,
    packageResult
  ] = await Promise.all([
    rest('care_households?select=*&order=created_at.desc&limit=5000'),
    rest('care_response_requests?select=*&order=created_at.desc&limit=5000'),
    rest('care_response_matches?select=*&order=created_at.desc&limit=5000'),
    rest('care_providers?select=*&order=created_at.desc&limit=3000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=5000'),
    rest('gov_report_snapshots?select=*&order=created_at.desc&limit=100'),
    rest('privacy_access_logs?select=*&order=created_at.desc&limit=5000'),
    rest('privacy_consent_records?select=*&order=created_at.desc&limit=5000'),
    rest('gov_submission_packages?select=*&order=created_at.desc&limit=30')
  ])

  if (!householdResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '대상자 데이터를 불러오지 못했습니다.',
      detail: householdResult.error
    }
  }

  if (!privacyLogResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '개인정보 감사 로그를 불러오지 못했습니다. SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.',
      detail: privacyLogResult.error
    }
  }

  const households = rows(householdResult)
  const requests = rows(requestResult)
  const matches = rows(matchResult)
  const providers = rows(providerResult)
  const outbox = rows(outboxResult)
  const reports = rows(reportResult)
  const privacyLogs = rows(privacyLogResult)
  const consentRecords = rows(consentResult)
  const packages = rows(packageResult)

  const requestsInRange = requests.filter((row) => within(row.created_at, range.start, range.end))
  const matchesInRange = matches.filter((row) => within(row.created_at || row.notified_at, range.start, range.end))
  const outboxInRange = outbox.filter((row) => within(row.created_at, range.start, range.end) || within(row.sent_at, range.start, range.end))
  const privacyInRange = privacyLogs.filter((row) => within(row.created_at, range.start, range.end))
  const consentInRange = consentRecords.filter((row) => within(row.created_at, range.start, range.end) || within(row.consented_at, range.start, range.end) || within(row.revoked_at, range.start, range.end))
  const reportsInRange = reports.filter((row) => {
    const start = text(row.period_start)
    const end = text(row.period_end)
    if (!start || !end) return within(row.created_at, range.start, range.end)
    return start >= dateKey(range.start) && end <= dateKey(range.end)
  })

  const activeHouseholds = households.filter((row) => text(row.household_status) !== 'archived')
  const groupA = activeHouseholds.filter((row) => text(row.risk_group) === 'A')
  const groupB = activeHouseholds.filter((row) => text(row.risk_group) === 'B')
  const consentApproved = activeHouseholds.filter((row) => text(row.consent_status) === 'approved')
  const urgentRequests = requestsInRange.filter((row) => text(row.risk_level) === 'high' || text(row.request_type) === 'urgent_neighbor_help')
  const openRequests = requests.filter((row) => isOpenStatus(text(row.status)))
  const completedRequests = requestsInRange.filter((row) => text(row.status) === 'completed')
  const sentSms = outboxInRange.filter((row) => text(row.status) === 'sent')
  const failedSms = outboxInRange.filter((row) => text(row.status) === 'failed')
  const acceptedMatches = matchesInRange.filter((row) => ['accepted', 'in_progress', 'completed'].includes(text(row.match_status)) || text(row.accepted_at))

  const metrics = {
    activeHouseholds: activeHouseholds.length,
    groupA: groupA.length,
    groupB: groupB.length,
    consentApproved: consentApproved.length,
    consentPending: activeHouseholds.length - consentApproved.length,

    requests: requestsInRange.length,
    urgentRequests: urgentRequests.length,
    openRequests: openRequests.length,
    completedRequests: completedRequests.length,

    providers: providers.length,
    availableProviders: providers.filter((row) => text(row.available_status) === 'available').length,
    matches: matchesInRange.length,
    acceptedMatches: acceptedMatches.length,
    acceptanceRate: matchesInRange.length ? Math.round((acceptedMatches.length / matchesInRange.length) * 1000) / 10 : 0,

    smsSent: sentSms.length,
    smsFailed: failedSms.length,
    smsQueued: outbox.filter((row) => text(row.status) === 'queued').length,

    reports: reportsInRange.length,
    privacyLogs: privacyInRange.length,
    consentRecords: consentInRange.length,
    packages: packages.length
  }

  const checklist = [
    checklistItem('households', '실증 대상자 등록', metrics.activeHouseholds > 0, `운영 중 대상자 ${metrics.activeHouseholds}명`),
    checklistItem('risk_groups', 'A/B 위험군 분류', metrics.groupA > 0 && metrics.groupB > 0, `A그룹 ${metrics.groupA}명 · B그룹 ${metrics.groupB}명`),
    checklistItem('consent', '개인정보 동의 상태', metrics.consentApproved > 0, `동의 완료 ${metrics.consentApproved}명 · 대기 ${metrics.consentPending}명`),
    checklistItem('incidents', '사건 처리 이력', requestsInRange.length > 0, `기간 내 사건 ${requestsInRange.length}건`),
    checklistItem('reports', '운영보고서 스냅샷', reportsInRange.length > 0, `저장된 보고서 ${reportsInRange.length}건`),
    checklistItem('providers', '도움망 네트워크', providers.length > 0, `등록 도움망 ${providers.length}명`),
    checklistItem('notifications', '알림 발송 증빙', outboxInRange.length > 0, `문자 기록 ${outboxInRange.length}건`),
    checklistItem('privacy_audit', '개인정보 열람 감사', privacyInRange.length > 0, `열람 로그 ${privacyInRange.length}건`),
    checklistItem('submission_print', '제출본 출력 경로', true, '/gov/submission/print 사용 가능')
  ]

  const readyScore = Math.round((checklist.filter((item) => item.ok).length / checklist.length) * 100)

  const summaryLines = [
    `제출 기간은 ${dateKey(range.start)}부터 ${dateKey(range.end)}까지입니다.`,
    `운영 중 대상자는 ${metrics.activeHouseholds}명이며, A그룹 ${metrics.groupA}명, B그룹 ${metrics.groupB}명입니다.`,
    `기간 내 사건은 ${metrics.requests}건, 긴급 사건은 ${metrics.urgentRequests}건, 완료 사건은 ${metrics.completedRequests}건입니다.`,
    `도움망 수락률은 ${metrics.acceptanceRate}%이며, 문자 발송 완료 ${metrics.smsSent}건, 실패 ${metrics.smsFailed}건입니다.`,
    `개인정보 열람 감사 로그 ${metrics.privacyLogs}건과 동의 기록 ${metrics.consentRecords}건을 포함합니다.`
  ]

  const householdsCsv = makeCsv(
    [
      'family_code',
      'parent_name',
      'guardian_name',
      'guardian_phone',
      'service_area',
      'risk_group',
      'risk_level',
      'household_status',
      'consent_status',
      'created_at'
    ],
    activeHouseholds.map((row) => [
      row.family_code,
      row.parent_name,
      row.guardian_name,
      row.guardian_phone,
      row.service_area,
      row.risk_group,
      row.risk_level,
      row.household_status,
      row.consent_status,
      row.created_at
    ])
  )

  const operationsCsv = makeCsv(
    ['metric', 'value'],
    Object.entries(metrics).map(([key, value]) => [key, value])
  )

  const incidentsCsv = makeCsv(
    [
      'id',
      'family_code',
      'parent_name',
      'signal_label',
      'request_type',
      'risk_level',
      'status',
      'service_area',
      'created_at',
      'completed_at'
    ],
    requestsInRange.map((row) => [
      row.id,
      row.family_code,
      row.parent_name,
      row.signal_label || requestTypeLabel(text(row.request_type)),
      row.request_type,
      row.risk_level,
      row.status,
      row.service_area,
      row.created_at,
      row.completed_at
    ])
  )

  const notificationsCsv = makeCsv(
    [
      'id',
      'family_code',
      'to_name',
      'to_phone',
      'title',
      'reason',
      'status',
      'provider',
      'created_at',
      'sent_at'
    ],
    outboxInRange.map((row) => [
      row.id,
      row.family_code,
      row.to_name,
      row.to_phone,
      row.title,
      row.reason,
      row.status,
      row.provider,
      row.created_at,
      row.sent_at
    ])
  )

  const privacyCsv = makeCsv(
    [
      'created_at',
      'actor_type',
      'actor_name',
      'family_code',
      'target_name',
      'purpose',
      'legal_basis',
      'fields_accessed',
      'route_path'
    ],
    privacyInRange.map((row) => [
      row.created_at,
      row.actor_type,
      row.actor_name,
      row.family_code,
      row.target_name,
      row.purpose,
      row.legal_basis,
      Array.isArray(row.fields_accessed) ? row.fields_accessed.join('|') : '',
      row.route_path
    ])
  )

  const consentCsv = makeCsv(
    [
      'created_at',
      'family_code',
      'subject_name',
      'consent_type',
      'consent_status',
      'consent_version',
      'collected_by',
      'evidence_note',
      'consented_at',
      'revoked_at'
    ],
    consentInRange.map((row) => [
      row.created_at,
      row.family_code,
      row.subject_name,
      row.consent_type,
      row.consent_status,
      row.consent_version,
      row.collected_by,
      row.evidence_note,
      row.consented_at,
      row.revoked_at
    ])
  )

  const checklistCsv = makeCsv(
    ['id', 'title', 'status', 'detail'],
    checklist.map((item) => [item.id, item.title, item.status, item.detail])
  )

  const summaryJson = JSON.stringify(
    {
      title: `안부웍스 지자체 제출 패키지 · ${dateKey(range.start)} ~ ${dateKey(range.end)}`,
      period: {
        key: range.period,
        start: dateKey(range.start),
        end: dateKey(range.end)
      },
      readyScore,
      summaryLines,
      metrics,
      checklist,
      generatedAt: new Date().toISOString()
    },
    null,
    2
  )

  const prefix = `anbu-submission-${dateKey(range.start)}-${dateKey(range.end)}`

  const files: FileItem[] = [
    fileItem(`${prefix}-summary.json`, '제출 요약 JSON', 'application/json', summaryJson, 1),
    fileItem(`${prefix}-households.csv`, '대상자 현황 CSV', 'text/csv', householdsCsv, activeHouseholds.length),
    fileItem(`${prefix}-operations.csv`, '운영 성과 CSV', 'text/csv', operationsCsv, Object.keys(metrics).length),
    fileItem(`${prefix}-incidents.csv`, '사건 처리 이력 CSV', 'text/csv', incidentsCsv, requestsInRange.length),
    fileItem(`${prefix}-notifications.csv`, '알림 발송 기록 CSV', 'text/csv', notificationsCsv, outboxInRange.length),
    fileItem(`${prefix}-privacy-audit.csv`, '개인정보 열람 감사 CSV', 'text/csv', privacyCsv, privacyInRange.length),
    fileItem(`${prefix}-consent-records.csv`, '동의 기록 CSV', 'text/csv', consentCsv, consentInRange.length),
    fileItem(`${prefix}-checklist.csv`, '제출 체크리스트 CSV', 'text/csv', checklistCsv, checklist.length)
  ]

  return {
    ok: true,
    title: `안부웍스 지자체 제출 패키지 · ${dateKey(range.start)} ~ ${dateKey(range.end)}`,
    period: {
      key: range.period,
      start: dateKey(range.start),
      end: dateKey(range.end)
    },
    readyScore,
    summary: summaryLines.join('\n'),
    summaryLines,
    checklist,
    metrics,
    files,
    filesManifest: files.map((file) => ({
      name: file.name,
      label: file.label,
      mime: file.mime,
      rows: file.rows
    })),
    recentPackages: packages,
    generatedAt: new Date().toISOString()
  }
}

async function savePackage(request: NextRequest) {
  const pkg = await buildPackage(request)

  if (!pkg.ok || !('period' in pkg)) {
    return {
      ...pkg,
      ok: false,
      status: (pkg as { status?: number }).status || 500,
      message: (pkg as { message?: string }).message || '제출 패키지 데이터를 만들지 못했습니다.'
    }
  }

  const readyPackage = pkg as {
    ok: true
    title: string
    period: { key: string; start: string; end: string }
    summary: string
    summaryLines: string[]
    readyScore: number
    checklist: unknown
    metrics: unknown
    filesManifest: unknown
    generatedAt: string
  }

  const result = await rest('gov_submission_packages', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        package_type: 'gov_submission',
        period_key: readyPackage.period.key,
        period_start: readyPackage.period.start,
        period_end: readyPackage.period.end,
        title: readyPackage.title,
        summary: readyPackage.summary,
        status: readyPackage.readyScore >= 80 ? 'ready' : 'need_check',
        ready_score: readyPackage.readyScore,
        checklist: readyPackage.checklist,
        metrics: readyPackage.metrics,
        files_manifest: readyPackage.filesManifest,
        payload: {
          title: readyPackage.title,
          period: readyPackage.period,
          summaryLines: readyPackage.summaryLines,
          generatedAt: readyPackage.generatedAt
        },
        created_by: '운영실'
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '제출 패키지를 저장했습니다.' : '제출 패키지 저장에 실패했습니다.',
    package: rows(result)[0],
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

  const result = await buildPackage(request)
  return NextResponse.json(result, { status: responseStatus(result) })
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

  if (action === 'savePackage') {
    const result = await savePackage(request)
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
