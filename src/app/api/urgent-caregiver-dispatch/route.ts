import { createHash, randomBytes, timingSafeEqual } from 'crypto'
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

function opsPassword() {
  return process.env.ANBU_OPS_PASSWORD || process.env.OPS_PASSWORD || ''
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || process.env.OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
}

function tokenFor(password: string) {
  return createHash('sha256').update(password + ':' + authSecret()).digest('hex')
}

function hashDispatchToken(token: string) {
  return createHash('sha256').update(token + ':' + authSecret()).digest('hex')
}

function createDispatchToken() {
  return randomBytes(32).toString('base64url')
}

function tokenExpiry(minutes = 30) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

function isExpired(value: unknown) {
  const raw = text(value)
  if (!raw) return true

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return true

  return Date.now() > d.getTime()
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

function isOpenStatus(status: string) {
  return ['open', 'dispatched', 'manual_needed', 'accepted', 'in_progress'].includes(status)
}

function isUrgent(row: Row) {
  return (
    text(row.request_type) === 'urgent_neighbor_help' ||
    text(row.signal_type) === 'urgent_neighbor_help' ||
    text(row.risk_level) === 'high'
  )
}

function labelRequestType(type: string) {
  if (type === 'urgent_neighbor_help') return '지금 도움이 필요해요'
  if (type === 'care_partner_check') return '몸 상태 확인 필요'
  if (type === 'meal_delivery') return '식사 미확인'
  if (type === 'medication_reminder') return '복약 미확인'
  return '안부 확인 필요'
}

function code6() {
  return String(Math.floor(100000 + Math.random() * 900000))
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
  return rest(table + '?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })
}

async function logRequest(requestId: string, actionType: string, message: string, payload?: Row) {
  await insertRows('care_response_updates', [
    {
      request_id: requestId,
      actor_type: 'ops',
      actor_name: '요양보호사 즉시배치',
      update_type: actionType,
      message,
      payload: payload || {}
    }
  ])

  await insertRows('ops_autopilot_logs', [
    {
      request_id: requestId,
      action_type: actionType,
      actor_name: '요양보호사 즉시배치',
      message,
      payload: payload || {}
    }
  ])
}

async function loadRequest(id: string) {
  const result = await rest('care_response_requests?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1')
  return rows(result)[0]
}

async function loadProvider(id: string) {
  const result = await rest('care_providers?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1')
  return rows(result)[0]
}

async function loadMatchByToken(token: string) {
  const tokenHash = hashDispatchToken(token)
  const result = await rest('care_response_matches?select=*&accept_token_hash=eq.' + encodeURIComponent(tokenHash) + '&limit=1')
  return rows(result)[0]
}

function sanitizeRequest(request: Row, unlocked: boolean) {
  return {
    id: text(request.id),
    family_code: text(request.family_code),
    parent_name: text(request.parent_name),
    signal_label: text(request.signal_label) || labelRequestType(text(request.request_type)),
    request_type: text(request.request_type),
    risk_level: text(request.risk_level),
    status: text(request.status),
    service_area: text(request.service_area),
    address_hint: unlocked ? text(request.address_hint) : '수락 후 상세 위치가 표시됩니다.',
    requested_action: text(request.requested_action),
    guardian_name: unlocked ? text(request.guardian_name) : '',
    guardian_phone: unlocked ? text(request.guardian_phone) : '',
    created_at: text(request.created_at),
    accepted_at: text(request.accepted_at),
    completed_at: text(request.completed_at)
  }
}

async function loadTokenMode(token: string) {
  if (!token) {
    return {
      ok: false,
      status: 400,
      message: '요청 링크 토큰이 필요합니다.'
    }
  }

  const match = await loadMatchByToken(token)

  if (!match) {
    return {
      ok: false,
      status: 404,
      message: '유효하지 않은 요청 링크입니다.'
    }
  }

  const expired = isExpired(match.accept_token_expires_at)
  const request = await loadRequest(text(match.request_id))
  const provider = await loadProvider(text(match.provider_id))

  if (!request || !provider) {
    return {
      ok: false,
      status: 404,
      message: '요청 정보를 찾지 못했습니다.'
    }
  }

  const matchStatus = text(match.match_status)
  const unlocked = ['accepted', 'completed'].includes(matchStatus) || Boolean(text(match.detail_unlocked_at))

  return {
    ok: true,
    expired,
    canAccept: !expired && matchStatus === 'notified' && isOpenStatus(text(request.status)),
    canComplete: !expired && ['accepted', 'in_progress'].includes(matchStatus) && ['accepted', 'in_progress'].includes(text(request.status)),
    match: {
      id: text(match.id),
      match_status: matchStatus,
      notified_at: text(match.notified_at),
      accepted_at: text(match.accepted_at),
      completed_at: text(match.completed_at),
      expires_at: text(match.accept_token_expires_at),
      note: text(match.note)
    },
    provider: {
      id: text(provider.id),
      provider_type: text(provider.provider_type),
      provider_name: text(provider.provider_name),
      service_area: text(provider.service_area),
      qualification: text(provider.qualification)
    },
    request: sanitizeRequest(request, unlocked),
    message: expired ? '요청 링크가 만료되었습니다. 운영실에 다시 요청해주세요.' : '긴급 요청을 불러왔습니다.'
  }
}

async function loadAll() {
  const [requestResult, providerResult, matchResult, outboxResult] = await Promise.all([
    rest('care_response_requests?select=*&order=created_at.desc&limit=1000'),
    rest('care_providers?select=*&order=created_at.desc&limit=1000'),
    rest('care_response_matches?select=*&order=created_at.desc&limit=2000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=2000')
  ])

  if (!requestResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '긴급 요청 목록을 불러오지 못했습니다.',
      detail: requestResult.error
    }
  }

  const requests = rows(requestResult)
  const providers = rows(providerResult)
  const matches = rows(matchResult)
  const outbox = rows(outboxResult)

  const urgentRequests = requests
    .filter((row) => isOpenStatus(text(row.status)) && isUrgent(row))
    .map((row) => {
      const requestId = text(row.id)
      const requestMatches = matches.filter((match) => text(match.request_id) === requestId)
      const accepted = requestMatches.find((match) => ['accepted', 'in_progress', 'completed'].includes(text(match.match_status)))

      return {
        ...row,
        signal_label: text(row.signal_label) || labelRequestType(text(row.request_type)),
        match_count: requestMatches.length,
        accepted_match: accepted || null
      }
    })

  const eligibleProviders = providers.filter((row) => {
    const type = text(row.provider_type)
    return (
      ['caregiver', 'care_partner'].includes(type) &&
      text(row.available_status) === 'available' &&
      text(row.verified_status) === 'verified' &&
      row.fast_dispatch_enabled !== false
    )
  })

  return {
    ok: true,
    urgentRequests,
    providers,
    eligibleProviders,
    matches,
    outbox,
    metrics: {
      urgentOpen: urgentRequests.length,
      eligibleProviders: eligibleProviders.length,
      caregivers: eligibleProviders.filter((row) => text(row.provider_type) === 'caregiver').length,
      carePartners: eligibleProviders.filter((row) => text(row.provider_type) === 'care_partner').length,
      notifiedMatches: matches.filter((row) => text(row.match_status) === 'notified').length,
      acceptedMatches: matches.filter((row) => text(row.match_status) === 'accepted').length,
      completedMatches: matches.filter((row) => text(row.match_status) === 'completed').length,
      expiredMatches: matches.filter((row) => text(row.match_status) === 'notified' && isExpired(row.accept_token_expires_at)).length,
      queuedSms: outbox.filter((row) => text(row.status) === 'queued' && text(row.reason).includes('urgent-caregiver')).length
    }
  }
}

async function registerCaregiver(request: NextRequest, body: Row) {
  const providerName = text(body.providerName)
  const cleanPhone = phone(body.phone)
  const serviceArea = text(body.serviceArea)

  if (!providerName) {
    return {
      ok: false,
      status: 400,
      message: '이름이 필요합니다.'
    }
  }

  if (!cleanPhone) {
    return {
      ok: false,
      status: 400,
      message: '휴대폰 번호가 필요합니다.'
    }
  }

  if (!serviceArea) {
    return {
      ok: false,
      status: 400,
      message: '활동 권역이 필요합니다.'
    }
  }

  const isOps = authorized(request)

  const result = await insertRows('care_providers', [
    {
      provider_type: text(body.providerType) || 'caregiver',
      provider_name: providerName,
      phone: cleanPhone,
      email: text(body.email),
      service_area: serviceArea,
      address_hint: text(body.addressHint),
      available_status: 'available',
      verified_status: isOps ? 'verified' : 'pending',
      qualification: text(body.qualification) || '요양보호사/돌봄파트너',
      available_hours: text(body.availableHours) || '즉시 배치 가능 시간 등록 필요',
      response_time_min: Number(body.responseTimeMin) || 15,
      notes: text(body.notes),
      fast_dispatch_enabled: true,
      last_seen_at: new Date().toISOString(),
      payload: {
        source: isOps ? 'ops-urgent-dispatch' : 'provider-self-register',
        original: body
      },
      updated_at: new Date().toISOString()
    }
  ])

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: isOps
      ? '검증된 요양보호사/돌봄파트너로 등록했습니다.'
      : '등록 요청이 접수되었습니다. 운영실 검증 후 즉시 배치 대상에 포함됩니다.',
    provider: rows(result)[0],
    detail: result.error
  }
}

