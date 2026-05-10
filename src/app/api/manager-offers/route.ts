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

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((item) => item.trim()).filter(Boolean)
      }
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean)
    }
  }

  return []
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
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

function inferRequestType(input: string) {
  const value = input.toLowerCase()

  if (value.includes('식사') || value.includes('밥') || value.includes('도시락')) return 'meal_check'
  if (value.includes('약') || value.includes('복약')) return 'meal_check'
  if (value.includes('퇴원')) return 'discharge_check'
  if (value.includes('서류') || value.includes('보험') || value.includes('영수증')) return 'document_pickup'
  if (value.includes('안부')) return 'wellbeing_check'

  return 'hospital_visit'
}

function labelRequestType(type: string) {
  const map: Record<string, string> = {
    hospital_visit: '병원동행',
    meal_check: '식사·약 확인',
    discharge_check: '퇴원 후 확인',
    document_pickup: '서류 챙김',
    wellbeing_check: '안부 확인',
    custom: '기타'
  }

  return map[type] || type
}

function scoreManager(profile: AnyRow, request: AnyRow) {
  let score = 35
  const reasons: string[] = []

  if (profile.identity_verified) {
    score += 20
    reasons.push('본인확인 완료')
  }

  if (profile.profile_status === 'active') {
    score += 10
    reasons.push('활동 중 매니저')
  }

  if (profile.trust_level === 'trusted') {
    score += 15
    reasons.push('높은 안심도')
  } else if (profile.trust_level === 'standard') {
    score += 10
    reasons.push('표준 안심도')
  } else {
    score += 5
    reasons.push('기본 안심도')
  }

  const regions = asArray(profile.available_regions)
  const regionText = text(request.region_text)

  if (regionText && regions.some((region) => regionText.includes(region) || region.includes(regionText))) {
    score += 10
    reasons.push('지역 일치')
  }

  const requestSpecialties = asArray(request.required_specialties)
  const managerSpecialties = asArray(profile.specialties)

  if (requestSpecialties.some((item) => managerSpecialties.includes(item))) {
    score += 10
    reasons.push('전문분야 일치')
  }

  const requestScopes = asArray(request.required_service_scopes)
  const managerScopes = asArray(profile.service_scopes)

  if (requestScopes.some((item) => managerScopes.includes(item))) {
    score += 8
    reasons.push('업무범위 일치')
  }

  if (request.hearing_support_needed && managerSpecialties.some((item) => item.includes('청력') || item.includes('의사소통'))) {
    score += 5
    reasons.push('청력·의사소통 보조 가능')
  }

  if (request.medication_attention_needed && managerScopes.some((item) => item.includes('복약') || item.includes('약국'))) {
    score += 5
    reasons.push('복약·약국 확인 가능')
  }

  if (profile.direct_transport_included) {
    score -= 100
    reasons.push('직접 운송 포함으로 제외 필요')
  }

  if (!profile.identity_verified || profile.profile_status !== 'active') {
    score -= 100
    reasons.push('매칭 불가 상태')
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons
  }
}

