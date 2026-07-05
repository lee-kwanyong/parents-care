import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Tone = 'safe' | 'watch' | 'danger' | 'neutral'

type CountResult = {
  ok: boolean
  count: number
  error?: string
}

type Row = Record<string, unknown>

type RunbookTask = {
  id: string
  group: string
  title: string
  desc: string
  tone: Tone
  countLabel: string
  href: string
  primaryAction: string
  owner: string
  due: string
  detail?: string
}

const ADMIN_SESSION_VALUE = 'anbu-admin-ok-v1'
const ADMIN_CODE = '530868'

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'ops_session_token',
  'OPS_SESSION_TOKEN',
  'ops_session'
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || process.env.OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
}

function canonicalOpsCode() {
  return (
    text(process.env.ANBU_OPS_PASSWORD) ||
    text(process.env.OPS_PASSWORD) ||
    text(process.env.ADMIN_CODE) ||
    ADMIN_CODE
  )
}

function tokenFor(code: string) {
  return createHash('sha256').update(code + ':' + authSecret()).digest('hex')
}

function isAdminAuthed(request: NextRequest) {
  const adminCookie = request.cookies.get('anbu_admin_code_ok')?.value || ''
  const opsCookies = OPS_COOKIE_NAMES.map((name) => request.cookies.get(name)?.value || '').filter(Boolean)
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')
  const secrets = [
    process.env.CRON_SECRET || '',
    process.env.OPS_AUTOPILOT_SECRET || '',
    process.env.RESPONSE_ESCALATION_SECRET || ''
  ].filter(Boolean)

  return (
    adminCookie === ADMIN_SESSION_VALUE ||
    adminCookie === tokenFor(ADMIN_CODE) ||
    opsCookies.includes(tokenFor(canonicalOpsCode())) ||
    secrets.includes(auth)
  )
}

function supabaseBaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function restBaseUrl() {
  const base = supabaseBaseUrl()
  return base ? `${base}/rest/v1` : ''
}

function parseCount(contentRange: string | null) {
  if (!contentRange) return 0
  const total = contentRange.split('/').pop()
  const parsed = Number(total)
  return Number.isFinite(parsed) ? parsed : 0
}

