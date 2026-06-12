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

const roleLabels: Record<string, string> = {
  guardian: '보호자',
  child: '보호자',
  parent: '부모님',
  provider: '생활확인 파트너',
  caregiver: '생활확인 파트너',
  ops: '운영실',
  admin: '운영실',
  unknown: '미분류'
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function bool(value: unknown) {
  return value === true || value === 'true'
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

function toKst(value: unknown) {
  const date = dateValue(value)
  if (!date) return ''

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
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

  const response = await fetch(base + '/auth/v1/admin/' + path, {
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

function userMeta(user: Row) {
  const raw = user.raw_user_meta_data || user.user_metadata

  return raw && typeof raw === 'object' ? raw as Row : {}
}

function appMeta(user: Row) {
  const raw = user.raw_app_meta_data || user.app_metadata

  return raw && typeof raw === 'object' ? raw as Row : {}
}

function userRole(user: Row) {
  const meta = userMeta(user)
  const raw =
    text(meta.role) ||
    text(meta.userType) ||
    text(meta.accountType) ||
    text(meta.type) ||
    text(meta.anbuRole)

  const normalized = raw.toLowerCase()

  if (['child', 'guardian', 'protector'].includes(normalized)) return 'guardian'
  if (['parent', 'senior', 'elder'].includes(normalized)) return 'parent'
  if (['provider', 'caregiver', 'care_worker', 'care-worker', 'helper'].includes(normalized)) return 'provider'
  if (['ops', 'admin', 'operator'].includes(normalized)) return 'ops'

  return 'unknown'
}

function providers(user: Row) {
  const identities = Array.isArray(user.identities) ? user.identities as Row[] : []
  const found = identities.map((item) => text(item.provider)).filter(Boolean)

  const app = appMeta(user)
  const appProvider = text(app.provider)

  if (appProvider) found.push(appProvider)

  const appProviders = Array.isArray(app.providers) ? app.providers.map((item) => text(item)).filter(Boolean) : []
  found.push(...appProviders)

  return Array.from(new Set(found)).filter(Boolean)
}

function normalizeUser(user: Row, familyLinks: Row[], households: Row[], signals: Row[], messages: Row[]) {
  const id = text(user.id)
  const email = text(user.email)
  const p = phone(user.phone)
  const role = userRole(user)
  const meta = userMeta(user)
  const userProviders = providers(user)

  const linkedByEmail = familyLinks.filter((item) => {
    return email && text(item.guardian_email).toLowerCase() === email.toLowerCase()
  })

  const linkedByPhone = familyLinks.filter((item) => {
    const gp = phone(item.guardian_phone)
    return p && gp && gp === p
  })

  const householdByPhone = households.filter((item) => {
    const gp = phone(item.guardian_phone)
    const pp = phone(item.parent_phone)
    return p && (gp === p || pp === p)
  })

  const familyCodes = Array.from(new Set([
    ...linkedByEmail.map((item) => text(item.family_code)),
    ...linkedByPhone.map((item) => text(item.family_code)),
    ...householdByPhone.map((item) => text(item.family_code))
  ].filter(Boolean)))

  const signalCount = signals.filter((item) => familyCodes.includes(text(item.family_code))).length
  const messageCount = messages.filter((item) => familyCodes.includes(text(item.family_code))).length

  return {
    id,
    email,
    phone: p,
    role,
    roleLabel: roleLabels[role] || role,
    name: text(meta.name) || text(meta.full_name) || text(meta.nickname) || text(meta.displayName) || '',
    providers: userProviders,
    createdAt: text(user.created_at),
    createdKst: toKst(user.created_at),
    lastSignInAt: text(user.last_sign_in_at),
    lastSignInKst: toKst(user.last_sign_in_at),
    confirmedAt: text(user.email_confirmed_at),
    confirmedKst: toKst(user.email_confirmed_at),
    isConfirmed: Boolean(text(user.email_confirmed_at)),
    hasSignedIn: Boolean(text(user.last_sign_in_at)),
    familyLinkCount: linkedByEmail.length + linkedByPhone.length,
    householdCount: householdByPhone.length,
    familyCodes,
    signalCount,
    messageCount,
    rawUserMetaData: meta
  }
}

function normalizeFamily(row: Row, source: string, signals: Row[], messages: Row[]) {
  const familyCode = text(row.family_code)
  const familySignals = signals.filter((item) => text(item.family_code) === familyCode)
  const familyMessages = messages.filter((item) => text(item.family_code) === familyCode)

  return {
    id: text(row.id),
    source,
    familyCode,
    guardianName: text(row.guardian_name),
    guardianEmail: text(row.guardian_email),
    guardianPhone: phone(row.guardian_phone),
    parentName: text(row.parent_name),
    parentPhone: phone(row.parent_phone),
    serviceArea: text(row.service_area),
    status: text(row.status) || text(row.link_status) || text(row.consent_status),
    consentStatus: text(row.consent_status),
    linkStatus: text(row.link_status),
    parentJoinedAt: text(row.parent_joined_at),
    parentJoinedKst: toKst(row.parent_joined_at),
    createdAt: text(row.created_at),
    createdKst: toKst(row.created_at),
    signalCount: familySignals.length,
    lastSignalKst: toKst(familySignals[0]?.created_at),
    messageCount: familyMessages.length,
    sentMessageCount: familyMessages.filter((item) => text(item.status) === 'sent').length
  }
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

async function loadPublicTables() {
  const [
    familyLinksResult,
    householdsResult,
    signalsResult,
    messagesResult,
    onboardingResult
  ] = await Promise.all([
    rest('anbu_family_links?select=*&order=created_at.desc&limit=2000'),
    rest('ops_private_pilot_households?select=*&order=created_at.desc&limit=2000'),
    rest('care_response_requests?select=*&order=created_at.desc&limit=2000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=2000'),
    rest('user_onboarding_events?select=*&order=created_at.desc&limit=1000')
  ])

  return {
    familyLinks: rows(familyLinksResult),
    households: rows(householdsResult),
    signals: rows(signalsResult),
    messages: rows(messagesResult),
    onboardingEvents: rows(onboardingResult),
    errors: {
      familyLinks: familyLinksResult.ok ? null : familyLinksResult.error,
      households: householdsResult.ok ? null : householdsResult.error,
      signals: signalsResult.ok ? null : signalsResult.error,
      messages: messagesResult.ok ? null : messagesResult.error,
      onboardingEvents: onboardingResult.ok ? null : onboardingResult.error
    }
  }
}

function countBy<T>(items: T[], predicate: (item: T) => boolean) {
  return items.filter(predicate).length
}

function groupCount(items: Row[], keyFn: (item: Row) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyFn(item) || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

async function loadDashboard() {
  const [authResult, publicData] = await Promise.all([
    fetchAuthUsers(),
    loadPublicTables()
  ])

  if (!authResult.ok) {
    return {
      ok: false,
      status: 500,
      message: 'Supabase Auth 가입자 목록을 불러오지 못했습니다.',
      detail: authResult.error
    }
  }

  const users = authResult.users
  const familyLinks = publicData.familyLinks
  const households = publicData.households
  const signals = publicData.signals
  const messages = publicData.messages
  const onboardingEvents = publicData.onboardingEvents

  const normalizedUsers = users
    .map((user) => normalizeUser(user, familyLinks, households, signals, messages))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))

  const combinedFamilies = [
    ...familyLinks.map((item) => normalizeFamily(item, 'anbu_family_links', signals, messages)),
    ...households.map((item) => normalizeFamily(item, 'ops_private_pilot_households', signals, messages))
  ].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))

  const roleCounts = normalizedUsers.reduce<Record<string, number>>((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {})

  const providerCounts = users.reduce<Record<string, number>>((acc, user) => {
    const userProviders = providers(user)

    if (userProviders.length === 0) {
      acc.unknown = (acc.unknown || 0) + 1
    }

    for (const provider of userProviders) {
      acc[provider] = (acc[provider] || 0) + 1
    }

    return acc
  }, {})

  const familyCodesWithSignals = new Set(signals.map((item) => text(item.family_code)).filter(Boolean))

  const metrics = {
    totalUsers: normalizedUsers.length,
    users24h: countBy(normalizedUsers, (user) => isWithin(user.createdAt, 24)),
    users7d: countBy(normalizedUsers, (user) => isWithin(user.createdAt, 24 * 7)),
    confirmedUsers: countBy(normalizedUsers, (user) => user.isConfirmed),
    unconfirmedUsers: countBy(normalizedUsers, (user) => !user.isConfirmed),
    signedInUsers: countBy(normalizedUsers, (user) => user.hasSignedIn),
    unknownRoleUsers: roleCounts.unknown || 0,
    guardianUsers: roleCounts.guardian || 0,
    parentUsers: roleCounts.parent || 0,
    providerUsers: roleCounts.provider || 0,
    opsUsers: roleCounts.ops || 0,
    familyLinks: familyLinks.length,
    pilotHouseholds: households.length,
    familiesTotal: combinedFamilies.length,
    familiesWithSignals: Array.from(familyCodesWithSignals).length,
    careSignals: signals.length,
    careSignals24h: countBy(signals, (item) => isWithin(item.created_at, 24)),
    okSignals: countBy(signals, (item) => text(item.signal_type) === 'daily_ok'),
    warningSignals: countBy(signals, (item) => ['meal_missed', 'medication_missed', 'feeling_sick'].includes(text(item.signal_type))),
    urgentSignals: countBy(signals, (item) => text(item.signal_type) === 'urgent_neighbor_help' || text(item.risk_level) === 'high'),
    queuedMessages: countBy(messages, (item) => text(item.status) === 'queued'),
    sentMessages: countBy(messages, (item) => text(item.status) === 'sent'),
    failedMessages: countBy(messages, (item) => text(item.status) === 'failed'),
    cancelledMessages: countBy(messages, (item) => text(item.status) === 'cancelled'),
    onboardingEvents: onboardingEvents.length,
    roleCounts,
    providerCounts,
    messageStatusCounts: groupCount(messages, (item) => text(item.status)),
    signalTypeCounts: groupCount(signals, (item) => text(item.signal_type)),
    onboardingRoleCounts: groupCount(onboardingEvents, (item) => text(item.role))
  }

  const dropoffs = {
    signupToSignin: metrics.totalUsers ? Math.round((metrics.signedInUsers / metrics.totalUsers) * 100) : 0,
    signupToFamily: metrics.totalUsers ? Math.round((metrics.familiesTotal / metrics.totalUsers) * 100) : 0,
    familyToSignal: metrics.familiesTotal ? Math.round((metrics.familiesWithSignals / metrics.familiesTotal) * 100) : 0,
    signalToSentMessage: metrics.careSignals ? Math.round((metrics.sentMessages / metrics.careSignals) * 100) : 0
  }

  return {
    ok: true,
    metrics,
    dropoffs,
    users: normalizedUsers.slice(0, 500),
    families: combinedFamilies.slice(0, 500),
    signals: signals.slice(0, 200).map((item) => ({
      id: text(item.id),
      familyCode: text(item.family_code),
      parentName: text(item.parent_name),
      guardianName: text(item.guardian_name),
      guardianPhone: phone(item.guardian_phone),
      signalType: text(item.signal_type),
      signalLabel: text(item.signal_label) || text(item.request_type),
      riskLevel: text(item.risk_level),
      status: text(item.status),
      source: text(item.source),
      createdKst: toKst(item.created_at)
    })),
    messages: messages.slice(0, 200).map((item) => ({
      id: text(item.id),
      familyCode: text(item.family_code),
      toName: text(item.to_name),
      toPhone: phone(item.to_phone),
      title: text(item.title),
      templateCode: text(item.template_code),
      reason: text(item.reason),
      status: text(item.status),
      provider: text(item.provider),
      createdKst: toKst(item.created_at),
      sentKst: toKst(item.sent_at)
    })),
    publicErrors: publicData.errors,
    generatedAt: new Date().toISOString()
  }
}

async function updateUserRole(body: Row) {
  const userId = text(body.userId)
  const role = text(body.role)

  if (!userId) {
    return {
      ok: false,
      status: 400,
      message: 'userId가 필요합니다.'
    }
  }

  if (!['guardian', 'parent', 'provider', 'ops', 'unknown'].includes(role)) {
    return {
      ok: false,
      status: 400,
      message: '허용되지 않은 역할입니다.'
    }
  }

  const getResult = await authAdmin('users/' + encodeURIComponent(userId))

  if (!getResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '사용자 정보를 불러오지 못했습니다.',
      detail: getResult.error
    }
  }

  const raw = getResult.data as Row
  const user = (raw.user && typeof raw.user === 'object' ? raw.user : raw) as Row
  const currentMeta = userMeta(user)

  const nextMeta = {
    ...currentMeta,
    role,
    userType: role,
    accountType: role,
    anbuRole: role,
    roleUpdatedAt: new Date().toISOString()
  }

  const updateResult = await authAdmin('users/' + encodeURIComponent(userId), {
    method: 'PATCH',
    body: JSON.stringify({
      user_metadata: nextMeta
    })
  })

  if (!updateResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '사용자 역할 수정에 실패했습니다.',
      detail: updateResult.error
    }
  }

  await insertRows('user_onboarding_events', [
    {
      event_type: 'role_updated_by_ops',
      role,
      source: 'ops-users',
      path: '/admin/ops/users',
      email: text(user.email),
      phone: phone(user.phone),
      payload: {
        userId,
        previousRole: userRole(user),
        nextRole: role,
        createdAt: new Date().toISOString()
      }
    }
  ])

  return {
    ok: true,
    message: `${text(user.email) || userId} 계정을 ${roleLabels[role] || role} 역할로 수정했습니다.`,
    user: updateResult.data
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

  if (action === 'updateUserRole') result = await updateUserRole(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