async function fetchMatchingRequests() {
  const select = [
    'id',
    'elder_name',
    'guardian_name',
    'guardian_phone',
    'request_title',
    'request_type',
    'region_text',
    'hospital_name',
    'appointment_date',
    'appointment_time',
    'meeting_location',
    'required_specialties',
    'required_service_scopes',
    'mobility_support_needed',
    'hearing_support_needed',
    'allergy_attention_needed',
    'medication_attention_needed',
    'transport_mode',
    'priority',
    'matching_status',
    'selected_manager_profile_id',
    'manager_assignment_id',
    'created_at'
  ].join(',')

  const result = await rest(
    'care_manager_matching_requests?select=' +
      encodeURIComponent(select) +
      '&order=created_at.desc&limit=100'
  )

  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function fetchVerifiedManagers() {
  const select = [
    'id',
    'manager_name',
    'manager_phone',
    'profile_status',
    'trust_level',
    'identity_verified',
    'available_regions',
    'specialties',
    'service_scopes',
    'vehicle_owned',
    'driving_license_owned',
    'direct_transport_included',
    'trust_card_summary',
    'rating_safety',
    'rating_kindness',
    'rating_accuracy',
    'rating_punctuality',
    'evaluation_count',
    'created_at'
  ].join(',')

  const result = await rest(
    'care_manager_profiles?select=' +
      encodeURIComponent(select) +
      '&profile_status=eq.active&identity_verified=eq.true&direct_transport_included=eq.false&order=created_at.desc&limit=200'
  )

  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function fetchOffers() {
  const result = await rest(
    'care_manager_match_offers?select=*&order=created_at.desc&limit=300'
  )

  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function fetchRequestById(id: string) {
  const result = await rest(
    'care_manager_matching_requests?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1'
  )

  return result.ok && Array.isArray(result.data) ? result.data[0] : null
}

async function fetchProfileById(id: string) {
  const result = await rest(
    'care_manager_profiles?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1'
  )

  return result.ok && Array.isArray(result.data) ? result.data[0] : null
}

async function fetchOfferById(id: string) {
  const result = await rest(
    'care_manager_match_offers?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1'
  )

  return result.ok && Array.isArray(result.data) ? result.data[0] : null
}

async function createEvent(input: {
  offerId?: string | null
  matchingRequestId?: string | null
  managerProfileId?: string | null
  eventType: string
  title: string
  description?: string | null
  payload?: Record<string, unknown>
  role?: string
}) {
  await rest('care_manager_match_offer_events', {
    method: 'POST',
    body: JSON.stringify([
      {
        offer_id: input.offerId || null,
        matching_request_id: input.matchingRequestId || null,
        manager_profile_id: input.managerProfileId || null,
        event_type: input.eventType,
        title: input.title,
        description: input.description || null,
        payload: input.payload || {},
        created_by_role: input.role || 'system'
      }
    ])
  })
}

async function createNotification(input: {
  manager: AnyRow
  request: AnyRow
  offerId: string
}) {
  await rest('notification_outbox', {
    method: 'POST',
    body: JSON.stringify([
      {
        elder_name: input.request.elder_name || '부모님',
        recipient_role: 'manager',
        recipient_name: input.manager.manager_name,
        recipient_phone: input.manager.manager_phone,
        channel: 'app',
        template_code: 'manager_offer_sent',
        title: '새 케어 요청 제안',
        body: `${input.request.elder_name || '부모님'} ${labelRequestType(input.request.request_type)} 요청이 도착했습니다.`,
        payload: {
          offer_id: input.offerId,
          matching_request_id: input.request.id,
          url: '/manager/offers'
        },
        priority: input.request.priority || 'normal',
        status: 'queued',
        created_by_role: 'system',
        dedupe_key: `manager-offer-${input.offerId}`
      }
    ])
  })
}

export async function GET() {
  const [requests, offers, managers] = await Promise.all([
    fetchMatchingRequests(),
    fetchOffers(),
    fetchVerifiedManagers()
  ])

  const summary = {
    requests: requests.length,
    offers: offers.length,
    sent: offers.filter((item) => item.offer_status === 'sent').length,
    accepted: offers.filter((item) => item.offer_status === 'accepted').length,
    assigned: offers.filter((item) => item.offer_status === 'assigned').length,
    declined: offers.filter((item) => item.offer_status === 'declined').length,
    verifiedManagers: managers.length
  }

  return NextResponse.json({
    ok: true,
    requests,
    offers,
    managers,
    summary
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create_request_from_latest_intake') {
    const intakeResult = await rest(
      'care_assisted_intake_requests?select=*&order=created_at.desc&limit=1'
    )

    const intake = intakeResult.ok && Array.isArray(intakeResult.data)
      ? intakeResult.data[0]
      : null

    if (!intake) {
      return NextResponse.json(
        {
          ok: false,
          message: '최근 접수가 없습니다. 먼저 /care-request에서 접수해주세요.'
        },
        { status: 404 }
      )
    }

    const rawText = text(intake.raw_text)
    const title = text(intake.summary_title) || rawText.slice(0, 40) || '부모님 케어 요청'
    const requestType = inferRequestType(`${title} ${rawText}`)

    const insert = await rest('care_manager_matching_requests', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          elder_name: text(intake.elder_name) || '부모님',
          guardian_name: text(intake.contact_name) || '보호자',
          guardian_phone: text(intake.contact_phone) || null,
          request_title: title,
          request_type: requestType,
          region_text: null,
          hospital_name: null,
          appointment_date: null,
          appointment_time: null,
          meeting_location: null,
          required_specialties: requestType === 'hospital_visit' ? ['약국·복약 확인'] : [],
          required_service_scopes: ['접수·수납 도움', '복약 확인', '귀가 확인'],
          mobility_support_needed: rawText.includes('무릎') || rawText.includes('다리') || rawText.includes('이동'),
          hearing_support_needed: rawText.includes('귀') || rawText.includes('청력'),
          allergy_attention_needed: rawText.includes('알러지') || rawText.includes('알레르기'),
          medication_attention_needed: rawText.includes('약') || rawText.includes('복용'),
          transport_mode: 'hospital_meet',
          vehicle_required: false,
          direct_transport_required: false,
          priority: intake.priority || 'normal',
          matching_status: 'requested',
          ops_memo: '운영실 접수함에서 생성된 매칭 요청',
          created_by_role: 'ops'
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '매칭 요청 생성 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: '최근 접수를 매칭 요청으로 만들었습니다.',
      request: firstRow(insert)
    })
  }

  if (action === 'broadcast_offers') {
    const requestId = text(body.requestId)

    if (!requestId) {
      return NextResponse.json({ ok: false, message: 'requestId가 필요합니다.' }, { status: 400 })
    }

    const matchingRequest = await fetchRequestById(requestId)

    if (!matchingRequest) {
      return NextResponse.json({ ok: false, message: '매칭 요청을 찾지 못했습니다.' }, { status: 404 })
    }

    const managers = await fetchVerifiedManagers()

    if (managers.length === 0) {
      return NextResponse.json({
        ok: false,
        message: '본인확인 완료된 활동 매니저가 없습니다. 먼저 매니저 검증/승인을 완료하세요.'
      }, { status: 400 })
    }

    const scoredManagers = managers
      .map((manager) => {
        const scored = scoreManager(manager, matchingRequest)

        return {
          manager,
          score: scored.score,
          reasons: scored.reasons
        }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(body.limit || 10))

    const deadline = new Date(Date.now() + 1000 * 60 * 30).toISOString()

    const rows = scoredManagers.map((item) => ({
      matching_request_id: matchingRequest.id,
      manager_profile_id: item.manager.id,
      manager_name: item.manager.manager_name,
      manager_phone: item.manager.manager_phone,
      offer_status: 'sent',
      offer_score: item.score,
      offer_reasons: item.reasons,
      response_deadline: deadline,
      request_snapshot: {
        elder_name: matchingRequest.elder_name,
        request_title: matchingRequest.request_title,
        request_type: matchingRequest.request_type,
        region_text: matchingRequest.region_text,
        hospital_name: matchingRequest.hospital_name,
        appointment_date: matchingRequest.appointment_date,
        appointment_time: matchingRequest.appointment_time,
        meeting_location: matchingRequest.meeting_location
      },
      manager_snapshot: {
        manager_name: item.manager.manager_name,
        trust_level: item.manager.trust_level,
        identity_verified: item.manager.identity_verified,
        trust_card_summary: item.manager.trust_card_summary,
        rating_safety: item.manager.rating_safety,
        rating_kindness: item.manager.rating_kindness,
        rating_accuracy: item.manager.rating_accuracy,
        rating_punctuality: item.manager.rating_punctuality
      }
    }))

    const insert = await rest('care_manager_match_offers?on_conflict=matching_request_id,manager_profile_id', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify(rows)
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '매니저 제안 생성 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    const offers = Array.isArray(insert.data) ? insert.data : []

    for (const offer of offers) {
      const manager = managers.find((item) => item.id === offer.manager_profile_id)

      if (manager) {
        await createNotification({
          manager,
          request: matchingRequest,
          offerId: offer.id
        })

        await createEvent({
          offerId: offer.id,
          matchingRequestId: matchingRequest.id,
          managerProfileId: manager.id,
          eventType: 'sent',
          title: '매니저에게 케어 요청 제안 발송',
          description: `${manager.manager_name} 매니저에게 제안이 발송됐습니다.`,
          role: 'ops'
        })
      }
    }

    await rest('care_manager_matching_requests?id=eq.' + encodeURIComponent(matchingRequest.id), {
      method: 'PATCH',
      body: JSON.stringify({
        matching_status: 'candidate_generated',
        updated_at: new Date().toISOString()
      })
    })

    return NextResponse.json({
      ok: true,
      message: `검증 매니저 ${offers.length}명에게 제안을 보냈습니다.`,
      offers
    })
  }

  if (action === 'accept_offer' || action === 'decline_offer') {
    const offerId = text(body.offerId)
    const memo = text(body.memo)

    if (!offerId) {
      return NextResponse.json({ ok: false, message: 'offerId가 필요합니다.' }, { status: 400 })
    }

    const status = action === 'accept_offer' ? 'accepted' : 'declined'
    const now = new Date().toISOString()

    const patch = await rest('care_manager_match_offers?id=eq.' + encodeURIComponent(offerId), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        offer_status: status,
        manager_response_memo: memo || null,
        responded_at: now
      })
    })

    if (!patch.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '제안 응답 처리 중 오류가 발생했습니다.',
          detail: patch.error
        },
        { status: 500 }
      )
    }

    const offer = firstRow(patch)

    await createEvent({
      offerId: offer.id,
      matchingRequestId: offer.matching_request_id,
      managerProfileId: offer.manager_profile_id,
      eventType: status,
      title: status === 'accepted' ? '매니저가 제안을 수락했습니다.' : '매니저가 제안을 거절했습니다.',
      description: memo || null,
      role: 'manager'
    })

    return NextResponse.json({
      ok: true,
      message: status === 'accepted' ? '제안을 수락했습니다.' : '제안을 거절했습니다.',
      offer
    })
  }

  if (action === 'assign_offer') {
    const offerId = text(body.offerId)

    if (!offerId) {
      return NextResponse.json({ ok: false, message: 'offerId가 필요합니다.' }, { status: 400 })
    }

    const offer = await fetchOfferById(offerId)

    if (!offer) {
      return NextResponse.json({ ok: false, message: '제안을 찾지 못했습니다.' }, { status: 404 })
    }

    if (offer.offer_status !== 'accepted') {
      return NextResponse.json({ ok: false, message: '수락된 제안만 배정 확정할 수 있습니다.' }, { status: 400 })
    }

    const matchingRequest = await fetchRequestById(offer.matching_request_id)
    const manager = await fetchProfileById(offer.manager_profile_id)

    if (!matchingRequest || !manager) {
      return NextResponse.json({ ok: false, message: '매칭 요청 또는 매니저 정보를 찾지 못했습니다.' }, { status: 404 })
    }

    if (!manager.identity_verified || manager.profile_status !== 'active' || manager.direct_transport_included) {
      return NextResponse.json({ ok: false, message: '검증 완료된 활동 매니저만 배정할 수 있습니다.' }, { status: 400 })
    }

    const assignmentType =
      matchingRequest.request_type === 'document_pickup'
        ? 'document_pickup'
        : matchingRequest.request_type === 'meal_check'
          ? 'meal_check'
          : matchingRequest.request_type === 'discharge_check'
            ? 'discharge_check'
            : matchingRequest.request_type === 'wellbeing_check'
              ? 'wellbeing'
              : 'hospital_visit'

    const assignmentInsert = await rest('manager_field_assignments', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          matching_request_id: matchingRequest.id,
          manager_profile_id: manager.id,
          elder_name: matchingRequest.elder_name || '부모님',
          manager_name: manager.manager_name,
          manager_phone: manager.manager_phone,
          assignment_type: assignmentType,
          title: matchingRequest.request_title || '부모님 케어 배정',
          appointment_date: matchingRequest.appointment_date,
          appointment_time: matchingRequest.appointment_time,
          meeting_location: matchingRequest.meeting_location,
          meeting_code: '2580',
          transport_mode: matchingRequest.transport_mode || 'hospital_meet',
          vehicle_owned: Boolean(manager.vehicle_owned),
          direct_transport_included: false,
          transport_policy_acknowledged: true,
          status: 'assigned',
          care_passport_snapshot: {},
          safety_notes: [
            '본인확인 완료 매니저입니다.',
            '매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.',
            '현장 특이사항은 보호자에게 즉시 공유합니다.'
          ],
          guardian_questions: [],
          required_documents: [],
          ops_memo: '매니저 수락 후 운영실 최종 배정',
          created_by_role: 'ops',
          manager_trust_snapshot: {
            manager_profile_id: manager.id,
            trust_level: manager.trust_level,
            identity_verified: manager.identity_verified,
            trust_card_summary: manager.trust_card_summary,
            rating_safety: manager.rating_safety,
            rating_kindness: manager.rating_kindness,
            rating_accuracy: manager.rating_accuracy,
            rating_punctuality: manager.rating_punctuality
          },
          matching_gate_checked: true
        }
      ])
    })

    if (!assignmentInsert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '현장 배정 생성 중 오류가 발생했습니다.',
          detail: assignmentInsert.error
        },
        { status: 500 }
      )
    }

    const assignment = firstRow(assignmentInsert)

    await rest('care_manager_matching_requests?id=eq.' + encodeURIComponent(matchingRequest.id), {
      method: 'PATCH',
      body: JSON.stringify({
        matching_status: 'assigned',
        selected_manager_profile_id: manager.id,
        manager_assignment_id: assignment.id,
        updated_at: new Date().toISOString()
      })
    })

    await rest('care_manager_match_offers?id=eq.' + encodeURIComponent(offer.id), {
      method: 'PATCH',
      body: JSON.stringify({
        offer_status: 'assigned',
        assigned_at: new Date().toISOString()
      })
    })

    await rest(
      'care_manager_match_offers?matching_request_id=eq.' +
        encodeURIComponent(matchingRequest.id) +
        '&id=neq.' +
        encodeURIComponent(offer.id),
      {
        method: 'PATCH',
        body: JSON.stringify({
          offer_status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
      }
    )

    await createEvent({
      offerId: offer.id,
      matchingRequestId: matchingRequest.id,
      managerProfileId: manager.id,
      eventType: 'assigned',
      title: '운영실이 매니저 배정을 확정했습니다.',
      description: `${manager.manager_name} 매니저가 배정됐습니다.`,
      role: 'ops'
    })

    return NextResponse.json({
      ok: true,
      message: '수락한 매니저로 현장 배정을 확정했습니다.',
      assignment
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}
