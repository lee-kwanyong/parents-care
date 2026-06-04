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

const OPS_COOKIE_NAME = 'anbu_ops_token'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function code6(value: unknown) {
  return text(value).replace(/[^\d]/g, '').slice(0, 6)
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function opsPassword() {
  return process.env.ANBU_OPS_PASSWORD || process.env.OPS_PASSWORD || ''
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

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
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

function requestTypeLabel(type: string) {
  if (type === 'meal_delivery') return '식사 연결'
  if (type === 'medication_reminder') return '복약 확인'
  if (type === 'urgent_neighbor_help') return '긴급 도움'
  if (type === 'care_partner_check') return '돌봄 확인'
  if (type === 'pharmacy_call') return '약국 상담'
  return '안부 확인'
}

function recommendedAction(type: string) {
  if (type === 'meal_delivery') return '가족이 식사 여부를 확인하고, 필요하면 주변 가게·도시락·반찬가게에 식사 연결을 요청하세요.'
  if (type === 'medication_reminder') return '복약 여부를 다시 확인하고, 반복되면 보호자·돌봄파트너·약국 상담으로 연결하세요.'
  if (type === 'urgent_neighbor_help') return '가족에게 즉시 알리고, 응답이 없으면 가까운 돌봄파트너·수행기관 확인 요청으로 연결하세요. 응급 가능성이 있으면 119 또는 의료기관에 연락하세요.'
  if (type === 'care_partner_check') return '가족 또는 돌봄파트너가 전화·방문으로 상태를 확인하고 결과를 기록하세요.'
  if (type === 'pharmacy_call') return '약국 상담이 필요한지 보호자가 확인하고, 처방·복약 관련 판단은 약사 또는 의료기관에 문의하세요.'
  return '가족이 먼저 확인하고 필요한 지역 후속조치를 연결하세요.'
}

function providerTypesFor(requestType: string) {
  if (requestType === 'meal_delivery') return ['local_store', 'meal_provider', 'care_partner']
  if (requestType === 'medication_reminder') return ['care_partner', 'pharmacy', 'family']
  if (requestType === 'urgent_neighbor_help') return ['care_partner', 'caregiver', 'welfare_org', 'gov_center']
  if (requestType === 'care_partner_check') return ['care_partner', 'caregiver', 'welfare_org']
  if (requestType === 'pharmacy_call') return ['pharmacy', 'care_partner']
  return ['care_partner', 'family']
}

function metrics(requests: Row[], providers: Row[]) {
  const open = requests.filter((row) => !['completed', 'cancelled'].includes(text(row.status)))
  return {
    total: requests.length,
    open: open.length,
    urgent: open.filter((row) => text(row.risk_level) === 'high').length,
    completed: requests.filter((row) => text(row.status) === 'completed').length,
    providers: providers.length
  }
}

export async function GET(request: NextRequest) {
  const familyCode = code6(request.nextUrl.searchParams.get('familyCode'))
  const scope = text(request.nextUrl.searchParams.get('scope'))
  const ops = isOpsAuthed(request)

  if (scope === 'ops' && !ops) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다. 먼저 /ops 에서 로그인해주세요.'
      },
      { status: 401 }
    )
  }

  if (!familyCode && scope !== 'ops') {
    return NextResponse.json({
      ok: true,
      needFamilyCode: true,
      message: '가족코드 6자리를 입력하면 내 부모님 관련 후속조치만 조회합니다.',
      requests: [],
      providers: [],
      matches: [],
      metrics: metrics([], [])
    })
  }

  const requestPath =
    'care_response_requests?select=*&order=created_at.desc&limit=300' +
    (scope === 'ops' ? '' : '&family_code=eq.' + encodeURIComponent(familyCode))

  const [requestResult, providerResult, matchResult] = await Promise.all([
    rest(requestPath),
    scope === 'ops'
      ? rest('care_providers?select=*&order=created_at.desc&limit=300')
      : rest('care_providers?select=provider_type,provider_name,service_area,available_status,verified_status,response_time_min&order=created_at.desc&limit=60'),
    scope === 'ops'
      ? rest('care_response_matches?select=*&order=created_at.desc&limit=500')
      : rest('care_response_matches?select=request_id,match_status,created_at&order=created_at.desc&limit=100')
  ])

  if (!requestResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '후속조치 요청을 불러오지 못했습니다.',
        detail: requestResult.error
      },
      { status: 500 }
    )
  }

  const requests = rows(requestResult)
  const providers = rows(providerResult)

  return NextResponse.json({
    ok: true,
    scope: scope === 'ops' ? 'ops' : 'family',
    familyCode,
    requests,
    providers,
    matches: rows(matchResult),
    metrics: metrics(requests, providers)
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)
  const ops = isOpsAuthed(request)

  if (action === 'createProvider') {
    if (!ops) {
      return NextResponse.json(
        {
          ok: false,
          message: '지역 제공자 등록은 운영실 인증이 필요합니다.'
        },
        { status: 401 }
      )
    }

    const payload = {
      provider_type: text(body.providerType) || 'care_partner',
      provider_name: text(body.providerName) || '지역 돌봄파트너',
      phone: phone(body.phone),
      email: text(body.email),
      service_area: text(body.serviceArea) || '우리동네',
      address_hint: text(body.addressHint),
      available_status: text(body.availableStatus) || 'available',
      verified_status: text(body.verifiedStatus) || 'pending',
      qualification: text(body.qualification),
      available_hours: text(body.availableHours) || '주간',
      response_time_min: Number(body.responseTimeMin) || 30,
      notes: text(body.notes),
      payload: body,
      updated_at: new Date().toISOString()
    }

    const result = await rest('care_providers', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([payload])
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: '제공자 등록 실패', detail: result.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: '지역 후속조치 제공자가 등록되었습니다.',
      provider: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  if (action === 'createRequest') {
    const requestType = text(body.requestType) || 'care_partner_check'
    const familyCode = code6(body.familyCode)

    if (!familyCode && !ops) {
      return NextResponse.json(
        {
          ok: false,
          message: '후속조치 요청을 만들려면 가족코드가 필요합니다.'
        },
        { status: 400 }
      )
    }

    const payload = {
      family_code: familyCode || null,
      parent_name: text(body.parentName) || '부모님',
      parent_phone: phone(body.parentPhone),
      guardian_name: text(body.guardianName),
      guardian_phone: phone(body.guardianPhone),
      signal_type: text(body.signalType) || requestType,
      signal_label: text(body.signalLabel) || requestTypeLabel(requestType),
      request_type: requestType,
      risk_level: text(body.riskLevel) || (requestType === 'meal_delivery' ? 'medium' : 'high'),
      status: 'open',
      service_area: text(body.serviceArea) || '우리동네',
      address_hint: text(body.addressHint),
      requested_action: text(body.requestedAction) || recommendedAction(requestType),
      dispatch_scope: 'family_first',
      source: ops ? 'ops-manual' : 'family-manual',
      source_key: text(body.sourceKey) || null,
      payload: body,
      updated_at: new Date().toISOString()
    }

    const result = await rest('care_response_requests', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([payload])
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: '후속조치 요청 생성 실패', detail: result.error }, { status: 500 })
    }

    const created = Array.isArray(result.data) ? result.data[0] as Row : result.data as Row

    await rest('care_response_updates', {
      method: 'POST',
      body: JSON.stringify([
        {
          request_id: created.id,
          actor_type: ops ? 'ops' : 'family',
          actor_name: ops ? '운영실' : '가족',
          update_type: 'created',
          message: '후속조치 요청이 생성되었습니다.',
          payload: created
        }
      ])
    })

    return NextResponse.json({
      ok: true,
      message: '후속조치 요청이 생성되었습니다.',
      request: created
    })
  }

  if (action === 'dispatch') {
    if (!ops) {
      return NextResponse.json(
        {
          ok: false,
          message: '주변 도움망 전파는 운영실 인증이 필요합니다.'
        },
        { status: 401 }
      )
    }

    const requestId = text(body.requestId)

    if (!requestId) {
      return NextResponse.json({ ok: false, message: '요청 ID가 없습니다.' }, { status: 400 })
    }

    const requestResult = await rest('care_response_requests?select=*&id=eq.' + encodeURIComponent(requestId) + '&limit=1')
    const requestRow = rows(requestResult)[0]

    if (!requestResult.ok || !requestRow) {
      return NextResponse.json({ ok: false, message: '요청을 찾지 못했습니다.', detail: requestResult.error }, { status: 404 })
    }

    const requestType = text(requestRow.request_type)
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

      return NextResponse.json({
        ok: true,
        message: '조건에 맞는 제공자가 없습니다. 운영실 수동 연결이 필요합니다.',
        matched: 0
      })
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
              providerType: provider.provider_type
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
        dispatch_scope: 'provider_network',
        updated_at: new Date().toISOString()
      })
    })

    const outboxRows = newProviders
      .filter((provider) => phone(provider.phone))
      .map((provider) => ({
        family_code: text(requestRow.family_code),
        channel: 'sms',
        to_name: text(provider.provider_name),
        to_phone: phone(provider.phone),
        title: '[안부웍스] 지역 후속조치 요청',
        body:
          requestTypeLabel(requestType) +
          '\n' +
          text(requestRow.signal_label) +
          '\n확인 가능하면 안부웍스 요청함에서 수락해주세요.\nhttps://parents-care.net/provider/requests',
        reason: 'care-response-dispatch',
        target_url: '/provider/requests',
        status: 'queued',
        provider: 'response-network',
        source_key: 'response-dispatch-' + requestId + '-' + provider.id,
        payload: {
          requestId,
          providerId: provider.id
        }
      }))

    if (outboxRows.length > 0) {
      await rest('notification_outbox', {
        method: 'POST',
        body: JSON.stringify(outboxRows)
      })
    }

    await rest('care_response_updates', {
      method: 'POST',
      body: JSON.stringify([
        {
          request_id: requestId,
          actor_type: 'system',
          actor_name: '안부웍스',
          update_type: 'dispatched',
          message: `${newProviders.length}명의 지역 제공자에게 요청을 보냈습니다.`,
          payload: {
            providers: newProviders
          }
        }
      ])
    })

    return NextResponse.json({
      ok: true,
      message: `${newProviders.length}명의 지역 제공자에게 요청을 보냈습니다.`,
      matched: newProviders.length
    })
  }

  return NextResponse.json({ ok: false, message: '알 수 없는 action입니다.' }, { status: 400 })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const requestId = text(body.requestId)
  const status = text(body.status)
  const actorName = text(body.actorName) || '가족'
  const note = text(body.note)
  const familyCode = code6(body.familyCode)
  const ops = isOpsAuthed(request)

  if (!requestId || !status) {
    return NextResponse.json({ ok: false, message: 'requestId와 status가 필요합니다.' }, { status: 400 })
  }

  if (!ops && !familyCode) {
    return NextResponse.json(
      {
        ok: false,
        message: '상태를 변경하려면 가족코드가 필요합니다.'
      },
      { status: 400 }
    )
  }

  const filter =
    'id=eq.' +
    encodeURIComponent(requestId) +
    (ops ? '' : '&family_code=eq.' + encodeURIComponent(familyCode))

  const patch: Row = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'accepted' || status === 'in_progress') {
    patch.accepted_by_name = actorName
    patch.accepted_at = new Date().toISOString()
  }

  if (status === 'completed') {
    patch.completed_at = new Date().toISOString()
    patch.completed_note = note || `${actorName} 처리 완료`
  }

  if (note) patch.completed_note = note

  const result = await rest('care_response_requests?' + filter, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: '상태 변경 실패', detail: result.error }, { status: 500 })
  }

  await rest('care_response_updates', {
    method: 'POST',
    body: JSON.stringify([
      {
        request_id: requestId,
        actor_type: ops ? 'ops' : 'family',
        actor_name: actorName,
        update_type: status,
        message: note || `${actorName} 상태 변경: ${status}`,
        payload: body
      }
    ])
  })

  return NextResponse.json({
    ok: true,
    message: status === 'completed' ? '후속조치가 완료되었습니다.' : '후속조치 상태가 변경되었습니다.',
    request: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
