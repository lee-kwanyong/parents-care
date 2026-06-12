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

function code6() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function suffix() {
  return new Date().toISOString().slice(11, 19).replace(/:/g, '')
}

function requestTypeLabel(type: string) {
  if (type === 'meal_delivery') return '밥을 못 먹었어요'
  if (type === 'medication_reminder') return '약을 못 먹었어요'
  if (type === 'urgent_neighbor_help') return '지금 당장 도움이 필요해요'
  if (type === 'care_partner_check') return '몸이 아파요'
  return '안부 확인이 필요해요'
}

function requestedAction(type: string) {
  if (type === 'meal_delivery') return '보호자가 식사 여부를 확인하고, 필요하면 지역상점·도시락·돌봄파트너 연결을 검토하세요.'
  if (type === 'medication_reminder') return '복약 여부를 확인하고, 처방·복용량 판단은 보호자·약사·의료기관에 문의해야 합니다.'
  if (type === 'urgent_neighbor_help') return '보호자에게 즉시 알리고, 미확인 시 지역 도움망 또는 운영실 수동 확인으로 연결하세요.'
  if (type === 'care_partner_check') return '전화 또는 방문으로 몸 상태를 확인하고, 응급 가능성이 있으면 119 또는 의료기관 연락을 안내하세요.'
  return '가족 또는 운영실이 상태를 확인하세요.'
}

function providerTypesFor(requestType: string) {
  if (requestType === 'meal_delivery') return ['meal_provider', 'care_partner']
  if (requestType === 'medication_reminder') return ['pharmacy', 'care_partner']
  if (requestType === 'urgent_neighbor_help') return ['care_partner', 'caregiver']
  if (requestType === 'care_partner_check') return ['care_partner', 'caregiver']
  return ['care_partner']
}

function jsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean)

  if (value && typeof value === 'object') {
    return []
  }

  return []
}

function payloadObject(row: Row) {
  const payload = row.payload
  return payload && typeof payload === 'object' ? payload as Row : {}
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

async function patchIds(table: string, ids: string[], patch: Row) {
  if (ids.length === 0) {
    return {
      ok: true,
      status: 200,
      data: [],
      error: null
    } as RestResult
  }

  return rest(table + '?id=in.(' + ids.map(encodeURIComponent).join(',') + ')', {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })
}

async function loadRuns() {
  const [runResult, householdResult, requestResult, providerResult, outboxResult] = await Promise.all([
    rest('gov_demo_runs?select=*&order=created_at.desc&limit=100'),
    rest('care_households?select=*&order=created_at.desc&limit=1000'),
    rest('care_response_requests?select=*&order=created_at.desc&limit=1000'),
    rest('care_providers?select=*&order=created_at.desc&limit=1000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=1000')
  ])

  if (!runResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '시연 기록을 불러오지 못했습니다.',
      detail: runResult.error
    }
  }

  const runs = rows(runResult)
  const households = rows(householdResult)
  const requests = rows(requestResult)
  const providers = rows(providerResult)
  const outbox = rows(outboxResult)

  function isDemo(row: Row) {
    const payload = payloadObject(row)
    return text(payload.source) === 'gov-demo-runner' || text(row.source_key).includes('demo-runner')
  }

  return {
    ok: true,
    runs,
    latestRun: runs[0] || null,
    metrics: {
      demoRuns: runs.length,
      createdRuns: runs.filter((row) => text(row.status) === 'created').length,
      completedRuns: runs.filter((row) => text(row.status) === 'completed').length,
      cleanedRuns: runs.filter((row) => text(row.status) === 'cleaned').length,
      demoHouseholds: households.filter(isDemo).length,
      demoRequests: requests.filter(isDemo).length,
      demoProviders: providers.filter(isDemo).length,
      demoOutbox: outbox.filter(isDemo).length,
      queuedDemoOutbox: outbox.filter((row) => isDemo(row) && text(row.status) === 'queued').length
    },
    generatedAt: new Date().toISOString()
  }
}

