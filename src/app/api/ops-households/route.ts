import { createHash, randomUUID, timingSafeEqual } from 'crypto'
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

function code6(value: unknown) {
  return text(value).replace(/[^\d]/g, '').slice(0, 6)
}

function randomCode6() {
  return String(Math.floor(100000 + Math.random() * 900000))
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

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function responseStatus(result: unknown) {
  const maybe = result as { ok?: boolean; status?: number }
  return maybe.ok ? 200 : maybe.status || 500
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

function isOpenStatus(status: string) {
  return ['open', 'dispatched', 'manual_needed', 'accepted', 'in_progress'].includes(status)
}

function requestTypeLabel(type: string) {
  if (type === 'meal_delivery') return '밥을 못 먹었어요'
  if (type === 'medication_reminder') return '약을 못 먹었어요'
  if (type === 'urgent_neighbor_help') return '도움이 필요해요'
  if (type === 'care_partner_check') return '몸이 아파요'
  if (type === 'pharmacy_call') return '약국 상담 필요'
  return '안부 확인 필요'
}

function requestedAction(type: string) {
  if (type === 'meal_delivery') return '보호자가 식사 여부를 확인하고, 필요하면 지역상점·도시락·돌봄파트너 연결을 검토하세요.'
  if (type === 'medication_reminder') return '실제 복약 여부를 확인하고, 처방·복용량 판단은 보호자·약사·의료기관에 문의해야 합니다.'
  if (type === 'urgent_neighbor_help') return '보호자에게 즉시 알리고, 미확인 시 지역 도움망 또는 운영실 수동 확인으로 연결하세요.'
  if (type === 'care_partner_check') return '전화 또는 방문으로 몸 상태를 확인하고, 응급 가능성이 있으면 119 또는 의료기관 연락을 안내하세요.'
  return '가족 또는 운영실이 상태를 확인하세요.'
}

function normalizeHousehold(row: Row, requests: Row[]) {
  const familyCode = text(row.family_code)
  const related = familyCode
    ? requests.filter((request) => text(request.family_code) === familyCode)
    : []

  const open = related.filter((request) => isOpenStatus(text(request.status)))
  const urgent = open.filter((request) => text(request.risk_level) === 'high' || text(request.request_type) === 'urgent_neighbor_help')
  const last = related[0]

  let derivedStatus = 'normal'
  if (urgent.length > 0) derivedStatus = 'urgent'
  else if (open.length > 0) derivedStatus = 'attention'
  else if (text(row.consent_status) !== 'approved') derivedStatus = 'consent_needed'

  return {
    ...row,
    open_incident_count: open.length,
    urgent_incident_count: urgent.length,
    total_signal_count: related.length,
    last_signal_label: last ? text(last.signal_label) || requestTypeLabel(text(last.request_type)) : '',
    last_signal_at: last ? text(last.created_at) : '',
    derived_status: derivedStatus
  }
}

function metrics(households: Row[]) {
  return {
    total: households.length,
    active: households.filter((row) => text(row.household_status) === 'active').length,
    archived: households.filter((row) => text(row.household_status) === 'archived').length,
    groupA: households.filter((row) => text(row.risk_group) === 'A').length,
    groupB: households.filter((row) => text(row.risk_group) === 'B').length,
    consentApproved: households.filter((row) => text(row.consent_status) === 'approved').length,
    consentPending: households.filter((row) => text(row.consent_status) !== 'approved').length,
    openIncidents: households.reduce((sum, row) => sum + Number(row.open_incident_count || 0), 0),
    urgentIncidents: households.reduce((sum, row) => sum + Number(row.urgent_incident_count || 0), 0)
  }
}

async function logHousehold(input: {
  householdId?: string
  familyCode?: string
  actionType: string
  message: string
  payload?: Row
}) {
  await rest('care_household_logs', {
    method: 'POST',
    body: JSON.stringify([
      {
        household_id: input.householdId || null,
        family_code: input.familyCode || null,
        action_type: input.actionType,
        actor_name: '운영실',
        message: input.message,
        payload: input.payload || {}
      }
    ])
  })
}

async function loadData() {
  const [householdResult, requestResult, logResult] = await Promise.all([
    rest('care_households?select=*&order=created_at.desc&limit=1000'),
    rest('care_response_requests?select=*&order=created_at.desc&limit=2000'),
    rest('care_household_logs?select=*&order=created_at.desc&limit=200')
  ])

  if (!householdResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '실증 대상자 목록을 불러오지 못했습니다.',
      detail: householdResult.error
    }
  }

  const requests = rows(requestResult)
  const households = rows(householdResult).map((row) => normalizeHousehold(row, requests))

  return {
    ok: true,
    households,
    requests,
    logs: rows(logResult),
    metrics: metrics(households)
  }
}

async function createHousehold(body: Row) {
  const parentName = text(body.parentName)

  if (!parentName) {
    return {
      ok: false,
      status: 400,
      message: '대상자 이름이 필요합니다.'
    }
  }

  const riskGroup = text(body.riskGroup) || 'B'
  const familyCode = code6(body.familyCode) || randomCode6()

  const payload = {
    family_code: familyCode,
    parent_name: parentName,
    parent_phone: phone(body.parentPhone),
    guardian_name: text(body.guardianName),
    guardian_phone: phone(body.guardianPhone),
    service_area: text(body.serviceArea) || '우리동네',
    address_hint: text(body.addressHint),
    risk_group: riskGroup,
    risk_level: riskGroup === 'A' ? 'high' : 'medium',
    household_status: text(body.householdStatus) || 'active',
    pilot_group: riskGroup,
    consent_status: text(body.consentStatus) || 'pending',
    consent_at: text(body.consentStatus) === 'approved' ? new Date().toISOString() : null,
    start_date: text(body.startDate) || new Date().toISOString().slice(0, 10),
    care_flags: {
      meal: bool(body.mealCare),
      medication: bool(body.medicationCare),
      condition: bool(body.conditionCare),
      urgent: true
    },
    notes: text(body.notes),
    payload: {
      source: 'ops-households',
      original: body
    },
    updated_at: new Date().toISOString()
  }

  const result = await rest('care_households', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  const household = rows(result)[0]

  if (result.ok && household) {
    await logHousehold({
      householdId: text(household.id),
      familyCode,
      actionType: 'create_household',
      message: `${parentName} 대상자를 등록했습니다.`,
      payload: household
    })
  }

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '실증 대상자를 등록했습니다.' : '실증 대상자 등록에 실패했습니다.',
    household,
    detail: result.error
  }
}

async function seedDemoHouseholds(body: Row) {
  const testPhone = phone(body.testPhone)
  const serviceArea = text(body.serviceArea) || '우리동네'

  if (!testPhone) {
    return {
      ok: false,
      status: 400,
      message: '테스트 보호자 연락처가 필요합니다.'
    }
  }

  const suffix = new Date().toISOString().slice(11, 19).replace(/:/g, '')

  const names = [
    ['테스트 고위험 A', 'A'],
    ['테스트 고위험 B', 'A'],
    ['테스트 일반관리 C', 'B'],
    ['테스트 일반관리 D', 'B'],
    ['테스트 일반관리 E', 'B']
  ]

  const insertRows = names.map(([name, group], index) => ({
    family_code: randomCode6(),
    parent_name: `${name}-${suffix}`,
    parent_phone: testPhone,
    guardian_name: '테스트 보호자',
    guardian_phone: testPhone,
    service_area: serviceArea,
    address_hint: `${serviceArea} 테스트 주소 ${index + 1}`,
    risk_group: group,
    risk_level: group === 'A' ? 'high' : 'medium',
    household_status: 'active',
    pilot_group: group,
    consent_status: 'approved',
    consent_at: new Date().toISOString(),
    start_date: new Date().toISOString().slice(0, 10),
    care_flags: {
      meal: true,
      medication: true,
      condition: true,
      urgent: true
    },
    notes: '실증 테스트용 자동 생성 대상자',
    payload: {
      source: 'ops-households-demo-seed',
      testPhone
    },
    updated_at: new Date().toISOString()
  }))

  const result = await rest('care_households', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(insertRows)
  })

  const households = rows(result)

  if (result.ok) {
    await logHousehold({
      actionType: 'seed_demo_households',
      message: `테스트 실증 대상자 ${households.length}명을 등록했습니다.`,
      payload: { households }
    })
  }

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? `테스트 실증 대상자 ${households.length}명을 등록했습니다.` : '테스트 대상자 등록에 실패했습니다.',
    households,
    detail: result.error
  }
}

