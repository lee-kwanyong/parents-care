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

function numberValue(value: unknown, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
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

function payload(row: Row) {
  return row.payload && typeof row.payload === 'object' ? row.payload as Row : {}
}

function defaultSettings() {
  const opsPhone = phone(process.env.OPS_ALERT_PHONE) || '01046390336'

  return {
    id: '',
    dailyLimit: 30,
    perFamilyDailyLimit: 3,
    pointPerSms: 18,
    pointBudget: 500,
    testMode: true,
    autoDispatchAllowed: false,
    allowedTestPhones: [opsPhone].filter(Boolean),
    notificationPhone: opsPhone,
    notes: '실증 초기 기본값: 테스트 번호만 허용, 자동발송 OFF',
    createdBy: '기본값',
    createdAt: ''
  }
}

function jsonPhoneArray(value: unknown) {
  if (Array.isArray(value)) return value.map(phone).filter(Boolean)

  const raw = text(value)

  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(phone).filter(Boolean)
  } catch {
    return raw.split(',').map(phone).filter(Boolean)
  }

  return []
}

function normalizeSettings(row?: Row) {
  const fallback = defaultSettings()

  if (!row) return fallback

  const allowed = jsonPhoneArray(row.allowed_test_phones)

  return {
    id: text(row.id),
    dailyLimit: numberValue(row.daily_limit, fallback.dailyLimit),
    perFamilyDailyLimit: numberValue(row.per_family_daily_limit, fallback.perFamilyDailyLimit),
    pointPerSms: numberValue(row.point_per_sms, fallback.pointPerSms),
    pointBudget: numberValue(row.point_budget, fallback.pointBudget),
    testMode: bool(row.test_mode),
    autoDispatchAllowed: bool(row.auto_dispatch_allowed),
    allowedTestPhones: allowed.length ? allowed : fallback.allowedTestPhones,
    notificationPhone: phone(row.notification_phone),
    notes: text(row.notes),
    createdBy: text(row.created_by),
    createdAt: text(row.created_at)
  }
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

function familyKey(row: Row) {
  return text(row.family_code) || phone(row.to_phone) || text(row.to_email) || 'unknown'
}

function duplicateKey(row: Row) {
  return [
    phone(row.to_phone),
    text(row.title),
    text(row.body),
    text(row.template_code),
    text(row.family_code)
  ].join('|')
}

function normalizeMessage(row: Row, reasons: string[], hardReasons: string[]) {
  return {
    id: text(row.id),
    familyCode: text(row.family_code),
    toName: text(row.to_name),
    toPhone: phone(row.to_phone),
    title: text(row.title),
    body: text(row.body),
    templateCode: text(row.template_code),
    reason: text(row.reason),
    status: text(row.status),
    provider: text(row.provider),
    createdKst: toKst(row.created_at),
    sentKst: toKst(row.sent_at),
    reasons,
    hardReasons,
    shouldCancel: hardReasons.length > 0
  }
}

async function loadSettings() {
  const result = await rest('ops_sms_budget_guard_settings?select=*&order=created_at.desc&limit=1')
  const setting = normalizeSettings(rows(result)[0])

  return {
    ok: result.ok,
    settings: setting,
    error: result.ok ? null : result.error
  }
}

async function loadDashboard() {
  const today = kstDateKey()

  const [settingsResult, outboxResult, runResult] = await Promise.all([
    loadSettings(),
    rest('notification_outbox?select=*&order=created_at.desc&limit=5000'),
    rest('ops_sms_budget_guard_runs?select=*&order=created_at.desc&limit=100')
  ])

  if (!outboxResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '문자 발송 기록을 불러오지 못했습니다.',
      detail: outboxResult.error
    }
  }

  const settings = settingsResult.settings
  const outbox = rows(outboxResult)
  const todayItems = outbox.filter((item) => sameKstDay(item.created_at, today) || sameKstDay(item.sent_at, today))
  const sentToday = todayItems.filter((item) => text(item.status) === 'sent')
  const queued = outbox.filter((item) => text(item.status) === 'queued')
  const failedToday = todayItems.filter((item) => text(item.status) === 'failed')
  const cancelledToday = todayItems.filter((item) => text(item.status) === 'cancelled')

  const sentByFamily: Record<string, number> = {}

  for (const item of sentToday) {
    const key = familyKey(item)
    sentByFamily[key] = (sentByFamily[key] || 0) + 1
  }

  let projectedDaily = sentToday.length
  const projectedByFamily = { ...sentByFamily }
  const seenDuplicate = new Set<string>()

  const riskyQueued = queued.map((item) => {
    const reasons: string[] = []
    const hardReasons: string[] = []
    const toPhone = phone(item.to_phone)
    const key = familyKey(item)
    const dup = duplicateKey(item)

    projectedDaily += 1
    projectedByFamily[key] = (projectedByFamily[key] || 0) + 1

    if (!toPhone) {
      reasons.push('수신번호 없음')
      hardReasons.push('수신번호 없음')
    }

    if (settings.testMode && !settings.allowedTestPhones.includes(toPhone)) {
      reasons.push('테스트 모드에서 허용되지 않은 번호')
      hardReasons.push('테스트 모드 번호 제한')
    }

    if (projectedDaily > settings.dailyLimit) {
      reasons.push('하루 발송 한도 초과')
      hardReasons.push('하루 발송 한도 초과')
    }

    if (projectedByFamily[key] > settings.perFamilyDailyLimit) {
      reasons.push('가구/수신자별 발송 한도 초과')
      hardReasons.push('가구/수신자별 발송 한도 초과')
    }

    if (seenDuplicate.has(dup)) {
      reasons.push('중복 대기 문자')
      hardReasons.push('중복 대기 문자')
    } else {
      seenDuplicate.add(dup)
    }

    if (!settings.autoDispatchAllowed) {
      reasons.push('자동발송 OFF 상태')
    }

    return normalizeMessage(item, reasons, hardReasons)
  }).filter((item) => item.reasons.length > 0)

  const hardRiskQueued = riskyQueued.filter((item) => item.shouldCancel)

  const estimatedQueuedCost = queued.length * settings.pointPerSms
  const estimatedTodayCost = sentToday.length * settings.pointPerSms
  const projectedCost = estimatedTodayCost + estimatedQueuedCost
  const remainingPoint = settings.pointBudget - projectedCost

  const metrics = {
    today,
    totalOutbox: outbox.length,
    sentToday: sentToday.length,
    queued: queued.length,
    failedToday: failedToday.length,
    cancelledToday: cancelledToday.length,
    riskyQueued: riskyQueued.length,
    hardRiskQueued: hardRiskQueued.length,
    dailyLimit: settings.dailyLimit,
    perFamilyDailyLimit: settings.perFamilyDailyLimit,
    pointPerSms: settings.pointPerSms,
    pointBudget: settings.pointBudget,
    estimatedTodayCost,
    estimatedQueuedCost,
    projectedCost,
    remainingPoint,
    overDailyLimit: sentToday.length + queued.length > settings.dailyLimit,
    overPointBudget: projectedCost > settings.pointBudget,
    testMode: settings.testMode,
    autoDispatchAllowed: settings.autoDispatchAllowed
  }

  return {
    ok: true,
    settings,
    metrics,
    queued: queued.slice(0, 300).map((item) => normalizeMessage(item, [], [])),
    riskyQueued,
    hardRiskQueued,
    recentItems: outbox.slice(0, 300).map((item) => normalizeMessage(item, [], [])),
    runs: rows(runResult),
    sourceErrors: {
      settings: settingsResult.error,
      outbox: outboxResult.ok ? null : outboxResult.error,
      runs: runResult.ok ? null : runResult.error
    }
  }
}

