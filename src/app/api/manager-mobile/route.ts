import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
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

function won(value: number) {
  return Math.max(0, Math.round(value || 0))
}

async function getManagerProfile(managerProfileId?: string) {
  if (managerProfileId) {
    const result = await rest(
      'care_manager_profiles?select=*&id=eq.' +
        encodeURIComponent(managerProfileId) +
        '&limit=1'
    )

    return result.ok && Array.isArray(result.data) ? result.data[0] : null
  }

  const result = await rest(
    'care_manager_profiles?select=*&profile_status=eq.active&identity_verified=eq.true&direct_transport_included=eq.false&order=created_at.desc&limit=1'
  )

  return result.ok && Array.isArray(result.data) ? result.data[0] : null
}

async function getOffers(managerProfileId: string) {
  const result = await rest(
    'care_manager_match_offers?select=*&manager_profile_id=eq.' +
      encodeURIComponent(managerProfileId) +
      '&order=created_at.desc&limit=50'
  )

  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function getAssignments(managerProfileId: string) {
  const result = await rest(
    'manager_field_assignments?select=*&manager_profile_id=eq.' +
      encodeURIComponent(managerProfileId) +
      '&order=created_at.desc&limit=50'
  )

  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function getEarnings(managerProfileId: string) {
  const result = await rest(
    'care_manager_earnings?select=*&manager_profile_id=eq.' +
      encodeURIComponent(managerProfileId) +
      '&order=created_at.desc&limit=100'
  )

  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function getAvailability(managerProfileId: string) {
  const result = await rest(
    'care_manager_availability?select=*&manager_profile_id=eq.' +
      encodeURIComponent(managerProfileId) +
      '&order=day_of_week.asc,time_slot.asc'
  )

  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function createDemoPartnerAndWork() {
  const now = new Date().toISOString()

  const profileInsert = await rest('care_manager_profiles', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        manager_name: '홍길동 케어파트너',
        manager_phone: '01000000000',
        profile_status: 'active',
        trust_level: 'standard',
        identity_verified: true,
        identity_verified_at: now,
        certifications: ['요양보호사 또는 관련 자격 확인', '병원동행 기본교육 확인'],
        available_regions: ['강남구', '서초구', '송파구'],
        specialties: ['병원동행', '약국·복약 확인', '어르신 응대'],
        service_scopes: ['병원 앞 만남', '접수·수납 도움', '약국 동행', '복약 확인', '귀가 확인'],
        vehicle_owned: false,
        driving_license_owned: false,
        direct_transport_included: false,
        trust_card_summary: '최초 검증 완료 · 병원동행 · 약국/복약 확인 가능',
        public_notes: '검증 완료 케어파트너입니다. 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.',
        review_summary: '신규 검증 케어파트너',
        approved_at: now
      }
    ])
  })

  if (!profileInsert.ok) {
    return {
      ok: false,
      error: profileInsert.error
    }
  }

  const profile = firstRow(profileInsert)

  const requestInsert = await rest('care_manager_matching_requests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: '어머니',
        guardian_name: '보호자 데모',
        guardian_phone: '01011112222',
        request_title: '강남구 정형외과 병원동행',
        request_type: 'hospital_visit',
        region_text: '강남구',
        hospital_name: '강남안심병원',
        appointment_date: '2026-05-10',
        appointment_time: '오전 10시',
        meeting_location: '병원 정문',
        required_specialties: ['병원동행', '약국·복약 확인'],
        required_service_scopes: ['접수·수납 도움', '약국 동행', '귀가 확인'],
        mobility_support_needed: true,
        hearing_support_needed: false,
        medication_attention_needed: true,
        transport_mode: 'hospital_meet',
        priority: 'high',
        matching_status: 'candidate_generated',
        created_by_role: 'ops'
      }
    ])
  })

  if (!requestInsert.ok) {
    return {
      ok: false,
      error: requestInsert.error
    }
  }

  const matchingRequest = firstRow(requestInsert)

  const offerInsert = await rest('care_manager_match_offers?on_conflict=matching_request_id,manager_profile_id', {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify([
      {
        matching_request_id: matchingRequest.id,
        manager_profile_id: profile.id,
        manager_name: profile.manager_name,
        manager_phone: profile.manager_phone,
        offer_status: 'sent',
        offer_score: 92,
        offer_reasons: ['본인확인 완료', '검증 매니저', '지역 가능', '약국·복약 확인 가능'],
        expected_fee: 39000,
        estimated_minutes: 120,
        response_deadline: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
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
          manager_name: profile.manager_name,
          trust_level: profile.trust_level,
          identity_verified: profile.identity_verified,
          trust_card_summary: profile.trust_card_summary
        }
      }
    ])
  })

  return {
    ok: offerInsert.ok,
    profile,
    request: matchingRequest,
    offer: firstRow(offerInsert),
    error: offerInsert.error
  }
}


