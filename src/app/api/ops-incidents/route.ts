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

type TimelineEvent = {
  id: string
  kind: string
  title: string
  message: string
  actor: string
  status: string
  createdAt: string
  payload?: Row
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

function isOpenStatus(status: string) {
  return ['open', 'dispatched', 'manual_needed', 'accepted', 'in_progress'].includes(status)
}

function requestTypeLabel(type: string) {
  if (type === 'meal_delivery') return '식사 미확인'
  if (type === 'medication_reminder') return '복약 미확인'
  if (type === 'urgent_neighbor_help') return '도움 요청'
  if (type === 'care_partner_check') return '몸 상태 확인'
  if (type === 'pharmacy_call') return '약국 상담'
  return '안부 확인'
}

function statusLabel(status: string) {
  if (status === 'open') return '새 사건'
  if (status === 'dispatched') return '도움망 전파'
  if (status === 'manual_needed') return '수동 연결'
  if (status === 'accepted') return '수락됨'
  if (status === 'in_progress') return '확인 중'
  if (status === 'completed') return '완료'
  if (status === 'cancelled') return '취소'
  if (status === 'queued') return '문자 대기'
  if (status === 'sent') return '문자 발송'
  if (status === 'failed') return '문자 실패'
  if (status === 'notified') return '요청 전파'
  return status || '기록'
}

function providerTypeLabel(type: string) {
  if (type === 'care_partner') return '돌봄파트너'
  if (type === 'caregiver') return '요양보호사'
  if (type === 'local_store') return '지역상점'
  if (type === 'meal_provider') return '도시락/반찬'
  if (type === 'pharmacy') return '약국'
  if (type === 'welfare_org') return '수행기관'
  if (type === 'gov_center') return '지자체'
  if (type === 'family') return '가족'
  return type || '도움망'
}

function providerTypesFor(requestType: string) {
  if (requestType === 'meal_delivery') return ['local_store', 'meal_provider', 'care_partner']
  if (requestType === 'medication_reminder') return ['care_partner', 'pharmacy', 'family']
  if (requestType === 'urgent_neighbor_help') return ['care_partner', 'caregiver', 'welfare_org', 'gov_center']
  if (requestType === 'care_partner_check') return ['care_partner', 'caregiver', 'welfare_org']
  if (requestType === 'pharmacy_call') return ['pharmacy', 'care_partner']
  return ['care_partner', 'family']
}

function ageMinutes(value: unknown) {
  const d = new Date(text(value))
  if (Number.isNaN(d.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000))
}

function payloadObject(row: Row) {
  const payload = row.payload
  return payload && typeof payload === 'object' ? payload as Row : {}
}

function payloadRequestId(row: Row) {
  const payload = payloadObject(row)
  return text(payload.requestId || payload.request_id)
}

function makeEvent(event: TimelineEvent) {
  return event
}

function eventTime(value: unknown) {
  const raw = text(value)
  if (!raw) return new Date(0).getTime()
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? 0 : d.getTime()
}

function severityOf(request: Row) {
  const type = text(request.request_type)
  const risk = text(request.risk_level)
  const status = text(request.status)

  if (status === 'manual_needed') return 'Red'
  if (risk === 'high' || type === 'urgent_neighbor_help') return 'Red'
  if (type === 'care_partner_check' || type === 'medication_reminder') return 'Orange'
  return 'Yellow'
}

function incidentScore(request: Row, timeline: TimelineEvent[]) {
  let score = ageMinutes(request.created_at)

  if (severityOf(request) === 'Red') score += 120
  if (severityOf(request) === 'Orange') score += 70
  if (text(request.status) === 'manual_needed') score += 120
  if (isOpenStatus(text(request.status))) score += 60
  if (timeline.some((event) => event.kind === 'sms' && event.status === 'failed')) score += 25

  return score
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
        actor_name: '운영실',
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
          actor_type: 'ops',
          actor_name: '운영실',
          update_type: input.actionType,
          message: input.message,
          payload: input.payload || {}
        }
      ])
    })
  }
}

