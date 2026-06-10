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

function ageHours(value: unknown) {
  const raw = text(value)
  if (!raw) return null

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null

  return Math.floor((Date.now() - date.getTime()) / (60 * 60 * 1000))
}

function payload(row: Row) {
  return row.payload && typeof row.payload === 'object' ? row.payload as Row : {}
}

function normalizeFamily(row: Row, source: string) {
  const familyCode = text(row.family_code)
  const p = payload(row)

  return {
    id: text(row.id),
    source,
    familyCode,
    pilotKey: text(row.pilot_key) || text(p.pilotKey),
    parentName: text(row.parent_name) || '부모님',
    parentPhone: phone(row.parent_phone),
    guardianName: text(row.guardian_name) || '보호자',
    guardianPhone: phone(row.guardian_phone),
    guardianEmail: text(row.guardian_email),
    serviceArea: text(row.service_area) || '우리동네',
    addressHint: text(row.address_hint),
    status: text(row.status) || text(row.link_status) || text(row.consent_status) || 'active',
    createdAt: text(row.created_at),
    onboardingUrl: text(row.onboarding_url)
  }
}

function isActiveStatus(status: string) {
  const normalized = status.toLowerCase()

  return ![
    'archived',
    'cancelled',
    'canceled',
    'inactive',
    'deleted',
    'stopped',
    'ended'
  ].includes(normalized)
}

function parentAppUrl(origin: string, family: ReturnType<typeof normalizeFamily>) {
  if (family.onboardingUrl) {
    return family.onboardingUrl.startsWith('http') ? family.onboardingUrl : origin + family.onboardingUrl
  }

  const params = new URLSearchParams()
  params.set('familyCode', family.familyCode)
  params.set('parentName', family.parentName)
  params.set('parentPhone', family.parentPhone)
  params.set('guardianName', family.guardianName)
  params.set('guardianPhone', family.guardianPhone)
  params.set('serviceArea', family.serviceArea)

  if (family.addressHint) params.set('addressHint', family.addressHint)
  if (family.pilotKey) params.set('pilotKey', family.pilotKey)

  return origin + '/mobile/parent?' + params.toString()
}

function guardianProxyUrl(origin: string, family: ReturnType<typeof normalizeFamily>) {
  const params = new URLSearchParams()
  params.set('familyCode', family.familyCode)

  if (family.guardianPhone) params.set('last4', family.guardianPhone.slice(-4))
  else if (family.parentPhone) params.set('last4', family.parentPhone.slice(-4))

  return origin + '/guardian/proxy-checkin?' + params.toString()
}

function guardianReportUrl(origin: string, family: ReturnType<typeof normalizeFamily>) {
  const params = new URLSearchParams()
  params.set('familyCode', family.familyCode)

  if (family.guardianPhone) params.set('last4', family.guardianPhone.slice(-4))
  else if (family.parentPhone) params.set('last4', family.parentPhone.slice(-4))

  return origin + '/guardian/today?' + params.toString()
}

function latestForFamily(items: Row[], familyCode: string) {
  return items.find((item) => text(item.family_code) === familyCode) || null
}

function sameKstDay(value: unknown, dayKey: string) {
  const raw = text(value)
  if (!raw) return false
  return kstDateKey(raw) === dayKey
}

function isNoResponseReminder(row: Row) {
  const bundle = [
    row.template_code,
    row.reason,
    row.provider,
    row.title,
    row.body
  ].map((value) => text(value).toLowerCase()).join(' ')

  return bundle.includes('no-response') || bundle.includes('미응답')
}