async function createUrgentRequest(body: Row) {
  const familyCode = text(body.familyCode) || code6()
  const parentName = text(body.parentName) || '긴급 확인 대상자'
  const guardianName = text(body.guardianName) || '보호자'
  const guardianPhone = phone(body.guardianPhone)
  const serviceArea = text(body.serviceArea) || '우리동네'

  const result = await insertRows('care_response_requests', [
    {
      family_code: familyCode,
      parent_name: parentName,
      parent_phone: phone(body.parentPhone),
      guardian_name: guardianName,
      guardian_phone: guardianPhone,
      signal_type: 'urgent_neighbor_help',
      signal_label: '지금 당장 도움이 필요해요',
      request_type: 'urgent_neighbor_help',
      risk_level: 'high',
      status: 'open',
      service_area: serviceArea,
      address_hint: text(body.addressHint),
      requested_action: '보호자에게 즉시 알리고, 가까운 요양보호사·돌봄파트너에게 확인 요청을 전파하세요. 응급상황이 의심되면 119 또는 의료기관 연락을 안내하세요.',
      dispatch_scope: 'caregiver_fast_dispatch_ready',
      source: 'ops-urgent-dispatch',
      source_key: 'urgent-caregiver-' + Date.now(),
      payload: {
        source: 'ops-urgent-dispatch',
        original: body
      },
      fast_dispatch_status: 'none',
      updated_at: new Date().toISOString()
    }
  ])

  const urgentRequest = rows(result)[0]

  if (urgentRequest) {
    await logRequest(
      text(urgentRequest.id),
      'urgent_request_created',
      '운영실에서 긴급 도움 요청을 생성했습니다.',
      { request: urgentRequest }
    )
  }

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '긴급 도움 요청을 생성했습니다.' : '긴급 도움 요청 생성에 실패했습니다.',
    request: urgentRequest,
    detail: result.error
  }
}

