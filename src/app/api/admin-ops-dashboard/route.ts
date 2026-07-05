import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type CountResult = {
  ok: boolean
  count: number
  error?: string
}

type Row = Record<string, unknown>

type Metric = {
  key: string
  label: string
  value: number | string
  caption: string
  tone: 'safe' | 'watch' | 'danger' | 'neutral'
  href?: string
}

const ADMIN_SESSION_VALUE = 'anbu-admin-ok-v1'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function isAdminAuthed(request: NextRequest) {
  const cookie = request.cookies.get('anbu_admin_code_ok')?.value || ''
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')
  const secrets = [
    process.env.CRON_SECRET || '',
    process.env.OPS_AUTOPILOT_SECRET || '',
    process.env.RESPONSE_ESCALATION_SECRET || ''
  ].filter(Boolean)

  return cookie === ADMIN_SESSION_VALUE || secrets.includes(auth)
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
        signedInUsers: 0,
        error: `auth.users: ${response.status}`
      }
    }

    const since24h = Date.now() - 24 * 60 * 60 * 1000
    const users = data.users as Row[]

    return {
      ok: true,
      totalUsers: users.length,
      users24h: users.filter((user) => {
        const createdAt = Date.parse(text(user.created_at))
        return Number.isFinite(createdAt) && createdAt >= since24h
      }).length,
      confirmedUsers: users.filter((user) => Boolean(user.email_confirmed_at || user.confirmed_at)).length,
      signedInUsers: users.filter((user) => Boolean(user.last_sign_in_at)).length
    }
  } catch (error) {
    return {
      ok: false,
      totalUsers: 0,
      users24h: 0,
      confirmedUsers: 0,
      signedInUsers: 0,
      error: `auth.users: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

function kstTodayStartUtcIso() {
  const kstDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())

  const [year, month, day] = kstDate.split('-').map(Number)

  return new Date(Date.UTC(year, month - 1, day, -9, 0, 0)).toISOString()
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

function maskName(value: unknown) {
  const name = text(value)

  if (!name) return ''
  if (name.length === 1) return name
  if (name.length === 2) return `${name[0]}*`

  return `${name[0]}*${name[name.length - 1]}`
}

function maskPhone(value: unknown) {
  const digits = text(value).replace(/[^\d]/g, '')

  if (digits.length < 4) return ''

  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
  }

  return `****-${digits.slice(-4)}`
}

function countValue(result: CountResult) {
  return result.ok ? result.count : 0
}

function metric(
  key: string,
  label: string,
  value: number | string,
  caption: string,
  tone: Metric['tone'],
  href?: string
): Metric {
  return {
    key,
    label,
    value,
    caption,
    tone,
    href
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

    familiesTotal,
    familiesJoined,

    careTotal,
    careToday,
    careHigh,
    careManualNeeded,
    careUrgent,

    messageQueued,
    messageSent,
    messageFailed,
    messageFailed24h,

    ringReports,
    ringReportsToday,
    ringCheckNeeded,
    ringWatch,
    ringLowQuality,

    recentMessages,
    recentCareSignals,
    recentRingReports
  ] = await Promise.all([
    authUsersSummary(),

    restCount('anbu_family_links'),
    restCount('anbu_family_links', { parent_joined_at: `not.is.null` }),

    restCount('care_response_requests'),
    restCount('care_response_requests', { created_at: `gte.${todayStart}` }),
    restCount('care_response_requests', { risk_level: 'eq.high' }),
    restCount('care_response_requests', { status: 'eq.manual_needed' }),
    restCount('care_response_requests', { signal_type: 'eq.urgent_neighbor_help' }),

    restCount('notification_outbox', { status: 'eq.queued' }),
    restCount('notification_outbox', { status: 'eq.sent' }),
    restCount('notification_outbox', { status: 'eq.failed' }),
    restCount('notification_outbox', { status: 'eq.failed', created_at: `gte.${since24h}` }),

    restCount('ring_daily_reports'),
    restCount('ring_daily_reports', { created_at: `gte.${todayStart}` }),
    restCount('ring_daily_reports', { overall_status: 'eq.check_needed' }),
    restCount('ring_daily_reports', { overall_status: 'eq.watch' }),
    restCount('ring_daily_reports', { data_quality_score: 'lt.45' }),

    restRows(
      'notification_outbox',
      'select=id,title,status,provider,reason,to_name,to_phone,created_at,sent_at&order=created_at.desc&limit=8'
    ),
    restRows(
      'care_response_requests',
      'select=id,family_code,parent_name,guardian_name,signal_type,signal_label,risk_level,status,created_at&order=created_at.desc&limit=8'
    ),
    restRows(
      'ring_daily_reports',
      'select=id,family_code,parent_name,guardian_name,overall_status,anbu_score,data_quality_score,created_at&order=created_at.desc&limit=8'
    )
  ])

  for (const result of [
    familiesTotal,
    familiesJoined,
    careTotal,
    careToday,
    careHigh,
    careManualNeeded,
    careUrgent,
    messageQueued,
    messageSent,
    messageFailed,
    messageFailed24h,
    ringReports,
    ringReportsToday,
    ringCheckNeeded,
    ringWatch,
    ringLowQuality
  ]) {
    if (!result.ok && result.error) sourceErrors.push(result.error)
  }

  if (!authSummary.ok && authSummary.error) sourceErrors.push(authSummary.error)
  if (!recentMessages.ok && recentMessages.error) sourceErrors.push(recentMessages.error)
  if (!recentCareSignals.ok && recentCareSignals.error) sourceErrors.push(recentCareSignals.error)
  if (!recentRingReports.ok && recentRingReports.error) sourceErrors.push(recentRingReports.error)

  const highCare = countValue(careHigh) + countValue(careManualNeeded) + countValue(careUrgent)
  const messageRisk = countValue(messageFailed) + countValue(messageQueued)
  const ringRisk = countValue(ringCheckNeeded) + countValue(ringLowQuality)

  const metrics: Metric[] = [
    metric(
      'users',
      '전체 가입자',
      authSummary.totalUsers,
      `최근 24시간 ${authSummary.users24h}명 · 인증 ${authSummary.confirmedUsers}명`,
      authSummary.users24h > 0 ? 'safe' : 'neutral',
      '/admin/ops/users'
    ),
    metric(
      'families',
      '실증 연결 가구',
      countValue(familiesJoined) || countValue(familiesTotal),
      `전체 ${countValue(familiesTotal)}건 · 부모님 연결 ${countValue(familiesJoined)}건`,
      countValue(familiesJoined) > 0 ? 'safe' : 'watch',
      '/admin/ops/private-pilot'
    ),
    metric(
      'care',
      '오늘 안부 신호',
      countValue(careToday),
      `확인필요 ${highCare}건 · 전체 누적 ${countValue(careTotal)}건`,
      highCare > 0 ? 'danger' : countValue(careToday) > 0 ? 'safe' : 'neutral',
      '/admin/ops/today-runbook'
    ),
    metric(
      'messages',
      '문자/알림 상태',
      countValue(messageFailed) + countValue(messageQueued),
      `실패 ${countValue(messageFailed)}건 · 대기 ${countValue(messageQueued)}건 · 발송 ${countValue(messageSent)}건`,
      messageRisk > 0 ? 'danger' : 'safe',
      '/admin/ops/notification-dispatch'
    ),
    metric(
      'ring',
      '안부완료 리포트',
      countValue(ringReportsToday),
      `확인필요 ${countValue(ringCheckNeeded)}건 · 주의 ${countValue(ringWatch)}건 · 품질부족 ${countValue(ringLowQuality)}건`,
      ringRisk > 0 ? 'watch' : countValue(ringReportsToday) > 0 ? 'safe' : 'neutral',
      '/admin/ops/ring-csv-import'
    ),
    metric(
      'system',
      '시스템 점검',
      sourceErrors.length,
      sourceErrors.length > 0 ? '일부 테이블/API 확인 필요' : 'API와 주요 데이터 연결 정상',
      sourceErrors.length > 0 ? 'watch' : 'safe',
      '/admin/ops/preflight-test'
    )
  ]

  const focusItems = [
    highCare > 0
      ? {
          tone: 'danger',
          title: '확인필요 안부 신호가 있습니다.',
          desc: `${highCare}건을 먼저 전화 확인하거나 운영 메모로 처리하세요.`,
          href: '/admin/ops/today-runbook',
          cta: '오늘 운영센터'
        }
      : {
          tone: 'safe',
          title: '확인필요 안부 신호가 없습니다.',
          desc: '오늘 안부 신호는 큰 위험 없이 관리 중입니다.',
          href: '/admin/ops/today-runbook',
          cta: '운영센터 보기'
        },
    messageRisk > 0
      ? {
          tone: 'danger',
          title: '문자/알림 대기 또는 실패가 있습니다.',
          desc: `실패 ${countValue(messageFailed)}건, 대기 ${countValue(messageQueued)}건을 확인하세요.`,
          href: '/admin/ops/notification-dispatch',
          cta: '발송센터'
        }
      : {
          tone: 'safe',
          title: '문자/알림 상태가 양호합니다.',
          desc: '실패나 대기 건이 없거나 낮은 상태입니다.',
          href: '/admin/ops/notification-dispatch',
          cta: '알림 확인'
        },
    ringRisk > 0
      ? {
          tone: 'watch',
          title: '안부완료 리포트 확인이 필요합니다.',
          desc: `확인필요 ${countValue(ringCheckNeeded)}건, 품질부족 ${countValue(ringLowQuality)}건이 있습니다.`,
          href: '/admin/ops/ring-csv-import',
          cta: '링 데이터 보기'
        }
      : {
          tone: 'safe',
          title: '안부완료 리포트 흐름이 안정적입니다.',
          desc: '확인필요 또는 데이터 품질 부족 신호가 낮습니다.',
          href: '/admin/ops/ring-csv-import',
          cta: '링 리포트'
        },
    sourceErrors.length > 0
      ? {
          tone: 'watch',
          title: '일부 데이터 소스를 확인해야 합니다.',
          desc: '없는 테이블 또는 권한 문제는 아래 상세 로그에서 확인하세요.',
          href: '/admin/ops/preflight-test',
          cta: '시스템 점검'
        }
      : {
          tone: 'safe',
          title: '대시보드 데이터 연결이 정상입니다.',
          desc: '주요 운영 데이터 API가 응답했습니다.',
          href: '/admin/ops/preflight-test',
          cta: '점검 보기'
        }
  ]

  return NextResponse.json({
    ok: true,
    generatedKst: kstNowLabel(),
    todayStart,
    metrics,
    focusItems,
    recent: {
      messages: recentMessages.rows.map((row) => ({
        id: text(row.id),
        title: text(row.title) || '알림',
        status: text(row.status) || 'unknown',
        provider: text(row.provider) || '미지정',
        reason: text(row.reason) || '',
        toName: maskName(row.to_name),
        toPhone: maskPhone(row.to_phone),
        createdAt: text(row.created_at),
        sentAt: text(row.sent_at)
      })),
      careSignals: recentCareSignals.rows.map((row) => ({
        id: text(row.id),
        familyCode: text(row.family_code),
        parentName: maskName(row.parent_name),
        guardianName: maskName(row.guardian_name),
        signalType: text(row.signal_type),
        signalLabel: text(row.signal_label),
        riskLevel: text(row.risk_level),
        status: text(row.status),
        createdAt: text(row.created_at)
      })),
      ringReports: recentRingReports.rows.map((row) => ({
        id: text(row.id),
        familyCode: text(row.family_code),
        parentName: maskName(row.parent_name),
        guardianName: maskName(row.guardian_name),
        overallStatus: text(row.overall_status),
        anbuScore: num(row.anbu_score, 0),
        dataQualityScore: num(row.data_quality_score, 0),
        createdAt: text(row.created_at)
      }))
    },
    sourceErrors: sourceErrors.slice(0, 20)
  })
}