async function loadAll() {
  const [
    requestResult,
    matchResult,
    providerResult,
    outboxResult,
    updateResult,
    logResult,
    contactResult,
    assignmentResult,
    householdResult
  ] = await Promise.all([
    rest('care_response_requests?select=*&order=created_at.desc&limit=1000'),
    rest('care_response_matches?select=*&order=created_at.desc&limit=2000'),
    rest('care_providers?select=*&order=created_at.desc&limit=1000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=2000'),
    rest('care_response_updates?select=*&order=created_at.desc&limit=2000'),
    rest('ops_autopilot_logs?select=*&order=created_at.desc&limit=2000'),
    rest('ops_contact_attempts?select=*&order=created_at.desc&limit=2000'),
    rest('ops_incident_assignments?select=*&order=created_at.desc&limit=1000'),
    rest('care_households?select=*&order=created_at.desc&limit=1000')
  ])

  if (!requestResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '사건 목록을 불러오지 못했습니다.',
      detail: requestResult.error
    }
  }

  const requests = rows(requestResult)
  const matches = rows(matchResult)
  const providers = rows(providerResult)
  const outbox = rows(outboxResult)
  const updates = rows(updateResult)
  const logs = rows(logResult)
  const contacts = rows(contactResult)
  const assignments = rows(assignmentResult)
  const households = rows(householdResult)

  const providersById: Record<string, Row> = {}
  for (const provider of providers) {
    const id = text(provider.id)
    if (id) providersById[id] = provider
  }

  const householdsByFamily: Record<string, Row> = {}
  for (const household of households) {
    const code = text(household.family_code)
    if (code) householdsByFamily[code] = household
  }

  const matchesByRequest: Record<string, Row[]> = {}
  const updatesByRequest: Record<string, Row[]> = {}
  const logsByRequest: Record<string, Row[]> = {}
  const contactsByRequest: Record<string, Row[]> = {}
  const assignmentsByRequest: Record<string, Row[]> = {}

  for (const row of matches) {
    const id = text(row.request_id)
    if (!id) continue
    matchesByRequest[id] = matchesByRequest[id] || []
    matchesByRequest[id].push(row)
  }

  for (const row of updates) {
    const id = text(row.request_id)
    if (!id) continue
    updatesByRequest[id] = updatesByRequest[id] || []
    updatesByRequest[id].push(row)
  }

  for (const row of logs) {
    const id = text(row.request_id)
    if (!id) continue
    logsByRequest[id] = logsByRequest[id] || []
    logsByRequest[id].push(row)
  }

  for (const row of contacts) {
    const id = text(row.request_id)
    if (!id) continue
    contactsByRequest[id] = contactsByRequest[id] || []
    contactsByRequest[id].push(row)
  }

  for (const row of assignments) {
    const id = text(row.request_id)
    if (!id) continue
    assignmentsByRequest[id] = assignmentsByRequest[id] || []
    assignmentsByRequest[id].push(row)
  }

  const incidents = requests.map((request) => {
    const id = text(request.id)
    const familyCode = text(request.family_code)
    const household = householdsByFamily[familyCode] || {}

    const timeline: TimelineEvent[] = []

    timeline.push(makeEvent({
      id: 'request-' + id,
      kind: 'signal',
      title: text(request.signal_label) || requestTypeLabel(text(request.request_type)),
      message: text(request.requested_action) || '부모님 안부 신호가 접수되었습니다.',
      actor: text(request.parent_name) || '부모님',
      status: text(request.status),
      createdAt: text(request.created_at),
      payload: request
    }))

    for (const match of matchesByRequest[id] || []) {
      const provider = providersById[text(match.provider_id)] || {}
      const providerName = text(provider.provider_name) || '지역 도움망'
      const providerType = providerTypeLabel(text(provider.provider_type))

      timeline.push(makeEvent({
        id: 'match-' + text(match.id),
        kind: 'provider',
        title: `${providerName}에게 요청`,
        message: `${providerType} · 상태 ${statusLabel(text(match.match_status))}`,
        actor: providerName,
        status: text(match.match_status),
        createdAt: text(match.created_at || match.notified_at),
        payload: { match, provider }
      }))

      if (text(match.accepted_at)) {
        timeline.push(makeEvent({
          id: 'match-accepted-' + text(match.id),
          kind: 'provider_accept',
          title: `${providerName} 수락`,
          message: '지역 도움망이 요청을 수락했습니다.',
          actor: providerName,
          status: 'accepted',
          createdAt: text(match.accepted_at),
          payload: { match, provider }
        }))
      }

      if (text(match.completed_at)) {
        timeline.push(makeEvent({
          id: 'match-completed-' + text(match.id),
          kind: 'provider_complete',
          title: `${providerName} 처리 완료`,
          message: text(match.note) || '지역 도움망이 처리를 완료했습니다.',
          actor: providerName,
          status: 'completed',
          createdAt: text(match.completed_at),
          payload: { match, provider }
        }))
      }
    }

    for (const sms of outbox) {
      const exact = payloadRequestId(sms) === id
      const familyMatch = familyCode && text(sms.family_code) === familyCode
      const sourceMatch = text(sms.source_key).includes(id)

      if (!exact && !familyMatch && !sourceMatch) continue

      timeline.push(makeEvent({
        id: 'sms-' + text(sms.id),
        kind: 'sms',
        title: text(sms.title) || '문자 알림',
        message: `${text(sms.to_name) || '수신자'} · ${statusLabel(text(sms.status))} · ${text(sms.reason) || '-'}`,
        actor: '알림 발송센터',
        status: text(sms.status),
        createdAt: text(sms.sent_at || sms.created_at),
        payload: sms
      }))
    }

    for (const update of updatesByRequest[id] || []) {
      timeline.push(makeEvent({
        id: 'update-' + text(update.id),
        kind: 'update',
        title: text(update.update_type) || '상태 업데이트',
        message: text(update.message) || '-',
        actor: text(update.actor_name) || text(update.actor_type) || '시스템',
        status: text(update.update_type),
        createdAt: text(update.created_at),
        payload: update
      }))
    }

    for (const log of logsByRequest[id] || []) {
      timeline.push(makeEvent({
        id: 'log-' + text(log.id),
        kind: 'autopilot',
        title: text(log.action_type) || '오토파일럿',
        message: text(log.message) || '-',
        actor: text(log.actor_name) || '오토파일럿',
        status: text(log.action_type),
        createdAt: text(log.created_at),
        payload: log
      }))
    }

    for (const contact of contactsByRequest[id] || []) {
      timeline.push(makeEvent({
        id: 'contact-' + text(contact.id),
        kind: 'contact',
        title: text(contact.contact_type) === 'parent' ? '부모님 통화' : '보호자 통화',
        message: `${statusLabel(text(contact.result_status))} · ${text(contact.memo) || '-'}`,
        actor: text(contact.created_by) || '운영실',
        status: text(contact.result_status),
        createdAt: text(contact.created_at),
        payload: contact
      }))
    }

    for (const assignment of assignmentsByRequest[id] || []) {
      timeline.push(makeEvent({
        id: 'assignment-' + text(assignment.id),
        kind: 'assignment',
        title: '담당자 배정',
        message: `${text(assignment.assigned_to_name) || '운영실'} · ${text(assignment.note) || '-'}`,
        actor: '운영실',
        status: text(assignment.assignment_status),
        createdAt: text(assignment.created_at),
        payload: assignment
      }))
    }

    if (text(request.completed_at)) {
      timeline.push(makeEvent({
        id: 'completed-' + id,
        kind: 'complete',
        title: '사건 완료',
        message: text(request.completed_note) || '사건이 완료 처리되었습니다.',
        actor: text(request.accepted_by_name) || '운영실',
        status: 'completed',
        createdAt: text(request.completed_at),
        payload: request
      }))
    }

    timeline.sort((a, b) => eventTime(a.createdAt) - eventTime(b.createdAt))

    const lastEvent = timeline[timeline.length - 1]

    return {
      id,
      request,
      parentName: text(household.parent_name) || text(request.parent_name) || '대상자',
      familyCode,
      guardianName: text(household.guardian_name) || text(request.guardian_name),
      guardianPhone: text(household.guardian_phone) || text(request.guardian_phone),
      parentPhone: text(household.parent_phone) || text(request.parent_phone),
      serviceArea: text(household.service_area) || text(request.service_area) || '권역 미지정',
      addressHint: text(household.address_hint) || text(request.address_hint),
      riskGroup: text(household.risk_group) || '-',
      riskLevel: text(request.risk_level) || 'medium',
      severity: severityOf(request),
      requestType: text(request.request_type),
      requestTypeLabel: requestTypeLabel(text(request.request_type)),
      signalLabel: text(request.signal_label) || requestTypeLabel(text(request.request_type)),
      status: text(request.status) || 'open',
      statusLabel: statusLabel(text(request.status)),
      ageMinutes: ageMinutes(request.created_at),
      timeline,
      timelineCount: timeline.length,
      smsCount: timeline.filter((event) => event.kind === 'sms').length,
      contactCount: timeline.filter((event) => event.kind === 'contact').length,
      providerCount: (matchesByRequest[id] || []).length,
      assignment: (assignmentsByRequest[id] || [])[0] || null,
      lastEvent,
      priorityScore: incidentScore(request, timeline)
    }
  })

  incidents.sort((a, b) => b.priorityScore - a.priorityScore)

  const metrics = {
    total: incidents.length,
    open: incidents.filter((incident) => isOpenStatus(incident.status)).length,
    urgent: incidents.filter((incident) => incident.severity === 'Red' && isOpenStatus(incident.status)).length,
    manualNeeded: incidents.filter((incident) => incident.status === 'manual_needed').length,
    completed: incidents.filter((incident) => incident.status === 'completed').length,
    sms: incidents.reduce((sum, incident) => sum + incident.smsCount, 0),
    contacts: incidents.reduce((sum, incident) => sum + incident.contactCount, 0),
    providers: incidents.reduce((sum, incident) => sum + incident.providerCount, 0),
    timelineEvents: incidents.reduce((sum, incident) => sum + incident.timelineCount, 0)
  }

  return {
    ok: true,
    incidents,
    metrics,
    generatedAt: new Date().toISOString()
  }
}