async function saveSettings(body: Row) {
  const allowed = Array.isArray(body.allowedTestPhones)
    ? body.allowedTestPhones.map(phone).filter(Boolean)
    : text(body.allowedTestPhones).split(',').map(phone).filter(Boolean)

  const result = await insertRows('ops_sms_budget_guard_settings', [
    {
      daily_limit: Math.max(0, numberValue(body.dailyLimit, 30)),
      per_family_daily_limit: Math.max(0, numberValue(body.perFamilyDailyLimit, 3)),
      point_per_sms: Math.max(0, numberValue(body.pointPerSms, 18)),
      point_budget: Math.max(0, numberValue(body.pointBudget, 500)),
      test_mode: bool(body.testMode),
      auto_dispatch_allowed: bool(body.autoDispatchAllowed),
      allowed_test_phones: allowed,
      notification_phone: phone(body.notificationPhone),
      notes: text(body.notes),
      created_by: text(body.createdBy) || '운영실'
    }
  ])

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '문자 보호 설정 저장에 실패했습니다.',
      detail: result.error
    }
  }

  await insertRows('ops_sms_budget_guard_runs', [
    {
      action: 'save_settings',
      status: 'ok',
      summary: '문자 비용·자동발송 보호 설정을 저장했습니다.',
      metrics: {
        dailyLimit: Math.max(0, numberValue(body.dailyLimit, 30)),
        perFamilyDailyLimit: Math.max(0, numberValue(body.perFamilyDailyLimit, 3)),
        pointBudget: Math.max(0, numberValue(body.pointBudget, 500)),
        testMode: bool(body.testMode),
        autoDispatchAllowed: bool(body.autoDispatchAllowed)
      },
      payload: {
        allowedTestPhones: allowed,
        notes: text(body.notes)
      },
      created_by: text(body.createdBy) || '운영실'
    }
  ])

  return {
    ok: true,
    message: '문자 보호 설정을 저장했습니다.',
    settings: rows(result)[0]
  }
}