async function loadProviders() {
  const result = await rest('care_providers?select=*&order=response_time_min.asc&limit=1000')
  return rows(result)
}

async function loadExistingMatches(requestId: string) {
  const result = await rest('care_response_matches?select=*&request_id=eq.' + encodeURIComponent(requestId) + '&limit=1000')
  return rows(result)
}

async function enqueueSms(input: {
  request: Row
  provider?: Row
  toName: string
  toPhone: string
  title: string
  body: string
  sourceKey: string
  reason: string
  targetUrl: string
}) {
  const cleanPhone = phone(input.toPhone)

  if (!cleanPhone) {
    return {
      ok: true,
      skipped: true,
      reason: 'no-phone'
    }
  }

  const existing = await rest('notification_outbox?select=*&source_key=eq.' + encodeURIComponent(input.sourceKey) + '&limit=1')
  const existingRow = rows(existing)[0]

  if (existingRow) {
    return {
      ok: true,
      skipped: true,
      reason: 'already-exists',
      outbox: existingRow
    }
  }

  const result = await insertRows('notification_outbox', [
    {
      family_code: text(input.request.family_code),
      channel: 'sms',
      to_name: input.toName,
      to_phone: cleanPhone,
      title: input.title,
      body: input.body,
      template_code: 'urgent-caregiver-dispatch',
      reason: input.reason,
      target_url: input.targetUrl,
      status: 'queued',
      provider: 'urgent-caregiver-dispatch',
      source_key: input.sourceKey,
      payload: {
        source: 'urgent-caregiver-dispatch',
        requestId: text(input.request.id),
        providerId: input.provider ? text(input.provider.id) : null,
        targetUrl: input.targetUrl
      }
    }
  ])

  return {
    ok: result.ok,
    skipped: false,
    outbox: rows(result)[0],
    detail: result.error
  }
}

