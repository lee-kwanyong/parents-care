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

const FALLBACK_PLAYBOOKS: Row[] = [
  {
    request_type: 'urgent_neighbor_help',
    risk_level: 'high',
    step_order: 1,
    delay_minutes: 0,
    action_code: 'guardian_notify',
    action_label: '보호자 즉시 알림',
    action_detail: '보호자에게 부모님 도움 요청 신호와 다음 행동을 즉시 알립니다.',
    sms_template_code: 'guardian-followup',
    auto_execute: true,
    requires_human_confirm: false,
    escalation_level: 'urgent'
  },
  {
    request_type: 'urgent_neighbor_help',
    risk_level: 'high',
    step_order: 2,
    delay_minutes: 3,
    action_code: 'provider_dispatch',
    action_label: '지역 도움망 요청',
    action_detail: '가까운 돌봄파트너·요양보호사·수행기관에 확인 요청을 전파합니다.',
    sms_template_code: 'care-response-dispatch',
    auto_execute: false,
    requires_human_confirm: true,
    escalation_level: 'urgent'
  },
  {
    request_type: 'meal_delivery',
    risk_level: 'medium',
    step_order: 1,
    delay_minutes: 0,
    action_code: 'guardian_notify',
    action_label: '보호자 식사 확인 알림',
    action_detail: '보호자에게 식사 미확인 신호를 알립니다.',
    sms_template_code: 'guardian-followup',
    auto_execute: true,
    requires_human_confirm: false,
    escalation_level: 'notice'
  },
  {
    request_type: 'medication_reminder',
    risk_level: 'high',
    step_order: 1,
    delay_minutes: 0,
    action_code: 'guardian_notify',
    action_label: '보호자 복약 확인 알림',
    action_detail: '보호자에게 복약 미확인 신호를 알립니다. 처방·복용량 판단은 하지 않습니다.',
    sms_template_code: 'guardian-followup',
    auto_execute: true,
    requires_human_confirm: false,
    escalation_level: 'warning'
  }
]

