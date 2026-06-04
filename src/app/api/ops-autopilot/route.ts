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

type Incident = {
  id: string
  request: Row
  status: string
  riskLevel: string
  signalLabel: string
  requestType: string
  requestTypeLabel: string
  parentName: string
  familyCode: string
  serviceArea: string
  ageMinutes: number
  priorityScore: number
  severityLabel: string
  nextActionCode: string
  nextActionLabel: string
  nextActionDetail: string
  slaLabel: string
  acceptedProvider?: Row
  matches: Row[]
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
    process.env.RESPONSE_ESCALATION_SECRET || '',
    process.env.OPS_AUTOPILOT_SECRET || ''
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
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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

function minutesSince(value: unknown) {
  const date = new Date(text(value) || Date.now())
  if (Number.isNaN(date.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
}

function isOpenStatus(status: string) {
  return ['open', 'dispatched', 'manual_needed', 'accepted', 'in_progress'].includes(status)
}

function acceptedMatch(matches: Row[]) {
  return matches.find((match) => ['accepted', 'in_progress', 'completed'].includes(text(match.match_status)))
}

function requestTypeLabel(type: string) {
  if (type === 'meal_delivery') return '식사 연결'
  if (type === 'medication_reminder') return '복약 확인'
  if (type === 'urgent_neighbor_help') return '긴급 도움'
  if (type === 'care_partner_check') return '돌봄 확인'
  if (type === 'pharmacy_call') return '약국 상담'
  return '안부 확인'
}

function providerTypesFor(requestType: string) {
  if (requestType === 'meal_delivery') return ['local_store', 'meal_provider', 'care_partner']
  if (requestType === 'medication_reminder') return ['care_partner', 'pharmacy', 'family']
  if (requestType === 'urgent_neighbor_help') return ['care_partner', 'caregiver', 'welfare_org', 'gov_center']
  if (requestType === 'care_partner_check') return ['care_partner', 'caregiver', 'welfare_org']
  if (requestType === 'pharmacy_call') return ['pharmacy', 'care_partner']
  return ['care_partner', 'family']
}

function requestTitle(request: Row) {
  const signal = text(request.signal_label)
  if (signal) return signal

  return requestTypeLabel(text(request.request_type))
}

function severity(request: Row) {
  const risk = text(request.risk_level)
  const type = text(request.request_type)
  const signal = text(request.signal_label)

  if (risk === 'high') return 'Red'
  if (type === 'urgent_neighbor_help') return 'Red'
  if (signal.includes('도움')) return 'Red'
  if (signal.includes('아파')) return 'Orange'
  if (signal.includes('약')) return 'Orange'
  if (signal.includes('못')) return 'Yellow'
  return 'Yellow'
}

function nextActionFor(request: Row, matches: Row[], providerMap: Record<string, Row>) {
  const status = text(request.status) || 'open'
  const risk = text(request.risk_level) || 'medium'
  const type = text(request.request_type)
  const age = minutesSince(request.created_at)
  const accepted = acceptedMatch(matches)
  const acceptedProvider = accepted ? providerMap[text(accepted.provider_id)] : undefined

  if (status === 'manual_needed') {
    return {
      code: 'ops_manual_call',
      label: '운영실 직접 확인',
      detail: '보호자 또는 부모님께 직접 전화하고, 필요하면 다른 도움망을 배정하세요.',
      sla: '즉시 확인'
    }
  }

  if (status === 'accepted' || status === 'in_progress') {
    return {
      code: 'track_completion',
      label: '처리 완료 추적',
      detail: `${text(acceptedProvider?.provider_name) || text(request.accepted_by_name) || '담당자'}가 확인 중입니다. 완료 결과가 지연되면 재확인하세요.`,
      sla: risk === 'high' ? '20분 내 완료 확인' : '60분 내 완료 확인'
    }
  }

  if (status === 'dispatched') {
    if (accepted) {
      return {
        code: 'track_completion',
        label: '처리 완료 추적',
        detail: '지역 도움망이 수락했습니다. 처리 완료 결과를 확인하세요.',
        sla: risk === 'high' ? '20분 내 완료 확인' : '60분 내 완료 확인'
      }
    }

    return {
      code: 'provider_waiting',
      label: '도움망 수락 대기',
      detail: age >= 5 ? '아직 수락자가 없습니다. 운영실 수동 확인 또는 추가 도움망 전파가 필요합니다.' : '지역 도움망 수락을 기다리는 중입니다.',
      sla: risk === 'high' ? '5분 내 미수락 시 수동 연결' : '30분 내 미수락 시 확인'
    }
  }

  if (status === 'open') {
    if (risk === 'high' || type === 'urgent_neighbor_help') {
      return {
        code: 'guardian_and_provider',
        label: '보호자 알림 + 도움망 요청',
        detail: '보호자에게 알리고 동시에 가까운 지역 도움망에 확인 요청을 보내세요.',
        sla: '3분 내 도움망 요청'
      }
    }

    return {
      code: 'guardian_notify',
      label: '보호자 알림',
      detail: '보호자에게 안부 신호와 다음 할 일을 먼저 안내하세요.',
      sla: '30분 내 보호자 확인'
    }
  }

  return {
    code: 'monitor',
    label: '상태 관찰',
    detail: '현재 상태를 관찰하세요.',
    sla: '상태 변화 감시'
  }
}

function scoreIncident(request: Row, matches: Row[]) {
  const status = text(request.status) || 'open'
  const risk = text(request.risk_level) || 'medium'
  const type = text(request.request_type)
  const age = minutesSince(request.created_at)

  let score = age

  if (risk === 'high') score += 120
  if (type === 'urgent_neighbor_help') score += 120
  if (status === 'manual_needed') score += 100
  if (status === 'open') score += 70
  if (status === 'dispatched' && !acceptedMatch(matches)) score += 60
  if (status === 'accepted' || status === 'in_progress') score += 30

  return score
}

async function loadData() {
  const [requestResult, matchResult, providerResult, outboxResult, logResult] = await Promise.all([
    rest('care_response_requests?select=*&order=created_at.desc&limit=500'),
    rest('care_response_matches?select=*&order=created_at.desc&limit=1000'),
    rest('care_providers?select=*&order=created_at.desc&limit=1000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=300'),
    rest('ops_autopilot_logs?select=*&order=created_at.desc&limit=300')
  ])

  if (!requestResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '후속조치 요청을 불러오지 못했습니다.',
      detail: requestResult.error
    }
  }

  const requests = rows(requestResult)
  const matches = rows(matchResult)
  const providers = rows(providerResult)
  const outbox = rows(outboxResult)
  const logs = rows(logResult)

  const matchesByRequest: Record<string, Row[]> = {}
  for (const match of matches) {
    const requestId = text(match.request_id)
    if (!requestId) continue
    matchesByRequest[requestId] = matchesByRequest[requestId] || []
    matchesByRequest[requestId].push(match)
  }

  const providerMap: Record<string, Row> = {}
  for (const provider of providers) {
    const id = text(provider.id)
    if (id) providerMap[id] = provider
  }

  const incidents: Incident[] = requests
    .filter((request) => isOpenStatus(text(request.status) || 'open'))
    .map((request) => {
      const id = text(request.id)
      const requestMatches = matchesByRequest[id] || []
      const action = nextActionFor(request, requestMatches, providerMap)
      const accepted = acceptedMatch(requestMatches)
      const acceptedProvider = accepted ? providerMap[text(accepted.provider_id)] : undefined
      const riskLevel = text(request.risk_level) || 'medium'
      const requestType = text(request.request_type)

      return {
        id,
        request,
        status: text(request.status) || 'open',
        riskLevel,
        signalLabel: requestTitle(request),
        requestType,
        requestTypeLabel: requestTypeLabel(requestType),
        parentName: text(request.parent_name) || '부모님',
        familyCode: text(request.family_code),
        serviceArea: text(request.service_area) || '권역 미지정',
        ageMinutes: minutesSince(request.created_at),
        priorityScore: scoreIncident(request, requestMatches),
        severityLabel: severity(request),
        nextActionCode: action.code,
        nextActionLabel: action.label,
        nextActionDetail: action.detail,
        slaLabel: action.sla,
        acceptedProvider,
        matches: requestMatches
      }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)

  const openIncidents = incidents.filter((incident) => !['completed', 'cancelled'].includes(incident.status))
  const urgentIncidents = incidents.filter((incident) => incident.severityLabel === 'Red')
  const manualNeeded = incidents.filter((incident) => incident.status === 'manual_needed')
  const waitingProvider = incidents.filter((incident) => incident.status === 'dispatched' && !acceptedMatch(incident.matches))

  return {
    ok: true,
    requests,
    matches,
    providers,
    outbox,
    logs,
    incidents,
    metrics: {
      open: openIncidents.length,
      urgent: urgentIncidents.length,
      manualNeeded: manualNeeded.length,
      waitingProvider: waitingProvider.length,
      providers: providers.length,
      queued: outbox.filter((item) => text(item.status) === 'queued').length,
      sent: outbox.filter((item) => text(item.status) === 'sent').length,
      logs: logs.length
    }
  }
}

async function loadRequest(id: string) {
  const result = await rest('care_response_requests?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1')
  return rows(result)[0]
}

async function logAction(input: {
  requestId?: string
  actionType: string
  message: string
  payload?: Row
}) {
  await rest('ops_autopilot_logs', {
    method: 'POST',
    body: JSON.stringify([
      {
        request_id: input.requestId || null,
        action_type: input.actionType,
        actor_name: '안부웍스 오토파일럿',
        message: input.message,
        payload: input.payload || {}
      }
    ])
  })

  if (input.requestId) {
    await rest('care_response_updates', {
      method: 'POST',
      body: JSON.stringify([
        {
          request_id: input.requestId,
          actor_type: 'system',
          actor_name: '안부웍스 오토파일럿',
          update_type: input.actionType,
          message: input.message,
          payload: input.payload || {}
        }
      ])
    })
  }
}

async function outboxExists(sourceKey: string) {
  const result = await rest('notification_outbox?select=id&source_key=eq.' + encodeURIComponent(sourceKey) + '&limit=1')
  return rows(result).length > 0
}

async function enqueueSms(input: {
  request: Row
  toName: string
  toPhone: string
  title: string
  body: string
  templateCode: string
  reason: string
  targetUrl: string
  sourceKey: string
  payload?: Row
}) {
  const cleanPhone = phone(input.toPhone)

  if (!cleanPhone) {
    return {
      ok: false,
      skipped: true,
      reason: 'no-phone'
    }
  }

  if (await outboxExists(input.sourceKey)) {
    return {
      ok: true,
      skipped: true,
      reason: 'already-queued'
    }
  }

  const result = await rest('notification_outbox', {
    method: 'POST',
    body: JSON.stringify([
      {
        family_code: text(input.request.family_code) || null,
        channel: 'sms',
        to_name: input.toName,
        to_phone: cleanPhone,
        title: input.title,
        body: input.body,
        template_code: input.templateCode,
        reason: input.reason,
        target_url: input.targetUrl,
        status: 'queued',
        provider: 'ops-autopilot',
        source_key: input.sourceKey,
        payload: {
          requestId: text(input.request.id),
          ...input.payload
        }
      }
    ])
  })

  return {
    ok: result.ok,
    skipped: false,
    error: result.error
  }
}

async function notifyGuardian(requestId: string) {
  const request = await loadRequest(requestId)

  if (!request) {
    return {
      ok: false,
      message: '요청을 찾지 못했습니다.'
    }
  }

  const title = '[안부웍스] 부모님 후속조치 확인'
  const body = [
    `${text(request.parent_name) || '부모님'}님의 안부 신호가 접수되었습니다.`,
    `상태: ${requestTitle(request)}`,
    `다음 할 일: ${nextActionFor(request, [], {}).detail}`,
    '',
    '보호자 화면에서 확인 후 처리 결과를 남겨주세요.'
  ].join('\n')

  const result = await enqueueSms({
    request,
    toName: text(request.guardian_name) || '보호자',
    toPhone: text(request.guardian_phone),
    title,
    body,
    templateCode: 'guardian-followup',
    reason: 'ops-autopilot-guardian',
    targetUrl: '/response',
    sourceKey: `ops-auto-guardian-${requestId}`,
    payload: {
      action: 'guardian_notify'
    }
  })

  await logAction({
    requestId,
    actionType: 'guardian_notify',
    message: result.skipped ? '보호자 알림이 이미 대기열에 있거나 번호가 없습니다.' : '보호자 알림을 대기열에 넣었습니다.',
    payload: {
      result
    }
  })

  return {
    ok: result.ok,
    message: result.skipped ? '보호자 알림이 이미 있거나 번호가 없습니다.' : '보호자 알림을 대기열에 넣었습니다.',
    result
  }
}

async function providerQuery(requestType: string) {
  const types = providerTypesFor(requestType)

  return (
    'care_providers?select=*&available_status=eq.available&provider_type=in.(' +
    types.map(encodeURIComponent).join(',') +
    ')&order=response_time_min.asc&limit=10'
  )
}

async function dispatchProviders(requestId: string) {
  const request = await loadRequest(requestId)

  if (!request) {
    return {
      ok: false,
      message: '요청을 찾지 못했습니다.'
    }
  }

  const requestType = text(request.request_type)
  const providerResult = await rest(await providerQuery(requestType))
  const providers = rows(providerResult)

  if (providers.length === 0) {
    await rest('care_response_requests?id=eq.' + encodeURIComponent(requestId), {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'manual_needed',
        updated_at: new Date().toISOString()
      })
    })

    await logAction({
      requestId,
      actionType: 'provider_dispatch_failed',
      message: '조건에 맞는 지역 도움망이 없어 수동 연결 필요로 전환했습니다.',
      payload: {
        requestType
      }
    })

    return {
      ok: true,
      message: '조건에 맞는 지역 도움망이 없어 수동 연결 필요로 전환했습니다.',
      matched: 0
    }
  }

  const existingResult = await rest(
    'care_response_matches?select=provider_id&request_id=eq.' +
    encodeURIComponent(requestId) +
    '&limit=200'
  )

  const existingProviderIds = new Set(rows(existingResult).map((row) => text(row.provider_id)))
  const newProviders = providers.filter((provider) => !existingProviderIds.has(text(provider.id)))

  if (newProviders.length > 0) {
    await rest('care_response_matches', {
      method: 'POST',
      body: JSON.stringify(
        newProviders.map((provider) => ({
          request_id: requestId,
          provider_id: provider.id,
          match_status: 'notified',
          payload: {
            requestType,
            providerType: provider.provider_type,
            source: 'ops-autopilot'
          },
          updated_at: new Date().toISOString()
        }))
      )
    })
  }

  await rest('care_response_requests?id=eq.' + encodeURIComponent(requestId), {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'dispatched',
      dispatch_scope: 'ops_autopilot',
      updated_at: new Date().toISOString()
    })
  })

  const outboxResults = []

  for (const provider of newProviders) {
    const title = '[안부웍스] 지역 후속조치 요청'
    const body = [
      `${requestTypeLabel(requestType)} 요청이 접수되었습니다.`,
      `상태: ${requestTitle(request)}`,
      `부모님: ${text(request.parent_name) || '부모님'}`,
      '',
      '가능하시면 요청함에서 수락 후 전화 또는 방문 확인을 부탁드립니다.',
      '응급상황이 의심되면 119 또는 의료기관에 연락해주세요.'
    ].join('\n')

    const queued = await enqueueSms({
      request,
      toName: text(provider.provider_name) || '지역 도움망',
      toPhone: text(provider.phone),
      title,
      body,
      templateCode: 'care-response-dispatch',
      reason: 'care-response-dispatch',
      targetUrl: '/provider/requests',
      sourceKey: `ops-auto-provider-${requestId}-${text(provider.id)}`,
      payload: {
        action: 'provider_dispatch',
        providerId: text(provider.id),
        requestType
      }
    })

    outboxResults.push({
      providerId: text(provider.id),
      providerName: text(provider.provider_name),
      queued
    })
  }

  await logAction({
    requestId,
    actionType: 'provider_dispatch',
    message: `${newProviders.length}명의 지역 도움망에게 요청을 보냈습니다.`,
    payload: {
      providers: newProviders,
      outboxResults
    }
  })

  return {
    ok: true,
    message: `${newProviders.length}명의 지역 도움망에게 요청을 보냈습니다.`,
    matched: newProviders.length,
    outboxResults
  }
}