async function createAssignmentFromOfferRow(offer: AnyRow, manager: AnyRow) {
  const matchingRequestId = String(offer.matching_request_id || '')
  const managerProfileId = String(manager.id || '')

  if (matchingRequestId && managerProfileId) {
    const existing = await rest(
      'manager_field_assignments?select=*&matching_request_id=eq.' +
        encodeURIComponent(matchingRequestId) +
        '&manager_profile_id=eq.' +
        encodeURIComponent(managerProfileId) +
        '&limit=1'
    )

    if (existing.ok && Array.isArray(existing.data) && existing.data[0]) {
      await rest('care_manager_match_offers?id=eq.' + encodeURIComponent(String(offer.id)), {
        method: 'PATCH',
        body: JSON.stringify({
          offer_status: 'assigned',
          assigned_at: new Date().toISOString()
        })
      })

      return {
        ok: true,
        assignment: existing.data[0]
      }
    }
  }

  const snapshot = offer.request_snapshot || {}

  const assignmentResult = await rest('manager_field_assignments', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        matching_request_id: offer.matching_request_id,
        manager_profile_id: manager.id,
        elder_name: snapshot.elder_name || '부모님',
        manager_name: manager.manager_name,
        manager_phone: manager.manager_phone,
        assignment_type: snapshot.request_type || 'hospital_visit',
        title: snapshot.request_title || '부모님 안심케어 배정',
        appointment_date: snapshot.appointment_date || null,
        appointment_time: snapshot.appointment_time || null,
        meeting_location: snapshot.meeting_location || null,
        meeting_code: '2580',
        transport_mode: 'hospital_meet',
        vehicle_owned: Boolean(manager.vehicle_owned),
        direct_transport_included: false,
        transport_policy_acknowledged: true,
        status: 'assigned',
        checkin_status: 'not_started',
        expected_fee: won(offer.expected_fee || 35000),
        estimated_minutes: Number(offer.estimated_minutes || 120),
        safety_notes: ['검증 완료 케어파트너입니다.', '개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.'],
        matching_gate_checked: true,
        created_by_role: 'ops',
        manager_trust_snapshot: {
          manager_profile_id: manager.id,
          trust_level: manager.trust_level,
          identity_verified: manager.identity_verified,
          trust_card_summary: manager.trust_card_summary
        }
      }
    ])
  })

  if (!assignmentResult.ok) {
    return {
      ok: false,
      error: assignmentResult.error
    }
  }

  const assignment = firstRow(assignmentResult)

  await rest('care_manager_match_offers?id=eq.' + encodeURIComponent(String(offer.id)), {
    method: 'PATCH',
    body: JSON.stringify({
      offer_status: 'assigned',
      assigned_at: new Date().toISOString()
    })
  })

  return {
    ok: true,
    assignment
  }
}


async function getMatchingRequestForReport(matchingRequestId: string) {
  if (!matchingRequestId) return null

  const result = await rest(
    'care_manager_matching_requests?select=*&id=eq.' +
      encodeURIComponent(matchingRequestId) +
      '&limit=1'
  )

  return result.ok && Array.isArray(result.data) ? result.data[0] : null
}