async function patchCancelMessage(message: Row, createdBy: string) {
  const id = text(message.id)

  const nextPayload = {
    ...payload(message),
    do_not_retry: true,
    sms_budget_guard: {
      action: 'cancel_risky_queued',
      cancelledBy: createdBy,
      cancelledAt: new Date().toISOString(),
      previousStatus: text(message.status),
      reasons: (message as Row).hardReasons || (message as Row).reasons || []
    }
  }

  return rest('notification_outbox?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      status: 'cancelled',
      payload: nextPayload
    })
  })
}

async function cancelRiskyQueued(body: Row) {
  const createdBy = text(body.createdBy) || '운영실'
  const dashboard = await loadDashboard()

  if (!dashboard.ok) return dashboard

  const targetIds = new Set((dashboard.hardRiskQueued || []).map((item: Row) => text(item.id)))
  const queuedResult = await rest('notification_outbox?select=*&status=eq.queued&order=created_at.desc&limit=1000')

  if (!queuedResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '대기 문자 목록을 다시 불러오지 못했습니다.',
      detail: queuedResult.error
    }
  }

  const targets = rows(queuedResult).filter((item) => targetIds.has(text(item.id)))
  const results = []

  for (const item of targets) {
    const risky = (dashboard.hardRiskQueued || []).find((candidate: Row) => text(candidate.id) === text(item.id)) as Row | undefined
    results.push(await patchCancelMessage({ ...item, reasons: risky?.reasons, hardReasons: risky?.hardReasons }, createdBy))
  }

  const okCount = results.filter((item) => item.ok).length
  const failedCount = results.length - okCount
  const affectedIds = targets.map((item) => text(item.id))

  await insertRows('ops_sms_budget_guard_runs', [
    {
      action: 'cancel_risky_queued',
      status: failedCount > 0 ? 'warning' : 'ok',
      summary: `위험 대기 문자 ${okCount}건을 취소했습니다.`,
      metrics: {
        target: targets.length,
        ok: okCount,
        failed: failedCount
      },
      affected_ids: affectedIds,
      results: results.map((item) => ({
        ok: item.ok,
        status: item.status,
        error: item.error
      })),
      payload: {
        createdBy,
        reason: 'sms_budget_guard'
      },
      created_by: createdBy
    }
  ])

  return {
    ok: failedCount === 0,
    status: failedCount === 0 ? 200 : 207,
    message: `위험 대기 문자 ${okCount}건을 취소했습니다.`,
    metrics: {
      target: targets.length,
      ok: okCount,
      failed: failedCount
    },
    affectedIds
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

  if (action === 'saveSettings') result = await saveSettings(body)
  else if (action === 'cancelRiskyQueued') result = await cancelRiskyQueued(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
