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

type Family = {
  id: string
  source: string
  familyCode: string
  pilotKey: string
  parentName: string
  parentPhone: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  serviceArea: string
  addressHint: string
  status: string
  onboardingUrl: string
  createdAt: string
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

function sameKstDay(value: unknown, dayKey: string) {
  const raw = text(value)
  if (!raw) return false

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return false

  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date) === dayKey
}

function todayKey() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function payload(row: Row) {
  return row.payload && typeof row.payload === 'object' ? row.payload as Row : {}
}

function normalizeFamily(row: Row, source: string): Family {
  const p = payload(row)

  return {
    id: text(row.id),
    source,
    familyCode: text(row.family_code),
    pilotKey: text(row.pilot_key) || text(p.pilotKey),
    parentName: text(row.parent_name) || '부모님',
    parentPhone: phone(row.parent_phone),
    guardianName: text(row.guardian_name) || '보호자',
    guardianPhone: phone(row.guardian_phone),
    guardianEmail: text(row.guardian_email),
    serviceArea: text(row.service_area) || '우리동네',
    addressHint: text(row.address_hint),
    status: text(row.status) || text(row.link_status) || text(row.consent_status) || 'active',
    onboardingUrl: text(row.onboarding_url),
    createdAt: text(row.created_at)
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

function query(origin: string, path: string, params: Record<string, string>) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }

  const suffix = search.toString()

  return origin + path + (suffix ? '?' + suffix : '')
}

function familyLinks(origin: string, family: Family) {
  const guardianLast4 = family.guardianPhone.slice(-4)
  const parentLast4 = family.parentPhone.slice(-4)
  const defaultLast4 = guardianLast4 || parentLast4

  const parentAppUrl = family.onboardingUrl
    ? family.onboardingUrl.startsWith('http')
      ? family.onboardingUrl
      : origin + family.onboardingUrl
    : query(origin, '/mobile/parent', {
      familyCode: family.familyCode,
      parentName: family.parentName,
      parentPhone: family.parentPhone,
      guardianName: family.guardianName,
      guardianPhone: family.guardianPhone,
      serviceArea: family.serviceArea,
      addressHint: family.addressHint,
      pilotKey: family.pilotKey
    })

  return {
    guardianStart: query(origin, '/onboarding', {
      role: 'guardian',
      source: 'invite-center',
      familyCode: family.familyCode
    }),
    guardianRole: query(origin, '/auth/role', {
      role: 'guardian',
      source: 'invite-center'
    }),
    consentGuardian: query(origin, '/consent', {
      role: 'guardian',
      familyCode: family.familyCode,
      name: family.guardianName,
      phone: family.guardianPhone,
      guardianName: family.guardianName,
      guardianPhone: family.guardianPhone
    }),
    consentParent: query(origin, '/consent', {
      role: 'parent',
      familyCode: family.familyCode,
      name: family.parentName,
      phone: family.parentPhone,
      guardianName: family.guardianName,
      guardianPhone: family.guardianPhone
    }),
    parentApp: parentAppUrl,
    guardianReport: query(origin, '/guardian/today', {
      familyCode: family.familyCode
    }),
    guardianReportTest: query(origin, '/guardian/today', {
      familyCode: family.familyCode,
      last4: defaultLast4
    }),
    guardianProxy: query(origin, '/guardian/proxy-checkin', {
      familyCode: family.familyCode,
      last4: defaultLast4
    }),
    opsProxy: query(origin, '/ops/proxy-checkin', {
      familyCode: family.familyCode,
      last4: defaultLast4
    }),
    noResponse: origin + '/ops/no-response',
    providerRequests: origin + '/provider/urgent-requests',
    opsHome: origin + '/portal/ops'
  }
}

