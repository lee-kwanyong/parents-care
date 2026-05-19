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

async function getIntake(id: string) {
  const result = await rest(
    'care_assisted_intake_requests?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1'
  )

  return result.ok && Array.isArray(result.data) ? result.data[0] : null
}

function inferRequestType(intake: AnyRow, requestedType?: string) {
  if (requestedType) return requestedType

  const raw = [
    intake.summary_title,
    intake.worry_type,
    intake.raw_text
  ].filter(Boolean).join(' ')

  if (/퇴원|회복|수술 후|낙상|통증/.test(raw)) return 'discharge_care'
  if (/서류|보험|영수증|처방전|세부내역서|통원/.test(raw)) return 'document_help'
  if (/밥|식사|끼니|도시락|반찬/.test(raw)) return 'meal_check'
  if (/약|복용|복약|약봉투|처방/.test(raw)) return 'medication_check'
  if (/병원|진료|검사|예약|외래|동행/.test(raw)) return 'hospital_visit'

  return 'hospital_visit'
}

function defaultSpecialtiesByType(type: string) {
  if (type === 'meal_check') return ['식사 확인', '생활 안심케어']
  if (type === 'medication_check') return ['복약 확인', '약국·복약 확인']
  if (type === 'discharge_care') return ['퇴원 후 안심케어', '복약 확인', '식사 확인']
  if (type === 'document_help') return ['서류 챙김', '보험서류 정리']
  return ['병원동행', '약국·복약 확인']
}

function defaultScopesByType(type: string) {
  if (type === 'meal_check') return ['식사 확인', '자녀 알림']
  if (type === 'medication_check') return ['복약 확인', '약 봉투 확인', '자녀 알림']
  if (type === 'discharge_care') return ['퇴원 후 상태 확인', '약 확인', '식사 확인', '다음 외래 확인']
  if (type === 'document_help') return ['영수증 확인', '처방전 확인', '보험서류 정리']
  return ['접수·수납 도움', '약국 동행', '귀가 확인']
}

function requestTitleFrom(intake: AnyRow, requestType: string) {
  if (text(intake.summary_title)) return text(intake.summary_title)

  const typeLabel: Record<string, string> = {
    hospital_visit: '병원 안심동행',
    medication_check: '약·복약 확인',
    meal_check: '식사 확인',
    discharge_care: '퇴원 후 안심케어',
    document_help: '서류 챙김'
  }

  return `${text(intake.elder_name) || '부모님'} ${typeLabel[requestType] || '안심케어'}`
}

async function updateIntakeStatus(id: string, status: string, priority?: string) {
  const payload: Record<string, unknown> = {
    status
  }

  if (priority) payload.priority = priority

  return await rest('care_assisted_intake_requests?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload)
  })
}

export async function GET() {
  const [intakeResult, matchingResult] = await Promise.all([
    rest('care_assisted_intake_requests?select=*&order=created_at.desc&limit=200'),
    rest('care_manager_matching_requests?select=*&order=created_at.desc&limit=200')
  ])

  if (!intakeResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 접수함을 불러오지 못했습니다.',
        detail: intakeResult.error
      },
      { status: 500 }
    )
  }

  const intakes = Array.isArray(intakeResult.data) ? intakeResult.data : []
  const matchingRequests = matchingResult.ok && Array.isArray(matchingResult.data)
    ? matchingResult.data
    : []

  return NextResponse.json({
    ok: true,
    intakes,
    matchingRequests,
    summary: {
      total: intakes.length,
      received: intakes.filter((item: AnyRow) => item.status === 'received').length,
      reviewing: intakes.filter((item: AnyRow) => item.status === 'reviewing').length,
      matchingRequested: intakes.filter((item: AnyRow) => item.status === 'matching_requested').length,
      completed: intakes.filter((item: AnyRow) => item.status === 'completed').length,
      highPriority: intakes.filter((item: AnyRow) => item.priority === 'high').length
    }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'update_status') {
    const intakeId = text(body.intakeId)
    const status = text(body.status)

    if (!intakeId || !status) {
      return NextResponse.json({ ok: false, message: 'intakeId와 status가 필요합니다.' }, { status: 400 })
    }

    const result = await updateIntakeStatus(intakeId, status, text(body.priority))

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '접수 상태 변경 중 오류가 발생했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: '접수 상태를 변경했습니다.',
      intake: firstRow(result)
    })
  }

  if (action === 'create_matching_request') {
    const intakeId = text(body.intakeId)

    if (!intakeId) {
      return NextResponse.json({ ok: false, message: 'intakeId가 필요합니다.' }, { status: 400 })
    }

    const intake = await getIntake(intakeId)

    if (!intake) {
      return NextResponse.json({ ok: false, message: '접수 건을 찾지 못했습니다.' }, { status: 404 })
    }

    const requestType = inferRequestType(intake, text(body.requestType))
    const regionText = text(body.regionText) || '지역 협의'
    const requiredSpecialties = arrayFrom(body.requiredSpecialties)
    const requiredServiceScopes = arrayFrom(body.requiredServiceScopes)

    const insert = await rest('care_manager_matching_requests', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          elder_name: text(intake.elder_name) || '부모님',
          guardian_name: text(intake.contact_name),
          guardian_phone: text(intake.contact_phone),
          request_title: text(body.requestTitle) || requestTitleFrom(intake, requestType),
          request_type: requestType,
          region_text: regionText,
          hospital_name: text(body.hospitalName) || null,
          appointment_date: text(body.appointmentDate) || null,
          appointment_time: text(body.appointmentTime) || null,
          meeting_location: text(body.meetingLocation) || null,
          required_specialties: requiredSpecialties.length > 0 ? requiredSpecialties : defaultSpecialtiesByType(requestType),
          required_service_scopes: requiredServiceScopes.length > 0 ? requiredServiceScopes : defaultScopesByType(requestType),
          mobility_support_needed: requestType === 'hospital_visit' || requestType === 'discharge_care',
          hearing_support_needed: false,
          medication_attention_needed: requestType === 'medication_check' || /약|복용|복약/.test(text(intake.raw_text)),
          transport_mode: 'hospital_meet',
          priority: text(body.priority) || text(intake.priority) || 'normal',
          matching_status: 'requested',
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

    const matchingRequest = firstRow(insert)

    await updateIntakeStatus(intakeId, 'matching_requested', text(body.priority) || text(intake.priority))

    return NextResponse.json({
      ok: true,
      message: '접수 건을 매칭 요청으로 전환했습니다.',
      intake,
      matchingRequest
    })
  }

  if (action === 'create_demo_intake') {
    const insert = await rest('care_assisted_intake_requests', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          elder_name: '어머니',
          contact_name: '보호자 데모',
          contact_phone: '010-1111-2222',
          channel: 'phone',
          raw_text: '어머니가 무릎이 아프고 강남구 정형외과 예약이 있는데 혼자 가기 어려우세요. 병원 접수와 약국 동행까지 필요합니다.',
          summary_title: '강남구 정형외과 병원 안심동행',
          worry_type: '병원 안심동행',
          preferred_response_channel: 'phone',
          status: 'received',
          priority: 'high',
          social_care_requested: false,
          assets: [],
          metadata: {
            source: 'demo',
            submitted_at: new Date().toISOString()
          }
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '데모 접수 생성 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: '데모 접수 건을 만들었습니다.',
      intake: firstRow(insert)
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}
