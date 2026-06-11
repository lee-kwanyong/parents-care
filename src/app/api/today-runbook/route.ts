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

async function fetchJson(url: string, init?: RequestInit): Promise<RestResult> {
  const response = await fetch(url, {
    ...init,
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

  return fetchJson(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })
}

async function authAdmin(path: string, init?: RequestInit): Promise<RestResult> {
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

  return fetchJson(base + '/auth/v1/admin/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })
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

async function fetchAuthUsers() {
  const all: Row[] = []
  const perPage = 1000

  for (let page = 1; page <= 5; page += 1) {
    const result = await authAdmin('users?page=' + page + '&per_page=' + perPage)

    if (!result.ok) {
      return {
        ok: false,
        users: all,
        error: result.error
      }
    }

    const data = result.data as Row
    const users = Array.isArray(data?.users) ? data.users as Row[] : Array.isArray(result.data) ? result.data as Row[] : []

    all.push(...users)

    if (users.length < perPage) break
  }

  return {
    ok: true,
    users: all,
    error: null
  }
}

function meta(user: Row) {
  const raw = user.raw_user_meta_data || user.user_metadata
  return raw && typeof raw === 'object' ? raw as Row : {}
}

function userRole(user: Row) {
  const m = meta(user)
  const raw =
    text(m.role) ||
    text(m.userType) ||
    text(m.accountType) ||
    text(m.type) ||
    text(m.anbuRole)

  const normalized = raw.toLowerCase()

  if (['child', 'guardian', 'protector'].includes(normalized)) return 'guardian'
  if (['parent', 'senior', 'elder'].includes(normalized)) return 'parent'
  if (['provider', 'caregiver', 'care_worker', 'care-worker', 'helper'].includes(normalized)) return 'provider'
  if (['ops', 'admin', 'operator'].includes(normalized)) return 'ops'

  return 'unknown'
}

function dateValue(value: unknown) {
  const raw = text(value)
  if (!raw) return null

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null

  return date
}

function isWithin(value: unknown, hours: number) {
  const date = dateValue(value)
  if (!date) return false

  return Date.now() - date.getTime() <= hours * 60 * 60 * 1000
}

function kstDateKey(value?: unknown) {
  const date =
    value instanceof Date
      ? value
      : text(value)
        ? new Date(text(value))
        : new Date()

  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

function sameKstDay(value: unknown, dayKey: string) {
  const raw = text(value)
  if (!raw) return false
  return kstDateKey(raw) === dayKey
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

function countBy<T>(items: T[], predicate: (item: T) => boolean) {
  return items.filter(predicate).length
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function normalizeRun(row: Row) {
  return {
    id: text(row.id),
    runDate: text(row.run_date),
    action: text(row.action),
    stepKey: text(row.step_key),
    stepTitle: text(row.step_title),
    status: text(row.status),
    note: text(row.note),
    createdBy: text(row.created_by),
    createdAt: text(row.created_at),
    createdKst: toKst(row.created_at)
  }
}

function latestStepStatus(runs: Row[]) {
  const map = new Map<string, ReturnType<typeof normalizeRun>>()

  for (const row of runs) {
    const key = text(row.step_key)
    if (!key) continue
    if (!map.has(key)) map.set(key, normalizeRun(row))
  }

  return map
}

async function loadDashboard() {
  const today = kstDateKey()

  const [
    authResult,
    householdResult,
    familyLinkResult,
    requestResult,
    outboxResult,
    reportEventResult,
    consentResult,
    smsSettingResult,
    pilotReportSnapshotResult,
    runResult
  ] = await Promise.all([
    fetchAuthUsers(),
    rest('ops_private_pilot_households?select=*&order=created_at.desc&limit=2000'),
    rest('anbu_family_links?select=*&order=created_at.desc&limit=2000'),
    rest('care_response_requests?select=*&order=created_at.desc&limit=5000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=5000'),
    rest('guardian_report_events?select=*&order=created_at.desc&limit=3000'),
    rest('pilot_consent_records?select=*&order=created_at.desc&limit=3000'),
    rest('ops_sms_budget_guard_settings?select=*&order=created_at.desc&limit=1'),
    rest('ops_pilot_report_snapshots?select=*&order=created_at.desc&limit=50'),
    rest('ops_daily_runbook_runs?select=*&run_date=eq.' + encodeURIComponent(today) + '&order=created_at.desc&limit=200')
  ])

  const users = authResult.users
  const households = rows(householdResult)
  const familyLinks = rows(familyLinkResult)
  const requests = rows(requestResult)
  const outbox = rows(outboxResult)
  const reportEvents = rows(reportEventResult)
  const consents = rows(consentResult)
  const smsSetting = rows(smsSettingResult)[0] || {}
  const pilotReports = rows(pilotReportSnapshotResult)
  const runs = rows(runResult)

  const familyCodes = unique([
    ...households.map((item) => text(item.family_code)),
    ...familyLinks.map((item) => text(item.family_code))
  ])

  const todayRequests = requests.filter((item) => sameKstDay(item.created_at, today))
  const todaySignalFamilyCodes = unique(todayRequests.map((item) => text(item.family_code)))
  const todayOutbox = outbox.filter((item) => sameKstDay(item.created_at, today) || sameKstDay(item.sent_at, today))
  const todayReportEvents = reportEvents.filter((item) => sameKstDay(item.created_at, today))
  const todayConsents = consents.filter((item) => sameKstDay(item.created_at, today))

  const roleCounts = users.reduce<Record<string, number>>((acc, user) => {
    const role = userRole(user)
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})

  const metrics = {
    today,
    totalUsers: users.length,
    users24h: countBy(users, (item) => isWithin(item.created_at, 24)),
    confirmedUsers: countBy(users, (item) => Boolean(text(item.email_confirmed_at))),
    signedInUsers: countBy(users, (item) => Boolean(text(item.last_sign_in_at))),
    unknownRoleUsers: roleCounts.unknown || 0,
    guardianUsers: roleCounts.guardian || 0,
    parentUsers: roleCounts.parent || 0,
    providerUsers: roleCounts.provider || 0,
    opsUsers: roleCounts.ops || 0,

    pilotHouseholds: households.length,
    familyLinks: familyLinks.length,
    totalFamilies: familyCodes.length,

    consentRecords: consents.length,
    todayConsentRecords: todayConsents.length,

    careSignals: requests.length,
    todayCareSignals: todayRequests.length,
    todaySignalFamilies: todaySignalFamilyCodes.length,
    todayNoResponseFamilies: Math.max(familyCodes.length - todaySignalFamilyCodes.length, 0),
    urgentSignals: countBy(requests, (item) => text(item.signal_type) === 'urgent_neighbor_help' || text(item.risk_level) === 'high'),

    queuedMessages: countBy(outbox, (item) => text(item.status) === 'queued'),
    sentTodayMessages: countBy(todayOutbox, (item) => text(item.status) === 'sent'),
    failedTodayMessages: countBy(todayOutbox, (item) => text(item.status) === 'failed'),
    failedMessages: countBy(outbox, (item) => text(item.status) === 'failed'),

    reportEvents: reportEvents.length,
    todayReportEvents: todayReportEvents.length,
    todayReportSuccess: countBy(todayReportEvents, (item) => text(item.event_type) === 'report_lookup_success'),
    todayReportFailed: countBy(todayReportEvents, (item) => ['report_lookup_failed', 'report_lookup_validation_failed'].includes(text(item.event_type))),
    parentLinkCopied: countBy(reportEvents, (item) => text(item.event_type) === 'parent_app_link_copied'),

    smsTestMode: bool(smsSetting.test_mode),
    smsAutoAllowed: bool(smsSetting.auto_dispatch_allowed),
    smsDailyLimit: Number(smsSetting.daily_limit || 30),
    smsPointBudget: Number(smsSetting.point_budget || 500),

    pilotReportSnapshots: pilotReports.length,
    todayPilotReportSnapshots: countBy(pilotReports, (item) => sameKstDay(item.created_at, today))
  }

  const stepMap = latestStepStatus(runs)

  const baseChecklist = [
    {
      key: 'billing_deploy',
      title: '배포·청구 상태 확인',
      desc: 'Vercel 배포 Ready, Supabase 청구 경고, 문자 포인트를 확인합니다.',
      href: '/portal/ops',
      autoStatus: 'manual',
      reason: '외부 콘솔 확인 필요'
    },
    {
      key: 'consent',
      title: '실증 동의 기록 확인',
      desc: '참여자에게 /consent 링크를 보내고 동의 기록이 쌓였는지 확인합니다.',
      href: '/ops/consent-risk-center',
      autoStatus: metrics.consentRecords > 0 ? 'pass' : 'warning',
      reason: `${metrics.consentRecords}건`
    },
    {
      key: 'role_cleanup',
      title: '역할 미분류 정리',
      desc: 'unknown 계정을 보호자/부모님/파트너로 정리합니다.',
      href: '/ops/users',
      autoStatus: metrics.unknownRoleUsers === 0 ? 'pass' : 'warning',
      reason: `unknown ${metrics.unknownRoleUsers}명`
    },
    {
      key: 'pilot_household',
      title: '오늘 테스트 가구 확인',
      desc: '실증 가구와 부모님 앱 링크가 생성되어 있는지 확인합니다.',
      href: '/ops/private-pilot',
      autoStatus: metrics.totalFamilies > 0 ? 'pass' : 'warning',
      reason: `${metrics.totalFamilies}가구`
    },
    {
      key: 'parent_signal',
      title: '부모님 앱 안부 신호 1건 확인',
      desc: '괜찮아요 버튼을 눌러 오늘 안부 신호가 기록되는지 확인합니다.',
      href: '/mobile/parent',
      autoStatus: metrics.todayCareSignals > 0 ? 'pass' : 'warning',
      reason: `오늘 ${metrics.todayCareSignals}건`
    },
    {
      key: 'guardian_report',
      title: '보호자 리포트 조회 확인',
      desc: '가족코드와 휴대폰 뒤 4자리로 오늘 리포트가 열리는지 확인합니다.',
      href: '/guardian/today',
      autoStatus: metrics.todayReportSuccess > 0 ? 'pass' : 'warning',
      reason: `오늘 성공 ${metrics.todayReportSuccess}건`
    },
    {
      key: 'no_response',
      title: '미응답 가구 확인',
      desc: '오늘 안부 신호가 없는 가구를 확인하고 보호자 문자 또는 대리입력을 유도합니다.',
      href: '/ops/no-response',
      autoStatus: metrics.todayNoResponseFamilies === 0 ? 'pass' : 'warning',
      reason: `미응답 ${metrics.todayNoResponseFamilies}가구`
    },
    {
      key: 'sms_guard',
      title: '문자 비용 보호 확인',
      desc: '테스트 번호 모드, 자동발송 OFF/ON, 하루 한도, 위험 대기열을 확인합니다.',
      href: '/ops/sms-budget-guard',
      autoStatus: metrics.smsTestMode && !metrics.smsAutoAllowed ? 'pass' : 'warning',
      reason: `테스트모드 ${metrics.smsTestMode ? 'ON' : 'OFF'} · 자동발송 ${metrics.smsAutoAllowed ? 'ON' : 'OFF'}`
    },
    {
      key: 'message_queue',
      title: '문자 대기·실패 정리',
      desc: '대기열 수신번호와 문구를 확인하고, 실패 문자는 안전정리센터에서 정리합니다.',
      href: '/ops/notification-safety',
      autoStatus: metrics.failedMessages === 0 ? 'pass' : 'warning',
      reason: `대기 ${metrics.queuedMessages}건 · 실패 ${metrics.failedMessages}건`
    },
    {
      key: 'pilot_report',
      title: '실증 리포트 스냅샷 저장',
      desc: '오늘 실증 상태를 외부 미팅용 리포트로 저장합니다.',
      href: '/ops/pilot-report',
      autoStatus: metrics.todayPilotReportSnapshots > 0 ? 'pass' : 'manual',
      reason: `오늘 저장 ${metrics.todayPilotReportSnapshots}건`
    }
  ]

  const checklist = baseChecklist.map((item) => {
    const manual = stepMap.get(item.key)

    return {
      ...item,
      manualStatus: manual?.status || '',
      manualNote: manual?.note || '',
      manualBy: manual?.createdBy || '',
      manualKst: manual?.createdKst || '',
      finalStatus: manual?.status || item.autoStatus
    }
  })

  const summary = {
    pass: checklist.filter((item) => item.finalStatus === 'pass' || item.finalStatus === 'completed' || item.finalStatus === 'ok').length,
    warning: checklist.filter((item) => item.finalStatus === 'warning').length,
    manual: checklist.filter((item) => item.finalStatus === 'manual').length,
    total: checklist.length
  }

  return {
    ok: true,
    today,
    metrics,
    summary,
    checklist,
    runs: runs.map(normalizeRun),
    recentSignals: requests.slice(0, 20).map((item) => ({
      id: text(item.id),
      familyCode: text(item.family_code),
      parentName: text(item.parent_name),
      signalLabel: text(item.signal_label) || text(item.signal_type),
      riskLevel: text(item.risk_level),
      status: text(item.status),
      createdKst: toKst(item.created_at)
    })),
    recentMessages: outbox.slice(0, 20).map((item) => ({
      id: text(item.id),
      familyCode: text(item.family_code),
      toName: text(item.to_name),
      toPhone: phone(item.to_phone),
      title: text(item.title),
      status: text(item.status),
      provider: text(item.provider),
      createdKst: toKst(item.created_at)
    })),
    sourceErrors: {
      authUsers: authResult.ok ? null : authResult.error,
      households: householdResult.ok ? null : householdResult.error,
      familyLinks: familyLinkResult.ok ? null : familyLinkResult.error,
      requests: requestResult.ok ? null : requestResult.error,
      outbox: outboxResult.ok ? null : outboxResult.error,
      reportEvents: reportEventResult.ok ? null : reportEventResult.error,
      consents: consentResult.ok ? null : consentResult.error,
      smsSetting: smsSettingResult.ok ? null : smsSettingResult.error,
      pilotReports: pilotReportSnapshotResult.ok ? null : pilotReportSnapshotResult.error,
      runs: runResult.ok ? null : runResult.error
    }
  }
}

async function markStep(body: Row) {
  const today = kstDateKey()
  const stepKey = text(body.stepKey)
  const stepTitle = text(body.stepTitle)
  const status = text(body.status) || 'completed'

  if (!stepKey) {
    return {
      ok: false,
      status: 400,
      message: 'stepKey가 필요합니다.'
    }
  }

  const result = await insertRows('ops_daily_runbook_runs', [
    {
      run_date: today,
      action: 'mark_step',
      step_key: stepKey,
      step_title: stepTitle,
      status,
      note: text(body.note),
      metrics: body.metrics && typeof body.metrics === 'object' ? body.metrics : {},
      payload: {
        source: 'today-runbook',
        markedAt: new Date().toISOString()
      },
      created_by: text(body.createdBy) || '운영실'
    }
  ])

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '체크리스트 기록 저장에 실패했습니다.',
      detail: result.error
    }
  }

  return {
    ok: true,
    message: '오늘 할 일 기록을 저장했습니다.',
    run: rows(result)[0]
  }
}

async function saveDailySummary(body: Row) {
  const dashboard = await loadDashboard()
  const today = kstDateKey()

  if (!dashboard.ok) return dashboard

  const result = await insertRows('ops_daily_runbook_runs', [
    {
      run_date: today,
      action: 'daily_summary',
      step_key: 'daily_summary',
      step_title: '오늘 실증 운영 요약 저장',
      status: dashboard.summary.warning > 0 ? 'warning' : 'ok',
      note: text(body.note) || '오늘 실증 운영 요약을 저장했습니다.',
      metrics: dashboard.metrics,
      checklist: dashboard.checklist,
      payload: {
        summary: dashboard.summary,
        savedAt: new Date().toISOString()
      },
      created_by: text(body.createdBy) || '운영실'
    }
  ])

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '오늘 운영 요약 저장에 실패했습니다.',
      detail: result.error
    }
  }

  return {
    ok: true,
    message: '오늘 실증 운영 요약을 저장했습니다.',
    run: rows(result)[0]
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

  if (action === 'markStep') result = await markStep(body)
  else if (action === 'saveDailySummary') result = await saveDailySummary(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
