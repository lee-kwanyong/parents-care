import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

type Row = Record<string, unknown>

type EscalationItem = {
  request: Row
  kind: string
  level: 'warning' | 'urgent'
  ageMinutes: number
  message: string
  suggestedAction: string
  acceptedProvider?: Row
}

const OPS_COOKIE_NAME = 'anbu_ops_token'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function opsPhone() {
  return phone(process.env.ANBU_OPS_PHONE || process.env.OPS_PHONE || '')
}

function opsPassword() {
  return process.env.ANBU_OPS_PASSWORD || process.env.OPS_PASSWORD || process.env.ADMIN_CODE || '530868'
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
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
  const configuredPassword = opsPassword()
  const token = request.cookies.get(OPS_COOKIE_NAME)?.value || ''

  if (!configuredPassword || !token) return false

  try {
    return safeEqual(token, tokenFor(configuredPassword))
  } catch {
    return false
  }
}

function hasCronSecret(request: NextRequest) {
  const secret = process.env.RESPONSE_ESCALATION_SECRET || ''
  if (!secret) return false

  const queryToken = text(request.nextUrl.searchParams.get('token'))
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')

  return queryToken === secret || auth === secret
}

function authorized(request: NextRequest) {
  return isOpsAuthed(request) || hasCronSecret(request)
}


function responseStatus(result: unknown) {
  const maybe = result as { ok?: boolean; status?: number }
  return maybe.ok ? 200 : maybe.status || 500
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
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
  return ['open', 'dispatched', 'accepted', 'in_progress', 'manual_needed'].includes(status)
}

function isAcceptedStatus(status: string) {
  return ['accepted', 'in_progress', 'completed'].includes(status)
}

function providerLabel(provider: Row | undefined) {
  if (!provider) return '지역 도움망'
  return text(provider.provider_name) || '지역 도움망'
}

function requestTitle(request: Row) {
  const signal = text(request.signal_label)
  const type = text(request.request_type)

  if (signal) return signal
  if (type === 'meal_delivery') return '식사 연결 필요'
  if (type === 'medication_reminder') return '복약 확인 필요'
  if (type === 'urgent_neighbor_help') return '긴급 도움 요청'
  if (type === 'care_partner_check') return '돌봄 확인 필요'
  if (type === 'pharmacy_call') return '약국 상담 필요'
  return '안부 확인 필요'
}

function analyze(
  requests: Row[],
  matches: Row[],
  providerMap: Record<string, Row>
): EscalationItem[] {
  const matchesByRequest: Record<string, Row[]> = {}

  for (const match of matches) {
    const requestId = text(match.request_id)
    if (!requestId) continue
    matchesByRequest[requestId] = matchesByRequest[requestId] || []
    matchesByRequest[requestId].push(match)
  }

  const items: EscalationItem[] = []

  for (const request of requests) {
    const id = text(request.id)
    const status = text(request.status) || 'open'
    const risk = text(request.risk_level) || 'medium'

    if (!id || !isOpenStatus(status)) continue

    const age = minutesSince(request.created_at)
    const requestMatches = matchesByRequest[id] || []
    const acceptedMatch = requestMatches.find((match) => isAcceptedStatus(text(match.match_status)))
    const acceptedProvider = acceptedMatch ? providerMap[text(acceptedMatch.provider_id)] : undefined
    const acceptedByRequest = providerMap[text(request.accepted_by_provider_id)] || acceptedProvider

    const highThreshold = risk === 'high' ? 5 : 30
    const acceptedThreshold = risk === 'high' ? 20 : 60

    if (status === 'open' && age >= highThreshold) {
      items.push({
        request,
        kind: 'family_no_action',
        level: risk === 'high' ? 'urgent' : 'warning',
        ageMinutes: age,
        message: `${requestTitle(request)} 요청이 ${age}분 동안 처리되지 않았습니다.`,
        suggestedAction:
          risk === 'high'
            ? '보호자 재알림과 운영실 수동 확인이 필요합니다. 응급 가능성이 있으면 119 또는 의료기관 연락을 안내하세요.'
            : '보호자에게 재알림하고 당일 확인 여부를 점검하세요.'
      })
      continue
    }

    if ((status === 'dispatched' || status === 'manual_needed') && !acceptedMatch && age >= highThreshold) {
      items.push({
        request,
        kind: 'provider_no_accept',
        level: risk === 'high' ? 'urgent' : 'warning',
        ageMinutes: age,
        message: `${requestTitle(request)} 요청을 받은 지역 도움망이 아직 수락하지 않았습니다.`,
        suggestedAction:
          risk === 'high'
            ? '운영실이 직접 전화 확인하거나 다른 도움망으로 재배정해야 합니다.'
            : '운영실 수동 연결 또는 다른 지역 도움망 전파가 필요합니다.'
      })
      continue
    }

    if ((status === 'accepted' || status === 'in_progress') && age >= acceptedThreshold) {
      items.push({
        request,
        kind: 'accepted_not_completed',
        level: risk === 'high' ? 'urgent' : 'warning',
        ageMinutes: age,
        acceptedProvider: acceptedByRequest,
        message: `${providerLabel(acceptedByRequest)}이(가) 요청을 맡았지만 ${age}분 동안 완료되지 않았습니다.`,
        suggestedAction: '수락한 지역 도움망에게 재확인 알림을 보내고, 운영실이 처리 상태를 점검하세요.'
      })
    }
  }

  return items
}