async function markInProgress(requestId: string) {
  const result = await rest('care_response_requests?id=eq.' + encodeURIComponent(requestId), {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'in_progress',
      accepted_by_name: '운영실',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  })

  await logAction({
    requestId,
    actionType: 'ops_in_progress',
    message: '운영실이 직접 확인 중으로 변경했습니다.',
    payload: {
      result: result.data
    }
  })

  return {
    ok: result.ok,
    message: result.ok ? '운영실 확인 중으로 변경했습니다.' : '상태 변경에 실패했습니다.',
    detail: result.error
  }
}

async function markCompleted(requestId: string, note: string) {
  const result = await rest('care_response_requests?id=eq.' + encodeURIComponent(requestId), {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_note: note || '운영실 오토파일럿 처리 완료',
      updated_at: new Date().toISOString()
    })
  })

  await logAction({
    requestId,
    actionType: 'completed',
    message: note || '운영실 오토파일럿 처리 완료',
    payload: {
      result: result.data
    }
  })

  return {
    ok: result.ok,
    message: result.ok ? '처리 완료로 변경했습니다.' : '완료 처리에 실패했습니다.',
    detail: result.error
  }
}

async function cancelRequest(requestId: string, note: string) {
  const result = await rest('care_response_requests?id=eq.' + encodeURIComponent(requestId), {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'cancelled',
      completed_note: note || '운영실 취소',
      updated_at: new Date().toISOString()
    })
  })

  await logAction({
    requestId,
    actionType: 'cancelled',
    message: note || '운영실 취소',
    payload: {
      result: result.data
    }
  })

  return {
    ok: result.ok,
    message: result.ok ? '요청을 취소했습니다.' : '취소 처리에 실패했습니다.',
    detail: result.error
  }
}