function messageTemplates(origin: string, family: Family) {
  const links = familyLinks(origin, family)

  return {
    guardianSms:
`[안부웍스 실증 안내]
${family.guardianName || '보호자'}님, ${family.parentName || '부모님'} 안부 확인 실증 링크입니다.

1) 실증 참여 동의:
${links.consentGuardian}

2) 보호자 오늘 리포트:
${links.guardianReport}

가족코드: ${family.familyCode}
리포트 조회 시 보호자 휴대폰 뒤 4자리가 필요합니다.

응급상황은 앱보다 먼저 119 또는 의료기관에 연락해주세요.`,

    parentSms:
`[안부웍스 부모님 안부 앱]
${family.parentName || '부모님'}님, 아래 링크에서 오늘 상태를 눌러주세요.

${links.parentApp}

버튼은 5개입니다.
괜찮아요 / 밥을 못 먹었어요 / 약을 못 먹었어요 / 몸이 아파요 / 지금 도움이 필요해요

응급상황은 119 또는 의료기관에 먼저 연락해주세요.`,

    consentOnly:
`[안부웍스 실증 참여 동의]
안부웍스 자체 예비실증 참여 전 아래 동의서를 확인해주세요.

${links.consentGuardian}

본 실증은 의료 진단·치료·응급구조를 대체하지 않는 비의료 생활확인 실증입니다.`,

    guardianKakao:
`안녕하세요. 안부웍스 실증 안내드립니다.

${family.parentName || '부모님'} 안부 확인을 위해 아래 순서로 진행해주세요.

1. 실증 참여 동의
${links.consentGuardian}

2. 부모님 앱 링크 전달
${links.parentApp}

3. 보호자 리포트 확인
${links.guardianReport}

가족코드: ${family.familyCode}
휴대폰 뒤 4자리로 리포트 조회가 가능합니다.`,

    careCenter:
`안녕하세요. 안부웍스는 고령 부모님 안부 신호를 보호자 알림, 미응답 확인, 대리입력, 안심 리포트로 연결하는 비의료 생활확인 서비스입니다.

현재 5~10가구 자체 예비실증을 통해 부모님 앱, 보호자 리포트, 문자 알림, 미응답 처리 흐름을 검증하고 있습니다.

방문요양센터 또는 요양보호사 선생님들과는 의료행위가 아닌 전화 확인, 생활확인, 병원동행 가능성, 보호자 리포트 수요를 작게 검증하고 싶습니다.

서비스 확인:
${origin}

실증 리포트:
${origin}/ops/pilot-report`,

    providerRecruit:
`[안부웍스 생활확인 파트너 모집 안내]
안부웍스는 의료행위가 아닌 생활확인, 전화 확인, 병원동행 가능 여부 응답, 결과 기록을 함께할 파트너를 모집하고 있습니다.

파트너 역할:
- 보호자 요청 확인
- 가능한 경우 전화 확인 또는 생활확인
- 결과 메모 기록
- 응급 의심 시 119 또는 의료기관 연락 안내

파트너 요청함:
${links.providerRequests}

실증 참여 동의:
${query(origin, '/consent', { role: 'provider' })}`
  }
}

function buildInviteFamily(origin: string, family: Family) {
  return {
    ...family,
    createdKst: toKst(family.createdAt),
    guardianPhoneLast4: family.guardianPhone.slice(-4),
    parentPhoneLast4: family.parentPhone.slice(-4),
    links: familyLinks(origin, family),
    templates: messageTemplates(origin, family)
  }
}

function genericTemplates(origin: string) {
  return {
    careCenter:
`안녕하세요. 안부웍스는 고령 부모님 안부 신호를 보호자 알림, 미응답 확인, 대리입력, 안심 리포트로 연결하는 비의료 생활확인 서비스입니다.

현재 5~10가구 자체 예비실증을 통해 부모님 앱, 보호자 리포트, 문자 알림, 미응답 처리 흐름을 검증하고 있습니다.

서비스 확인:
${origin}

실증 참여 동의:
${origin}/consent`,

    providerRecruit:
`[안부웍스 생활확인 파트너 모집 안내]
안부웍스는 의료행위가 아닌 생활확인, 전화 확인, 병원동행 가능 여부 응답, 결과 기록을 함께할 파트너를 모집하고 있습니다.

파트너 요청함:
${origin}/provider/urgent-requests

실증 참여 동의:
${origin}/consent?role=provider`
  }
}

