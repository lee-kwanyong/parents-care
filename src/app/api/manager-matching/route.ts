import { NextRequest, NextResponse } from 'next/server'
import {
  scoreManagerCandidate,
  type ManagerMatchingRequestType
} from '@/lib/manager-matching-engine'
import {
  buildDefaultManagerChecklist,
  type ManagerAssignmentType,
  type TransportMode
} from '@/lib/manager-field-engine'

export const dynamic = 'force-dynamic'

const allowedRequestTypes = new Set([
  'hospital_visit',
  'meal_check',
  'discharge_check',
  'document_pickup',
  'wellbeing_check',
  'custom'
])

const allowedTransportModes = new Set([
  'hospital_meet',
  'home_meet_taxi_companion',
  'mobility_partner',
  'guardian_arranged',
  'no_transport'
])

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 'on'
}

function arrayText(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(String).map((item) => item.trim()).filter(Boolean)
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase env is missing' }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return { ok: false, data: parsed, error: parsed || bodyText }
  }

  return { ok: true, data: parsed, error: null }
}

async function verifiedProfiles() {
  const select = [
    'id',
    'application_id',
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
    'public_notes',
    'evaluation_count',
    'rating_safety',
    'rating_kindness',
    'rating_accuracy',
    'rating_punctuality',
    'review_summary',
    'created_at'
  ].join(',')

  const result = await rest(
    'care_manager_profiles?select=' +
      encodeURIComponent(select) +
      '&profile_status=eq.active&identity_verified=eq.true&direct_transport_included=eq.false&order=created_at.desc&limit=200'
  )

  if (!result.ok || !Array.isArray(result.data)) return []
  return result.data
}

async function fetchRequest(id: string) {
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
    'vehicle_required',
    'direct_transport_required',
    'priority',
    'matching_status',
    'selected_manager_profile_id',
    'ops_memo'
  ].join(',')

  const result = await rest(
    'care_manager_matching_requests?select=' + encodeURIComponent(select) + '&id=eq.' + encodeURIComponent(id) + '&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data)) return null
  return result.data[0] || null
}