async function loadAnalysis() {
  const [requestResult, matchResult, providerResult, logResult] = await Promise.all([
    rest('care_response_requests?select=*&order=created_at.asc&limit=500'),
    rest('care_response_matches?select=*&order=created_at.asc&limit=1000'),
    rest('care_providers?select=*&limit=1000'),
    rest('care_response_escalation_logs?select=*&order=created_at.desc&limit=300')
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
  const logs = rows(logResult)

  const providerMap: Record<string, Row> = {}
  for (const provider of providers) {
    const id = text(provider.id)
    if (id) providerMap[id] = provider
  }

  const escalationItems = analyze(requests, matches, providerMap)

  return {
    ok: true,
    requests,
    matches,
    providers,
    logs,
    escalationItems,
    metrics: {
      totalOpen: requests.filter((request) => isOpenStatus(text(request.status))).length,
      escalationNeeded: escalationItems.length,
      urgent: escalationItems.filter((item) => item.level === 'urgent').length,
      warning: escalationItems.filter((item) => item.level === 'warning').length,
      logs: logs.length
    }
  }
}

async function logExists(sourceKey: string) {
  const result = await rest('care_response_escalation_logs?select=id&source_key=eq.' + encodeURIComponent(sourceKey) + '&limit=1')
  return rows(result).length > 0
}

async function insertEscalationLog(item: EscalationItem) {
  const requestId = text(item.request.id)
  const sourceKey = `${item.kind}-${requestId}`

  if (await logExists(sourceKey)) {
    return {
      created: false,
      sourceKey
    }
  }

  const result = await rest('care_response_escalation_logs', {
    method: 'POST',
    body: JSON.stringify([
      {
        request_id: requestId,
        escalation_type: item.kind,
        level: item.level,
        status: 'created',
        message: item.message,
        source_key: sourceKey,
        payload: {
          ageMinutes: item.ageMinutes,
          suggestedAction: item.suggestedAction,
          request: item.request
        }
      }
    ])
  })

  return {
    created: result.ok,
    sourceKey,
    error: result.error
  }
}

async function insertUpdate(item: EscalationItem) {
  await rest('care_response_updates', {
    method: 'POST',
    body: JSON.stringify([
      {
        request_id: text(item.request.id),
        actor_type: 'system',
        actor_name: '안부웍스 에스컬레이션',
        update_type: item.kind,
        message: item.message + ' ' + item.suggestedAction,
        payload: {
          level: item.level,
          ageMinutes: item.ageMinutes,
          suggestedAction: item.suggestedAction
        }
      }
    ])
  })
}

async function patchRequest(item: EscalationItem) {
  if (item.kind === 'accepted_not_completed') return

  await rest('care_response_requests?id=eq.' + encodeURIComponent(text(item.request.id)), {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'manual_needed',
      updated_at: new Date().toISOString()
    })
  })
}

async function outboxExists(sourceKey: string) {
  const result = await rest('notification_outbox?select=id&source_key=eq.' + encodeURIComponent(sourceKey) + '&limit=1')
  return rows(result).length > 0
}