async function loadDashboard(request: NextRequest) {
  const origin = request.nextUrl.origin
  const today = kstDateKey()

  const [
    householdResult,
    familyLinkResult,
    requestResult,
    outboxResult,
    runResult
  ] = await Promise.all([
    rest('ops_private_pilot_households?select=*&order=created_at.desc&limit=2000'),
    rest('anbu_family_links?select=*&order=created_at.desc&limit=2000'),
    rest('care_response_requests?select=*&order=created_at.desc&limit=3000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=3000'),
    rest('ops_no_response_followup_runs?select=*&order=created_at.desc&limit=100')
  ])

  const households = rows(householdResult).map((row) => normalizeFamily(row, 'ops_private_pilot_households'))
  const familyLinks = rows(familyLinkResult).map((row) => normalizeFamily(row, 'anbu_family_links'))

  const familyByCode = new Map<string, ReturnType<typeof normalizeFamily>>()

  for (const family of [...households, ...familyLinks]) {
    if (!family.familyCode) continue
    if (!isActiveStatus(family.status)) continue
    if (!familyByCode.has(family.familyCode)) familyByCode.set(family.familyCode, family)
  }

  const families = Array.from(familyByCode.values())
  const requests = rows(requestResult)
  const outbox = rows(outboxResult)
  const noResponseRuns = rows(runResult)

  const rowsForUi = families.map((family) => {
    const familyRequests = requests.filter((item) => text(item.family_code) === family.familyCode)
    const familyMessages = outbox.filter((item) => text(item.family_code) === family.familyCode)
    const latestSignal = latestForFamily(familyRequests, family.familyCode)
    const todaySignals = familyRequests.filter((item) => sameKstDay(item.created_at, today))
    const todayMessages = familyMessages.filter((item) => sameKstDay(item.created_at, today))
    const todayNoResponseMessages = todayMessages.filter(isNoResponseReminder)
    const hasTodaySignal = todaySignals.length > 0
    const needsFollowup = !hasTodaySignal
    const latestReminder = todayNoResponseMessages[0] || null

    return {
      ...family,
      parentAppUrl: parentAppUrl(origin, family),
      guardianProxyUrl: guardianProxyUrl(origin, family),
      guardianReportUrl: guardianReportUrl(origin, family),
      hasTodaySignal,
      needsFollowup,
      todaySignalCount: todaySignals.length,
      signalCount: familyRequests.length,
      lastSignalKst: toKst(latestSignal?.created_at),
      lastSignalAgeHours: ageHours(latestSignal?.created_at),
      lastSignalLabel: text(latestSignal?.signal_label) || text(latestSignal?.signal_type) || '',
      todayMessageCount: todayMessages.length,
      todayNoResponseMessageCount: todayNoResponseMessages.length,
      reminderStatus: text(latestReminder?.status),
      reminderCreatedKst: toKst(latestReminder?.created_at),
      reminderSentKst: toKst(latestReminder?.sent_at),
      guardianPhoneLast4: family.guardianPhone.slice(-4),
      parentPhoneLast4: family.parentPhone.slice(-4)
    }
  }).sort((a, b) => {
    if (a.needsFollowup !== b.needsFollowup) return a.needsFollowup ? -1 : 1
    return String(b.createdAt).localeCompare(String(a.createdAt))
  })

  const noResponseFamilies = rowsForUi.filter((item) => item.needsFollowup)
  const respondedFamilies = rowsForUi.filter((item) => item.hasTodaySignal)
  const remindersQueued = rowsForUi.filter((item) => item.reminderStatus === 'queued').length
  const remindersSent = rowsForUi.filter((item) => item.reminderStatus === 'sent').length
  const remindersFailed = rowsForUi.filter((item) => item.reminderStatus === 'failed').length
  const noGuardianPhone = noResponseFamilies.filter((item) => !item.guardianPhone).length

  return {
    ok: true,
    today,
    metrics: {
      totalFamilies: rowsForUi.length,
      respondedFamilies: respondedFamilies.length,
      noResponseFamilies: noResponseFamilies.length,
      noGuardianPhone,
      remindersQueued,
      remindersSent,
      remindersFailed,
      responseRate: rowsForUi.length ? Math.round((respondedFamilies.length / rowsForUi.length) * 100) : 0
    },
    families: rowsForUi,
    noResponseFamilies,
    respondedFamilies,
    runs: noResponseRuns,
    sourceErrors: {
      households: householdResult.ok ? null : householdResult.error,
      familyLinks: familyLinkResult.ok ? null : familyLinkResult.error,
      requests: requestResult.ok ? null : requestResult.error,
      outbox: outboxResult.ok ? null : outboxResult.error,
      runs: runResult.ok ? null : runResult.error
    }
  }
}

async function existingOutbox(sourceKey: string) {
  const result = await rest('notification_outbox?select=*&source_key=eq.' + encodeURIComponent(sourceKey) + '&limit=1')
  return rows(result)[0]
}