async function logRequest(requestId: string, actionType: string, message: string, payload?: Row) {
  await insertRows('care_response_updates', [
    {
      request_id: requestId,
      actor_type: 'demo',
      actor_name: '시연 모드',
      update_type: actionType,
      message,
      payload: payload || {}
    }
  ])

  await insertRows('ops_autopilot_logs', [
    {
      request_id: requestId,
      action_type: actionType,
      actor_name: '시연 모드',
      message,
      payload: payload || {}
    }
  ])
}

async function runScenario(body: Row) {
  const demoPhone = phone(body.demoPhone)

  if (!demoPhone) {
    return {
      ok: false,
      status: 400,
      message: '시연용 수신번호가 필요합니다.'
    }
  }

  const runMarker = 'demo-runner-' + Date.now()
  const now = new Date().toISOString()
  const familyCode = code6()
  const sfx = suffix()
  const serviceArea = text(body.serviceArea) || '데모동'
  const scenarioKey = text(body.scenarioKey) || 'urgent_full'

  const householdResult = await insertRows('care_households', [
    {
      family_code: familyCode,
      parent_name: `데모 A그룹 어르신 ${sfx}`,
      parent_phone: demoPhone,
      guardian_name: '데모 보호자',
      guardian_phone: demoPhone,
      service_area: serviceArea,
      address_hint: `${serviceArea} 실증 시연 주소`,
      risk_group: 'A',
      risk_level: 'high',
      household_status: 'active',
      pilot_group: 'A',
      consent_status: 'approved',
      consent_at: now,
      start_date: now.slice(0, 10),
      care_flags: {
        meal: true,
        medication: true,
        condition: true,
        urgent: true
      },
      notes: '지자체 시연 모드에서 생성된 A그룹 고위험 대상자',
      payload: {
        source: 'gov-demo-runner',
        runMarker,
        scenarioKey
      },
      updated_at: now
    }
  ])

  if (!householdResult.ok) {
    return {
      ok: false,
      status: householdResult.status,
      message: '시연 대상자 생성에 실패했습니다.',
      detail: householdResult.error
    }
  }

  const household = rows(householdResult)[0]

  const providerRows = [
    {
      provider_type: 'care_partner',
      provider_name: `데모 돌봄파트너 ${sfx}`,
      phone: demoPhone,
      service_area: serviceArea,
      available_status: 'available',
      verified_status: 'verified',
      qualification: '생활확인·긴급 확인 시연',
      response_time_min: 5
    },
    {
      provider_type: 'caregiver',
      provider_name: `데모 요양보호사 ${sfx}`,
      phone: demoPhone,
      service_area: serviceArea,
      available_status: 'available',
      verified_status: 'verified',
      qualification: '방문확인 시연',
      response_time_min: 10
    },
    {
      provider_type: 'meal_provider',
      provider_name: `데모 식사도움 ${sfx}`,
      phone: demoPhone,
      service_area: serviceArea,
      available_status: 'available',
      verified_status: 'verified',
      qualification: '식사 전달 시연',
      response_time_min: 20
    },
    {
      provider_type: 'pharmacy',
      provider_name: `데모 약국 ${sfx}`,
      phone: demoPhone,
      service_area: serviceArea,
      available_status: 'available',
      verified_status: 'verified',
      qualification: '복약 상담 시연',
      response_time_min: 30
    }
  ].map((row) => ({
    ...row,
    available_hours: '시연 시간',
    notes: '지자체 시연 모드 자동 생성 도움망',
    payload: {
      source: 'gov-demo-runner',
      runMarker,
      scenarioKey
    },
    updated_at: now
  }))

  const providerResult = await insertRows('care_providers', providerRows)

  if (!providerResult.ok) {
    return {
      ok: false,
      status: providerResult.status,
      message: '시연 도움망 생성에 실패했습니다.',
      detail: providerResult.error
    }
  }

  const providers = rows(providerResult)

  const requestTypes =
    scenarioKey === 'urgent_only'
      ? ['urgent_neighbor_help']
      : ['urgent_neighbor_help', 'meal_delivery', 'medication_reminder']

  const requestRows = requestTypes.map((requestType, index) => ({
    family_code: familyCode,
    parent_name: text(household.parent_name),
    parent_phone: demoPhone,
    guardian_name: '데모 보호자',
    guardian_phone: demoPhone,
    signal_type: requestType,
    signal_label: requestTypeLabel(requestType),
    request_type: requestType,
    risk_level: requestType === 'meal_delivery' ? 'medium' : 'high',
    status: 'open',
    service_area: serviceArea,
    address_hint: text(household.address_hint),
    requested_action: requestedAction(requestType),
    dispatch_scope: 'demo_family_first',
    source: 'gov-demo-runner',
    source_key: `${runMarker}-request-${index + 1}`,
    payload: {
      source: 'gov-demo-runner',
      runMarker,
      scenarioKey,
      householdId: text(household.id)
    },
    created_at: new Date(Date.now() + index * 1000).toISOString(),
    updated_at: now
  }))

  const requestResult = await insertRows('care_response_requests', requestRows)

  if (!requestResult.ok) {
    return {
      ok: false,
      status: requestResult.status,
      message: '시연 사건 생성에 실패했습니다.',
      detail: requestResult.error
    }
  }

  const requests = rows(requestResult)

  const matchRows: Row[] = []

  for (const req of requests) {
    const allowed = providerTypesFor(text(req.request_type))
    const matchedProviders = providers.filter((provider) => allowed.includes(text(provider.provider_type)))

    for (const provider of matchedProviders) {
      matchRows.push({
        request_id: req.id,
        provider_id: provider.id,
        match_status: 'notified',
        notified_at: now,
        payload: {
          source: 'gov-demo-runner',
          runMarker,
          scenarioKey,
          providerType: provider.provider_type
        },
        updated_at: now
      })
    }
  }

  const matchResult = await insertRows('care_response_matches', matchRows)
  const matches = rows(matchResult)

  const outboxRows: Row[] = []

  for (const req of requests) {
    outboxRows.push({
      family_code: familyCode,
      channel: 'sms',
      to_name: '데모 보호자',
      to_phone: demoPhone,
      title: '[시연] 부모님 후속조치 확인',
      body: [
        `${text(req.parent_name)}님의 안부 신호가 접수되었습니다.`,
        `상태: ${text(req.signal_label)}`,
        '보호자 화면에서 후속조치를 확인해주세요.',
        '응급상황이 의심되면 119 또는 의료기관에 연락해주세요.'
      ].join('\n'),
      template_code: 'demo-guardian',
      reason: 'demo-runner-guardian',
      target_url: '/response',
      status: 'queued',
      provider: 'demo-runner',
      source_key: `${runMarker}-guardian-${text(req.id)}`,
      payload: {
        source: 'gov-demo-runner',
        runMarker,
        requestId: text(req.id)
      }
    })
  }

  for (const match of matches) {
    const provider = providers.find((item) => text(item.id) === text(match.provider_id))
    const req = requests.find((item) => text(item.id) === text(match.request_id))

    if (!provider || !req) continue

    outboxRows.push({
      family_code: familyCode,
      channel: 'sms',
      to_name: text(provider.provider_name),
      to_phone: demoPhone,
      title: '[시연] 지역 후속조치 요청',
      body: [
        `${requestTypeLabel(text(req.request_type))} 요청이 접수되었습니다.`,
        `부모님: ${text(req.parent_name)}`,
        '가능하시면 요청함에서 수락 후 확인을 부탁드립니다.'
      ].join('\n'),
      template_code: 'demo-provider',
      reason: 'demo-runner-provider',
      target_url: '/provider/requests',
      status: 'queued',
      provider: 'demo-runner',
      source_key: `${runMarker}-provider-${text(match.id)}`,
      payload: {
        source: 'gov-demo-runner',
        runMarker,
        requestId: text(req.id),
        providerId: text(provider.id)
      }
    })
  }

  const outboxResult = await insertRows('notification_outbox', outboxRows)
  const outboxItems = rows(outboxResult)

  for (const req of requests) {
    await logRequest(
      text(req.id),
      'demo_created',
      '시연 모드가 대상자, 사건, 도움망 요청, 문자 대기열을 생성했습니다.',
      {
        runMarker,
        scenarioKey,
        householdId: text(household.id)
      }
    )
  }

  const runResult = await insertRows('gov_demo_runs', [
    {
      scenario_key: scenarioKey,
      scenario_label: scenarioKey === 'urgent_only' ? '긴급 도움 요청 단일 시나리오' : '전체 흐름 시연 시나리오',
      demo_phone: demoPhone,
      status: 'created',
      family_code: familyCode,
      household_id: household.id,
      request_ids: requests.map((req) => text(req.id)),
      provider_ids: providers.map((provider) => text(provider.id)),
      outbox_ids: outboxItems.map((item) => text(item.id)),
      summary: `시연 데이터 생성 완료 · 대상자 1명 · 사건 ${requests.length}건 · 도움망 ${providers.length}명 · 문자 ${outboxItems.length}건`,
      payload: {
        source: 'gov-demo-runner',
        runMarker,
        scenarioKey,
        householdId: text(household.id),
        requestIds: requests.map((req) => text(req.id)),
        providerIds: providers.map((provider) => text(provider.id)),
        outboxIds: outboxItems.map((item) => text(item.id))
      },
      created_by: '운영실'
    }
  ])

  return {
    ok: runResult.ok,
    status: runResult.ok ? 200 : 500,
    message: '시연 데이터가 생성되었습니다.',
    run: rows(runResult)[0],
    links: {
      incidents: '/admin/ops/incidents',
      notificationDispatch: '/admin/ops/notification-dispatch',
      reports: '/gov/reports',
      submissionPackage: '/gov/submission-package'
    },
    counts: {
      households: 1,
      requests: requests.length,
      providers: providers.length,
      matches: matches.length,
      outbox: outboxItems.length
    },
    detail: runResult.error
  }
}