async function updateHousehold(body: Row) {
  const id = text(body.id)

  if (!id) {
    return {
      ok: false,
      status: 400,
      message: 'household id가 필요합니다.'
    }
  }

  const patch: Row = {
    updated_at: new Date().toISOString()
  }

  if (text(body.familyCode)) patch.family_code = code6(body.familyCode)
  if (text(body.parentName)) patch.parent_name = text(body.parentName)
  if (text(body.parentPhone)) patch.parent_phone = phone(body.parentPhone)
  if (text(body.guardianName)) patch.guardian_name = text(body.guardianName)
  if (text(body.guardianPhone)) patch.guardian_phone = phone(body.guardianPhone)
  if (text(body.serviceArea)) patch.service_area = text(body.serviceArea)
  if (text(body.addressHint)) patch.address_hint = text(body.addressHint)
  if (text(body.riskGroup)) {
    patch.risk_group = text(body.riskGroup)
    patch.pilot_group = text(body.riskGroup)
    patch.risk_level = text(body.riskGroup) === 'A' ? 'high' : 'medium'
  }
  if (text(body.householdStatus)) patch.household_status = text(body.householdStatus)
  if (text(body.consentStatus)) {
    patch.consent_status = text(body.consentStatus)
    if (text(body.consentStatus) === 'approved') patch.consent_at = new Date().toISOString()
  }
  if (text(body.notes)) patch.notes = text(body.notes)

  const result = await rest('care_households?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  const household = rows(result)[0]

  if (result.ok && household) {
    await logHousehold({
      householdId: id,
      familyCode: text(household.family_code),
      actionType: 'update_household',
      message: '실증 대상자 정보를 수정했습니다.',
      payload: { patch, household }
    })
  }

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '실증 대상자 정보를 수정했습니다.' : '수정에 실패했습니다.',
    household,
    detail: result.error
  }
}