async function fetchProfile(id: string) {
  const result = await rest(
    'care_manager_profiles?select=' +
      encodeURIComponent('id,manager_name,manager_phone,profile_status,trust_level,identity_verified,available_regions,specialties,service_scopes,vehicle_owned,direct_transport_included,trust_card_summary,public_notes,rating_safety,rating_kindness,rating_accuracy,rating_punctuality') +
      '&id=eq.' +
      encodeURIComponent(id) +
      '&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data)) return null
  return result.data[0] || null
}

export async function GET() {
  const requestSelect = [
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
    'vehicle_required',
    'direct_transport_required',
    'priority',
    'matching_status',
    'selected_manager_profile_id',
    'manager_assignment_id',
    'ops_memo',
    'created_at',
    'updated_at'
  ].join(',')

  const candidateSelect = [
    'id',
    'matching_request_id',
    'manager_profile_id',
    'match_score',
    'score_reasons',
    'candidate_status',
    'ops_memo',
    'created_at',
    'updated_at'
  ].join(',')

  const [requests, candidates, profiles] = await Promise.all([
    rest('care_manager_matching_requests?select=' + encodeURIComponent(requestSelect) + '&order=created_at.desc&limit=100'),
    rest('care_manager_matching_candidates?select=' + encodeURIComponent(candidateSelect) + '&order=match_score.desc,created_at.desc&limit=500'),
    verifiedProfiles()
  ])

  if (!requests.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '매니저 매칭 요청을 불러오지 못했습니다. SQL이 실행됐는지 확인해주세요.',
        detail: requests.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    requests: Array.isArray(requests.data) ? requests.data : [],
    candidates: candidates.ok && Array.isArray(candidates.data) ? candidates.data : [],
    profiles
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action) || 'create_request'

  if (action === 'create_request') {
    const requestTypeValue = text(body.requestType) || 'hospital_visit'
    const requestType: ManagerMatchingRequestType = allowedRequestTypes.has(requestTypeValue)
      ? (requestTypeValue as ManagerMatchingRequestType)
      : 'hospital_visit'

    const transportModeValue = text(body.transportMode) || 'hospital_meet'
    const transportMode = allowedTransportModes.has(transportModeValue) ? transportModeValue : 'hospital_meet'

    const directTransportRequired = bool(body.directTransportRequired)

    if (directTransportRequired) {
      return NextResponse.json(
        {
          ok: false,
          message: '매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다. 택시 동행 또는 이동지원 제휴로 선택해주세요.'
        },
        { status: 400 }
      )
    }

    const insert = await rest('care_manager_matching_requests', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          elder_name: text(body.elderName) || '부모님',
          guardian_name: text(body.guardianName) || null,
          guardian_phone: text(body.guardianPhone) || null,
          request_title: text(body.requestTitle) || '검증 매니저 매칭 요청',
          request_type: requestType,
          region_text: text(body.regionText) || null,
          hospital_name: text(body.hospitalName) || null,
          appointment_date: text(body.appointmentDate) || null,
          appointment_time: text(body.appointmentTime) || null,
          meeting_location: text(body.meetingLocation) || null,
          required_specialties: arrayText(body.requiredSpecialties),
          required_service_scopes: arrayText(body.requiredServiceScopes),
          mobility_support_needed: bool(body.mobilitySupportNeeded),
          hearing_support_needed: bool(body.hearingSupportNeeded),
          allergy_attention_needed: bool(body.allergyAttentionNeeded),
          medication_attention_needed: bool(body.medicationAttentionNeeded),
          transport_mode: transportMode,
          vehicle_required: bool(body.vehicleRequired),
          direct_transport_required: false,
          priority: text(body.priority) || 'normal',
          matching_status: 'requested',
          ops_memo: text(body.opsMemo) || null,
          created_by_role: 'ops'
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '매칭 요청 저장 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      request: Array.isArray(insert.data) ? insert.data[0] : insert.data
    })
  }

  if (action === 'generate_candidates') {
    const requestId = text(body.requestId)

    if (!requestId) {
      return NextResponse.json({ ok: false, message: 'requestId가 필요합니다.' }, { status: 400 })
    }

    const matchingRequest = await fetchRequest(requestId)

    if (!matchingRequest) {
      return NextResponse.json({ ok: false, message: '매칭 요청을 찾지 못했습니다.' }, { status: 404 })
    }

    if (matchingRequest.direct_transport_required) {
      return NextResponse.json(
        {
          ok: false,
          message: '직접 운송 요청은 기본 서비스에서 처리할 수 없습니다. 이동지원 제휴 또는 택시 동행으로 변경해주세요.'
        },
        { status: 400 }
      )
    }

    const profiles = await verifiedProfiles()

    const scored = profiles
      .map((profile: any) => {
        const result = scoreManagerCandidate({
          profile,
          regionText: matchingRequest.region_text,
          requiredSpecialties: matchingRequest.required_specialties || [],
          requiredServiceScopes: matchingRequest.required_service_scopes || [],
          mobilitySupportNeeded: Boolean(matchingRequest.mobility_support_needed),
          hearingSupportNeeded: Boolean(matchingRequest.hearing_support_needed),
          medicationAttentionNeeded: Boolean(matchingRequest.medication_attention_needed),
          vehicleRequired: Boolean(matchingRequest.vehicle_required)
        })

        return {
          matching_request_id: requestId,
          manager_profile_id: profile.id,
          match_score: result.score,
          score_reasons: result.reasons,
          candidate_status: 'recommended'
        }
      })
      .filter((item) => item.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10)

    if (scored.length === 0) {
      return NextResponse.json({
        ok: true,
        inserted: 0,
        message: '조건에 맞는 본인확인 완료 매니저 후보가 없습니다.'
      })
    }

    const insert = await rest('care_manager_matching_candidates?on_conflict=matching_request_id,manager_profile_id', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify(scored)
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '후보 생성 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    await rest('care_manager_matching_requests?id=eq.' + encodeURIComponent(requestId), {
      method: 'PATCH',
      body: JSON.stringify({
        matching_status: 'candidate_generated',
        updated_at: new Date().toISOString()
      })
    })

    return NextResponse.json({
      ok: true,
      inserted: Array.isArray(insert.data) ? insert.data.length : 0,
      candidates: Array.isArray(insert.data) ? insert.data : []
    })
  }

  if (action === 'select_candidate') {
    const requestId = text(body.requestId)
    const profileId = text(body.profileId)

    if (!requestId || !profileId) {
      return NextResponse.json({ ok: false, message: 'requestId와 profileId가 필요합니다.' }, { status: 400 })
    }

    const profile = await fetchProfile(profileId)

    if (!profile || profile.profile_status !== 'active' || !profile.identity_verified || profile.direct_transport_included) {
      return NextResponse.json({ ok: false, message: '본인확인 완료된 활동 매니저만 선택할 수 있습니다.' }, { status: 400 })
    }

    await rest('care_manager_matching_candidates?matching_request_id=eq.' + encodeURIComponent(requestId), {
      method: 'PATCH',
      body: JSON.stringify({
        candidate_status: 'recommended',
        updated_at: new Date().toISOString()
      })
    })

    await rest(
      'care_manager_matching_candidates?matching_request_id=eq.' +
        encodeURIComponent(requestId) +
        '&manager_profile_id=eq.' +
        encodeURIComponent(profileId),
      {
        method: 'PATCH',
        body: JSON.stringify({
          candidate_status: 'selected',
          updated_at: new Date().toISOString()
        })
      }
    )

    const update = await rest('care_manager_matching_requests?id=eq.' + encodeURIComponent(requestId), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        selected_manager_profile_id: profileId,
        matching_status: 'matched',
        updated_at: new Date().toISOString()
      })
    })

    if (!update.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '매니저 선택 중 오류가 발생했습니다.',
          detail: update.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      request: Array.isArray(update.data) ? update.data[0] : update.data
    })
  }

  if (action === 'assign_selected') {
    const requestId = text(body.requestId)

    if (!requestId) {
      return NextResponse.json({ ok: false, message: 'requestId가 필요합니다.' }, { status: 400 })
    }

    const matchingRequest = await fetchRequest(requestId)

    if (!matchingRequest?.selected_manager_profile_id) {
      return NextResponse.json({ ok: false, message: '선택된 매니저가 없습니다.' }, { status: 400 })
    }

    const profile = await fetchProfile(matchingRequest.selected_manager_profile_id)

    if (!profile || profile.profile_status !== 'active' || !profile.identity_verified || profile.direct_transport_included) {
      return NextResponse.json({ ok: false, message: '본인확인 완료된 활동 매니저만 배정할 수 있습니다.' }, { status: 400 })
    }

    const assignmentType: ManagerAssignmentType =
      matchingRequest.request_type === 'document_pickup'
        ? 'document_pickup'
        : matchingRequest.request_type === 'meal_check'
          ? 'meal_check'
          : matchingRequest.request_type === 'discharge_check'
            ? 'discharge_check'
            : matchingRequest.request_type === 'wellbeing_check'
              ? 'wellbeing'
              : 'hospital_visit'

    const transportMode: TransportMode = allowedTransportModes.has(matchingRequest.transport_mode)
      ? (matchingRequest.transport_mode as TransportMode)
      : 'hospital_meet'

    const assignmentInsert = await rest('manager_field_assignments', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          matching_request_id: matchingRequest.id,
          manager_profile_id: profile.id,
          elder_name: matchingRequest.elder_name,
          manager_name: profile.manager_name,
          manager_phone: profile.manager_phone,
          assignment_type: assignmentType,
          title: matchingRequest.request_title,
          appointment_date: matchingRequest.appointment_date,
          appointment_time: matchingRequest.appointment_time,
          meeting_location: matchingRequest.meeting_location,
          meeting_code: '2580',
          transport_mode: transportMode,
          vehicle_owned: Boolean(profile.vehicle_owned),
          direct_transport_included: false,
          transport_policy_acknowledged: true,
          status: 'assigned',
          care_passport_snapshot: {},
          safety_notes: [
            '본인확인 완료 매니저입니다.',
            '차량 보유 여부는 참고 정보입니다.',
            '매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.'
          ],
          guardian_questions: [],
          required_documents: [],
          ops_memo: matchingRequest.ops_memo,
          created_by_role: 'ops',
          manager_trust_snapshot: {
            manager_profile_id: profile.id,
            trust_level: profile.trust_level,
            identity_verified: profile.identity_verified,
            trust_card_summary: profile.trust_card_summary,
            rating_safety: profile.rating_safety,
            rating_kindness: profile.rating_kindness,
            rating_accuracy: profile.rating_accuracy,
            rating_punctuality: profile.rating_punctuality
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

    const assignment = Array.isArray(assignmentInsert.data) ? assignmentInsert.data[0] : null

    const checklistRows = buildDefaultManagerChecklist({
      assignmentType,
      transportMode,
      passport: null,
      guardianQuestions: [],
      requiredDocuments: []
    }).map((item) => ({
      assignment_id: assignment.id,
      ...item
    }))

    await rest('manager_field_checklist_items', {
      method: 'POST',
      body: JSON.stringify(checklistRows)
    })

    await rest('care_manager_matching_requests?id=eq.' + encodeURIComponent(requestId), {
      method: 'PATCH',
      body: JSON.stringify({
        matching_status: 'assigned',
        manager_assignment_id: assignment.id,
        updated_at: new Date().toISOString()
      })
    })

    await rest(
      'care_manager_matching_candidates?matching_request_id=eq.' +
        encodeURIComponent(requestId) +
        '&manager_profile_id=eq.' +
        encodeURIComponent(profile.id),
      {
        method: 'PATCH',
        body: JSON.stringify({
          candidate_status: 'assigned',
          updated_at: new Date().toISOString()
        })
      }
    )

    return NextResponse.json({
      ok: true,
      assignment
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}