async function latestRun() {
  const result = await rest('gov_demo_runs?select=*&order=created_at.desc&limit=1')
  return rows(result)[0]
}

async function fastForward(body: Row) {
  const runId = text(body.runId)
  let run: Row | undefined

  if (runId) {
    const result = await rest('gov_demo_runs?select=*&id=eq.' + encodeURIComponent(runId) + '&limit=1')
    run = rows(result)[0]
  } else {
    run = await latestRun()
  }

  if (!run) {
    return {
      ok: false,
      status: 404,
      message: '완료 처리할 시연 기록이 없습니다.'
    }
  }

  const payload = payloadObject(run)
  const requestIds = jsonArray(payload.requestIds || run.request_ids)
  const outboxIds = jsonArray(payload.outboxIds || run.outbox_ids)
  const runMarker = text(payload.runMarker)

  const now = new Date().toISOString()

  const requestPatch = await patchIds('care_response_requests', requestIds, {
    status: 'completed',
    completed_at: now,
    completed_note: '시연 모드에서 처리 완료로 전환했습니다.',
    updated_at: now
  })

  const matchResult = requestIds.length
    ? await rest('care_response_matches?select=*&request_id=in.(' + requestIds.map(encodeURIComponent).join(',') + ')&limit=1000')
    : { ok: true, status: 200, data: [], error: null }

  const matchIds = rows(matchResult).map((row) => text(row.id)).filter(Boolean)

  await patchIds('care_response_matches', matchIds, {
    match_status: 'completed',
    accepted_at: now,
    completed_at: now,
    note: '시연 모드 완료 처리',
    updated_at: now
  })

  await patchIds('notification_outbox', outboxIds, {
    status: 'sent',
    provider: 'demo-runner',
    provider_message_id: runMarker ? `${runMarker}-sent` : 'demo-sent',
    sent_at: now
  })

  for (const requestId of requestIds) {
    await logRequest(
      requestId,
      'demo_completed',
      '시연 모드가 도움망 수락, 문자 발송, 사건 완료 흐름을 완료 처리했습니다.',
      {
        runId: text(run.id),
        runMarker
      }
    )
  }

  const runPatch = await patchIds('gov_demo_runs', [text(run.id)], {
    status: 'completed',
    completed_at: now,
    summary: '시연 흐름을 완료 상태로 전환했습니다.'
  })

  return {
    ok: requestPatch.ok && runPatch.ok,
    status: requestPatch.ok && runPatch.ok ? 200 : 500,
    message: '시연 흐름을 완료 상태로 전환했습니다.',
    run: rows(runPatch)[0],
    counts: {
      requests: requestIds.length,
      matches: matchIds.length,
      outbox: outboxIds.length
    },
    detail: requestPatch.error || runPatch.error
  }
}