async function loadRequest(id: string) {
  const result = await rest('care_response_requests?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1')
  return rows(result)[0]
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
        provider: 'ops-incidents',
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

  if (!request) return { ok: false, status: 404, message: '요청을 찾지 못했습니다.' }

  const title = '[안부웍스] 부모님 후속조치 확인'
  const body = [
    `${text(request.parent_name) || '부모님'}님의 안부 신호가 접수되었습니다.`,
    `상태: ${text(request.signal_label) || requestTypeLabel(text(request.request_type))}`,
    '보호자 화면에서 확인 후 처리 결과를 남겨주세요.',
    '응급상황이 의심되면 119 또는 의료기관에 연락해주세요.'
  ].join('\n')

  const result = await enqueueSms({
    request,
    toName: text(request.guardian_name) || '보호자',
    toPhone: text(request.guardian_phone),
    title,
    body,
    templateCode: 'guardian-followup',
    reason: 'ops-incident-guardian',
    targetUrl: '/response',
    sourceKey: `ops-incident-guardian-${requestId}`,
    payload: { action: 'guardian_notify' }
  })

  await logAction({
    requestId,
    actionType: 'guardian_notify',
    message: result.skipped ? '보호자 알림이 이미 있거나 번호가 없습니다.' : '보호자 알림을 대기열에 넣었습니다.',
    payload: { result }
  })

  return {
    ok: result.ok,
    message: result.skipped ? '보호자 알림이 이미 있거나 번호가 없습니다.' : '보호자 알림을 대기열에 넣었습니다.',
    result
  }
}