async function dispatchNearest(request: NextRequest, body: Row) {
  const requestId = text(body.requestId)

  if (!requestId) {
    return {
      ok: false,
      status: 400,
      message: 'requestId가 필요합니다.'
    }
  }

  const urgentRequest = await loadRequest(requestId)

  if (!urgentRequest) {
    return {
      ok: false,
      status: 404,
      message: '긴급 요청을 찾지 못했습니다.'
    }
  }

  if (!isOpenStatus(text(urgentRequest.status))) {
    return {
      ok: false,
      status: 400,
      message: '이미 완료되었거나 취소된 요청입니다.'
    }
  }

  const providers = await loadProviders()
  const existingMatches = await loadExistingMatches(requestId)
  const existingProviderIds = new Set(existingMatches.map((row) => text(row.provider_id)))

  const area = text(urgentRequest.service_area)

  const candidates = providers
    .filter((provider) => {
      const type = text(provider.provider_type)
      if (!['caregiver', 'care_partner'].includes(type)) return false
      if (text(provider.available_status) !== 'available') return false
      if (text(provider.verified_status) !== 'verified') return false
      if (provider.fast_dispatch_enabled === false) return false
      if (existingProviderIds.has(text(provider.id))) return false
      return true
    })
    .sort((a, b) => {
      const aArea = area && text(a.service_area) === area ? 0 : 1
      const bArea = area && text(b.service_area) === area ? 0 : 1

      if (aArea !== bArea) return aArea - bArea

      return (Number(a.response_time_min) || 999) - (Number(b.response_time_min) || 999)
    })
    .slice(0, Number(body.limit) || 5)

  if (candidates.length === 0) {
    await patchById('care_response_requests', requestId, {
      status: 'manual_needed',
      fast_dispatch_status: 'no_available_provider',
      updated_at: new Date().toISOString()
    })

    await logRequest(
      requestId,
      'fast_dispatch_no_provider',
      '가용 요양보호사·돌봄파트너가 없어 수동 연결 필요로 전환했습니다.',
      { area }
    )

    return {
      ok: true,
      message: '가용 요양보호사·돌봄파트너가 없어 수동 연결 필요로 전환했습니다.',
      matched: 0
    }
  }

  const tokenRecords = candidates.map((provider) => {
    const rawToken = createDispatchToken()

    return {
      provider,
      token: rawToken,
      tokenHash: hashDispatchToken(rawToken),
      expiresAt: tokenExpiry(30)
    }
  })

  const matchResult = await insertRows(
    'care_response_matches',
    tokenRecords.map(({ provider, tokenHash, expiresAt }) => ({
      request_id: requestId,
      provider_id: provider.id,
      match_status: 'notified',
      notified_at: new Date().toISOString(),
      accept_token_hash: tokenHash,
      accept_token_expires_at: expiresAt,
      payload: {
        source: 'urgent-caregiver-dispatch',
        tokenMode: true,
        providerType: provider.provider_type,
        serviceArea: provider.service_area
      },
      updated_at: new Date().toISOString()
    }))
  )

  const matches = rows(matchResult)

  const smsResults = []

  for (let index = 0; index < tokenRecords.length; index += 1) {
    const { provider, token, expiresAt } = tokenRecords[index]
    const match = matches[index]
    const acceptPath = '/provider/urgent-requests?token=' + encodeURIComponent(token)
    const acceptUrl = new URL(acceptPath, request.nextUrl.origin).toString()

    smsResults.push(await enqueueSms({
      request: urgentRequest,
      provider,
      toName: text(provider.provider_name),
      toPhone: text(provider.phone),
      title: '[안부웍스] 가까운 어르신 긴급 확인 요청',
      body: [
        `${text(urgentRequest.parent_name) || '어르신'}님의 긴급 도움 요청이 접수되었습니다.`,
        `상태: ${text(urgentRequest.signal_label) || '지금 당장 도움이 필요해요'}`,
        `권역: ${text(urgentRequest.service_area) || '-'}`,
        '',
        '아래 링크에서 수락 후 상세 위치를 확인해주세요.',
        acceptUrl,
        '',
        '링크 유효시간: 30분',
        '응급상황이 의심되면 119 또는 의료기관 연락을 안내해주세요.'
      ].join('\n'),
      sourceKey: `urgent-caregiver-${requestId}-${text(provider.id)}`,
      reason: 'urgent-caregiver-dispatch',
      targetUrl: acceptPath
    }))

    if (match) {
      await logRequest(
        requestId,
        'fast_dispatch_token_created',
        `${text(provider.provider_name)}님에게 1회용 수락 링크를 생성했습니다.`,
        {
          providerId: text(provider.id),
          matchId: text(match.id),
          expiresAt
        }
      )
    }
  }

  await patchById('care_response_requests', requestId, {
    status: 'dispatched',
    dispatch_scope: 'caregiver_fast_dispatch_token',
    fast_dispatch_status: 'notified',
    fast_dispatch_requested_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  await logRequest(
    requestId,
    'fast_dispatch_notified',
    `${candidates.length}명의 가용 요양보호사·돌봄파트너에게 1회용 링크 기반 긴급 확인 요청을 보냈습니다.`,
    { providers: candidates, matches, smsResults }
  )

  return {
    ok: true,
    message: `${candidates.length}명의 가용 요양보호사·돌봄파트너에게 1회용 링크 기반 긴급 확인 요청을 보냈습니다.`,
    matched: candidates.length,
    providers: candidates,
    matches,
    smsResults
  }
}

async function declineOtherMatches(requestId: string, acceptedMatchId: string) {
  await rest(
    'care_response_matches?request_id=eq.' +
      encodeURIComponent(requestId) +
      '&id=neq.' +
      encodeURIComponent(acceptedMatchId) +
      '&match_status=eq.notified',
    {
      method: 'PATCH',
      body: JSON.stringify({
        match_status: 'declined',
        declined_at: new Date().toISOString(),
        note: '다른 도움망이 먼저 수락하여 자동 마감되었습니다.',
        updated_at: new Date().toISOString()
      })
    }
  )
}

async function acceptDispatchByToken(body: Row) {
  const token = text(body.token)
  const note = text(body.note)

  if (!token) {
    return {
      ok: false,
      status: 400,
      message: '요청 링크 토큰이 필요합니다.'
    }
  }

  const match = await loadMatchByToken(token)

  if (!match) {
    return {
      ok: false,
      status: 404,
      message: '유효하지 않은 요청 링크입니다.'
    }
  }

  if (isExpired(match.accept_token_expires_at)) {
    await patchById('care_response_matches', text(match.id), {
      match_status: 'expired',
      note: '수락 링크 유효시간이 만료되었습니다.',
      updated_at: new Date().toISOString()
    })

    return {
      ok: false,
      status: 410,
      message: '요청 링크가 만료되었습니다. 운영실에 다시 요청해주세요.'
    }
  }

  const request = await loadRequest(text(match.request_id))
  const provider = await loadProvider(text(match.provider_id))

  if (!request || !provider) {
    return {
      ok: false,
      status: 404,
      message: '요청 정보를 찾지 못했습니다.'
    }
  }

  if (['completed', 'cancelled'].includes(text(request.status))) {
    return {
      ok: false,
      status: 400,
      message: '이미 종료된 요청입니다.'
    }
  }

  if (text(request.accepted_by_provider_id) && text(request.accepted_by_provider_id) !== text(provider.id)) {
    return {
      ok: true,
      alreadyAccepted: true,
      message: '이미 다른 도움망이 먼저 수락했습니다.',
      request: sanitizeRequest(request, false)
    }
  }

  const now = new Date().toISOString()

  const [matchPatch, requestPatch] = await Promise.all([
    patchById('care_response_matches', text(match.id), {
      match_status: 'accepted',
      accepted_at: now,
      detail_unlocked_at: now,
      token_used_at: now,
      note: note || '요양보호사·돌봄파트너가 긴급 확인 요청을 수락했습니다.',
      updated_at: now
    }),
    patchById('care_response_requests', text(request.id), {
      status: 'accepted',
      accepted_by_provider_id: provider.id,
      accepted_by_name: text(provider.provider_name),
      accepted_at: now,
      fast_dispatch_status: 'accepted',
      updated_at: now
    })
  ])

  await declineOtherMatches(text(request.id), text(match.id))

  await logRequest(
    text(request.id),
    'fast_dispatch_accepted',
    `${text(provider.provider_name)}님이 1회용 링크로 긴급 확인 요청을 수락했습니다. 다른 도움망 요청은 자동 마감했습니다.`,
    { provider, match }
  )

  await enqueueSms({
    request,
    toName: text(request.guardian_name) || '보호자',
    toPhone: text(request.guardian_phone),
    title: '[안부웍스] 지역 도움망이 요청을 수락했습니다',
    body: [
      `${text(request.parent_name) || '부모님'}님의 긴급 도움 요청을`,
      `${text(provider.provider_name)}님이 수락했습니다.`,
      '',
      '운영실이 처리 상황을 계속 기록합니다.',
      '응급상황이 의심되면 119 또는 의료기관에 연락해주세요.'
    ].join('\n'),
    sourceKey: `urgent-caregiver-guardian-accepted-${text(request.id)}`,
    reason: 'urgent-caregiver-guardian-accepted',
    targetUrl: '/response'
  })

  return {
    ok: matchPatch.ok && requestPatch.ok,
    status: matchPatch.ok && requestPatch.ok ? 200 : 500,
    message: '긴급 확인 요청을 수락했습니다. 상세 위치가 표시됩니다.',
    match: rows(matchPatch)[0],
    request: sanitizeRequest(rows(requestPatch)[0] || request, true),
    provider: {
      id: text(provider.id),
      provider_name: text(provider.provider_name),
      provider_type: text(provider.provider_type)
    },
    detail: matchPatch.error || requestPatch.error
  }
}

async function completeDispatchByToken(body: Row) {
  const token = text(body.token)
  const note = text(body.note) || '요양보호사·돌봄파트너가 긴급 확인을 완료했습니다.'

  if (!token) {
    return {
      ok: false,
      status: 400,
      message: '요청 링크 토큰이 필요합니다.'
    }
  }

  const match = await loadMatchByToken(token)

  if (!match) {
    return {
      ok: false,
      status: 404,
      message: '유효하지 않은 요청 링크입니다.'
    }
  }

  if (!['accepted', 'in_progress'].includes(text(match.match_status))) {
    return {
      ok: false,
      status: 400,
      message: '수락된 요청만 완료 처리할 수 있습니다.'
    }
  }

  const request = await loadRequest(text(match.request_id))
  const provider = await loadProvider(text(match.provider_id))

  if (!request || !provider) {
    return {
      ok: false,
      status: 404,
      message: '요청 정보를 찾지 못했습니다.'
    }
  }

  if (text(request.accepted_by_provider_id) && text(request.accepted_by_provider_id) !== text(provider.id)) {
    return {
      ok: false,
      status: 403,
      message: '이 요청을 수락한 도움망만 완료 처리할 수 있습니다.'
    }
  }

  const now = new Date().toISOString()

  const [matchPatch, requestPatch] = await Promise.all([
    patchById('care_response_matches', text(match.id), {
      match_status: 'completed',
      completed_at: now,
      note,
      updated_at: now
    }),
    patchById('care_response_requests', text(request.id), {
      status: 'completed',
      completed_at: now,
      completed_note: note,
      fast_dispatch_status: 'completed',
      updated_at: now
    })
  ])

  await logRequest(
    text(request.id),
    'fast_dispatch_completed',
    note,
    { provider, match }
  )

  return {
    ok: matchPatch.ok && requestPatch.ok,
    status: matchPatch.ok && requestPatch.ok ? 200 : 500,
    message: '긴급 확인을 완료 처리했습니다.',
    match: rows(matchPatch)[0],
    request: sanitizeRequest(rows(requestPatch)[0] || request, true),
    detail: matchPatch.error || requestPatch.error
  }
}

export async function GET(request: NextRequest) {
  const mode = text(request.nextUrl.searchParams.get('mode'))

  if (mode === 'token') {
    const token = text(request.nextUrl.searchParams.get('token'))
    const result = await loadTokenMode(token)
    return NextResponse.json(result, { status: responseStatus(result) })
  }

  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const result = await loadAll()
  return NextResponse.json(result, { status: responseStatus(result) })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  const publicActions = new Set(['registerCaregiver', 'acceptDispatchByToken', 'completeDispatchByToken'])

  if (!publicActions.has(action) && !authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  let result

  if (action === 'registerCaregiver') result = await registerCaregiver(request, body)
  else if (action === 'createUrgentRequest') result = await createUrgentRequest(body)
  else if (action === 'dispatchNearest') result = await dispatchNearest(request, body)
  else if (action === 'acceptDispatchByToken') result = await acceptDispatchByToken(body)
  else if (action === 'completeDispatchByToken') result = await completeDispatchByToken(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