function responseStatus(result: unknown) {
  const maybe = result as { ok?: boolean; status?: number }
  return maybe.ok ? 200 : maybe.status || 500
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

function providerTypeLabel(type: string) {
  if (type === 'care_partner') return '돌봄파트너'
  if (type === 'caregiver') return '요양보호사'
  if (type === 'local_store') return '지역상점'
  if (type === 'meal_provider') return '도시락/반찬'
  if (type === 'pharmacy') return '약국'
  if (type === 'welfare_org') return '수행기관'
  if (type === 'gov_center') return '지자체'
  if (type === 'family') return '가족'
  return type || '제공자'
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

function severity(request: Row, ageMinutes: number) {
  const risk = text(request.risk_level)
  const type = text(request.request_type)
  const signal = text(request.signal_label)

  if (type === 'urgent_neighbor_help' || risk === 'high') return 'Red'
  if (signal.includes('도움')) return 'Red'
  if (signal.includes('아파') || signal.includes('약')) return 'Orange'
  if (ageMinutes >= 60) return 'Orange'
  return 'Yellow'
}

function scoreIncident(request: Row, matches: Row[]) {
  const status = text(request.status) || 'open'
  const risk = text(request.risk_level) || 'medium'
  const type = text(request.request_type)
  const age = minutesSince(request.created_at)

  let score = age

  if (risk === 'high') score += 120
  if (type === 'urgent_neighbor_help') score += 120
  if (status === 'manual_needed') score += 110
  if (status === 'open') score += 70
  if (status === 'dispatched' && !acceptedMatch(matches)) score += 70
  if (status === 'accepted' || status === 'in_progress') score += 40

  return score
}

function normalizePlaybook(row: Row) {
  return {
    request_type: text(row.request_type),
    risk_level: text(row.risk_level) || 'any',
    step_order: Number(row.step_order) || 1,
    delay_minutes: Number(row.delay_minutes) || 0,
    action_code: text(row.action_code),
    action_label: text(row.action_label),
    action_detail: text(row.action_detail),
    sms_template_code: text(row.sms_template_code),
    auto_execute: bool(row.auto_execute),
    requires_human_confirm: row.requires_human_confirm !== false,
    escalation_level: text(row.escalation_level) || 'notice'
  }
}

function playbookFor(request: Row, playbooks: Row[]) {
  const requestType = text(request.request_type)
  const riskLevel = text(request.risk_level) || 'medium'

  const source = playbooks.length > 0 ? playbooks : FALLBACK_PLAYBOOKS

  const exact = source
    .map(normalizePlaybook)
    .filter((step) => step.request_type === requestType && (step.risk_level === riskLevel || step.risk_level === 'any'))
    .sort((a, b) => a.step_order - b.step_order)

  if (exact.length > 0) return exact

  return FALLBACK_PLAYBOOKS
    .map(normalizePlaybook)
    .filter((step) => step.request_type === requestType || step.request_type === 'urgent_neighbor_help')
    .sort((a, b) => a.step_order - b.step_order)
}

function providerScore(provider: Row, request: Row) {
  const requestType = text(request.request_type)
  const serviceArea = text(request.service_area)
  const providerType = text(provider.provider_type)

  let score = 0

  if (providerTypesFor(requestType).includes(providerType)) score += 80
  if (text(provider.available_status) === 'available') score += 30
  if (text(provider.verified_status) === 'verified') score += 20
  if (serviceArea && text(provider.service_area) && text(provider.service_area) === serviceArea) score += 25

  const responseTime = Number(provider.response_time_min) || 30
  score += Math.max(0, 30 - responseTime)

  return score
}

function candidateProviders(request: Row, providers: Row[]) {
  return providers
    .map((provider) => ({
      ...provider,
      provider_type_label: providerTypeLabel(text(provider.provider_type)),
      candidate_score: providerScore(provider, request)
    }))
    .filter((provider) => Number(provider.candidate_score) > 0)
    .sort((a, b) => Number(b.candidate_score) - Number(a.candidate_score))
    .slice(0, 5)
}

function callScriptFor(request: Row) {
  const type = text(request.request_type)
  const parentName = text(request.parent_name) || '부모님'

  if (type === 'urgent_neighbor_help') {
    return [
      '안녕하세요. 안부웍스 운영실입니다.',
      `${parentName}께서 도움이 필요하다는 신호를 보내셔서 확인 연락드립니다.`,
      '현재 부모님과 통화가 가능하실까요?',
      '부모님께 연락이 안 되면 가까운 도움망 확인을 요청해도 될까요?',
      '응급상황이 의심되면 119 또는 의료기관에 바로 연락해주세요.'
    ]
  }

  if (type === 'meal_delivery') {
    return [
      '안녕하세요. 안부웍스 운영실입니다.',
      `${parentName}께서 식사를 못 하셨다는 신호가 접수되었습니다.`,
      '실제로 식사를 못 하신 상황인지 확인 가능하실까요?',
      '필요하면 지역 도움망 또는 식사 전달 연결을 도와드릴 수 있습니다.'
    ]
  }

  if (type === 'medication_reminder') {
    return [
      `${parentName}께서 약을 아직 못 드셨다는 신호가 접수되었습니다.`,
      '실제 복약 여부 확인이 필요합니다.',
      '처방이나 복용량은 보호자, 약사 또는 의료기관을 통해 확인해주세요.'
    ]
  }

  if (type === 'care_partner_check') {
    return [
      `${parentName}께서 몸이 불편하다는 신호를 보냈습니다.`,
      '넘어지셨거나 숨쉬기 어렵거나 가슴 통증이 있으신지 확인해주세요.',
      '의식 저하, 심한 어지러움, 호흡곤란 등이 있으면 119 또는 의료기관 연락이 필요합니다.'
    ]
  }

  return [
    '안녕하세요. 안부웍스 운영실입니다.',
    `${parentName}님의 안부 신호가 접수되어 확인 연락드립니다.`,
    '현재 상태 확인이 가능하실까요?'
  ]
}

function nextStepFor(request: Row, matches: Row[], playbooks: Row[], providers: Row[]) {
  const status = text(request.status) || 'open'
  const age = minutesSince(request.created_at)
  const steps = playbookFor(request, playbooks)
  const accepted = acceptedMatch(matches)
  const requestType = text(request.request_type)

  if (status === 'manual_needed') {
    return {
      code: 'manual_call',
      label: '운영실 직접 전화',
      detail: '수동 연결 필요 상태입니다. 보호자 또는 부모님께 직접 전화하고, 필요하면 도움망을 재배정하세요.',
      sla: '즉시 확인',
      steps
    }
  }

  if (status === 'accepted' || status === 'in_progress') {
    return {
      code: 'track_completion',
      label: '처리 완료 추적',
      detail: '담당자가 확인 중입니다. 완료 결과가 늦어지면 재확인하세요.',
      sla: text(request.risk_level) === 'high' ? '20분 내 완료 확인' : '60분 내 완료 확인',
      steps
    }
  }

  if (status === 'dispatched') {
    if (accepted) {
      return {
        code: 'track_completion',
        label: '처리 완료 추적',
        detail: '도움망이 수락했습니다. 처리 완료 결과를 확인하세요.',
        sla: '완료 결과 확인',
        steps
      }
    }

    return {
      code: age >= 5 ? 'manual_call' : 'provider_waiting',
      label: age >= 5 ? '미수락 수동 확인' : '도움망 수락 대기',
      detail: age >= 5 ? '아직 수락자가 없습니다. 운영실 수동 전화 또는 추가 도움망 배정이 필요합니다.' : '지역 도움망 수락을 기다리는 중입니다.',
      sla: text(request.risk_level) === 'high' ? '5분 내 미수락 시 수동 연결' : '30분 내 미수락 시 확인',
      steps
    }
  }

  const dueSteps = steps.filter((step) => age >= step.delay_minutes)
  const current = dueSteps[dueSteps.length - 1] || steps[0]

  if (current) {
    return {
      code: current.action_code,
      label: current.action_label,
      detail: current.action_detail,
      sla: `${current.delay_minutes}분 기준 · ${current.escalation_level}`,
      steps
    }
  }

  return {
    code: requestType === 'urgent_neighbor_help' ? 'guardian_and_provider' : 'guardian_notify',
    label: requestType === 'urgent_neighbor_help' ? '보호자 알림 + 도움망 요청' : '보호자 알림',
    detail: '보호자에게 먼저 알리고 필요한 경우 도움망 연결을 진행하세요.',
    sla: '즉시 확인',
    steps
  }
}

async function loadData() {
  const [requestResult, matchResult, providerResult, outboxResult, logResult, playbookResult, assignmentResult, contactResult, updateResult] = await Promise.all([
    rest('care_response_requests?select=*&order=created_at.desc&limit=500'),
    rest('care_response_matches?select=*&order=created_at.desc&limit=1000'),
    rest('care_providers?select=*&order=created_at.desc&limit=1000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=300'),
    rest('ops_autopilot_logs?select=*&order=created_at.desc&limit=300'),
    rest('ops_playbooks?select=*&is_active=eq.true&order=step_order.asc&limit=300'),
    rest('ops_incident_assignments?select=*&order=created_at.desc&limit=300'),
    rest('ops_contact_attempts?select=*&order=created_at.desc&limit=300'),
    rest('care_response_updates?select=*&order=created_at.desc&limit=500')
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
  const playbooks = rows(playbookResult)
  const assignments = rows(assignmentResult)
  const contacts = rows(contactResult)
  const updates = rows(updateResult)

  const matchesByRequest: Record<string, Row[]> = {}
  const assignmentsByRequest: Record<string, Row[]> = {}
  const contactsByRequest: Record<string, Row[]> = {}
  const logsByRequest: Record<string, Row[]> = {}
  const updatesByRequest: Record<string, Row[]> = {}

  for (const match of matches) {
    const requestId = text(match.request_id)
    if (!requestId) continue
    matchesByRequest[requestId] = matchesByRequest[requestId] || []
    matchesByRequest[requestId].push(match)
  }

  for (const item of assignments) {
    const requestId = text(item.request_id)
    if (!requestId) continue
    assignmentsByRequest[requestId] = assignmentsByRequest[requestId] || []
    assignmentsByRequest[requestId].push(item)
  }

  for (const item of contacts) {
    const requestId = text(item.request_id)
    if (!requestId) continue
    contactsByRequest[requestId] = contactsByRequest[requestId] || []
    contactsByRequest[requestId].push(item)
  }

  for (const item of logs) {
    const requestId = text(item.request_id)
    if (!requestId) continue
    logsByRequest[requestId] = logsByRequest[requestId] || []
    logsByRequest[requestId].push(item)
  }

  for (const item of updates) {
    const requestId = text(item.request_id)
    if (!requestId) continue
    updatesByRequest[requestId] = updatesByRequest[requestId] || []
    updatesByRequest[requestId].push(item)
  }

  const incidents = requests
    .filter((request) => isOpenStatus(text(request.status) || 'open'))
    .map((request) => {
      const id = text(request.id)
      const requestMatches = matchesByRequest[id] || []
      const age = minutesSince(request.created_at)
      const next = nextStepFor(request, requestMatches, playbooks, providers)
      const accepted = acceptedMatch(requestMatches)
      const candidates = candidateProviders(request, providers)
      const timeline = [
        ...(logsByRequest[id] || []),
        ...(updatesByRequest[id] || []),
        ...(contactsByRequest[id] || [])
      ].sort((a, b) => new Date(text(b.created_at)).getTime() - new Date(text(a.created_at)).getTime())

      return {
        id,
        request,
        status: text(request.status) || 'open',
        riskLevel: text(request.risk_level) || 'medium',
        signalLabel: requestTitle(request),
        requestType: text(request.request_type),
        requestTypeLabel: requestTypeLabel(text(request.request_type)),
        parentName: text(request.parent_name) || '부모님',
        familyCode: text(request.family_code),
        serviceArea: text(request.service_area) || '권역 미지정',
        ageMinutes: age,
        priorityScore: scoreIncident(request, requestMatches),
        severityLabel: severity(request, age),
        nextActionCode: next.code,
        nextActionLabel: next.label,
        nextActionDetail: next.detail,
        slaLabel: next.sla,
        playbookSteps: next.steps,
        candidates,
        callScript: callScriptFor(request),
        assignment: (assignmentsByRequest[id] || [])[0] || null,
        contactAttempts: contactsByRequest[id] || [],
        timeline,
        matches: requestMatches,
        acceptedProvider: accepted ? providers.find((provider) => text(provider.id) === text(accepted.provider_id)) : null
      }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)

  return {
    ok: true,
    incidents,
    requests,
    matches,
    providers,
    outbox,
    logs,
    assignments,
    contacts,
    playbooks: playbooks.length > 0 ? playbooks : FALLBACK_PLAYBOOKS,
    metrics: {
      open: incidents.length,
      urgent: incidents.filter((incident) => incident.severityLabel === 'Red').length,
      manualNeeded: incidents.filter((incident) => incident.status === 'manual_needed').length,
      waitingProvider: incidents.filter((incident) => incident.status === 'dispatched' && !acceptedMatch(incident.matches)).length,
      providers: providers.length,
      queued: outbox.filter((item) => text(item.status) === 'queued').length,
      sent: outbox.filter((item) => text(item.status) === 'sent').length,
      logs: logs.length,
      contacts: contacts.length,
      assignments: assignments.filter((item) => text(item.assignment_status) === 'active').length
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

  if (!request) return { ok: false, message: '요청을 찾지 못했습니다.' }

  const title = '[안부웍스] 부모님 후속조치 확인'
  const body = [
    `${text(request.parent_name) || '부모님'}님의 안부 신호가 접수되었습니다.`,
    `상태: ${requestTitle(request)}`,
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
    reason: 'ops-autopilot-guardian',
    targetUrl: '/response',
    sourceKey: `ops-auto-guardian-${requestId}`,
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

  if (!request) return { ok: false, message: '요청을 찾지 못했습니다.' }

  const requestType = text(request.request_type)
  const types = providerTypesFor(requestType)
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
      message: '조건에 맞는 지역 도움망이 없어 수동 연결 필요로 전환했습니다.',
      payload: { requestType }
    })

    return {
      ok: true,
      message: '조건에 맞는 지역 도움망이 없어 수동 연결 필요로 전환했습니다.',
      matched: 0
    }
  }

  const existingResult = await rest('care_response_matches?select=provider_id&request_id=eq.' + encodeURIComponent(requestId) + '&limit=200')
  const existingProviderIds = new Set(rows(existingResult).map((row) => text(row.provider_id)))
  const newProviders = providers.filter((provider) => !existingProviderIds.has(text(provider.id)))

  if (newProviders.length > 0) {
    await rest('care_response_matches', {
      method: 'POST',
      body: JSON.stringify(newProviders.map((provider) => ({
        request_id: requestId,
        provider_id: provider.id,
        match_status: 'notified',
        payload: {
          requestType,
          providerType: provider.provider_type,
          source: 'ops-autopilot'
        },
        updated_at: new Date().toISOString()
      })))
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
    payload: { providers: newProviders, outboxResults }
  })

  return {
    ok: true,
    message: `${newProviders.length}명의 지역 도움망에게 요청을 보냈습니다.`,
    matched: newProviders.length,
    outboxResults
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
        note: note || '운영실 담당 배정',
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

  if (!request) return { ok: false, message: '요청을 찾지 못했습니다.' }

  const toName = contactType === 'parent' ? text(request.parent_name) || '부모님' : text(request.guardian_name) || '보호자'
  const toPhone = contactType === 'parent' ? text(request.parent_phone) : text(request.guardian_phone)

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
    payload: { resultStatus, memo }
  })

  return {
    ok: result.ok,
    message: result.ok ? '통화 기록을 남겼습니다.' : '통화 기록 저장에 실패했습니다.',
    detail: result.error
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

async function executeRecommended(requestId: string) {
  const data = await loadData()

  if (!data.ok) return data

  const incident = (data.incidents || []).find((item: Row) => text(item.id) === requestId)

  if (!incident) return { ok: false, message: '사건을 찾지 못했습니다.' }

  const code = text(incident.nextActionCode)

  if (code === 'guardian_notify') return notifyGuardian(requestId)
  if (code === 'provider_dispatch') return dispatchProviders(requestId)
  if (code === 'guardian_and_provider') {
    const guardian = await notifyGuardian(requestId)
    const providers = await dispatchProviders(requestId)
    return { ok: true, message: '보호자 알림과 도움망 요청을 실행했습니다.', guardian, providers }
  }
  if (code === 'manual_call') return markInProgress(requestId)
  if (code === 'track_completion') return { ok: true, message: '현재는 처리 완료 추적 단계입니다. 완료 여부를 확인해주세요.' }

  return notifyGuardian(requestId)
}

async function runAutopilotPass(options: { autoSend?: boolean; request?: NextRequest }) {
  const data = await loadData()

  if (!data.ok) return data

  const results = []

  for (const incident of data.incidents || []) {
    const requestId = text(incident.id)
    const nextActionCode = text(incident.nextActionCode)

    if (nextActionCode === 'guardian_notify' || nextActionCode === 'guardian_and_provider') {
      results.push({ requestId, action: 'guardian_notify', result: await notifyGuardian(requestId) })
    }

    if (nextActionCode === 'provider_dispatch' || nextActionCode === 'guardian_and_provider') {
      results.push({ requestId, action: 'provider_dispatch', result: await dispatchProviders(requestId) })
    }

    if (nextActionCode === 'manual_call' && text(incident.status) === 'dispatched') {
      await rest('care_response_requests?id=eq.' + encodeURIComponent(requestId), {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'manual_needed',
          updated_at: new Date().toISOString()
        })
      })

      await logAction({
        requestId,
        actionType: 'manual_needed',
        message: '도움망 미수락 시간이 지나 수동 연결 필요로 전환했습니다.',
        payload: { ageMinutes: incident.ageMinutes }
      })

      results.push({ requestId, action: 'manual_needed', result: { ok: true } })
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
      dispatchResult = { ok: false, message: error instanceof Error ? error.message : '문자 자동 발송 실패' }
    }
  }

  await logAction({
    actionType: options.autoSend ? 'autopilot_pass_with_send' : 'autopilot_pass',
    message: options.autoSend ? '오토파일럿 자동 대응과 문자 발송을 실행했습니다.' : '오토파일럿 자동 대응을 실행했습니다.',
    payload: { results, dispatchResult }
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
    return NextResponse.json({ ok: false, message: '운영실 인증이 필요합니다.' }, { status: 401 })
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
    return NextResponse.json({ ok: false, message: '운영실 인증이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const action = text(body.action)
  const requestId = text(body.requestId)
  const note = text(body.note)

  if (action === 'runAutopilot') {
    return NextResponse.json(await runAutopilotPass({ autoSend: bool(body.autoSend), request }))
  }

  if (!requestId) {
    return NextResponse.json({ ok: false, message: '요청 ID가 필요합니다.' }, { status: 400 })
  }

  if (action === 'executeRecommended') return NextResponse.json(await executeRecommended(requestId))
  if (action === 'notifyGuardian') return NextResponse.json(await notifyGuardian(requestId))
  if (action === 'dispatchProviders') return NextResponse.json(await dispatchProviders(requestId))
  if (action === 'assignOperator') return NextResponse.json(await assignOperator(requestId, text(body.assignedToName) || '운영실', note))
  if (action === 'recordContact') return NextResponse.json(await recordContact(requestId, text(body.contactType) || 'guardian', text(body.resultStatus) || 'connected', note))
  if (action === 'markInProgress') return NextResponse.json(await markInProgress(requestId))
  if (action === 'markCompleted') return NextResponse.json(await markCompleted(requestId, note))
  if (action === 'cancelRequest') return NextResponse.json(await cancelRequest(requestId, note))

  return NextResponse.json({ ok: false, message: '알 수 없는 action입니다.' }, { status: 400 })
}