async function dispatchProviders(requestId: string) {
  const request = await loadRequest(requestId)

  if (!request) return { ok: false, status: 404, message: '요청을 찾지 못했습니다.' }

  const types = providerTypesFor(text(request.request_type))
  const providerResult = await rest(
    'care_providers?select=*&available_status=eq.available&provider_type=in.(' +
    types.map(encodeURIComponent).join(',') +
    ')&order=response_time_min.asc&limit=10'
  )

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
      message: '가용 도움망이 없어 수동 연결 필요로 전환했습니다.',
      payload: { requestType: text(request.request_type) }
    })

    return {
      ok: true,
      message: '가용 도움망이 없어 수동 연결 필요로 전환했습니다.',
      matched: 0
    }
  }

  const existingResult = await rest('care_response_matches?select=provider_id&request_id=eq.' + encodeURIComponent(requestId) + '&limit=200')
  const existing = new Set(rows(existingResult).map((row) => text(row.provider_id)))
  const newProviders = providers.filter((provider) => !existing.has(text(provider.id)))

  if (newProviders.length > 0) {
    await rest('care_response_matches', {
      method: 'POST',
      body: JSON.stringify(newProviders.map((provider) => ({
        request_id: requestId,
        provider_id: provider.id,
        match_status: 'notified',
        payload: {
          source: 'ops-incidents',
          providerType: provider.provider_type
        },
        updated_at: new Date().toISOString()
      })))
    })
  }

  await rest('care_response_requests?id=eq.' + encodeURIComponent(requestId), {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'dispatched',
      dispatch_scope: 'ops_incidents',
      updated_at: new Date().toISOString()
    })
  })

  const results = []

  for (const provider of newProviders) {
    const title = '[안부웍스] 지역 후속조치 요청'
    const body = [
      `${requestTypeLabel(text(request.request_type))} 요청이 접수되었습니다.`,
      `상태: ${text(request.signal_label) || requestTypeLabel(text(request.request_type))}`,
      `부모님: ${text(request.parent_name) || '부모님'}`,
      '',
      '가능하시면 요청함에서 수락 후 전화 또는 방문 확인을 부탁드립니다.',
      '응급상황이 의심되면 119 또는 의료기관에 연락해주세요.'
    ].join('\n')

    results.push(await enqueueSms({
      request,
      toName: text(provider.provider_name) || '지역 도움망',
      toPhone: text(provider.phone),
      title,
      body,
      templateCode: 'care-response-dispatch',
      reason: 'care-response-dispatch',
      targetUrl: '/provider/requests',
      sourceKey: `ops-incident-provider-${requestId}-${text(provider.id)}`,
      payload: {
        providerId: text(provider.id),
        action: 'provider_dispatch'
      }
    }))
  }

  await logAction({
    requestId,
    actionType: 'provider_dispatch',
    message: `${newProviders.length}명의 도움망에게 요청을 전파했습니다.`,
    payload: { providers: newProviders, results }
  })

  return {
    ok: true,
    message: `${newProviders.length}명의 도움망에게 요청을 전파했습니다.`,
    matched: newProviders.length,
    results
  }
}

