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

const signalMap: Record<string, { label: string; signalType: string; requestType: string; riskLevel: string; status: string; action: string }> = {
  ok: {
    label: '괜찮아요',
    signalType: 'daily_ok',
    requestType: 'daily_checkin',
    riskLevel: 'low',
    status: 'completed',
    action: '부모님이 괜찮다고 응답했습니다.'
  },
  meal: {
    label: '밥을 못 먹었어요',
    signalType: 'meal_missed',
    requestType: 'meal_delivery',
    riskLevel: 'medium',
    status: 'open',
    action: '보호자 식사 확인과 필요 시 지역 도움망 연결을 검토하세요.'
  },
  medication: {
    label: '약을 못 먹었어요',
    signalType: 'medication_missed',
    requestType: 'medication_reminder',
    riskLevel: 'medium',
    status: 'open',
    action: '보호자 복약 확인과 필요 시 약국 상담 또는 돌봄파트너 확인을 연결하세요.'
  },
  sick: {
    label: '몸이 아파요',
    signalType: 'feeling_sick',
    requestType: 'care_partner_check',
    riskLevel: 'high',
    status: 'open',
    action: '보호자 전화 확인을 우선하고, 응급상황이 의심되면 119 또는 의료기관 연락을 안내하세요.'
  },
  urgent: {
    label: '지금 도움이 필요해요',
    signalType: 'urgent_neighbor_help',
    requestType: 'urgent_neighbor_help',
    riskLevel: 'high',
    status: 'open',
    action: '운영실이 즉시 확인하고 가까운 요양보호사·돌봄파트너 배치를 검토하세요. 응급상황이면 119 연락을 안내하세요.'
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function numberValue(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
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

async function patchById(table: string, id: string, patch: Row) {
  return rest(`${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })
}

function createPilotKey() {
  return 'pilot-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000)
}

function familyCode(index = 0) {
  return String(910000 + Math.floor(Math.random() * 80000) + index).slice(0, 6)
}

function onboardingUrl(input: {
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  serviceArea: string
  addressHint?: string
  pilotKey: string
}) {
  const params = new URLSearchParams()
  params.set('familyCode', input.familyCode)
  params.set('parentName', input.parentName)
  params.set('guardianName', input.guardianName)
  params.set('guardianPhone', input.guardianPhone)
  params.set('serviceArea', input.serviceArea)
  params.set('pilotKey', input.pilotKey)

  if (input.addressHint) params.set('addressHint', input.addressHint)

  return '/mobile/parent?' + params.toString()
}

async function findPilot(pilotKeyOrId?: string) {
  if (pilotKeyOrId) {
    const result = await rest(
      'ops_private_pilots?select=*&or=(id.eq.' +
        encodeURIComponent(pilotKeyOrId) +
        ',pilot_key.eq.' +
        encodeURIComponent(pilotKeyOrId) +
        ')&limit=1'
    )

    const row = rows(result)[0]
    if (row) return row
  }

  const result = await rest('ops_private_pilots?select=*&order=created_at.desc&limit=1')
  return rows(result)[0]
}

async function computePilot(pilot: Row | null) {
  const [pilotResult, householdResult, reportResult, requestResult, outboxResult, matchResult, providerResult] = await Promise.all([
    rest('ops_private_pilots?select=*&order=created_at.desc&limit=100'),
    rest('ops_private_pilot_households?select=*&order=created_at.asc&limit=1000'),
    rest('ops_private_pilot_reports?select=*&order=created_at.desc&limit=100'),
    rest('care_response_requests?select=*&order=created_at.desc&limit=3000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=3000'),
    rest('care_response_matches?select=*&order=created_at.desc&limit=3000'),
    rest('care_providers?select=*&order=created_at.desc&limit=1000')
  ])

  if (!pilotResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '자체 예비 실증 테이블을 불러오지 못했습니다. SQL 실행 여부를 확인해주세요.',
      detail: pilotResult.error
    }
  }

  const pilots = rows(pilotResult)
  const selectedPilot = pilot || pilots[0] || null
  const selectedPilotKey = text(selectedPilot?.pilot_key)

  const allHouseholds = rows(householdResult)
  const households = selectedPilotKey
    ? allHouseholds.filter((row) => text(row.pilot_key) === selectedPilotKey)
    : []

  const familyCodes = new Set(households.map((row) => text(row.family_code)).filter(Boolean))
  const serviceAreas = new Set(households.map((row) => text(row.service_area)).filter(Boolean))

  const requests = rows(requestResult).filter((row) => familyCodes.has(text(row.family_code)))
  const requestIds = new Set(requests.map((row) => text(row.id)))
  const outbox = rows(outboxResult).filter((row) => familyCodes.has(text(row.family_code)))
  const matches = rows(matchResult).filter((row) => requestIds.has(text(row.request_id)))
  const providers = rows(providerResult).filter((row) => serviceAreas.has(text(row.service_area)))

  const start = text(selectedPilot?.start_date)
  const end = text(selectedPilot?.end_date)
  const now = new Date()

  let daysTotal = 0
  let daysElapsed = 0
  let daysRemaining = 0

  if (start && end) {
    const startDate = new Date(start + 'T00:00:00')
    const endDate = new Date(end + 'T23:59:59')
    daysTotal = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000))
    daysElapsed = Math.max(0, Math.min(daysTotal, Math.ceil((now.getTime() - startDate.getTime()) / 86400000)))
    daysRemaining = Math.max(0, daysTotal - daysElapsed)
  }

  const urgent = requests.filter((row) => text(row.request_type) === 'urgent_neighbor_help' || text(row.risk_level) === 'high')
  const completed = requests.filter((row) => text(row.status) === 'completed')
  const open = requests.filter((row) => ['open', 'dispatched', 'accepted', 'in_progress', 'manual_needed'].includes(text(row.status)))
  const sent = outbox.filter((row) => text(row.status) === 'sent')
  const queued = outbox.filter((row) => text(row.status) === 'queued')
  const failed = outbox.filter((row) => text(row.status) === 'failed')
  const acceptedMatches = matches.filter((row) => ['accepted', 'in_progress', 'completed'].includes(text(row.match_status)))
  const availableProviders = providers.filter((row) => text(row.available_status) === 'available' && text(row.verified_status) === 'verified')

  const metrics = {
    households: households.length,
    activeHouseholds: households.filter((row) => text(row.status) === 'active').length,
    onboardingHouseholds: households.filter((row) => text(row.status) === 'onboarding').length,
    requests: requests.length,
    urgentRequests: urgent.length,
    completedRequests: completed.length,
    openRequests: open.length,
    queuedMessages: queued.length,
    sentMessages: sent.length,
    failedMessages: failed.length,
    providers: providers.length,
    availableProviders: availableProviders.length,
    matches: matches.length,
    acceptedMatches: acceptedMatches.length,
    completionRate: requests.length ? Math.round((completed.length / requests.length) * 100) : 0,
    smsSuccessRate: outbox.length ? Math.round((sent.length / outbox.length) * 100) : 0,
    providerAcceptRate: matches.length ? Math.round((acceptedMatches.length / matches.length) * 100) : 0,
    daysTotal,
    daysElapsed,
    daysRemaining
  }

  return {
    ok: true,
    selectedPilot,
    pilots,
    households,
    requests,
    outbox,
    matches,
    providers,
    metrics,
    reports: rows(reportResult).filter((row) => !selectedPilotKey || text(row.pilot_key) === selectedPilotKey),
    generatedAt: new Date().toISOString()
  }
}

async function loadData(body?: Row) {
  const pilot = await findPilot(text(body?.pilotKey || body?.pilotId))
  return computePilot(pilot)
}

async function createPilot(body: Row) {
  const today = new Date()
  const startDate = text(body.startDate) || dateOnly(today)
  const endDate = text(body.endDate) || dateOnly(addDays(today, 13))
  const pilotKey = text(body.pilotKey) || createPilotKey()

  const result = await insertRows('ops_private_pilots', [
    {
      pilot_key: pilotKey,
      title: text(body.title) || '안부웍스 자체 예비 실증',
      status: text(body.status) || 'active',
      start_date: startDate,
      end_date: endDate,
      target_households: Number(body.targetHouseholds) || 10,
      target_providers: Number(body.targetProviders) || 2,
      owner_name: text(body.ownerName) || '운영실',
      notes: text(body.notes) || '지자체 제안 전 자체 예비 실증',
      payload: {
        source: 'ops-private-pilot',
        createdAt: new Date().toISOString()
      },
      created_by: text(body.createdBy) || '운영실',
      updated_at: new Date().toISOString()
    }
  ])

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '자체 예비 실증을 생성했습니다.' : '자체 예비 실증 생성에 실패했습니다.',
    pilot: rows(result)[0],
    detail: result.error
  }
}

async function seedHouseholds(body: Row) {
  const pilot = await findPilot(text(body.pilotKey || body.pilotId))

  if (!pilot) {
    return {
      ok: false,
      status: 404,
      message: '먼저 자체 예비 실증을 생성해주세요.'
    }
  }

  const count = Math.max(1, Math.min(30, Number(body.count) || 10))
  const pilotKey = text(pilot.pilot_key)
  const guardianPhone = phone(body.guardianPhone)
  const serviceArea = text(body.serviceArea) || 'QA실증권역'
  const now = new Date().toISOString()

  const values = Array.from({ length: count }).map((_, index) => {
    const code = familyCode(index)
    const parentName = `예비실증 부모님 ${index + 1}`
    const guardianName = `보호자 ${index + 1}`

    return {
      pilot_id: pilot.id,
      pilot_key: pilotKey,
      family_code: code,
      parent_name: parentName,
      parent_phone: '',
      guardian_name: guardianName,
      guardian_phone: guardianPhone,
      guardian_email: '',
      service_area: serviceArea,
      address_hint: `${serviceArea} 테스트 주소 ${index + 1}`,
      group_label: index < Math.ceil(count * 0.3) ? 'A그룹' : 'B그룹',
      status: 'onboarding',
      onboarding_url: onboardingUrl({
        familyCode: code,
        parentName,
        guardianName,
        guardianPhone,
        serviceArea,
        addressHint: `${serviceArea} 테스트 주소 ${index + 1}`,
        pilotKey
      }),
      notes: '자체 예비 실증 테스트 가구',
      payload: {
        source: 'seed-households',
        index,
        seededAt: now
      },
      created_by: text(body.createdBy) || '운영실',
      updated_at: now
    }
  })

  const result = await rest('ops_private_pilot_households?on_conflict=pilot_key,family_code', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(values)
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? `${count}개 예비 실증 가구를 생성했습니다.` : '예비 실증 가구 생성에 실패했습니다.',
    households: rows(result),
    detail: result.error
  }
}

async function addHousehold(body: Row) {
  const pilot = await findPilot(text(body.pilotKey || body.pilotId))

  if (!pilot) {
    return {
      ok: false,
      status: 404,
      message: '먼저 자체 예비 실증을 생성해주세요.'
    }
  }

  const pilotKey = text(pilot.pilot_key)
  const code = text(body.familyCode) || familyCode()
  const parentName = text(body.parentName) || '부모님'
  const guardianName = text(body.guardianName) || '보호자'
  const guardianPhone = phone(body.guardianPhone)
  const serviceArea = text(body.serviceArea) || '우리동네'
  const addressHint = text(body.addressHint)
  const now = new Date().toISOString()

  const result = await rest('ops_private_pilot_households?on_conflict=pilot_key,family_code', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([
      {
        pilot_id: pilot.id,
        pilot_key: pilotKey,
        family_code: code,
        parent_name: parentName,
        parent_phone: phone(body.parentPhone),
        guardian_name: guardianName,
        guardian_phone: guardianPhone,
        guardian_email: text(body.guardianEmail),
        service_area: serviceArea,
        address_hint: addressHint,
        group_label: text(body.groupLabel) || 'mini',
        status: text(body.status) || 'onboarding',
        onboarding_url: onboardingUrl({
          familyCode: code,
          parentName,
          guardianName,
          guardianPhone,
          serviceArea,
          addressHint,
          pilotKey
        }),
        notes: text(body.notes),
        payload: {
          source: 'manual-add-household',
          addedAt: now
        },
        created_by: text(body.createdBy) || '운영실',
        updated_at: now
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '예비 실증 가구를 저장했습니다.' : '가구 저장에 실패했습니다.',
    household: rows(result)[0],
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

  const patchInput = body.patch && typeof body.patch === 'object' ? body.patch as Row : {}
  const patch: Row = {
    updated_at: new Date().toISOString()
  }

  const allowed = [
    'parent_name',
    'parent_phone',
    'guardian_name',
    'guardian_phone',
    'guardian_email',
    'service_area',
    'address_hint',
    'group_label',
    'status',
    'notes',
    'payload'
  ]

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(patchInput, key)) patch[key] = patchInput[key]
  }

  const result = await patchById('ops_private_pilot_households', id, patch)

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '가구 정보를 수정했습니다.' : '가구 수정에 실패했습니다.',
    household: rows(result)[0],
    detail: result.error
  }
}

async function createSignal(body: Row) {
  const householdId = text(body.householdId)
  const signalKey = text(body.signalKey) || 'ok'
  const signal = signalMap[signalKey]

  if (!signal) {
    return {
      ok: false,
      status: 400,
      message: '알 수 없는 신호입니다.'
    }
  }

  if (!householdId) {
    return {
      ok: false,
      status: 400,
      message: 'householdId가 필요합니다.'
    }
  }

  const householdResult = await rest('ops_private_pilot_households?select=*&id=eq.' + encodeURIComponent(householdId) + '&limit=1')
  const household = rows(householdResult)[0]

  if (!household) {
    return {
      ok: false,
      status: 404,
      message: '가구를 찾지 못했습니다.'
    }
  }

  const now = new Date().toISOString()
  const sourceKey = 'private-pilot-' + text(household.pilot_key) + '-' + text(household.family_code) + '-' + signal.signalType + '-' + now.slice(0, 16)

  const requestResult = await insertRows('care_response_requests', [
    {
      family_code: text(household.family_code),
      parent_name: text(household.parent_name),
      parent_phone: phone(household.parent_phone),
      guardian_name: text(household.guardian_name),
      guardian_phone: phone(household.guardian_phone),
      signal_type: signal.signalType,
      signal_label: signal.label,
      request_type: signal.requestType,
      risk_level: signal.riskLevel,
      status: signal.status,
      service_area: text(household.service_area),
      address_hint: text(household.address_hint),
      requested_action: signal.action,
      dispatch_scope: signal.signalType === 'urgent_neighbor_help' ? 'caregiver_fast_dispatch_ready' : 'family_first',
      source: 'private_pilot',
      source_key: sourceKey,
      fast_dispatch_status: signal.signalType === 'urgent_neighbor_help' ? 'none' : null,
      completed_at: signal.status === 'completed' ? now : null,
      payload: {
        source: 'ops-private-pilot',
        pilotKey: text(household.pilot_key),
        householdId: text(household.id),
        signalKey
      },
      updated_at: now
    }
  ])

  const request = rows(requestResult)[0]

  if (!requestResult.ok || !request) {
    return {
      ok: false,
      status: 500,
      message: '실증 신호 생성에 실패했습니다.',
      detail: requestResult.error
    }
  }

  await insertRows('care_response_updates', [
    {
      request_id: request.id,
      actor_type: 'ops',
      actor_name: '자체 예비 실증',
      update_type: 'private_pilot_signal',
      message: `자체 예비 실증에서 “${signal.label}” 신호를 생성했습니다.`,
      payload: {
        pilotKey: text(household.pilot_key),
        householdId: text(household.id),
        signal
      }
    }
  ])

  let outbox: Row | null = null

  const guardianPhone = phone(household.guardian_phone)

  if (guardianPhone) {
    const outboxResult = await insertRows('notification_outbox', [
      {
        family_code: text(household.family_code),
        channel: 'sms',
        to_name: text(household.guardian_name) || '보호자',
        to_phone: guardianPhone,
        title: '[안부웍스] 예비 실증 안부 신호',
        body: [
          `${text(household.parent_name)}님이 예비 실증에서 신호를 보냈습니다.`,
          '',
          `상태: ${signal.label}`,
          `권역: ${text(household.service_area) || '-'}`,
          '',
          signal.signalType === 'urgent_neighbor_help'
            ? '운영실이 즉시 확인해야 합니다. 응급상황이면 119 또는 의료기관에 연락해주세요.'
            : '보호자 화면에서 후속조치를 확인해주세요.',
          '',
          'https://parents-care.net/mobile/guardian'
        ].join('\n'),
        template_code: 'private-pilot-signal',
        reason: 'private-pilot-signal',
        target_url: '/mobile/guardian',
        status: 'queued',
        provider: 'private-pilot',
        source_key: 'private-pilot-sms-' + text(request.id),
        payload: {
          source: 'ops-private-pilot',
          requestId: text(request.id),
          pilotKey: text(household.pilot_key)
        }
      }
    ])

    outbox = rows(outboxResult)[0] || null
  }

  return {
    ok: true,
    message: `예비 실증 신호 “${signal.label}”를 생성했습니다.`,
    request,
    outbox
  }
}

async function updatePilot(body: Row) {
  const id = text(body.id)

  if (!id) {
    return {
      ok: false,
      status: 400,
      message: 'pilot id가 필요합니다.'
    }
  }

  const patchInput = body.patch && typeof body.patch === 'object' ? body.patch as Row : {}
  const patch: Row = {
    updated_at: new Date().toISOString()
  }

  const allowed = [
    'title',
    'status',
    'start_date',
    'end_date',
    'target_households',
    'target_providers',
    'owner_name',
    'notes',
    'payload'
  ]

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(patchInput, key)) patch[key] = patchInput[key]
  }

  const result = await patchById('ops_private_pilots', id, patch)

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '실증 정보를 수정했습니다.' : '실증 수정에 실패했습니다.',
    pilot: rows(result)[0],
    detail: result.error
  }
}

async function saveMiniReport(body: Row) {
  const pilot = await findPilot(text(body.pilotKey || body.pilotId))

  if (!pilot) {
    return {
      ok: false,
      status: 404,
      message: '저장할 실증이 없습니다.'
    }
  }

  const data = await computePilot(pilot) as Row

  if (data.ok !== true) return data

  const metrics = data.metrics as Row
  const households = Array.isArray(data.households) ? data.households as Row[] : []
  const requests = Array.isArray(data.requests) ? data.requests as Row[] : []
  const outbox = Array.isArray(data.outbox) ? data.outbox as Row[] : []

  const summary = [
    `${text(pilot.title)} 미니 리포트`,
    `참여 가구 ${numberValue(metrics.households)}가구`,
    `안부 신호 ${numberValue(metrics.requests)}건`,
    `긴급 요청 ${numberValue(metrics.urgentRequests)}건`,
    `완료 사건 ${numberValue(metrics.completedRequests)}건`,
    `문자 성공률 ${numberValue(metrics.smsSuccessRate)}%`,
    `가용 도움망 ${numberValue(metrics.availableProviders)}명`
  ].join(' · ')

  const result = await insertRows('ops_private_pilot_reports', [
    {
      pilot_id: pilot.id,
      pilot_key: text(pilot.pilot_key),
      report_type: text(body.reportType) || 'mini_report',
      status: 'recorded',
      title: text(body.title) || `${text(pilot.title)} 미니 리포트`,
      summary,
      metrics,
      households,
      requests: requests.slice(0, 100),
      messages: outbox.slice(0, 100),
      payload: {
        generatedAt: new Date().toISOString(),
        selectedPilot: pilot
      },
      created_by: text(body.createdBy) || '운영실'
    }
  ])

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '자체 예비 실증 미니 리포트를 저장했습니다.' : '미니 리포트 저장에 실패했습니다.',
    report: rows(result)[0],
    detail: result.error
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

  const pilotKey = text(request.nextUrl.searchParams.get('pilotKey'))
  const data = await loadData({ pilotKey })
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

  if (action === 'createPilot') result = await createPilot(body)
  else if (action === 'seedHouseholds') result = await seedHouseholds(body)
  else if (action === 'addHousehold') result = await addHousehold(body)
  else if (action === 'updateHousehold') result = await updateHousehold(body)
  else if (action === 'updatePilot') result = await updatePilot(body)
  else if (action === 'createSignal') result = await createSignal(body)
  else if (action === 'saveMiniReport') result = await saveMiniReport(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