async function enqueueSms(input: {
  sourceKey: string
  familyCode?: string
  toName: string
  toPhone: string
  title: string
  body: string
  reason: string
  targetUrl: string
  payload?: Row
}) {
  const cleanPhone = phone(input.toPhone)

  if (!cleanPhone) return false
  if (await outboxExists(input.sourceKey)) return false

  const result = await rest('notification_outbox', {
    method: 'POST',
    body: JSON.stringify([
      {
        family_code: input.familyCode || null,
        channel: 'sms',
        to_name: input.toName,
        to_phone: cleanPhone,
        title: input.title,
        body: input.body,
        reason: input.reason,
        target_url: input.targetUrl,
        status: 'queued',
        provider: 'response-escalation',
        source_key: input.sourceKey,
        payload: input.payload || {}
      }
    ])
  })

  return result.ok
}

async function enqueueNotifications(item: EscalationItem) {
  const request = item.request
  const requestId = text(request.id)
  const familyCode = text(request.family_code)
  const guardianPhone = phone(request.guardian_phone)
  const parentName = text(request.parent_name) || '부모님'
  const title = item.level === 'urgent' ? '[안부웍스] 긴급 확인 필요' : '[안부웍스] 후속조치 확인 필요'
  const baseBody = [
    `${parentName}: ${requestTitle(request)}`,
    item.message,
    item.suggestedAction
  ].join('\n')

  const sent: string[] = []

  if (guardianPhone) {
    const ok = await enqueueSms({
      sourceKey: `esc-guardian-${item.kind}-${requestId}`,
      familyCode,
      toName: text(request.guardian_name) || '보호자',
      toPhone: guardianPhone,
      title,
      body: baseBody,
      reason: 'response-escalation-guardian',
      targetUrl: '/response',
      payload: {
        requestId,
        escalationKind: item.kind
      }
    })

    if (ok) sent.push('guardian')
  }

  const opPhone = opsPhone()

  if (opPhone) {
    const ok = await enqueueSms({
      sourceKey: `esc-ops-${item.kind}-${requestId}`,
      familyCode,
      toName: '운영실',
      toPhone: opPhone,
      title,
      body: baseBody,
      reason: 'response-escalation-ops',
      targetUrl: '/response?scope=ops',
      payload: {
        requestId,
        escalationKind: item.kind
      }
    })

    if (ok) sent.push('ops')
  }

  if (item.kind === 'accepted_not_completed' && item.acceptedProvider) {
    const providerPhone = phone(item.acceptedProvider.phone)
    const providerId = text(item.acceptedProvider.id)

    if (providerPhone && providerId) {
      const ok = await enqueueSms({
        sourceKey: `esc-provider-${item.kind}-${requestId}-${providerId}`,
        familyCode,
        toName: text(item.acceptedProvider.provider_name) || '지역 도움망',
        toPhone: providerPhone,
        title,
        body: baseBody,
        reason: 'care-response-dispatch',
        targetUrl: '/provider/requests',
        payload: {
          requestId,
          providerId,
          escalationKind: item.kind
        }
      })

      if (ok) sent.push('provider')
    }
  }

  return sent
}

async function runEscalation() {
  const analysis = await loadAnalysis()

  if (!analysis.ok) return analysis

  const results = []

  for (const item of analysis.escalationItems as EscalationItem[]) {
    const log = await insertEscalationLog(item)

    if (!log.created) {
      results.push({
        requestId: text(item.request.id),
        kind: item.kind,
        skipped: true,
        reason: 'already-escalated'
      })
      continue
    }

    await insertUpdate(item)
    await patchRequest(item)
    const notifications = await enqueueNotifications(item)

    results.push({
      requestId: text(item.request.id),
      kind: item.kind,
      level: item.level,
      notifications
    })
  }

  return {
    ok: true,
    message: `${results.length}건의 에스컬레이션을 처리했습니다.`,
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

  const action = text(request.nextUrl.searchParams.get('action'))

  if (action === 'run') {
    const result = await runEscalation()
    return NextResponse.json(result, { status: responseStatus(result) })
  }

  const analysis = await loadAnalysis()
  return NextResponse.json(analysis, { status: responseStatus(analysis) })
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

  if (action === 'runEscalation') {
    const result = await runEscalation()
    return NextResponse.json(result, { status: responseStatus(result) })
  }

  return NextResponse.json(
    {
      ok: false,
      message: '알 수 없는 action입니다.'
    },
    { status: 400 }
  )
}
