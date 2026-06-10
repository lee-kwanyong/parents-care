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

function role(user: Row) {
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

function kstDateKey(dateInput?: unknown) {
  const date =
    dateInput instanceof Date
      ? dateInput
      : text(dateInput)
        ? new Date(text(dateInput))
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

function groupCount(items: Row[], keyFn: (item: Row) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyFn(item) || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

function countBy<T>(items: T[], predicate: (item: T) => boolean) {
  return items.filter(predicate).length
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function staticUserSpoonSurvey() {
  return {
    source: '유저스푼 사용 경험 조사',
    respondents: 63,
    firstImpressionPositive: 33,
    firstImpressionPositiveRate: 52,
    inconvenienceReductionPositive: 29,
    inconvenienceReductionPositiveRate: 46,
    bodyStatusNeed: 31,
    emergencyNeed: 12,
    bodyAndEmergencyRate: 68,
    hospitalCompanionNeed: 31,
    visitCheckNeed: 17,
    careVisitNeed: 5,
    humanHelpNeedRate: 84,
    freeOnly: 42,
    paid19900: 11,
    paid39900: 1,
    payIntentRate: 19,
    coreFinding: '관심과 가입은 높지만, 단순 체크만으로는 유료화가 약하고 리포트·방문확인·병원동행·생활확인 연결이 핵심 가치로 확인됨'
  }
}

async function loadDashboard() {
  const today = kstDateKey()

  const [
    authResult,
    familyLinkResult,
    householdResult,
    requestResult,
    outboxResult,
    reportEventResult,
    proxyEventResult,
    noResponseRunResult,
    snapshotResult
  ] = await Promise.all([
    fetchAuthUsers(),
    rest('anbu_family_links?select=*&order=created_at.desc&limit=3000'),
    rest('ops_private_pilot_households?select=*&order=created_at.desc&limit=3000'),
    rest('care_response_requests?select=*&order=created_at.desc&limit=5000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=5000'),
    rest('guardian_report_events?select=*&order=created_at.desc&limit=3000'),
    rest('user_proxy_checkin_events?select=*&order=created_at.desc&limit=3000'),
    rest('ops_no_response_followup_runs?select=*&order=created_at.desc&limit=500'),
    rest('ops_pilot_report_snapshots?select=*&order=created_at.desc&limit=50')
  ])

  const authUsers = authResult.users
  const familyLinks = rows(familyLinkResult)
  const households = rows(householdResult)
  const requests = rows(requestResult)
  const outbox = rows(outboxResult)
  const reportEvents = rows(reportEventResult)
  const proxyEvents = rows(proxyEventResult)
  const noResponseRuns = rows(noResponseRunResult)
  const snapshots = rows(snapshotResult)

  const familyCodes = unique([
    ...familyLinks.map((item) => text(item.family_code)),
    ...households.map((item) => text(item.family_code))
  ])

  const todaySignalFamilyCodes = unique(
    requests
      .filter((item) => sameKstDay(item.created_at, today))
      .map((item) => text(item.family_code))
  )

  const roleCounts = authUsers.reduce<Record<string, number>>((acc, user) => {
    const key = role(user)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const reportLookupAttempts = reportEvents.filter((item) => text(item.event_type).includes('report_lookup'))
  const reportLookupSuccess = reportEvents.filter((item) => text(item.event_type) === 'report_lookup_success')
  const reportLookupFailed = reportEvents.filter((item) => ['report_lookup_failed', 'report_lookup_validation_failed'].includes(text(item.event_type)))
  const parentLinkCopied = reportEvents.filter((item) => text(item.event_type) === 'parent_app_link_copied')

  const metrics = {
    totalUsers: authUsers.length,
    users24h: countBy(authUsers, (item) => isWithin(item.created_at, 24)),
    confirmedUsers: countBy(authUsers, (item) => Boolean(text(item.email_confirmed_at))),
    unconfirmedUsers: countBy(authUsers, (item) => !text(item.email_confirmed_at)),
    signedInUsers: countBy(authUsers, (item) => Boolean(text(item.last_sign_in_at))),
    unknownRoleUsers: roleCounts.unknown || 0,
    guardianUsers: roleCounts.guardian || 0,
    parentUsers: roleCounts.parent || 0,
    providerUsers: roleCounts.provider || 0,
    opsUsers: roleCounts.ops || 0,

    familyLinks: familyLinks.length,
    pilotHouseholds: households.length,
    totalFamilies: familyCodes.length,

    careSignals: requests.length,
    careSignals24h: countBy(requests, (item) => isWithin(item.created_at, 24)),
    todaySignalFamilies: todaySignalFamilyCodes.length,
    noResponseFamilies: Math.max(familyCodes.length - todaySignalFamilyCodes.length, 0),
    responseRate: familyCodes.length ? Math.round((todaySignalFamilyCodes.length / familyCodes.length) * 100) : 0,
    okSignals: countBy(requests, (item) => text(item.signal_type) === 'daily_ok'),
    warningSignals: countBy(requests, (item) => ['meal_missed', 'medication_missed', 'feeling_sick', 'no_response'].includes(text(item.signal_type))),
    urgentSignals: countBy(requests, (item) => text(item.signal_type) === 'urgent_neighbor_help' || text(item.risk_level) === 'high'),

    sentMessages: countBy(outbox, (item) => text(item.status) === 'sent'),
    queuedMessages: countBy(outbox, (item) => text(item.status) === 'queued'),
    failedMessages: countBy(outbox, (item) => text(item.status) === 'failed'),
    cancelledMessages: countBy(outbox, (item) => text(item.status) === 'cancelled'),

    reportEvents: reportEvents.length,
    reportLookupAttempts: reportLookupAttempts.length,
    reportLookupSuccess: reportLookupSuccess.length,
    reportLookupFailed: reportLookupFailed.length,
    reportSuccessRate: reportLookupAttempts.length ? Math.round((reportLookupSuccess.length / reportLookupAttempts.length) * 100) : 0,
    parentLinkCopied: parentLinkCopied.length,
    uniqueReportFamilies: unique(reportLookupSuccess.map((item) => text(item.family_code))).length,

    proxyCheckins: proxyEvents.length,
    noResponseRuns: noResponseRuns.length,

    roleCounts,
    signalTypeCounts: groupCount(requests, (item) => text(item.signal_type)),
    messageStatusCounts: groupCount(outbox, (item) => text(item.status))
  }

  const funnel = {
    signupToSignin: metrics.totalUsers ? Math.round((metrics.signedInUsers / metrics.totalUsers) * 100) : 0,
    signupToFamily: metrics.totalUsers ? Math.round((metrics.totalFamilies / metrics.totalUsers) * 100) : 0,
    familyToSignal: metrics.totalFamilies ? Math.round((unique(requests.map((item) => text(item.family_code))).length / metrics.totalFamilies) * 100) : 0,
    familyToReport: metrics.totalFamilies ? Math.round((metrics.uniqueReportFamilies / metrics.totalFamilies) * 100) : 0,
    messageSuccessRate: metrics.sentMessages + metrics.failedMessages
      ? Math.round((metrics.sentMessages / (metrics.sentMessages + metrics.failedMessages)) * 100)
      : 0
  }

  const survey = staticUserSpoonSurvey()

  const recommendations = [
    {
      priority: 1,
      title: '회원가입 역할 저장 안정화',
      reason: `역할 미분류 ${metrics.unknownRoleUsers}명`,
      action: '신규 가입 시 보호자/부모님/파트너 역할을 반드시 저장하고, unknown 계정을 /ops/users에서 정리'
    },
    {
      priority: 2,
      title: '부모님 연결→안부 신호 전환 개선',
      reason: `가족→안부 신호 전환 ${funnel.familyToSignal}%`,
      action: '가입 후 3단계 온보딩, 부모님 앱 링크 복사, 미응답 문자, 대리입력을 계속 강화'
    },
    {
      priority: 3,
      title: '보호자 리포트 조회 성공률 개선',
      reason: `리포트 조회 성공률 ${metrics.reportSuccessRate}%`,
      action: '가족코드 다시 보기, 휴대폰 뒤 4자리 안내, 리포트 바로가기 문구를 더 단순화'
    },
    {
      priority: 4,
      title: '문자 실패/비용 리스크 관리',
      reason: `문자 실패 ${metrics.failedMessages}건`,
      action: '문자 안전정리센터에서 테스트/실사용 분리, 자동발송 전 대기열 확인, 실패 재시도 제한'
    },
    {
      priority: 5,
      title: '방문안부·병원동행 가치 전면화',
      reason: `유저스푼에서 병원동행 ${survey.hospitalCompanionNeed}명, 방문안부 ${survey.visitCheckNeed}명 수요`,
      action: '홈페이지와 제안서에서 단순 식사·복약 체크보다 몸 상태·방문확인·병원동행·보호자 안심 리포트 강조'
    }
  ]

  const reportMarkdown = makeReportMarkdown(metrics, funnel, survey, recommendations)

  return {
    ok: true,
    today,
    metrics,
    funnel,
    survey,
    recommendations,
    reportMarkdown,
    snapshots: snapshots.map((item) => ({
      id: text(item.id),
      title: text(item.title),
      status: text(item.status),
      reportType: text(item.report_type),
      createdBy: text(item.created_by),
      createdAt: text(item.created_at),
      createdKst: toKst(item.created_at),
      metrics: item.metrics,
      survey: item.survey,
      reportMarkdown: text(item.report_markdown)
    })),
    sourceErrors: {
      authUsers: authResult.ok ? null : authResult.error,
      familyLinks: familyLinkResult.ok ? null : familyLinkResult.error,
      households: householdResult.ok ? null : householdResult.error,
      requests: requestResult.ok ? null : requestResult.error,
      outbox: outboxResult.ok ? null : outboxResult.error,
      reportEvents: reportEventResult.ok ? null : reportEventResult.error,
      proxyEvents: proxyEventResult.ok ? null : proxyEventResult.error,
      noResponseRuns: noResponseRunResult.ok ? null : noResponseRunResult.error,
      snapshots: snapshotResult.ok ? null : snapshotResult.error
    },
    generatedAt: new Date().toISOString()
  }
}

function toKst(value: unknown) {
  const raw = text(value)
  if (!raw) return ''

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function makeReportMarkdown(metrics: Row, funnel: Row, survey: Row, recommendations: Array<Row>) {
  const lines = [
    '# 안부웍스 실증 리포트',
    '',
    `생성일: ${toKst(new Date().toISOString())}`,
    '',
    '## 1. 핵심 요약',
    '',
    `- 전체 가입자: ${metrics.totalUsers || 0}명`,
    `- 최근 24시간 가입자: ${metrics.users24h || 0}명`,
    `- 실증/가족 연결 가구: ${metrics.totalFamilies || 0}가구`,
    `- 누적 안부 신호: ${metrics.careSignals || 0}건`,
    `- 오늘 응답 가구: ${metrics.todaySignalFamilies || 0}가구`,
    `- 오늘 미응답 가구: ${metrics.noResponseFamilies || 0}가구`,
    `- 문자 발송 성공: ${metrics.sentMessages || 0}건`,
    `- 문자 실패: ${metrics.failedMessages || 0}건`,
    `- 보호자 리포트 조회 성공률: ${metrics.reportSuccessRate || 0}%`,
    `- 대리입력 기록: ${metrics.proxyCheckins || 0}건`,
    '',
    '## 2. 전환 퍼널',
    '',
    `- 가입 → 로그인: ${funnel.signupToSignin || 0}%`,
    `- 가입 → 가족 연결: ${funnel.signupToFamily || 0}%`,
    `- 가족 연결 → 안부 신호: ${funnel.familyToSignal || 0}%`,
    `- 가족 연결 → 리포트 조회: ${funnel.familyToReport || 0}%`,
    `- 문자 성공률: ${funnel.messageSuccessRate || 0}%`,
    '',
    '## 3. 유저스푼 사용 경험 조사 요약',
    '',
    `- 응답자: ${survey.respondents || 0}명`,
    `- 첫인상 긍정: ${survey.firstImpressionPositive || 0}명, ${survey.firstImpressionPositiveRate || 0}%`,
    `- 안부확인 불편 감소 긍정: ${survey.inconvenienceReductionPositive || 0}명, ${survey.inconvenienceReductionPositiveRate || 0}%`,
    `- 몸 상태/응급 여부 필요: 약 ${survey.bodyAndEmergencyRate || 0}%`,
    `- 병원동행 필요: ${survey.hospitalCompanionNeed || 0}명`,
    `- 방문안부 확인 필요: ${survey.visitCheckNeed || 0}명`,
    `- 유료 결제 의향: ${survey.payIntentRate || 0}%`,
    '',
    `핵심 해석: ${survey.coreFinding || ''}`,
    '',
    '## 4. 제품 개선 우선순위',
    '',
    ...recommendations.flatMap((item) => [
      `### ${item.priority}. ${item.title}`,
      `- 사유: ${item.reason}`,
      `- 조치: ${item.action}`,
      ''
    ]),
    '## 5. 외부 제안용 한 문장',
    '',
    '안부웍스는 고령 부모님의 안부 신호를 보호자 알림, 미응답 확인, 대리입력, 생활확인 파트너 연결, 리포트로 전환하는 비의료 생활확인 기반의 고령자 안심관리 플랫폼입니다.',
    '',
    '## 6. 다음 실증 목표',
    '',
    '- 보호자 리포트 조회 성공률 80% 이상',
    '- 가족 연결 → 안부 신호 전환율 50% 이상',
    '- 문자 실패율 5% 이하',
    '- 미응답 가구 보호자 확인 문자 생성률 90% 이상',
    '- 보호자 대리입력 또는 운영실 대리입력 사용 사례 확보'
  ]

  return lines.join('\n')
}

async function saveSnapshot(body: Row) {
  const createdBy = text(body.createdBy) || '운영실'
  const dashboard = await loadDashboard()

  if (!dashboard.ok) return dashboard

  const result = await insertRows('ops_pilot_report_snapshots', [
    {
      title: text(body.title) || '안부웍스 실증 리포트',
      report_type: 'pilot_report',
      status: 'saved',
      metrics: dashboard.metrics,
      survey: dashboard.survey,
      recommendations: dashboard.recommendations,
      report_markdown: dashboard.reportMarkdown,
      payload: {
        funnel: dashboard.funnel,
        today: dashboard.today,
        source: 'ops-pilot-report'
      },
      created_by: createdBy
    }
  ])

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '실증 리포트 스냅샷 저장에 실패했습니다.',
      detail: result.error
    }
  }

  return {
    ok: true,
    message: '실증 리포트 스냅샷을 저장했습니다.',
    snapshot: rows(result)[0]
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

  if (action === 'saveSnapshot') result = await saveSnapshot(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
