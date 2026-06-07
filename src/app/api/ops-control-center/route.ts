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

type HealthLevel = 'ok' | 'warning' | 'critical'

type HealthItem = {
  key: string
  title: string
  level: HealthLevel
  message: string
  detail?: string
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

function boolEnv(name: string) {
  return process.env[name] === 'true'
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

async function table(tableName: string, query: string, warnings: string[]) {
  const result = await rest(`${tableName}?${query}`)

  if (!result.ok) {
    warnings.push(`${tableName} 조회 실패`)
    return []
  }

  return rows(result)
}

function ageMinutes(value: unknown) {
  const raw = text(value)
  if (!raw) return null

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null

  return Math.floor((Date.now() - d.getTime()) / 60000)
}

function isToday(value: unknown) {
  const raw = text(value)
  if (!raw) return false

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return false

  const now = new Date()

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function isOpenStatus(status: string) {
  return ['open', 'dispatched', 'manual_needed', 'accepted', 'in_progress'].includes(status)
}

function isUrgentRequest(row: Row) {
  return (
    text(row.request_type) === 'urgent_neighbor_help' ||
    text(row.signal_type) === 'urgent_neighbor_help' ||
    text(row.risk_level) === 'high'
  )
}

function envSet(name: string) {
  return Boolean(process.env[name])
}

function maskPhone(value: string) {
  const clean = value.replace(/[^\d]/g, '')
  if (!clean) return ''
  if (clean.length < 7) return '설정됨'
  return clean.slice(0, 3) + '****' + clean.slice(-4)
}

function latestLog(logs: Row[], patterns: string[]) {
  return logs.find((row) => {
    const haystack = [
      text(row.action_type),
      text(row.actor_name),
      text(row.message),
      text(row.source),
      text(row.payload)
    ].join(' ').toLowerCase()

    return patterns.some((pattern) => haystack.includes(pattern.toLowerCase()))
  })
}

function healthItem(key: string, title: string, level: HealthLevel, message: string, detail?: string): HealthItem {
  return { key, title, level, message, detail }
}

function overallStatus(health: HealthItem[]) {
  if (health.some((item) => item.level === 'critical')) return 'critical'
  if (health.some((item) => item.level === 'warning')) return 'warning'
  return 'ok'
}

async function loadControlCenter() {
  const warnings: string[] = []

  const [
    requests,
    providers,
    matches,
    outbox,
    logs,
    updates,
    households,
    privacyLogs,
    consentRecords,
    leads,
    snapshots
  ] = await Promise.all([
    table('care_response_requests', 'select=*&order=created_at.desc&limit=1500', warnings),
    table('care_providers', 'select=*&order=created_at.desc&limit=1500', warnings),
    table('care_response_matches', 'select=*&order=created_at.desc&limit=2000', warnings),
    table('notification_outbox', 'select=*&order=created_at.desc&limit=2000', warnings),
    table('ops_autopilot_logs', 'select=*&order=created_at.desc&limit=500', warnings),
    table('care_response_updates', 'select=*&order=created_at.desc&limit=500', warnings),
    table('care_households', 'select=*&order=created_at.desc&limit=1500', warnings),
    table('privacy_access_logs', 'select=*&order=created_at.desc&limit=500', warnings),
    table('privacy_consent_records', 'select=*&order=created_at.desc&limit=500', warnings),
    table('gov_proposal_leads', 'select=*&order=created_at.desc&limit=500', warnings),
    table('ops_control_center_snapshots', 'select=*&order=created_at.desc&limit=20', warnings)
  ])

  const openRequests = requests.filter((row) => isOpenStatus(text(row.status)))
  const urgentOpen = openRequests.filter(isUrgentRequest)
  const staleUrgent = urgentOpen.filter((row) => {
    const age = ageMinutes(row.created_at)
    return typeof age === 'number' && age >= 10 && !text(row.accepted_at)
  })

  const manualNeeded = requests.filter((row) => text(row.status) === 'manual_needed')
  const completedToday = requests.filter((row) => text(row.status) === 'completed' && isToday(row.completed_at || row.updated_at))
  const acceptedOpen = requests.filter((row) => text(row.status) === 'accepted' || text(row.status) === 'in_progress')

  const eligibleProviders = providers.filter((row) => {
    const type = text(row.provider_type)
    return (
      ['caregiver', 'care_partner'].includes(type) &&
      text(row.available_status) === 'available' &&
      text(row.verified_status) === 'verified' &&
      row.fast_dispatch_enabled !== false
    )
  })

  const queuedOutbox = outbox.filter((row) => text(row.status) === 'queued')
  const failedOutbox = outbox.filter((row) => text(row.status) === 'failed')
  const sentToday = outbox.filter((row) => text(row.status) === 'sent' && isToday(row.sent_at || row.created_at))

  const latestHeartbeat = latestLog(logs, ['heartbeat', '하트비트'])
  const latestAutopilot = latestLog(logs, ['autopilot', '오토파일럿', '자동운영'])
  const latestAnyLog = logs[0]

  const heartbeatAge = latestHeartbeat ? ageMinutes(latestHeartbeat.created_at) : null
  const autopilotAge = latestAutopilot ? ageMinutes(latestAutopilot.created_at) : null

  const consentPending = households.filter((row) => text(row.consent_status) !== 'approved')
  const leadNew = leads.filter((row) => text(row.status) === 'new')
  const leadAlertProblem = leads.filter((row) => ['failed', 'no_recipient', 'pending'].includes(text(row.alert_status || 'pending')))

  const smsEnvOk =
    envSet('SOLAPI_API_KEY') &&
    envSet('SOLAPI_API_SECRET') &&
    envSet('SOLAPI_SENDER')

  const secretEnvOk =
    envSet('CRON_SECRET') &&
    envSet('OPS_AUTOPILOT_SECRET') &&
    envSet('RESPONSE_ESCALATION_SECRET')

  const serviceRoleOk = envSet('SUPABASE_SERVICE_ROLE_KEY')

  const health: HealthItem[] = [
    healthItem(
      'supabase',
      'Supabase 연결',
      supabaseBaseUrl() && serviceKey() ? 'ok' : 'critical',
      supabaseBaseUrl() && serviceKey() ? 'Supabase 환경변수가 있습니다.' : 'Supabase URL 또는 Key가 없습니다.',
      serviceRoleOk ? 'Service Role Key 설정됨' : 'Service Role Key가 없으면 개인정보/제출 관련 조회가 제한될 수 있습니다.'
    ),
    healthItem(
      'secrets',
      'Cron/자동운영 Secret',
      secretEnvOk ? 'ok' : 'warning',
      secretEnvOk ? '자동운영 Secret이 준비되었습니다.' : 'CRON_SECRET, OPS_AUTOPILOT_SECRET, RESPONSE_ESCALATION_SECRET 중 누락이 있습니다.'
    ),
    healthItem(
      'sms',
      'SOLAPI 문자',
      smsEnvOk ? 'ok' : 'warning',
      smsEnvOk ? '문자 발송 환경변수가 준비되었습니다.' : 'SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER를 확인하세요.',
      `자동발송: Heartbeat=${boolEnv('OPS_HEARTBEAT_AUTO_SEND') ? 'ON' : 'OFF'}, 문의=${boolEnv('OPS_LEAD_ALERT_AUTO_SEND') ? 'ON' : 'OFF'}`
    ),
    healthItem(
      'heartbeat',
      'Heartbeat',
      heartbeatAge === null ? 'warning' : heartbeatAge <= 90 ? 'ok' : 'warning',
      heartbeatAge === null ? 'Heartbeat 로그가 아직 없습니다.' : `마지막 Heartbeat 추정 ${heartbeatAge}분 전`,
      latestHeartbeat ? text(latestHeartbeat.message) : ''
    ),
    healthItem(
      'autopilot',
      '오토파일럿',
      autopilotAge === null ? 'warning' : autopilotAge <= 180 ? 'ok' : 'warning',
      autopilotAge === null ? '오토파일럿 로그가 아직 없습니다.' : `마지막 오토파일럿 추정 ${autopilotAge}분 전`,
      latestAutopilot ? text(latestAutopilot.message) : ''
    ),
    healthItem(
      'urgent',
      '긴급 사건',
      staleUrgent.length > 0 ? 'critical' : urgentOpen.length > 0 ? 'warning' : 'ok',
      staleUrgent.length > 0
        ? `${staleUrgent.length}건이 10분 이상 수락되지 않았습니다.`
        : urgentOpen.length > 0
          ? `${urgentOpen.length}건의 긴급 사건이 열려 있습니다.`
          : '열린 긴급 사건이 없습니다.'
    ),
    healthItem(
      'providers',
      '가용 요양보호사',
      eligibleProviders.length > 0 ? 'ok' : 'warning',
      eligibleProviders.length > 0 ? `${eligibleProviders.length}명이 즉시 배치 가능합니다.` : '즉시 배치 가능한 검증 도움망이 없습니다.'
    ),
    healthItem(
      'notifications',
      '문자 대기/실패',
      failedOutbox.length > 0 ? 'critical' : queuedOutbox.length > 0 ? 'warning' : 'ok',
      failedOutbox.length > 0
        ? `문자 실패 ${failedOutbox.length}건이 있습니다.`
        : queuedOutbox.length > 0
          ? `문자 대기 ${queuedOutbox.length}건이 있습니다.`
          : '문자 대기/실패가 없습니다.'
    ),
    healthItem(
      'privacy',
      '개인정보 동의',
      consentPending.length > 0 ? 'warning' : 'ok',
      consentPending.length > 0 ? `동의 대기/미완료 대상자 ${consentPending.length}명` : '개인정보 동의 상태가 정리되어 있습니다.'
    ),
    healthItem(
      'proposal',
      '제안 문의 알림',
      leadAlertProblem.length > 0 ? 'warning' : 'ok',
      leadAlertProblem.length > 0 ? `문의 알림 확인 필요 ${leadAlertProblem.length}건` : '제안 문의 알림 상태가 정상입니다.'
    )
  ]

  const metrics = {
    openRequests: openRequests.length,
    urgentOpen: urgentOpen.length,
    staleUrgent: staleUrgent.length,
    manualNeeded: manualNeeded.length,
    acceptedOpen: acceptedOpen.length,
    completedToday: completedToday.length,

    queuedOutbox: queuedOutbox.length,
    failedOutbox: failedOutbox.length,
    sentToday: sentToday.length,

    providers: providers.length,
    eligibleProviders: eligibleProviders.length,
    caregivers: eligibleProviders.filter((row) => text(row.provider_type) === 'caregiver').length,
    carePartners: eligibleProviders.filter((row) => text(row.provider_type) === 'care_partner').length,

    notifiedMatches: matches.filter((row) => text(row.match_status) === 'notified').length,
    acceptedMatches: matches.filter((row) => text(row.match_status) === 'accepted').length,

    households: households.length,
    consentPending: consentPending.length,
    privacyLogsToday: privacyLogs.filter((row) => isToday(row.created_at)).length,
    consentRecords: consentRecords.length,

    proposalNew: leadNew.length,
    proposalAlertProblem: leadAlertProblem.length,

    heartbeatAge,
    autopilotAge
  }

  const recentEvents = [
    ...logs.slice(0, 20).map((row) => ({
      id: text(row.id),
      kind: '자동운영',
      title: text(row.action_type) || '운영 로그',
      message: text(row.message),
      createdAt: text(row.created_at)
    })),
    ...updates.slice(0, 20).map((row) => ({
      id: text(row.id),
      kind: '사건 업데이트',
      title: text(row.update_type) || '업데이트',
      message: text(row.message),
      createdAt: text(row.created_at)
    })),
    ...outbox.slice(0, 20).map((row) => ({
      id: text(row.id),
      kind: '문자',
      title: text(row.title) || text(row.reason) || '문자 기록',
      message: `${text(row.status)} · ${text(row.to_name)} · ${text(row.to_phone)}`,
      createdAt: text(row.sent_at || row.created_at)
    }))
  ]
    .filter((item) => item.id || item.createdAt)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 30)

  const status = overallStatus(health)

  return {
    ok: true,
    status,
    generatedAt: new Date().toISOString(),
    metrics,
    health,
    warnings,
    config: {
      hasSupabaseUrl: Boolean(supabaseBaseUrl()),
      hasServiceRoleKey: serviceRoleOk,
      hasCronSecret: envSet('CRON_SECRET'),
      hasOpsAutopilotSecret: envSet('OPS_AUTOPILOT_SECRET'),
      hasResponseEscalationSecret: envSet('RESPONSE_ESCALATION_SECRET'),
      hasSolapiApiKey: envSet('SOLAPI_API_KEY'),
      hasSolapiApiSecret: envSet('SOLAPI_API_SECRET'),
      hasSolapiSender: envSet('SOLAPI_SENDER'),
      opsHeartbeatAutoSend: boolEnv('OPS_HEARTBEAT_AUTO_SEND'),
      opsLeadAlertAutoSend: boolEnv('OPS_LEAD_ALERT_AUTO_SEND'),
      opsLeadAlertPhoneMasked: maskPhone(process.env.OPS_LEAD_ALERT_PHONE || '')
    },
    urgentRequests: urgentOpen.slice(0, 20),
    manualNeeded: manualNeeded.slice(0, 20),
    failedOutbox: failedOutbox.slice(0, 20),
    queuedOutbox: queuedOutbox.slice(0, 20),
    eligibleProviders: eligibleProviders.slice(0, 20),
    recentEvents,
    latestAnyLog,
    recentSnapshots: snapshots
  }
}

async function saveSnapshot() {
  const data = await loadControlCenter()

  if (!data.ok) return data

  const result = await rest('ops_control_center_snapshots', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        overall_status: data.status,
        metrics: data.metrics,
        health: data.health,
        warnings: data.warnings,
        payload: {
          generatedAt: data.generatedAt,
          config: data.config
        },
        created_by: '운영실'
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '운영실 상태 스냅샷을 저장했습니다.' : '스냅샷 저장에 실패했습니다.',
    snapshot: rows(result)[0],
    detail: result.error
  }
}

async function callInternal(request: NextRequest, candidates: Array<{ path: string; method?: 'GET' | 'POST'; body?: Row }>) {
  const secret = process.env.CRON_SECRET || process.env.OPS_AUTOPILOT_SECRET || process.env.RESPONSE_ESCALATION_SECRET || ''

  if (!secret) {
    return {
      ok: false,
      status: 400,
      message: 'CRON_SECRET 또는 자동운영 Secret이 없어 수동 실행을 요청할 수 없습니다.'
    }
  }

  const attempts = []

  for (const candidate of candidates) {
    const url = new URL(candidate.path, request.nextUrl.origin)

    if (!url.searchParams.get('token')) {
      url.searchParams.set('token', secret)
    }

    try {
      const response = await fetch(url.toString(), {
        method: candidate.method || 'GET',
        headers: {
          Authorization: 'Bearer ' + secret,
          'Content-Type': 'application/json'
        },
        body: candidate.method === 'POST' ? JSON.stringify(candidate.body || {}) : undefined,
        cache: 'no-store'
      })

      const raw = await response.text()
      let data: unknown = raw

      try {
        data = raw ? JSON.parse(raw) : null
      } catch {
        data = raw
      }

      attempts.push({
        path: candidate.path,
        status: response.status,
        ok: response.ok,
        data
      })

      if (response.ok || response.status !== 404) {
        return {
          ok: response.ok,
          status: response.status,
          message: response.ok ? '수동 실행 요청을 보냈습니다.' : '수동 실행 요청이 실패했습니다.',
          path: candidate.path,
          data,
          attempts
        }
      }
    } catch (error) {
      attempts.push({
        path: candidate.path,
        ok: false,
        error: error instanceof Error ? error.message : '요청 실패'
      })
    }
  }

  return {
    ok: false,
    status: 404,
    message: '실행 가능한 내부 API를 찾지 못했습니다.',
    attempts
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

  const data = await loadControlCenter()
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

  if (action === 'saveSnapshot') {
    result = await saveSnapshot()
  } else if (action === 'runHeartbeat') {
    result = await callInternal(request, [
      { path: '/api/cron/ops-heartbeat', method: 'GET' },
      { path: '/api/ops-heartbeat', method: 'GET' },
      { path: '/api/heartbeat', method: 'GET' }
    ])
  } else if (action === 'runAutopilot') {
    result = await callInternal(request, [
      { path: '/api/ops-autopilot?autoSend=false', method: 'GET' },
      { path: '/api/ops-autopilot', method: 'POST', body: { autoSend: false } },
      { path: '/api/agent/full-autopilot', method: 'GET' }
    ])
  } else if (action === 'dispatchQueued') {
    result = await callInternal(request, [
      { path: '/api/notifications/dispatch', method: 'POST', body: { action: 'dispatchQueued', limit: 20 } }
    ])
  } else {
    result = {
      ok: false,
      status: 400,
      message: '알 수 없는 action입니다.'
    }
  }

  return NextResponse.json(result, { status: responseStatus(result) })
}