async function loadDashboard(request: NextRequest) {
  const origin = request.nextUrl.origin
  const today = todayKey()

  const [householdResult, familyLinkResult, eventResult] = await Promise.all([
    rest('ops_private_pilot_households?select=*&order=created_at.desc&limit=2000'),
    rest('anbu_family_links?select=*&order=created_at.desc&limit=2000'),
    rest('ops_invite_center_events?select=*&order=created_at.desc&limit=300')
  ])

  const householdFamilies = rows(householdResult).map((item) => normalizeFamily(item, 'ops_private_pilot_households'))
  const linkFamilies = rows(familyLinkResult).map((item) => normalizeFamily(item, 'anbu_family_links'))

  const byCode = new Map<string, Family>()

  for (const family of [...householdFamilies, ...linkFamilies]) {
    if (!family.familyCode) continue
    if (!isActiveStatus(family.status)) continue
    if (!byCode.has(family.familyCode)) byCode.set(family.familyCode, family)
  }

  const families = Array.from(byCode.values()).map((family) => buildInviteFamily(origin, family))
  const events = rows(eventResult)

  const metrics = {
    totalFamilies: families.length,
    pilotFamilies: householdFamilies.filter((item) => item.familyCode && isActiveStatus(item.status)).length,
    linkedFamilies: linkFamilies.filter((item) => item.familyCode && isActiveStatus(item.status)).length,
    copyEvents: events.length,
    todayCopyEvents: events.filter((item) => sameKstDay(item.created_at, today)).length,
    guardianTargets: families.filter((item) => item.guardianPhone || item.guardianEmail).length,
    parentTargets: families.filter((item) => item.parentPhone || item.parentName).length
  }

  return {
    ok: true,
    origin,
    metrics,
    genericLinks: {
      home: origin,
      onboarding: origin + '/onboarding',
      consentGuardian: origin + '/consent?role=guardian',
      consentParent: origin + '/consent?role=parent',
      consentProvider: origin + '/consent?role=provider',
      mobileParent: origin + '/mobile/parent',
      guardianToday: origin + '/guardian/today',
      providerRequests: origin + '/provider/urgent-requests',
      opsHome: origin + '/portal/ops'
    },
    genericTemplates: genericTemplates(origin),
    families,
    events: events.map((item) => ({
      id: text(item.id),
      action: text(item.action),
      familyCode: text(item.family_code),
      targetRole: text(item.target_role),
      channel: text(item.channel),
      templateKey: text(item.template_key),
      targetUrl: text(item.target_url),
      copiedText: text(item.copied_text),
      createdBy: text(item.created_by),
      createdAt: text(item.created_at),
      createdKst: toKst(item.created_at)
    })),
    sourceErrors: {
      households: householdResult.ok ? null : householdResult.error,
      familyLinks: familyLinkResult.ok ? null : familyLinkResult.error,
      events: eventResult.ok ? null : eventResult.error
    }
  }
}

async function logCopy(body: Row, request: NextRequest) {
  const copiedText = text(body.copiedText)

  const result = await insertRows('ops_invite_center_events', [
    {
      action: text(body.action) || 'copy',
      family_code: text(body.familyCode) || null,
      target_role: text(body.targetRole),
      channel: text(body.channel),
      template_key: text(body.templateKey),
      target_url: text(body.targetUrl),
      copied_text: copiedText.slice(0, 5000),
      payload: {
        source: 'invite-center',
        path: text(body.path) || request.headers.get('referer') || '',
        copiedLength: copiedText.length,
        userAgent: request.headers.get('user-agent') || '',
        createdAt: new Date().toISOString()
      },
      created_by: text(body.createdBy) || '운영실'
    }
  ])

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '초대 링크 복사 기록 저장에 실패했습니다.',
      detail: result.error
    }
  }

  return {
    ok: true,
    message: '초대 링크 복사 기록을 저장했습니다.',
    event: rows(result)[0]
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

  if (action === 'logCopy' || action === 'copy') result = await logCopy(body, request)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
