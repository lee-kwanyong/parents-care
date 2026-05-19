import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function arrayFrom(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean)
  }

  const str = text(value)
  if (!str) return []

  return str.split(',').map((item) => item.trim()).filter(Boolean)
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null as any,
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

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: parsed,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    status: response.status,
    data: parsed,
    error: null
  }
}

function firstRow(result: { data: any }) {
  return Array.isArray(result.data) ? result.data[0] : result.data
}

async function getManagers() {
  const result = await rest(
    'care_manager_profiles?select=*&profile_status=eq.active&identity_verified=eq.true&direct_transport_included=eq.false&order=created_at.desc&limit=200'
  )

  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function getRequests() {
  const result = await rest('care_manager_matching_requests?select=*&order=created_at.desc&limit=200')
  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function getOffers() {
  const result = await rest('care_manager_match_offers?select=*&order=created_at.desc&limit=500')
  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function getRequest(id: string) {
  const result = await rest('care_manager_matching_requests?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1')
  return result.ok && Array.isArray(result.data) ? result.data[0] : null
}

function containsAny(source: string, values: string[]) {
  const normalized = source.replace(/\s/g, '').toLowerCase()

  return values.some((value) => {
    const item = String(value || '').replace(/\s/g, '').toLowerCase()
    return Boolean(item) && (normalized.includes(item) || item.includes(normalized))
  })
}

function scoreManager(request: AnyRow, manager: AnyRow) {
  const requestRegion = text(request.region_text)
  const requiredSpecialties = Array.isArray(request.required_specialties) ? request.required_specialties : []
  const requiredScopes = Array.isArray(request.required_service_scopes) ? request.required_service_scopes : []
  const managerRegions = Array.isArray(manager.available_regions) ? manager.available_regions : []
  const managerSpecialties = Array.isArray(manager.specialties) ? manager.specialties : []
  const managerScopes = Array.isArray(manager.service_scopes) ? manager.service_scopes : []

  let score = 45
  const reasons: string[] = []

  if (manager.identity_verified) {
    score += 15
    reasons.push('본인확인 완료')
  }

  if (requestRegion && containsAny(requestRegion, managerRegions)) {
    score += 22
    reasons.push('활동지역 일치')
  }

  const specialtyHits = requiredSpecialties.filter((item: string) => containsAny(item, managerSpecialties))
  if (specialtyHits.length > 0) {
    score += Math.min(20, specialtyHits.length * 8)
    reasons.push('필요 역량 일치')
  }

  const scopeHits = requiredScopes.filter((item: string) => containsAny(item, managerScopes))
  if (scopeHits.length > 0) {
    score += Math.min(15, scopeHits.length * 5)
    reasons.push('수행업무 일치')
  }

  if (manager.trust_level === 'premium') {
    score += 8
    reasons.push('상위 신뢰등급')
  } else if (manager.trust_level === 'standard') {
    score += 5
    reasons.push('표준 신뢰등급')
  }

  if (request.medication_attention_needed && containsAny('복약', managerSpecialties.concat(managerScopes))) {
    score += 5
    reasons.push('복약 확인 가능')
  }

  if (request.mobility_support_needed && containsAny('동행', managerSpecialties.concat(managerScopes))) {
    score += 5
    reasons.push('이동·동행 보조 가능')
  }

  if (manager.direct_transport_included) {
    score -= 30
    reasons.push('유상운송 정책 확인 필요')
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons: reasons.length > 0 ? Array.from(new Set(reasons)) : ['검증 매니저']
  }
}

function expectedFee(request: AnyRow) {
  const type = text(request.request_type)

  if (type === 'hospital_visit') return 39000
  if (type === 'discharge_care') return 49000
  if (type === 'document_help') return 25000
  if (type === 'meal_check') return 29000
  if (type === 'medication_check') return 29000

  return 35000
}

function requestSnapshot(request: AnyRow) {
  return {
    elder_name: request.elder_name,
    guardian_name: request.guardian_name,
    guardian_phone: request.guardian_phone,
    request_title: request.request_title,
    request_type: request.request_type,
    region_text: request.region_text,
    hospital_name: request.hospital_name,
    appointment_date: request.appointment_date,
    appointment_time: request.appointment_time,
    meeting_location: request.meeting_location,
    required_specialties: request.required_specialties,
    required_service_scopes: request.required_service_scopes
  }
}

function managerSnapshot(manager: AnyRow) {
  return {
    manager_name: manager.manager_name,
    manager_phone: manager.manager_phone,
    trust_level: manager.trust_level,
    identity_verified: manager.identity_verified,
    available_regions: manager.available_regions,
    specialties: manager.specialties,
    service_scopes: manager.service_scopes,
    trust_card_summary: manager.trust_card_summary
  }
}

async function createRequest(body: AnyRow) {
  const elderName = text(body.elderName) || '부모님'
  const requestTitle = text(body.requestTitle) || '부모님 안심케어 요청'
  const regionText = text(body.regionText)

  if (!regionText) {
    return {
      ok: false,
      message: '지역을 입력해주세요.'
    }
  }

  const insert = await rest('care_manager_matching_requests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: elderName,
        guardian_name: text(body.guardianName),
        guardian_phone: text(body.guardianPhone),
        request_title: requestTitle,
        request_type: text(body.requestType) || 'hospital_visit',
        region_text: regionText,
        hospital_name: text(body.hospitalName) || null,
        appointment_date: text(body.appointmentDate) || null,
        appointment_time: text(body.appointmentTime) || null,
        meeting_location: text(body.meetingLocation) || null,
        required_specialties: arrayFrom(body.requiredSpecialties),
        required_service_scopes: arrayFrom(body.requiredServiceScopes),
        mobility_support_needed: true,
        hearing_support_needed: false,
        medication_attention_needed: arrayFrom(body.requiredSpecialties).some((item) => item.includes('약') || item.includes('복약')),
        transport_mode: 'hospital_meet',
        priority: text(body.priority) || 'normal',
        matching_status: 'requested',
        created_by_role: 'ops'
      }
    ])
  })

  if (!insert.ok) {
    return {
      ok: false,
      message: '안심케어 요청 생성 중 오류가 발생했습니다.',
      detail: insert.error
    }
  }

  return {
    ok: true,
    message: '안심케어 요청을 만들었습니다.',
    request: firstRow(insert)
  }
}