async function runAutopilotPass(options: { autoSend?: boolean; request?: NextRequest }) {
  const data = await loadData()

  if (!data.ok) return data

  const incidents = data.incidents as Incident[]
  const results = []

  for (const incident of incidents) {
    if (incident.status === 'open') {
      const guardian = await notifyGuardian(incident.id)
      results.push({
        requestId: incident.id,
        action: 'guardian_notify',
        result: guardian
      })

      if (incident.riskLevel === 'high' || incident.requestType === 'urgent_neighbor_help') {
        const providers = await dispatchProviders(incident.id)
        results.push({
          requestId: incident.id,
          action: 'provider_dispatch',
          result: providers
        })
      }
    }

    if (incident.status === 'dispatched' && !acceptedMatch(incident.matches) && incident.ageMinutes >= 5) {
      await rest('care_response_requests?id=eq.' + encodeURIComponent(incident.id), {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'manual_needed',
          updated_at: new Date().toISOString()
        })
      })

      await logAction({
        requestId: incident.id,
        actionType: 'manual_needed',
        message: '도움망 미수락 시간이 지나 수동 연결 필요로 전환했습니다.',
        payload: {
          ageMinutes: incident.ageMinutes
        }
      })

      results.push({
        requestId: incident.id,
        action: 'manual_needed',
        result: {
          ok: true
        }
      })
    }
  }

  let dispatchResult: unknown = null

  if (options.autoSend && options.request) {
    const origin = options.request.nextUrl.origin
    const cookie = options.request.headers.get('cookie') || ''

    try {
      const response = await fetch(origin + '/api/notifications/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie
        },
        body: JSON.stringify({
          action: 'dispatchQueued',
          limit: 50
        })
      })

      const raw = await response.text()

      try {
        dispatchResult = raw ? JSON.parse(raw) : null
      } catch {
        dispatchResult = raw
      }
    } catch (error) {
      dispatchResult = {
        ok: false,
        message: error instanceof Error ? error.message : '문자 자동 발송 실패'
      }
    }
  }

  await logAction({
    actionType: options.autoSend ? 'autopilot_pass_with_send' : 'autopilot_pass',
    message: options.autoSend ? '오토파일럿 자동 대응과 문자 발송을 실행했습니다.' : '오토파일럿 자동 대응을 실행했습니다.',
    payload: {
      results,
      dispatchResult
    }
  })

  return {
    ok: true,
    message: options.autoSend ? '오토파일럿을 실행하고 문자 발송까지 시도했습니다.' : '오토파일럿을 실행했습니다.',
    results,
    dispatchResult
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

  const action = text(request.nextUrl.searchParams.get('action'))

  if (action === 'run') {
    const autoSend = text(request.nextUrl.searchParams.get('autoSend')) === 'true'
    const result = await runAutopilotPass({ autoSend, request })
    return NextResponse.json(result, { status: responseStatus(result) })
  }

  const data = await loadData()
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
  const requestId = text(body.requestId)
  const note = text(body.note)

  if (action === 'runAutopilot') {
    return NextResponse.json(
      await runAutopilotPass({ autoSend: Boolean(body.autoSend), request })
    )
  }

  if (!requestId && action !== 'runAutopilot') {
    return NextResponse.json(
      {
        ok: false,
        message: '요청 ID가 필요합니다.'
      },
      { status: 400 }
    )
  }

  if (action === 'notifyGuardian') {
    return NextResponse.json(await notifyGuardian(requestId))
  }

  if (action === 'dispatchProviders') {
    return NextResponse.json(await dispatchProviders(requestId))
  }

  if (action === 'markInProgress') {
    return NextResponse.json(await markInProgress(requestId))
  }

  if (action === 'markCompleted') {
    return NextResponse.json(await markCompleted(requestId, note))
  }

  if (action === 'cancelRequest') {
    return NextResponse.json(await cancelRequest(requestId, note))
  }

  return NextResponse.json(
    {
      ok: false,
      message: '알 수 없는 action입니다.'
    },
    { status: 400 }
  )
}
