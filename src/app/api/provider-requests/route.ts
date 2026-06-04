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

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
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

function providerTypeLabel(type: string) {
  if (type === 'care_partner') return '돌봄파트너'
  if (type === 'caregiver') return '요양보호사'
  if (type === 'local_store') return '지역상점'
  if (type === 'meal_provider') return '도시락/반찬'
  if (type === 'pharmacy') return '약국'
  if (type === 'welfare_org') return '수행기관'
  if (type === 'gov_center') return '지자체'
  if (type === 'family') return '가족'
  return '제공자'
}

function canSeePrivate(matchStatus: string) {
  return ['accepted', 'in_progress', 'completed'].includes(matchStatus)
}

function sanitizeRequest(request: Row, matchStatus: string) {
  const visible = canSeePrivate(matchStatus)

  return {
    id: text(request.id),
    family_code: text(request.family_code),
    parent_name: text(request.parent_name) || '부모님',
    signal_label: text(request.signal_label),
    request_type: text(request.request_type),
    request_type_label: requestTypeLabel(text(request.request_type)),
    risk_level: text(request.risk_level) || 'medium',
    status: text(request.status),
    service_area: text(request.service_area),
    requested_action: text(request.requested_action),
    created_at: text(request.created_at),
    parent_phone: visible ? text(request.parent_phone) : '',
    guardian_phone: visible ? text(request.guardian_phone) : '',
    address_hint: visible ? text(request.address_hint) : '',
    private_locked: !visible
  }
}