async function cleanupDemo() {
  const [runResult, householdResult, providerResult, requestResult, outboxResult] = await Promise.all([
    rest('gov_demo_runs?select=*&order=created_at.desc&limit=500'),
    rest('care_households?select=*&order=created_at.desc&limit=5000'),
    rest('care_providers?select=*&order=created_at.desc&limit=5000'),
    rest('care_response_requests?select=*&order=created_at.desc&limit=5000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=5000')
  ])

  const runs = rows(runResult)
  const households = rows(householdResult)
  const providers = rows(providerResult)
  const requests = rows(requestResult)
  const outbox = rows(outboxResult)

  function isDemo(row: Row) {
    const payload = payloadObject(row)
    return text(payload.source) === 'gov-demo-runner' || text(row.source_key).includes('demo-runner')
  }

  const now = new Date().toISOString()
  const runIds = runs.filter((row) => text(row.status) !== 'cleaned').map((row) => text(row.id)).filter(Boolean)
  const householdIds = households.filter(isDemo).map((row) => text(row.id)).filter(Boolean)
  const providerIds = providers.filter(isDemo).map((row) => text(row.id)).filter(Boolean)
  const requestIds = requests.filter(isDemo).map((row) => text(row.id)).filter(Boolean)
  const outboxIds = outbox.filter(isDemo).map((row) => text(row.id)).filter(Boolean)

  await patchIds('gov_demo_runs', runIds, {
    status: 'cleaned',
    cleaned_at: now
  })

  await patchIds('care_households', householdIds, {
    household_status: 'archived',
    notes: '시연 모드 정리 처리',
    updated_at: now
  })

  await patchIds('care_providers', providerIds, {
    available_status: 'paused',
    notes: '시연 모드 정리 처리',
    updated_at: now
  })

  await patchIds('care_response_requests', requestIds, {
    status: 'cancelled',
    completed_note: '시연 모드 정리 처리',
    updated_at: now
  })

  await patchIds('notification_outbox', outboxIds, {
    archived_at: now,
    archived_by: '시연 모드',
    archived_reason: '시연 데이터 정리'
  })

  return {
    ok: true,
    message: '시연 데이터를 정리했습니다.',
    counts: {
      runs: runIds.length,
      households: householdIds.length,
      providers: providerIds.length,
      requests: requestIds.length,
      outbox: outboxIds.length
    }
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

  const result = await loadRuns()
  return NextResponse.json(result, { status: responseStatus(result) })
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

  if (action === 'runScenario') result = await runScenario(body)
  else if (action === 'fastForward') result = await fastForward(body)
  else if (action === 'cleanupDemo') result = await cleanupDemo()
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