async function queueReminder(request: NextRequest, family: ReturnType<typeof normalizeFamily>, createdBy: string) {
  const today = kstDateKey()
  const sourceKey = `no-response-${family.familyCode}-${today}`

  if (!family.familyCode) {
    return {
      ok: true,
      skipped: true,
      reason: 'no-family-code',
      familyCode: family.familyCode
    }
  }

  if (!family.guardianPhone) {
    return {
      ok: true,
      skipped: true,
      reason: 'no-guardian-phone',
      familyCode: family.familyCode
    }
  }

  const existing = await existingOutbox(sourceKey)

  if (existing) {
    return {
      ok: true,
      skipped: true,
      reason: 'already-exists',
      familyCode: family.familyCode,
      outbox: existing
    }
  }

  const proxyUrl = guardianProxyUrl(request.nextUrl.origin, family)
  const reportUrl = guardianReportUrl(request.nextUrl.origin, family)

  const body = `[안부웍스 미응답 확인]
${family.guardianName || '보호자'}님, 오늘 ${family.parentName || '부모님'}님의 안부 신호가 아직 기록되지 않았습니다.

가능하면 전화로 상태를 확인해주세요.
확인 후 아래 링크에서 대신 기록할 수 있습니다.

대리 기록:
${proxyUrl}

오늘 리포트:
${reportUrl}

응급상황이면 즉시 119 또는 의료기관에 연락해주세요.`

  const result = await insertRows('notification_outbox', [
    {
      family_code: family.familyCode,
      channel: 'sms',
      to_name: family.guardianName || '보호자',
      to_phone: family.guardianPhone,
      title: '[안부웍스] 오늘 안부 미응답 확인',
      body,
      template_code: 'guardian_no_response_check',
      reason: 'no-response-reminder',
      target_url: proxyUrl,
      status: 'queued',
      provider: 'no-response-center',
      source_key: sourceKey,
      payload: {
        source: 'no-response-center',
        createdBy,
        familyCode: family.familyCode,
        parentName: family.parentName,
        guardianName: family.guardianName,
        today,
        proxyUrl,
        reportUrl,
        do_not_retry: false
      }
    }
  ])

  return {
    ok: result.ok,
    skipped: false,
    reason: result.ok ? 'queued' : 'insert-failed',
    familyCode: family.familyCode,
    outbox: rows(result)[0],
    detail: result.error
  }
}

async function runReminders(body: Row, request: NextRequest) {
  const createdBy = text(body.createdBy) || '운영실'
  const familyCode = text(body.familyCode)
  const force = bool(body.force)
  const dashboard = await loadDashboard(request)

  if (!dashboard.ok) return dashboard

  const targets = familyCode
    ? dashboard.families.filter((item) => item.familyCode === familyCode)
    : dashboard.noResponseFamilies

  const effectiveTargets = force ? targets : targets.filter((item) => item.needsFollowup)
  const results = []

  for (const family of effectiveTargets) {
    results.push(await queueReminder(request, family, createdBy))
  }

  const queued = results.filter((item) => item.ok && !item.skipped).length
  const skipped = results.filter((item) => item.skipped).length
  const failed = results.filter((item) => !item.ok).length
  const affectedIds = results
    .map((item) => text((item.outbox as Row)?.id))
    .filter(Boolean)

  const summary = familyCode
    ? `${familyCode} 가구 미응답 보호자 확인 문자를 생성했습니다. 생성 ${queued}건, 스킵 ${skipped}건, 실패 ${failed}건`
    : `미응답 가구 보호자 확인 문자를 생성했습니다. 생성 ${queued}건, 스킵 ${skipped}건, 실패 ${failed}건`

  await insertRows('ops_no_response_followup_runs', [
    {
      action: familyCode ? 'queue_one_no_response_reminder' : 'queue_all_no_response_reminders',
      status: failed > 0 ? 'warning' : 'ok',
      summary,
      family_code: familyCode || null,
      metrics: {
        targets: effectiveTargets.length,
        queued,
        skipped,
        failed
      },
      results,
      affected_ids: affectedIds,
      payload: {
        createdBy,
        force,
        today: dashboard.today
      },
      created_by: createdBy
    }
  ])

  return {
    ok: failed === 0,
    status: failed === 0 ? 200 : 207,
    message: summary,
    metrics: {
      targets: effectiveTargets.length,
      queued,
      skipped,
      failed
    },
    results
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

  const data = await loadDashboard(request)
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

  if (action === 'queueReminders') result = await runReminders(body, request)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