async function generateOffers(body: AnyRow) {
  const matchingRequestId = text(body.matchingRequestId)

  if (!matchingRequestId) {
    return {
      ok: false,
      message: 'matchingRequestId가 필요합니다.'
    }
  }

  const request = await getRequest(matchingRequestId)

  if (!request) {
    return {
      ok: false,
      message: '매칭 요청을 찾지 못했습니다.'
    }
  }

  const managers = await getManagers()
  const scored = managers
    .map((manager) => {
      const score = scoreManager(request, manager)

      return {
        manager,
        ...score
      }
    })
    .filter((item) => item.score >= 45)
    .sort((a, b) => b.score - a.score)
    .slice(0, Number(body.topN || 5))

  if (scored.length === 0) {
    return {
      ok: false,
      message: '조건에 맞는 검증 매니저가 없습니다. 먼저 매니저 등록/검증을 진행하세요.'
    }
  }

  const rows = scored.map(({ manager, score, reasons }) => ({
    matching_request_id: request.id,
    manager_profile_id: manager.id,
    manager_name: manager.manager_name,
    manager_phone: manager.manager_phone,
    offer_status: 'sent',
    offer_score: score,
    offer_reasons: reasons,
    expected_fee: expectedFee(request),
    estimated_minutes: request.request_type === 'hospital_visit' ? 120 : 90,
    response_deadline: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    request_snapshot: requestSnapshot(request),
    manager_snapshot: managerSnapshot(manager)
  }))

  const offerInsert = await rest('care_manager_match_offers?on_conflict=matching_request_id,manager_profile_id', {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify(rows)
  })

  if (!offerInsert.ok) {
    return {
      ok: false,
      message: '후보 매니저 제안 생성 중 오류가 발생했습니다.',
      detail: offerInsert.error
    }
  }

  await rest('care_manager_matching_requests?id=eq.' + encodeURIComponent(request.id), {
    method: 'PATCH',
    body: JSON.stringify({
      matching_status: 'candidate_generated',
      updated_at: new Date().toISOString()
    })
  })

  return {
    ok: true,
    message: `${rows.length}명의 후보 매니저에게 제안을 만들었습니다.`,
    request,
    offers: offerInsert.data
  }
}

export async function GET() {
  const [managers, requests, offers] = await Promise.all([
    getManagers(),
    getRequests(),
    getOffers()
  ])

  return NextResponse.json({
    ok: true,
    managers,
    requests,
    offers,
    summary: {
      managers: managers.length,
      activeRequests: requests.filter((item: AnyRow) => !['completed', 'cancelled'].includes(item.matching_status)).length,
      sentOffers: offers.filter((item: AnyRow) => item.offer_status === 'sent').length,
      acceptedOffers: offers.filter((item: AnyRow) => item.offer_status === 'accepted').length
    }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create_request') {
    const result = await createRequest(body)

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  }

  if (action === 'create_demo_request') {
    const result = await createRequest({
      elderName: '어머니',
      guardianName: '보호자 데모',
      guardianPhone: '010-1111-2222',
      requestTitle: '강남구 정형외과 병원 안심동행',
      requestType: 'hospital_visit',
      regionText: '강남구',
      hospitalName: '강남안심병원',
      appointmentDate: new Date().toISOString().slice(0, 10),
      appointmentTime: '오전 10시',
      meetingLocation: '병원 정문',
      requiredSpecialties: '병원동행, 약국·복약 확인',
      requiredServiceScopes: '접수·수납 도움, 약국 동행, 귀가 확인',
      priority: 'high'
    })

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  }

  if (action === 'generate_offers') {
    const result = await generateOffers(body)

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}