async function archiveHousehold(body: Row) {
  return updateHousehold({
    id: body.id,
    householdStatus: 'archived',
    notes: text(body.notes) || '운영실 보관 처리'
  })
}

async function loadHousehold(id: string) {
  const result = await rest('care_households?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1')
  return rows(result)[0]
}

async function createIncident(body: Row) {
  const householdId = text(body.id)
  const requestType = text(body.requestType) || 'urgent_neighbor_help'

  if (!householdId) {
    return {
      ok: false,
      status: 400,
      message: 'household id가 필요합니다.'
    }
  }

  const household = await loadHousehold(householdId)

  if (!household) {
    return {
      ok: false,
      status: 404,
      message: '대상자를 찾지 못했습니다.'
    }
  }

  const label = text(body.signalLabel) || requestTypeLabel(requestType)
  const risk =
    requestType === 'meal_delivery'
      ? 'medium'
      : text(household.risk_level) === 'high'
        ? 'high'
        : requestType === 'urgent_neighbor_help'
          ? 'high'
          : 'medium'

  const insert = {
    family_code: text(household.family_code),
    parent_name: text(household.parent_name),
    parent_phone: phone(household.parent_phone),
    guardian_name: text(household.guardian_name),
    guardian_phone: phone(household.guardian_phone),
    signal_type: requestType,
    signal_label: label,
    request_type: requestType,
    risk_level: risk,
    status: 'open',
    service_area: text(household.service_area),
    address_hint: text(household.address_hint),
    requested_action: requestedAction(requestType),
    dispatch_scope: 'family_first',
    source: 'ops-households',
    source_key: 'household-test-' + householdId + '-' + randomUUID(),
    payload: {
      household_id: householdId,
      created_from: '/ops/households'
    },
    updated_at: new Date().toISOString()
  }

  const result = await rest('care_response_requests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([insert])
  })

  const request = rows(result)[0]

  if (result.ok) {
    await logHousehold({
      householdId,
      familyCode: text(household.family_code),
      actionType: 'create_test_incident',
      message: `${text(household.parent_name)} 대상자에게 ${label} 테스트 사건을 생성했습니다.`,
      payload: { request }
    })
  }

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '테스트 사건을 생성했습니다.' : '테스트 사건 생성에 실패했습니다.',
    request,
    detail: result.error
  }
}

export async function GET(request: NextRequest) {
  if (!isOpsAuthed(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const data = await loadData()
  return NextResponse.json(data, { status: responseStatus(data) })
}

export async function POST(request: NextRequest) {
  if (!isOpsAuthed(request)) {
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

  if (action === 'createHousehold') result = await createHousehold(body)
  else if (action === 'seedDemoHouseholds') result = await seedDemoHouseholds(body)
  else if (action === 'updateHousehold') result = await updateHousehold(body)
  else if (action === 'archiveHousehold') result = await archiveHousehold(body)
  else if (action === 'createIncident') result = await createIncident(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
