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

const signalMap: Record<string, {
  signalType: string
  signalLabel: string
  requestType: string
  riskLevel: string
  status: string
  requestedAction: string
}> = {
  ok: {
    signalType: 'daily_ok',
    signalLabel: '괜찮아요',
    requestType: 'daily_checkin',
    riskLevel: 'low',
    status: 'completed',
    requestedAction: '전화 확인 결과 정상 상태로 기록했습니다.'
  },
  meal: {
    signalType: 'meal_missed',
    signalLabel: '밥을 못 먹었어요',
    requestType: 'meal_delivery',
    riskLevel: 'medium',
    status: 'open',
    requestedAction: '식사 여부 확인 및 필요 시 식사 도움 연결을 검토해야 합니다.'
  },
  medication: {
    signalType: 'medication_missed',
    signalLabel: '약을 못 먹었어요',
    requestType: 'medication_reminder',
    riskLevel: 'medium',
    status: 'open',
    requestedAction: '복약 여부 확인 및 필요 시 약국 상담 또는 보호자 확인이 필요합니다.'
  },
  sick: {
    signalType: 'feeling_sick',
    signalLabel: '몸이 아파요',
    requestType: 'care_partner_check',
    riskLevel: 'high',
    status: 'open',
    requestedAction: '보호자 전화 확인이 필요합니다. 응급상황이면 119 또는 의료기관 연락을 안내해야 합니다.'
  },
  urgent: {
    signalType: 'urgent_neighbor_help',
    signalLabel: '지금 도움이 필요해요',
    requestType: 'urgent_neighbor_help',
    riskLevel: 'high',
    status: 'open',
    requestedAction: '즉시 보호자 확인이 필요합니다. 응급상황이면 119 또는 의료기관 연락을 안내해야 합니다.'
  },
  noAnswer: {
    signalType: 'no_response',
    signalLabel: '전화 연결 안 됨',
    requestType: 'no_response_check',
    riskLevel: 'medium',
    status: 'open',
    requestedAction: '전화 연결이 되지 않았습니다. 재확인 또는 다른 연락수단 확인이 필요합니다.'
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function last4(value: unknown) {
  const p = phone(value)
  return p.slice(-4)
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

function authorizedOps(request: NextRequest) {
  return isOpsAuthed(request) || hasSecret(request)
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

function matchesLast4(row: Row, inputLast4: string) {
  if (!inputLast4) return false

  return [
    row.guardian_phone,
    row.parent_phone,
    row.parent_phone_last4,
    row.payload && typeof row.payload === 'object' ? (row.payload as Row).guardianPhone : '',
    row.payload && typeof row.payload === 'object' ? (row.payload as Row).parentPhone : ''
  ].some((value) => {
    const raw = text(value)
    if (!raw) return false
    if (raw === inputLast4) return true
    return last4(raw) === inputLast4
  })
}

async function loadFamily(familyCode: string, inputLast4: string, request: NextRequest) {
  const [linkResult, householdResult] = await Promise.all([
    rest('anbu_family_links?select=*&family_code=eq.' + encodeURIComponent(familyCode) + '&limit=20'),
    rest('ops_private_pilot_households?select=*&family_code=eq.' + encodeURIComponent(familyCode) + '&limit=20')
  ])

  const linkRows: Row[] = rows(linkResult).map((item) => ({ ...(item as Row), source_table: 'anbu_family_links' }))
  const householdRows: Row[] = rows(householdResult).map((item) => ({ ...(item as Row), source_table: 'ops_private_pilot_households' }))
  const all: Row[] = [...linkRows, ...householdRows]

  const matchedByLast4 = all.find((item) => matchesLast4(item, inputLast4))
  const matchedByOps = authorizedOps(request) ? all[0] : null

  return {
    all,
    matched: matchedByLast4 || matchedByOps || null,
    matchedBy: matchedByLast4 ? 'last4' : matchedByOps ? 'ops' : 'none',
    errors: {
      links: linkResult.ok ? null : linkResult.error,
      households: householdResult.ok ? null : householdResult.error
    }
  }
}

function originUrl(request: NextRequest) {
  return request.nextUrl.origin
}

function buildParentAppUrl(request: NextRequest, family: Row) {
  const direct = text(family.onboarding_url)

  if (direct) {
    return direct.startsWith('http') ? direct : originUrl(request) + direct
  }

  const params = new URLSearchParams()
  params.set('familyCode', text(family.family_code))
  params.set('parentName', text(family.parent_name) || '부모님')
  params.set('parentPhone', phone(family.parent_phone))
  params.set('guardianName', text(family.guardian_name) || '보호자')
  params.set('guardianPhone', phone(family.guardian_phone))
  params.set('serviceArea', text(family.service_area) || '우리동네')

  if (text(family.address_hint)) params.set('addressHint', text(family.address_hint))
  if (text(family.pilot_key)) params.set('pilotKey', text(family.pilot_key))

  return originUrl(request) + '/mobile/parent?' + params.toString()
}

async function createProxyCheckin(body: Row, request: NextRequest) {
  const familyCode = text(body.familyCode)
  const inputLast4 = phone(body.last4).slice(-4)
  const signalKey = text(body.signalKey) || 'ok'
  const signal = signalMap[signalKey]
  const actorType = text(body.actorType) || 'guardian'
  const notifyGuardian = bool(body.notifyGuardian)

  if (!familyCode) {
    return {
      ok: false,
      status: 400,
      message: '가족코드가 필요합니다.'
    }
  }

  if (!signal) {
    return {
      ok: false,
      status: 400,
      message: '알 수 없는 안부 상태입니다.'
    }
  }

  if (actorType !== 'ops' && inputLast4.length !== 4) {
    return {
      ok: false,
      status: 400,
      message: '보호자 또는 부모님 휴대폰 뒤 4자리가 필요합니다.'
    }
  }

  const familyResult = await loadFamily(familyCode, inputLast4, request)
  const family = familyResult.matched as Row | null

  if (!family) {
    return {
      ok: false,
      status: 404,
      message: '가족코드 또는 휴대폰 뒤 4자리가 일치하지 않습니다.'
    }
  }

  if (actorType === 'ops' && familyResult.matchedBy !== 'ops' && inputLast4.length !== 4 && !authorizedOps(request)) {
    return {
      ok: false,
      status: 401,
      message: '운영실 인증이 필요합니다.'
    }
  }

  const note = text(body.note)
  const actorName =
    text(body.actorName) ||
    (actorType === 'ops' ? '운영실' : text(family.guardian_name) || '보호자')

  const actorPhone =
    phone(body.actorPhone) ||
    (actorType === 'ops' ? phone(process.env.OPS_ALERT_PHONE) : phone(family.guardian_phone))

  const now = new Date().toISOString()
  const source = actorType === 'ops' ? 'ops_proxy_checkin' : 'guardian_proxy_checkin'
  const sourceKey = `${source}-${familyCode}-${signal.signalType}-${Date.now()}`

  const requestResult = await insertRows('care_response_requests', [
    {
      family_code: familyCode,
      parent_name: text(family.parent_name) || text(body.parentName) || '부모님',
      parent_phone: phone(family.parent_phone) || phone(body.parentPhone),
      guardian_name: text(family.guardian_name) || text(body.guardianName) || '보호자',
      guardian_phone: phone(family.guardian_phone) || phone(body.guardianPhone),
      signal_type: signal.signalType,
      signal_label: signal.signalLabel,
      request_type: signal.requestType,
      risk_level: signal.riskLevel,
      status: signal.status,
      service_area: text(family.service_area) || text(body.serviceArea) || '우리동네',
      address_hint: text(family.address_hint) || text(body.addressHint),
      requested_action: note || signal.requestedAction,
      dispatch_scope: signal.signalType === 'urgent_neighbor_help' ? 'caregiver_fast_dispatch_ready' : 'family_first',
      source,
      source_key: sourceKey,
      completed_at: signal.status === 'completed' ? now : null,
      payload: {
        source,
        proxyCheckin: true,
        actorType,
        actorName,
        actorPhone,
        note,
        notifyGuardian,
        matchedBy: familyResult.matchedBy,
        parentAppUrl: buildParentAppUrl(request, family)
      },
      updated_at: now
    }
  ])

  const createdRequest = rows(requestResult)[0]

  if (!requestResult.ok || !createdRequest) {
    return {
      ok: false,
      status: 500,
      message: '대리 안부 기록에 실패했습니다.',
      detail: requestResult.error
    }
  }

  const updateResult = await insertRows('care_response_updates', [
    {
      request_id: createdRequest.id,
      actor_type: actorType,
      actor_name: actorName,
      update_type: 'proxy_checkin',
      message: note || `${actorName}님이 전화 확인 후 “${signal.signalLabel}” 상태로 대신 기록했습니다.`,
      payload: {
        source,
        signalKey,
        signal,
        actorPhone,
        notifyGuardian
      }
    }
  ])

  const eventResult = await insertRows('user_proxy_checkin_events', [
    {
      request_id: createdRequest.id,
      family_code: familyCode,
      actor_type: actorType,
      actor_name: actorName,
      actor_phone: actorPhone,
      signal_key: signalKey,
      signal_type: signal.signalType,
      signal_label: signal.signalLabel,
      note,
      notify_guardian: notifyGuardian,
      source,
      payload: {
        updateInserted: updateResult.ok,
        parentAppUrl: buildParentAppUrl(request, family)
      }
    }
  ])

  return {
    ok: true,
    message: `${signal.signalLabel} 상태를 대신 기록했습니다.`,
    request: createdRequest,
    update: updateResult.ok ? rows(updateResult)[0] : null,
    event: eventResult.ok ? rows(eventResult)[0] : null,
    family: {
      familyCode,
      parentName: text(family.parent_name) || '부모님',
      guardianName: text(family.guardian_name) || '보호자',
      guardianPhone: phone(family.guardian_phone),
      serviceArea: text(family.service_area) || '우리동네',
      parentAppUrl: buildParentAppUrl(request, family)
    }
  }
}

async function lookupFamily(request: NextRequest) {
  const familyCode = text(request.nextUrl.searchParams.get('familyCode'))
  const inputLast4 = phone(request.nextUrl.searchParams.get('last4')).slice(-4)

  if (!familyCode) {
    return {
      ok: true,
      needsLookup: true,
      message: '가족코드를 입력해주세요.'
    }
  }

  if (inputLast4.length !== 4 && !authorizedOps(request)) {
    return {
      ok: false,
      status: 400,
      message: '휴대폰 뒤 4자리를 입력해주세요.'
    }
  }

  const familyResult = await loadFamily(familyCode, inputLast4, request)
  const family = familyResult.matched as Row | null

  if (!family) {
    return {
      ok: false,
      status: 404,
      message: '가족코드 또는 휴대폰 뒤 4자리가 일치하지 않습니다.',
      matchedCount: familyResult.all.length
    }
  }

  return {
    ok: true,
    family: {
      familyCode,
      parentName: text(family.parent_name) || '부모님',
      guardianName: text(family.guardian_name) || '보호자',
      guardianPhone: phone(family.guardian_phone),
      parentPhone: phone(family.parent_phone),
      serviceArea: text(family.service_area) || '우리동네',
      parentAppUrl: buildParentAppUrl(request, family),
      matchedBy: familyResult.matchedBy
    }
  }
}

export async function GET(request: NextRequest) {
  const result = await lookupFamily(request)
  return NextResponse.json(result, { status: result.ok ? 200 : result.status || 500 })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action) || 'createProxyCheckin'

  let result

  if (action === 'createProxyCheckin') result = await createProxyCheckin(body, request)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: result.ok ? 200 : result.status || 500 })
}