async function assignOperator(requestId: string, assignedToName: string, note: string) {
  const result = await rest('ops_incident_assignments', {
    method: 'POST',
    body: JSON.stringify([
      {
        request_id: requestId,
        assigned_to_name: assignedToName || '운영실',
        assigned_role: 'ops',
        assignment_status: 'active',
        note: note || '사건 담당자 배정',
        updated_at: new Date().toISOString()
      }
    ])
  })

  await logAction({
    requestId,
    actionType: 'assign_operator',
    message: `${assignedToName || '운영실'}에게 사건을 배정했습니다.`,
    payload: { result: result.data, note }
  })

  return {
    ok: result.ok,
    message: result.ok ? '담당자를 배정했습니다.' : '담당자 배정에 실패했습니다.',
    detail: result.error
  }
}

async function recordContact(requestId: string, contactType: string, resultStatus: string, memo: string) {
  const request = await loadRequest(requestId)

  if (!request) return { ok: false, status: 404, message: '요청을 찾지 못했습니다.' }

  const isParent = contactType === 'parent'
  const toName = isParent ? text(request.parent_name) || '부모님' : text(request.guardian_name) || '보호자'
  const toPhone = isParent ? text(request.parent_phone) : text(request.guardian_phone)

  const result = await rest('ops_contact_attempts', {
    method: 'POST',
    body: JSON.stringify([
      {
        request_id: requestId,
        contact_type: contactType || 'guardian',
        to_name: toName,
        to_phone: phone(toPhone),
        result_status: resultStatus || 'connected',
        memo: memo || '운영실 통화 기록',
        created_by: '운영실'
      }
    ])
  })

  await logAction({
    requestId,
    actionType: 'contact_attempt',
    message: `${toName} 통화 기록을 남겼습니다.`,
    payload: { contactType, resultStatus, memo }
  })

  return {
    ok: result.ok,
    message: result.ok ? '통화 기록을 남겼습니다.' : '통화 기록 저장에 실패했습니다.',
    detail: result.error
  }
}