async function restCount(table: string, params: Record<string, string> = {}): Promise<CountResult> {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      count: 0,
      error: 'Supabase service role 또는 URL이 설정되지 않았습니다.'
    }
  }

  const search = new URLSearchParams({
    select: 'id',
    ...params
  })

  try {
    const response = await fetch(`${base}/${table}?${search.toString()}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'count=exact',
        Range: '0-0'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      return {
        ok: false,
        count: 0,
        error: `${table}: ${response.status} ${body.slice(0, 180)}`
      }
    }

    return {
      ok: true,
      count: parseCount(response.headers.get('content-range'))
    }
  } catch (error) {
    return {
      ok: false,
      count: 0,
      error: `${table}: ${error instanceof Error ? error.message : 'count failed'}`
    }
  }
}

async function restRows(table: string, query: string): Promise<{ ok: boolean; rows: Row[]; error?: string }> {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [],
      error: 'Supabase service role 또는 URL이 설정되지 않았습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/${table}?${query}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = []

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      parsed = []
    }

    if (!response.ok) {
      return {
        ok: false,
        rows: [],
        error: `${table}: ${response.status} ${raw.slice(0, 180)}`
      }
    }

    return {
      ok: true,
      rows: Array.isArray(parsed) ? parsed as Row[] : []
    }
  } catch (error) {
    return {
      ok: false,
      rows: [],
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

async function authUsersSummary() {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      totalUsers: 0,
      users24h: 0,
      confirmedUsers: 0,
      unconfirmedUsers: 0,
      signedInUsers: 0,
      error: 'Supabase service role 또는 URL이 설정되지 않았습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/auth/v1/admin/users?page=1&per_page=1000`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      },
      cache: 'no-store'
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok || !Array.isArray(data.users)) {
      return {
        ok: false,
        totalUsers: 0,
        users24h: 0,
        confirmedUsers: 0,
        unconfirmedUsers: 0,
        signedInUsers: 0,
        error: `auth.users: ${response.status}`
      }
    }

    const since24h = Date.now() - 24 * 60 * 60 * 1000
    const users = data.users as Row[]
    const confirmedUsers = users.filter((user) => Boolean(user.email_confirmed_at || user.confirmed_at)).length

    return {
      ok: true,
      totalUsers: users.length,
      users24h: users.filter((user) => {
        const createdAt = Date.parse(text(user.created_at))
        return Number.isFinite(createdAt) && createdAt >= since24h
      }).length,
      confirmedUsers,
      unconfirmedUsers: Math.max(0, users.length - confirmedUsers),
      signedInUsers: users.filter((user) => Boolean(user.last_sign_in_at)).length
    }
  } catch (error) {
    return {
      ok: false,
      totalUsers: 0,
      users24h: 0,
      confirmedUsers: 0,
      unconfirmedUsers: 0,
      signedInUsers: 0,
      error: `auth.users: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

function kstToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function kstNowLabel() {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date())
}

function kstTodayStartUtcIso() {
  const [year, month, day] = kstToday().split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, -9, 0, 0)).toISOString()
}

function task(
  id: string,
  group: string,
  title: string,
  desc: string,
  tone: Tone,
  countLabel: string,
  href: string,
  primaryAction: string,
  owner = '운영실',
  due = '오늘'
): RunbookTask {
  return {
    id,
    group,
    title,
    desc,
    tone,
    countLabel,
    href,
    primaryAction,
    owner,
    due
  }
}

function toneByRisk(count: number, watchAt = 1, dangerAt = 3): Tone {
  if (count >= dangerAt) return 'danger'
  if (count >= watchAt) return 'watch'
  return 'safe'
}

function count(result: CountResult) {
  return result.ok ? result.count : 0
}

async function insertRunbookLog(payload: Row) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      error: 'Supabase service role 또는 URL이 설정되지 않았습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/ops_runbook_logs`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    })

    if (!response.ok) {
      const raw = await response.text().catch(() => '')
      return {
        ok: false,
        error: raw.slice(0, 220)
      }
    }

    return {
      ok: true
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'insert failed'
    }
  }
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Admin 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const todayStart = kstTodayStartUtcIso()
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const sourceErrors: string[] = []

  const [
    authSummary,

    familyTotal,
    familyPendingJoin,
    familyVerified,

    careToday,
    careHigh,
    careManualNeeded,
    careUrgent,

    messageQueued,
    messageFailed,
    messageFailed24h,

    ringToday,
    ringCheckNeeded,
    ringWatch,
    ringLowQuality,

    latestLogs
  ] = await Promise.all([
    authUsersSummary(),

    restCount('anbu_family_links'),
    restCount('anbu_family_links', { parent_joined_at: 'is.null' }),
    restCount('anbu_family_links', { parent_verified_at: 'not.is.null' }),

    restCount('care_response_requests', { created_at: `gte.${todayStart}` }),
    restCount('care_response_requests', { risk_level: 'eq.high' }),
    restCount('care_response_requests', { status: 'eq.manual_needed' }),
    restCount('care_response_requests', { signal_type: 'eq.urgent_neighbor_help' }),

    restCount('notification_outbox', { status: 'eq.queued' }),
    restCount('notification_outbox', { status: 'eq.failed' }),
    restCount('notification_outbox', { status: 'eq.failed', created_at: `gte.${since24h}` }),

    restCount('ring_daily_reports', { created_at: `gte.${todayStart}` }),
    restCount('ring_daily_reports', { overall_status: 'eq.check_needed' }),
    restCount('ring_daily_reports', { overall_status: 'eq.watch' }),
    restCount('ring_daily_reports', { data_quality_score: 'lt.45' }),

    restRows(
      'ops_runbook_logs',
      `select=id,run_date,task_id,task_title,task_group,checked,note,created_at&run_date=eq.${kstToday()}&order=created_at.desc&limit=100`
    )
  ])

  for (const result of [
    familyTotal,
    familyPendingJoin,
    familyVerified,
    careToday,
    careHigh,
    careManualNeeded,
    careUrgent,
    messageQueued,
    messageFailed,
    messageFailed24h,
    ringToday,
    ringCheckNeeded,
    ringWatch,
    ringLowQuality
  ]) {
    if (!result.ok && result.error) sourceErrors.push(result.error)
  }

  if (!authSummary.ok && authSummary.error) sourceErrors.push(authSummary.error)
  if (!latestLogs.ok && latestLogs.error) sourceErrors.push(latestLogs.error)

  const careRisk = count(careHigh) + count(careManualNeeded) + count(careUrgent)
  const messageRisk = count(messageQueued) + count(messageFailed)
  const ringRisk = count(ringCheckNeeded) + count(ringLowQuality)

  const tasks: RunbookTask[] = [
    task(
      'users-check',
      '가입·연결',
      '오늘 가입자와 이메일 인증을 확인합니다.',
      '신규 가입자, 이메일 미인증, 로그인 이력이 없는 사용자를 확인합니다.',
      authSummary.unconfirmedUsers > 0 ? 'watch' : 'safe',
      `신규 ${authSummary.users24h}명 · 미인증 ${authSummary.unconfirmedUsers}명`,
      '/admin/ops/users',
      '가입자 보기'
    ),
    task(
      'family-link-check',
      '가입·연결',
      '보호자-부모님 연결 상태를 확인합니다.',
      '가족코드만 생성되고 부모님 연결이 끝나지 않은 가구를 먼저 처리합니다.',
      count(familyPendingJoin) > 0 ? 'watch' : count(familyTotal) > 0 ? 'safe' : 'neutral',
      `전체 ${count(familyTotal)}건 · 연결대기 ${count(familyPendingJoin)}건`,
      '/admin/ops/private-pilot',
      '실증 가구 보기'
    ),
    task(
      'care-signal-check',
      '안부 신호',
      '오늘 안부 신호를 확인합니다.',
      '오늘 들어온 식사, 복약, 몸 상태, 도움 요청 신호를 전체적으로 확인합니다.',
      count(careToday) > 0 ? 'safe' : 'neutral',
      `오늘 ${count(careToday)}건`,
      '/admin/ops/today-runbook',
      '신호 확인'
    ),
    task(
      'care-risk-call',
      '안부 신호',
      '확인필요 가구는 전화 확인합니다.',
      '고위험, 긴급 도움 요청, 수동확인 필요 건은 체크 완료 전에 전화 또는 가족 확인 기록을 남깁니다.',
      toneByRisk(careRisk, 1, 2),
      `확인필요 ${careRisk}건`,
      '/admin/ops/no-response',
      '확인필요 보기',
      '운영실',
      '즉시'
    ),
    task(
      'message-dispatch-check',
      '문자·알림',
      '문자 대기와 실패 건을 재처리합니다.',
      '문자/알림 대기열과 실패 건을 확인하고 필요한 경우 재발송 또는 수동 안내합니다.',
      toneByRisk(messageRisk, 1, 3),
      `대기 ${count(messageQueued)}건 · 실패 ${count(messageFailed)}건`,
      '/admin/ops/notification-dispatch',
      '발송센터'
    ),
    task(
      'message-cost-check',
      '문자·알림',
      '문자 비용과 자동발송 상태를 확인합니다.',
      '자동문자 ON/OFF, 과발송 방지, 실패 증가 여부를 확인합니다.',
      count(messageFailed24h) > 0 ? 'watch' : 'safe',
      `24시간 실패 ${count(messageFailed24h)}건`,
      '/admin/ops/sms-budget-guard',
      '비용 보호'
    ),
    task(
      'ring-report-check',
      '안부리포트',
      '안부완료 리포트 생성과 상태를 확인합니다.',
      '오늘 생성된 고객센터, 확인필요, 주의 상태를 확인합니다.',
      ringRisk > 0 ? 'watch' : count(ringToday) > 0 ? 'safe' : 'neutral',
      `오늘 ${count(ringToday)}건 · 확인필요 ${count(ringCheckNeeded)}건`,
      '/admin/ops/ring-csv-import',
      '고객센터 보기'
    ),
    task(
      'ring-quality-check',
      '안부리포트',
      '안부리포트 데이터 품질을 확인합니다.',
      '착용 시간 부족, 데이터 품질 부족, 배터리 이슈가 있는 가구를 분리합니다.',
      count(ringLowQuality) > 0 ? 'watch' : 'safe',
      `품질부족 ${count(ringLowQuality)}건 · 주의 ${count(ringWatch)}건`,
      '/admin/ops/ring-report-lab',
      '리포트 실험실'
    ),
    task(
      'gov-rnd-followup',
      '지자체·R&D',
      '지자체·R&D 후속 액션을 정리합니다.',
      '미팅, 제안서, 안부리포트 업체, 실증 협력기관 후속 연락을 정리합니다.',
      'neutral',
      '후속 메모 필요',
      '/admin/ops/gov-rnd',
      'R&D 관리'
    ),
    task(
      'day-close',
      '마감',
      '오늘 운영 메모를 남기고 마감합니다.',
      '처리한 건, 전화 확인, 미처리 건, 내일 이어갈 일을 메모합니다.',
      sourceErrors.length > 0 ? 'watch' : 'neutral',
      sourceErrors.length > 0 ? `점검필요 ${sourceErrors.length}건` : '마감 대기',
      '/admin/ops/preflight-test',
      '시스템 점검',
      '운영실',
      '마감 전'
    )
  ]

  return NextResponse.json({
    ok: true,
    runDate: kstToday(),
    generatedKst: kstNowLabel(),
    tasks,
    summary: {
      totalTasks: tasks.length,
      dangerTasks: tasks.filter((item) => item.tone === 'danger').length,
      watchTasks: tasks.filter((item) => item.tone === 'watch').length,
      safeTasks: tasks.filter((item) => item.tone === 'safe').length,
      careRisk,
      messageRisk,
      ringRisk
    },
    latestLogs: latestLogs.ok ? latestLogs.rows : [],
    sourceErrors: sourceErrors.slice(0, 20)
  })
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Admin 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action !== 'log') {
    return NextResponse.json(
      {
        ok: false,
        message: '알 수 없는 action입니다.'
      },
      { status: 400 }
    )
  }

  const result = await insertRunbookLog({
    run_date: text(body.runDate) || kstToday(),
    task_id: text(body.taskId),
    task_title: text(body.taskTitle),
    task_group: text(body.taskGroup),
    checked: Boolean(body.checked),
    note: text(body.note),
    payload: body.payload || {},
    created_by: text(body.createdBy) || '운영실'
  })

  return NextResponse.json({
    ok: true,
    persisted: result.ok,
    warning: result.ok ? null : result.error || '운영 로그 테이블이 없어 브라우저 저장만 사용합니다.'
  })
}