async function createGuardianReportFromAssignment(assignment: AnyRow, manager: AnyRow) {
  const existing = await rest(
    'care_guardian_reports?select=*&assignment_id=eq.' +
      encodeURIComponent(String(assignment.id)) +
      '&limit=1'
  )

  if (existing.ok && Array.isArray(existing.data) && existing.data[0]) {
    return {
      ok: true,
      report: existing.data[0],
      created: false
    }
  }

  const matchingRequest = await getMatchingRequestForReport(String(assignment.matching_request_id || ''))
  const elderName = assignment.elder_name || matchingRequest?.elder_name || '부모님'
  const guardianName = matchingRequest?.guardian_name || '보호자'
  const guardianPhone = matchingRequest?.guardian_phone || ''
  const managerName = assignment.manager_name || manager.manager_name || '안심케어 매니저'
  const title = assignment.title || matchingRequest?.request_title || `${elderName} 안심케어 리포트`
  const completedAt = assignment.completed_at || new Date().toISOString()

  const reportInsert = await rest('care_guardian_reports', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        assignment_id: assignment.id,
        elder_name: elderName,
        guardian_name: guardianName,
        guardian_phone: guardianPhone,
        manager_name: managerName,
        report_title: `${title} 완료 리포트`,
        report_status: 'ready',
        reassurance_state: '안심',
        summary_30sec: `${managerName}가 ${elderName} 안심케어를 완료했습니다. 방문/동행 상황은 특이사항 없이 정리됐고, 보호자가 확인할 다음 할 일을 아래에 남겼습니다.`,
        parent_condition: '현장 확인 결과 큰 특이사항은 없습니다. 불편 사항이 있으면 보호자와 운영실이 추가 확인합니다.',
        visit_result: `${assignment.appointment_time || '협의된 시간'} 일정 기준으로 안심케어가 완료됐습니다.`,
        medication_result: '약이나 복약 관련 내용은 필요 시 보호자가 추가 확인해주세요.',
        document_result: '영수증, 처방전, 보험서류 등은 필요 시 보호자에게 전달하거나 추가 확인합니다.',
        meal_result: '식사 상태는 부모님 안심 확인 버튼 또는 보호자 확인으로 이어집니다.',
        next_actions: [
          '보호자는 리포트를 확인해주세요.',
          '다음 병원 일정이나 약 복용 여부를 확인해주세요.',
          '추가 도움이 필요하면 안심케어를 다시 신청해주세요.'
        ],
        check_events: [
          {
            label: '안심케어 완료',
            occurred_at: completedAt,
            actor: managerName
          }
        ],
        report_memo: '매니저 현장 완료 후 자동 생성된 보호자 리포트입니다.'
      }
    ])
  })

  if (!reportInsert.ok) {
    return {
      ok: false,
      error: reportInsert.error
    }
  }

  const report = firstRow(reportInsert)

  const actions = [
    {
      care_report_id: report.id,
      assignment_id: assignment.id,
      action_title: '리포트 확인하기',
      action_description: '오늘 안심케어 결과와 부모님 상태를 확인해주세요.',
      action_status: 'open',
      assigned_to_role: 'guardian',
      sort_order: 1
    },
    {
      care_report_id: report.id,
      assignment_id: assignment.id,
      action_title: '다음 일정 확인하기',
      action_description: '다음 병원 일정, 약 복용, 서류 필요 여부를 확인해주세요.',
      action_status: 'open',
      assigned_to_role: 'guardian',
      sort_order: 2
    },
    {
      care_report_id: report.id,
      assignment_id: assignment.id,
      action_title: '추가 안심케어 필요 여부 판단',
      action_description: '추가 동행, 식사, 약, 서류 도움이 필요하면 새 안심케어를 신청해주세요.',
      action_status: 'open',
      assigned_to_role: 'guardian',
      sort_order: 3
    }
  ]

  await rest('care_guardian_report_actions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(actions)
  })

  return {
    ok: true,
    report,
    created: true
  }
}