export async function GET(request: NextRequest) {
  const providerPhone = phone(request.nextUrl.searchParams.get('phone'))

  if (!providerPhone) {
    return NextResponse.json({
      ok: true,
      needPhone: true,
      message: '요청을 확인하려면 등록된 연락처를 입력해주세요.',
      providers: [],
      items: [],
      metrics: {
        total: 0,
        notified: 0,
        accepted: 0,
        completed: 0
      }
    })
  }

  const providerResult = await rest('care_providers?select=*&phone=eq.' + encodeURIComponent(providerPhone) + '&limit=20')

  if (!providerResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '지역 도움망 정보를 불러오지 못했습니다.',
        detail: providerResult.error
      },
      { status: 500 }
    )
  }

  const providers = rows(providerResult)

  if (providers.length === 0) {
    return NextResponse.json({
      ok: true,
      notRegistered: true,
      message: '등록된 지역 도움망 연락처가 아닙니다. 운영실에서 먼저 제공자를 등록해야 합니다.',
      providers: [],
      items: [],
      metrics: {
        total: 0,
        notified: 0,
        accepted: 0,
        completed: 0
      }
    })
  }

  const providerIds = providers.map((provider) => text(provider.id)).filter(Boolean)

  const matchResult = await rest(
    'care_response_matches?select=*&provider_id=in.(' +
      providerIds.map(encodeURIComponent).join(',') +
      ')&order=created_at.desc&limit=200'
  )

  if (!matchResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '받은 요청을 불러오지 못했습니다.',
        detail: matchResult.error
      },
      { status: 500 }
    )
  }

  const matches = rows(matchResult)
  const requestIds = [...new Set(matches.map((match) => text(match.request_id)).filter(Boolean))]

  let requests: Row[] = []

  if (requestIds.length > 0) {
    const requestResult = await rest(
      'care_response_requests?select=*&id=in.(' +
        requestIds.map(encodeURIComponent).join(',') +
        ')&order=created_at.desc&limit=200'
    )

    if (!requestResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '요청 상세를 불러오지 못했습니다.',
          detail: requestResult.error
        },
        { status: 500 }
      )
    }

    requests = rows(requestResult)
  }

  const requestMap: Record<string, Row> = {}

  for (const requestRow of requests) {
    requestMap[text(requestRow.id)] = requestRow
  }

  const providerMap: Record<string, Row> = {}

  for (const provider of providers) {
    providerMap[text(provider.id)] = provider
  }

  const items = matches.map((match) => {
    const matchStatus = text(match.match_status)
    const requestRow = requestMap[text(match.request_id)] || {}
    const provider = providerMap[text(match.provider_id)] || {}

    return {
      match: {
        id: text(match.id),
        request_id: text(match.request_id),
        provider_id: text(match.provider_id),
        match_status: matchStatus,
        notified_at: text(match.notified_at),
        accepted_at: text(match.accepted_at),
        completed_at: text(match.completed_at),
        note: text(match.note)
      },
      provider: {
        id: text(provider.id),
        provider_type: text(provider.provider_type),
        provider_type_label: providerTypeLabel(text(provider.provider_type)),
        provider_name: text(provider.provider_name),
        service_area: text(provider.service_area),
        verified_status: text(provider.verified_status),
        available_status: text(provider.available_status)
      },
      request: sanitizeRequest(requestRow, matchStatus)
    }
  })

  return NextResponse.json({
    ok: true,
    providers,
    items,
    metrics: {
      total: items.length,
      notified: items.filter((item) => item.match.match_status === 'notified').length,
      accepted: items.filter((item) => ['accepted', 'in_progress'].includes(item.match.match_status)).length,
      completed: items.filter((item) => item.match.match_status === 'completed').length
    }
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const providerPhone = phone(body.phone)
  const matchId = text(body.matchId)
  const action = text(body.action)
  const note = text(body.note)

  if (!providerPhone || !matchId || !action) {
    return NextResponse.json(
      {
        ok: false,
        message: '연락처, 요청 ID, 처리 상태가 필요합니다.'
      },
      { status: 400 }
    )
  }

  const providerResult = await rest('care_providers?select=*&phone=eq.' + encodeURIComponent(providerPhone) + '&limit=20')
  const providers = rows(providerResult)
  const providerIds = providers.map((provider) => text(provider.id)).filter(Boolean)

  if (providerIds.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        message: '등록된 지역 도움망 연락처가 아닙니다.'
      },
      { status: 403 }
    )
  }

  const matchResult = await rest(
    'care_response_matches?select=*&id=eq.' +
      encodeURIComponent(matchId) +
      '&provider_id=in.(' +
      providerIds.map(encodeURIComponent).join(',') +
      ')&limit=1'
  )

  const matchRows = rows(matchResult)

  if (matchRows.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        message: '처리할 수 있는 요청을 찾지 못했습니다.'
      },
      { status: 404 }
    )
  }

  const match = matchRows[0]
  const requestId = text(match.request_id)
  const provider = providers.find((row) => text(row.id) === text(match.provider_id)) || providers[0]
  const providerName = text(provider.provider_name) || '지역 도움망'

  let matchPatch: Row = {
    updated_at: new Date().toISOString()
  }

  let requestPatch: Row = {
    updated_at: new Date().toISOString()
  }

  let updateType = action
  let message = ''

  if (action === 'accept') {
    matchPatch = {
      ...matchPatch,
      match_status: 'accepted',
      accepted_at: new Date().toISOString(),
      note: note || providerName + '님이 요청을 수락했습니다.'
    }

    requestPatch = {
      ...requestPatch,
      status: 'accepted',
      accepted_by_provider_id: text(provider.id),
      accepted_by_name: providerName,
      accepted_at: new Date().toISOString()
    }

    message = providerName + '님이 요청을 수락했습니다.'
    updateType = 'accepted'
  } else if (action === 'start') {
    matchPatch = {
      ...matchPatch,
      match_status: 'in_progress',
      note: note || providerName + '님이 확인 중입니다.'
    }

    requestPatch = {
      ...requestPatch,
      status: 'in_progress',
      accepted_by_provider_id: text(provider.id),
      accepted_by_name: providerName
    }

    message = providerName + '님이 확인 중입니다.'
    updateType = 'in_progress'
  } else if (action === 'complete') {
    matchPatch = {
      ...matchPatch,
      match_status: 'completed',
      completed_at: new Date().toISOString(),
      note: note || providerName + '님이 처리를 완료했습니다.'
    }

    requestPatch = {
      ...requestPatch,
      status: 'completed',
      accepted_by_provider_id: text(provider.id),
      accepted_by_name: providerName,
      completed_at: new Date().toISOString(),
      completed_note: note || providerName + '님이 처리를 완료했습니다.'
    }

    message = note || providerName + '님이 처리를 완료했습니다.'
    updateType = 'completed'
  } else if (action === 'decline') {
    matchPatch = {
      ...matchPatch,
      match_status: 'declined',
      declined_at: new Date().toISOString(),
      note: note || providerName + '님이 요청을 거절했습니다.'
    }

    message = note || providerName + '님이 요청을 거절했습니다.'
    updateType = 'declined'
  } else {
    return NextResponse.json(
      {
        ok: false,
        message: '알 수 없는 처리 상태입니다.'
      },
      { status: 400 }
    )
  }

  const updateMatch = await rest('care_response_matches?id=eq.' + encodeURIComponent(matchId), {
    method: 'PATCH',
    body: JSON.stringify(matchPatch)
  })

  if (!updateMatch.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '요청 상태를 변경하지 못했습니다.',
        detail: updateMatch.error
      },
      { status: 500 }
    )
  }

  if (action !== 'decline') {
    await rest('care_response_requests?id=eq.' + encodeURIComponent(requestId), {
      method: 'PATCH',
      body: JSON.stringify(requestPatch)
    })
  }

  await rest('care_response_updates', {
    method: 'POST',
    body: JSON.stringify([
      {
        request_id: requestId,
        actor_type: 'provider',
        actor_name: providerName,
        update_type: updateType,
        message,
        payload: {
          matchId,
          providerId: text(provider.id),
          action,
          note
        }
      }
    ])
  })

  return NextResponse.json({
    ok: true,
    message,
    action
  })
}