async function addNote(requestId: string, note: string) {
  if (!note) {
    return {
      ok: false,
      status: 400,
      message: '메모 내용이 필요합니다.'
    }
  }

  await logAction({
    requestId,
    actionType: 'ops_note',
    message: note,
    payload: { note }
  })

  return {
    ok: true,
    message: '사건 메모를 남겼습니다.'
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
    message: '운영실 확인 중으로 변경했습니다.',
    payload: { result: result.data }
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
      completed_note: note || '운영실 처리 완료',
      updated_at: new Date().toISOString()
    })
  })

  await logAction({
    requestId,
    actionType: 'completed',
    message: note || '운영실 처리 완료',
    payload: { result: result.data }
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
    payload: { result: result.data }
  })

  return {
    ok: result.ok,
    message: result.ok ? '요청을 취소했습니다.' : '취소 처리에 실패했습니다.',
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

  const status = text(request.nextUrl.searchParams.get('status')) || 'open'
  const data = await loadAll()

  if (!data.ok) return NextResponse.json(data, { status: responseStatus(data) })

  let incidents = data.incidents || []

  if (status === 'open') {
    incidents = incidents.filter((incident: Row) => isOpenStatus(text(incident.status)))
  } else if (status === 'urgent') {
    incidents = incidents.filter((incident: Row) => text(incident.severity) === 'Red' && isOpenStatus(text(incident.status)))
  } else if (status === 'completed') {
    incidents = incidents.filter((incident: Row) => text(incident.status) === 'completed')
  } else if (status === 'manual') {
    incidents = incidents.filter((incident: Row) => text(incident.status) === 'manual_needed')
  }

  return NextResponse.json({
    ...data,
    incidents,
    filter: status
  })
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

  if (!requestId) {
    return NextResponse.json(
      {
        ok: false,
        message: '요청 ID가 필요합니다.'
      },
      { status: 400 }
    )
  }

  let result

  if (action === 'notifyGuardian') result = await notifyGuardian(requestId)
  else if (action === 'dispatchProviders') result = await dispatchProviders(requestId)
  else if (action === 'assignOperator') result = await assignOperator(requestId, text(body.assignedToName) || '운영실', note)
  else if (action === 'recordContact') result = await recordContact(requestId, text(body.contactType) || 'guardian', text(body.resultStatus) || 'connected', note)
  else if (action === 'addNote') result = await addNote(requestId, note)
  else if (action === 'markInProgress') result = await markInProgress(requestId)
  else if (action === 'markCompleted') result = await markCompleted(requestId, note)
  else if (action === 'cancelRequest') result = await cancelRequest(requestId, note)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