export async function GET(request: NextRequest) {
  const managerProfileId = text(request.nextUrl.searchParams.get('managerProfileId'))
  const manager = await getManagerProfile(managerProfileId)

  if (!manager) {
    return NextResponse.json({
      ok: true,
      manager: null,
      offers: [],
      assignments: [],
      earnings: [],
      availability: [],
      summary: {
        sentOffers: 0,
        acceptedOffers: 0,
        activeAssignments: 0,
        completedAssignments: 0,
        expectedEarnings: 0,
        paidEarnings: 0
      }
    })
  }

  const [offers, assignments, earnings, availability] = await Promise.all([
    getOffers(manager.id),
    getAssignments(manager.id),
    getEarnings(manager.id),
    getAvailability(manager.id)
  ])

  const summary = {
    sentOffers: offers.filter((item: AnyRow) => item.offer_status === 'sent').length,
    acceptedOffers: offers.filter((item: AnyRow) => item.offer_status === 'accepted').length,
    activeAssignments: assignments.filter((item: AnyRow) => ['assigned', 'in_progress'].includes(item.status)).length,
    completedAssignments: assignments.filter((item: AnyRow) => item.status === 'completed').length,
    expectedEarnings: earnings
      .filter((item: AnyRow) => item.earning_status !== 'paid')
      .reduce((sum: number, item: AnyRow) => sum + Number(item.amount || 0), 0),
    paidEarnings: earnings
      .filter((item: AnyRow) => item.earning_status === 'paid')
      .reduce((sum: number, item: AnyRow) => sum + Number(item.amount || 0), 0)
  }

  return NextResponse.json({
    ok: true,
    manager,
    offers,
    assignments,
    earnings,
    availability,
    summary
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create_demo_partner') {
    const result = await createDemoPartnerAndWork()

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '테스트 케어파트너 생성 중 오류가 발생했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    const payload: Record<string, unknown> = { ...result }
    delete payload.ok
    delete payload.error

    return NextResponse.json({
      ok: true,
      message: '테스트 케어파트너와 일감 제안을 만들었습니다.',
      ...payload
    })
  }

  const managerProfileId = text(body.managerProfileId)
  const manager = await getManagerProfile(managerProfileId)

  if (!manager) {
    return NextResponse.json(
      {
        ok: false,
        message: '검증 완료된 매니저가 없습니다. 먼저 최초 검증을 완료하세요.'
      },
      { status: 400 }
    )
  }

  if (action === 'set_availability') {
    const days = Array.isArray(body.days) ? body.days.map(String) : ['월', '화', '수', '목', '금']
    const timeSlots = Array.isArray(body.timeSlots) ? body.timeSlots.map(String) : ['오전', '오후']
    const regionText = text(body.regionText) || '활동 가능 지역'
    const rows = []

    for (const day of days) {
      for (const timeSlot of timeSlots) {
        rows.push({
          manager_profile_id: manager.id,
          day_of_week: day,
          time_slot: timeSlot,
          region_text: regionText,
          availability_status: 'available',
          memo: text(body.memo)
        })
      }
    }

    const result = await rest('care_manager_availability?on_conflict=manager_profile_id,day_of_week,time_slot', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify(rows)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '가능시간 저장 중 오류가 발생했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: '가능시간을 저장했습니다.',
      items: result.data
    })
  }

  if (action === 'accept_offer' || action === 'decline_offer') {
    const offerId = text(body.offerId)

    if (!offerId) {
      return NextResponse.json({ ok: false, message: 'offerId가 필요합니다.' }, { status: 400 })
    }

    const status = action === 'accept_offer' ? 'accepted' : 'declined'

    const result = await rest('care_manager_match_offers?id=eq.' + encodeURIComponent(offerId), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        offer_status: status,
        manager_response_memo: text(body.memo) || null,
        responded_at: new Date().toISOString()
      })
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '제안 응답 처리 중 오류가 발생했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    const offer = firstRow(result)

    if (status === 'accepted') {
      const assignmentResult = await createAssignmentFromOfferRow(offer, manager)

      if (!assignmentResult.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: '제안은 수락했지만 배정 생성 중 오류가 발생했습니다.',
            detail: assignmentResult.error
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ok: true,
        message: '제안을 수락하고 오늘 배정으로 만들었습니다.',
        offer,
        assignment: assignmentResult.assignment
      })
    }

    return NextResponse.json({
      ok: true,
      message: '제안을 거절했습니다.',
      offer
    })
  }

  if (action === 'create_assignment_from_offer') {
    const offerId = text(body.offerId)

    if (!offerId) {
      return NextResponse.json({ ok: false, message: 'offerId가 필요합니다.' }, { status: 400 })
    }

    const offerResult = await rest('care_manager_match_offers?select=*&id=eq.' + encodeURIComponent(offerId) + '&limit=1')
    const offer = offerResult.ok && Array.isArray(offerResult.data) ? offerResult.data[0] : null

    if (!offer) {
      return NextResponse.json({ ok: false, message: '제안을 찾지 못했습니다.' }, { status: 404 })
    }

    if (offer.offer_status !== 'accepted') {
      return NextResponse.json({ ok: false, message: '수락한 제안만 배정으로 만들 수 있습니다.' }, { status: 400 })
    }

    const snapshot = offer.request_snapshot || {}

    const assignmentResult = await rest('manager_field_assignments', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          matching_request_id: offer.matching_request_id,
          manager_profile_id: manager.id,
          elder_name: snapshot.elder_name || '부모님',
          manager_name: manager.manager_name,
          manager_phone: manager.manager_phone,
          assignment_type: snapshot.request_type || 'hospital_visit',
          title: snapshot.request_title || '부모님 케어 배정',
          appointment_date: snapshot.appointment_date || null,
          appointment_time: snapshot.appointment_time || null,
          meeting_location: snapshot.meeting_location || null,
          meeting_code: '2580',
          transport_mode: 'hospital_meet',
          vehicle_owned: Boolean(manager.vehicle_owned),
          direct_transport_included: false,
          transport_policy_acknowledged: true,
          status: 'assigned',
          checkin_status: 'not_started',
          expected_fee: won(offer.expected_fee || 35000),
          estimated_minutes: Number(offer.estimated_minutes || 120),
          safety_notes: ['검증 완료 케어파트너입니다.', '개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.'],
          matching_gate_checked: true,
          created_by_role: 'ops',
          manager_trust_snapshot: {
            manager_profile_id: manager.id,
            trust_level: manager.trust_level,
            identity_verified: manager.identity_verified,
            trust_card_summary: manager.trust_card_summary
          }
        }
      ])
    })

    if (!assignmentResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '배정 생성 중 오류가 발생했습니다.',
          detail: assignmentResult.error
        },
        { status: 500 }
      )
    }

    await rest('care_manager_match_offers?id=eq.' + encodeURIComponent(offerId), {
      method: 'PATCH',
      body: JSON.stringify({
        offer_status: 'assigned',
        assigned_at: new Date().toISOString()
      })
    })

    return NextResponse.json({
      ok: true,
      message: '수락한 제안을 오늘 배정으로 만들었습니다.',
      assignment: firstRow(assignmentResult)
    })
  }

  if (action === 'start_assignment' || action === 'complete_assignment') {
    const assignmentId = text(body.assignmentId)

    if (!assignmentId) {
      return NextResponse.json({ ok: false, message: 'assignmentId가 필요합니다.' }, { status: 400 })
    }

    const status = action === 'start_assignment' ? 'in_progress' : 'completed'
    const now = new Date().toISOString()

    const patchPayload: Record<string, unknown> = {
      status,
      checkin_status: action === 'start_assignment' ? 'started' : 'completed',
      updated_at: now
    }

    if (action === 'start_assignment') patchPayload.started_at = now
    if (action === 'complete_assignment') patchPayload.completed_at = now

    const result = await rest('manager_field_assignments?id=eq.' + encodeURIComponent(assignmentId), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patchPayload)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '배정 상태 변경 중 오류가 발생했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    const assignment = firstRow(result)

    let guardianReport: AnyRow | null = null

    if (action === 'complete_assignment') {
      await rest('care_manager_earnings?on_conflict=assignment_id', {
        method: 'POST',
        headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
        body: JSON.stringify([
          {
            manager_profile_id: manager.id,
            assignment_id: assignment.id,
            earning_title: assignment.title || '케어 수행 정산',
            amount: won(assignment.expected_fee || 35000),
            earning_status: 'expected',
            payout_due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
            memo: '현장 완료 후 예상 정산'
          }
        ])
      })

      const reportResult = await createGuardianReportFromAssignment(assignment, manager)

      if (reportResult.ok) {
        guardianReport = reportResult.report
      }
    }

    return NextResponse.json({
      ok: true,
      message: action === 'start_assignment'
        ? '현장 수행을 시작했습니다.'
        : guardianReport
          ? '현장 수행을 완료하고 보호자 리포트까지 생성했습니다.'
          : '현장 수행을 완료하고 정산 예정에 반영했습니다.',
      assignment,
      guardianReport
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}
