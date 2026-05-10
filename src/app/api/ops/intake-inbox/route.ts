import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>
type IntakeSource = 'care_assisted_intake_requests' | 'care_intake_entries'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function firstRow(result: { data: any }) {
  return Array.isArray(result.data) ? result.data[0] : result.data
}

function normalizeItem(row: AnyRow, source: IntakeSource) {
  const elderName =
    text(row.elder_name) ||
    text(row.parent_name) ||
    text(row.parentName) ||
    text(row.elderName) ||
    '부모님'

  const contactName =
    text(row.contact_name) ||
    text(row.guardian_name) ||
    text(row.guardianName) ||
    text(row.protector_name) ||
    text(row.family_name) ||
    '보호자'

  const contactPhone =
    text(row.contact_phone) ||
    text(row.guardian_phone) ||
    text(row.guardianPhone) ||
    text(row.phone) ||
    ''

  const rawText =
    text(row.raw_text) ||
    text(row.situation_memo) ||
    text(row.situationMemo) ||
    text(row.memo) ||
    text(row.message) ||
    text(row.description) ||
    ''

  const summaryTitle =
    text(row.summary_title) ||
    text(row.title) ||
    text(row.worry_type) ||
    text(row.category) ||
    (rawText ? rawText.slice(0, 44) : `${elderName} 걱정 접수`)

  const status = text(row.ops_status) || text(row.status) || 'received'
  const priority = text(row.priority) || (row.social_care_requested ? 'high' : 'normal')
  const channel = text(row.channel) || text(row.preferred_response_channel) || 'memo'

  return {
    id: String(row.id || ''),
    source,
    elder_name: elderName,
    contact_name: contactName,
    contact_phone: contactPhone,
    channel,
    summary_title: summaryTitle,
    worry_type: text(row.worry_type),
    raw_text: rawText,
    status,
    priority,
    social_care_requested: Boolean(row.social_care_requested),
    care_case_id: row.care_case_id || null,
    matching_request_id: row.matching_request_id || null,
    created_at: row.created_at || new Date().toISOString()
  }
}

function inferCareCase(input: {
  title: string
  rawText: string
  worryType?: string
}) {
  const haystack = `${input.title} ${input.rawText} ${input.worryType || ''}`

  if (/퇴원|회복|수술 후|입원 후/.test(haystack)) {
    return {
      careCaseType: 'discharge_check',
      matchingRequestType: 'discharge_check',
      titlePrefix: '퇴원 후 안심 케어',
      nextAction: '퇴원 후 7일 체크와 약·식사·통증 확인을 생성하세요.',
      requiredSpecialties: ['퇴원 후 확인', '약국·복약 확인'],
      requiredScopes: ['복약 확인', '귀가 확인', '30초 리포트 작성']
    }
  }

  if (/서류|보험|영수증|처방전|세부내역|진단서|확인서/.test(haystack)) {
    return {
      careCaseType: 'document_pickup',
      matchingRequestType: 'document_pickup',
      titlePrefix: '서류 챙김 케어',
      nextAction: '필요 서류를 정리하고 병원/관공서 수령 동선을 확인하세요.',
      requiredSpecialties: ['서류·보험서류'],
      requiredScopes: ['서류 수령', '접수·수납 도움', '30초 리포트 작성']
    }
  }

  if (/밥|식사|도시락|반찬|끼니|회복식/.test(haystack)) {
    return {
      careCaseType: 'meal_check',
      matchingRequestType: 'meal_check',
      titlePrefix: '식사·안심밥상 케어',
      nextAction: '식사 가능 여부와 안심밥상/회복식 연결 여부를 확인하세요.',
      requiredSpecialties: ['식사 확인', '복약 확인'],
      requiredScopes: ['식사 확인', '복약 확인', '30초 리포트 작성']
    }
  }

  if (/약|복약|처방|약국|약봉투/.test(haystack)) {
    return {
      careCaseType: 'medication_check',
      matchingRequestType: 'meal_check',
      titlePrefix: '복약 확인 케어',
      nextAction: '약 봉투, 복용 시간, 약국 방문 필요 여부를 확인하세요.',
      requiredSpecialties: ['약국·복약 확인'],
      requiredScopes: ['약국 동행', '복약 확인', '30초 리포트 작성']
    }
  }

  if (/안부|연락|혼자|독거|상태 확인/.test(haystack)) {
    return {
      careCaseType: 'wellbeing_check',
      matchingRequestType: 'wellbeing_check',
      titlePrefix: '정기 안부 확인',
      nextAction: '부모님 연락 가능 여부와 긴급 연락처를 확인하세요.',
      requiredSpecialties: ['안부 확인'],
      requiredScopes: ['안부 확인', '귀가 확인', '30초 리포트 작성']
    }
  }

  return {
    careCaseType: 'hospital_visit',
    matchingRequestType: 'hospital_visit',
    titlePrefix: '병원동행 케어',
    nextAction: '병원 일정, 만남 장소, 약국/서류 필요 여부를 확인하세요.',
    requiredSpecialties: ['병원동행', '약국·복약 확인'],
    requiredScopes: ['병원 앞 만남', '접수·수납 도움', '약국 동행', '귀가 확인', '30초 리포트 작성']
  }
}

function makeTasks(careCaseType: string) {
  const common = [
    {
      task_title: '보호자 연락처 확인',
      task_description: '접수 내용이 부족하면 보호자에게 전화 또는 카톡으로 확인합니다.',
      assigned_to_role: 'ops',
      sort_order: 10
    },
    {
      task_title: '부모님 주의사항 확인',
      task_description: '청력, 보행, 알러지, 복용약 여부를 확인합니다.',
      assigned_to_role: 'ops',
      sort_order: 20
    }
  ]

  if (careCaseType === 'hospital_visit') {
    return [
      ...common,
      {
        task_title: '병원 일정과 만남 장소 확인',
        task_description: '병원명, 예약 시간, 병원 정문/접수처 등 만남 장소를 확인합니다.',
        assigned_to_role: 'ops',
        sort_order: 30
      },
      {
        task_title: '검증 매니저에게 알림 준비',
        task_description: '검증 완료 매니저 풀에서 지역/시간/업무 조건에 맞게 알림을 보냅니다.',
        assigned_to_role: 'ops',
        sort_order: 40
      }
    ]
  }

  if (careCaseType === 'meal_check') {
    return [
      ...common,
      {
        task_title: '식사 가능 상태 확인',
        task_description: '못 드시는 음식, 회복식 필요 여부, 식사 시간대를 확인합니다.',
        assigned_to_role: 'ops',
        sort_order: 30
      },
      {
        task_title: '안심밥상 또는 현장 확인 연결',
        task_description: '도시락/회복식/식사 확인 중 적절한 방식을 선택합니다.',
        assigned_to_role: 'ops',
        sort_order: 40
      }
    ]
  }

  if (careCaseType === 'medication_check') {
    return [
      ...common,
      {
        task_title: '약 봉투와 복용 시간 확인',
        task_description: '약 사진, 복용 시간, 약국 방문 필요 여부를 확인합니다.',
        assigned_to_role: 'ops',
        sort_order: 30
      },
      {
        task_title: '복약 확인 알림 준비',
        task_description: '보호자에게 복약 확인 결과를 공유할 방식을 정합니다.',
        assigned_to_role: 'ops',
        sort_order: 40
      }
    ]
  }

  if (careCaseType === 'discharge_check') {
    return [
      ...common,
      {
        task_title: '퇴원 후 7일 체크 생성',
        task_description: '약, 식사, 통증, 낙상, 다음 외래를 7일 동안 확인합니다.',
        assigned_to_role: 'ops',
        sort_order: 30
      },
      {
        task_title: '다음 외래와 보호자 할 일 확인',
        task_description: '퇴원 후 외래 일정과 가족이 해야 할 일을 정리합니다.',
        assigned_to_role: 'ops',
        sort_order: 40
      }
    ]
  }

  if (careCaseType === 'document_pickup') {
    return [
      ...common,
      {
        task_title: '필요 서류 목록 확인',
        task_description: '영수증, 처방전, 세부내역서, 통원확인서 등 필요한 서류를 확인합니다.',
        assigned_to_role: 'ops',
        sort_order: 30
      },
      {
        task_title: '서류 수령 방법 확인',
        task_description: '보호자 위임, 병원 정책, 수령 가능 시간을 확인합니다.',
        assigned_to_role: 'ops',
        sort_order: 40
      }
    ]
  }

  return [
    ...common,
    {
      task_title: '맞춤 케어 방식 확인',
      task_description: '보호자와 통화 후 필요한 케어 방식을 정리합니다.',
      assigned_to_role: 'ops',
      sort_order: 30
    }
  ]
}

async function getSourceRow(source: IntakeSource, id: string) {
  const result = await rest(source + '?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1')
  return result.ok && Array.isArray(result.data) ? result.data[0] || null : null
}

async function findExistingCase(source: IntakeSource, id: string) {
  const result = await rest(
    'care_cases?select=*&intake_source=eq.' +
      encodeURIComponent(source) +
      '&intake_id=eq.' +
      encodeURIComponent(id) +
      '&limit=1'
  )

  return result.ok && Array.isArray(result.data) ? result.data[0] || null : null
}

async function createMatchingRequest(input: {
  item: ReturnType<typeof normalizeItem>
  inferred: ReturnType<typeof inferCareCase>
}) {
  const haystack = `${input.item.summary_title} ${input.item.raw_text}`

  const insert = await rest('care_manager_matching_requests', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: input.item.elder_name,
        guardian_name: input.item.contact_name,
        guardian_phone: input.item.contact_phone || null,
        request_title: `${input.inferred.titlePrefix}: ${input.item.summary_title}`,
        request_type: input.inferred.matchingRequestType,
        region_text: null,
        hospital_name: null,
        appointment_date: null,
        appointment_time: null,
        meeting_location: null,
        required_specialties: input.inferred.requiredSpecialties,
        required_service_scopes: input.inferred.requiredScopes,
        mobility_support_needed: /다리|무릎|보행|휠체어|계단|이동/.test(haystack),
        hearing_support_needed: /귀|청력|잘 안 들/.test(haystack),
        allergy_attention_needed: /알러지|알레르기/.test(haystack),
        medication_attention_needed: /약|복용|처방|약국/.test(haystack),
        transport_mode: 'hospital_meet',
        vehicle_required: false,
        direct_transport_required: false,
        priority: input.item.priority || 'normal',
        matching_status: 'requested',
        ops_memo: '운영실 접수함에서 자동 생성된 매칭 요청',
        created_by_role: 'ops'
      }
    ])
  })

  return insert
}

async function createCaseTasks(careCaseId: string, careCaseType: string) {
  const tasks = makeTasks(careCaseType).map((task) => ({
    care_case_id: careCaseId,
    ...task
  }))

  if (tasks.length === 0) return { ok: true, data: [] }

  return await rest('care_case_tasks', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(tasks)
  })
}

async function createCaseEvent(input: {
  careCaseId: string
  eventType: string
  title: string
  description?: string | null
  payload?: Record<string, unknown>
}) {
  await rest('care_case_events', {
    method: 'POST',
    body: JSON.stringify([
      {
        care_case_id: input.careCaseId,
        event_type: input.eventType,
        title: input.title,
        description: input.description || null,
        payload: input.payload || {},
        created_by_role: 'ops'
      }
    ])
  })
}

async function createNotification(input: {
  item: ReturnType<typeof normalizeItem>
  careCaseId: string
  matchingRequestId?: string | null
}) {
  await rest('notification_outbox', {
    method: 'POST',
    body: JSON.stringify([
      {
        elder_name: input.item.elder_name,
        recipient_role: 'guardian',
        recipient_name: input.item.contact_name,
        recipient_phone: input.item.contact_phone,
        channel: 'app',
        template_code: 'care_case_created',
        title: '부모님 케어 요청이 정리됐습니다',
        body: `${input.item.elder_name} 케어 요청을 운영실이 정리했습니다.`,
        payload: {
          care_case_id: input.careCaseId,
          matching_request_id: input.matchingRequestId || null,
          url: '/child/cases'
        },
        priority: input.item.priority || 'normal',
        status: 'queued',
        created_by_role: 'system',
        dedupe_key: `care-case-created-${input.careCaseId}`
      }
    ])
  })
}

async function patchIntakeAfterConversion(input: {
  source: IntakeSource
  id: string
  careCaseId: string
  matchingRequestId?: string | null
}) {
  const now = new Date().toISOString()

  const fullPatch = await rest(input.source + '?id=eq.' + encodeURIComponent(input.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      status: 'converted',
      ops_status: 'converted',
      care_case_id: input.careCaseId,
      matching_request_id: input.matchingRequestId || null,
      converted_at: now,
      updated_at: now
    })
  })

  if (fullPatch.ok) return fullPatch

  const fallbackPatch = await rest(input.source + '?id=eq.' + encodeURIComponent(input.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      ops_status: 'converted',
      care_case_id: input.careCaseId,
      matching_request_id: input.matchingRequestId || null,
      converted_at: now
    })
  })

  return fallbackPatch
}

async function convertIntakeToCareCase(input: {
  id: string
  source: IntakeSource
}) {
  const row = await getSourceRow(input.source, input.id)

  if (!row) {
    return {
      ok: false,
      status: 404,
      message: '접수 데이터를 찾지 못했습니다.'
    }
  }

  const item = normalizeItem(row, input.source)
  const inferred = inferCareCase({
    title: item.summary_title,
    rawText: item.raw_text,
    worryType: item.worry_type
  })

  const existingCase = await findExistingCase(input.source, input.id)

  if (existingCase) {
    await patchIntakeAfterConversion({
      source: input.source,
      id: input.id,
      careCaseId: existingCase.id,
      matchingRequestId: existingCase.matching_request_id
    })

    return {
      ok: true,
      careCase: existingCase,
      matchingRequestId: existingCase.matching_request_id,
      message: '이미 생성된 케어 케이스가 있어 연결 상태만 갱신했습니다.'
    }
  }

  const matchingRequest = await createMatchingRequest({
    item,
    inferred
  })

  if (!matchingRequest.ok) {
    return {
      ok: false,
      status: 500,
      message: '매칭 요청 생성 중 오류가 발생했습니다.',
      detail: matchingRequest.error
    }
  }

  const matchingRequestRow = firstRow(matchingRequest)

  const careCaseInsert = await rest('care_cases', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        intake_source: input.source,
        intake_id: input.id,
        elder_name: item.elder_name,
        guardian_name: item.contact_name,
        guardian_phone: item.contact_phone || null,
        case_title: `${inferred.titlePrefix}: ${item.summary_title}`,
        care_case_type: inferred.careCaseType,
        case_status: 'created',
        priority: item.priority || 'normal',
        raw_text: item.raw_text,
        summary_text: item.summary_title,
        recommended_next_action: inferred.nextAction,
        matching_request_id: matchingRequestRow?.id || null,
        created_by_role: 'ops'
      }
    ])
  })

  if (!careCaseInsert.ok) {
    return {
      ok: false,
      status: 500,
      message: '케어 케이스 생성 중 오류가 발생했습니다.',
      detail: careCaseInsert.error
    }
  }

  const careCase = firstRow(careCaseInsert)

  await createCaseTasks(careCase.id, inferred.careCaseType)

  await createCaseEvent({
    careCaseId: careCase.id,
    eventType: 'created_from_intake',
    title: '접수에서 케어 케이스가 생성됐습니다.',
    description: item.summary_title,
    payload: {
      intake_source: input.source,
      intake_id: input.id,
      matching_request_id: matchingRequestRow?.id || null,
      inferred
    }
  })

  await createNotification({
    item,
    careCaseId: careCase.id,
    matchingRequestId: matchingRequestRow?.id || null
  })

  await patchIntakeAfterConversion({
    source: input.source,
    id: input.id,
    careCaseId: careCase.id,
    matchingRequestId: matchingRequestRow?.id || null
  })

  return {
    ok: true,
    careCase,
    matchingRequest: matchingRequestRow,
    message: '케어 케이스와 매칭 요청을 자동 생성했습니다.'
  }
}

async function getAssistedIntakeItems() {
  const select = [
    'id',
    'elder_name',
    'contact_name',
    'contact_phone',
    'channel',
    'raw_text',
    'summary_title',
    'worry_type',
    'preferred_response_channel',
    'status',
    'ops_status',
    'priority',
    'social_care_requested',
    'care_case_id',
    'matching_request_id',
    'created_at'
  ].join(',')

  const result = await rest(
    'care_assisted_intake_requests?select=' +
      encodeURIComponent(select) +
      '&order=created_at.desc&limit=100'
  )

  if (!result.ok) {
    return { ok: false, items: [] as AnyRow[], error: result.error }
  }

  return {
    ok: true,
    items: Array.isArray(result.data)
      ? result.data.map((row) => normalizeItem(row, 'care_assisted_intake_requests'))
      : [],
    error: null
  }
}

async function getCareIntakeEntries() {
  const result = await rest('care_intake_entries?select=*&order=created_at.desc&limit=100')

  if (!result.ok) {
    return { ok: false, items: [] as AnyRow[], error: result.error }
  }

  return {
    ok: true,
    items: Array.isArray(result.data)
      ? result.data.map((row) => normalizeItem(row, 'care_intake_entries'))
      : [],
    error: null
  }
}

export async function GET() {
  const [assisted, careIntake] = await Promise.all([
    getAssistedIntakeItems(),
    getCareIntakeEntries()
  ])

  const items = [...assisted.items, ...careIntake.items]
    .filter((item) => item.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const summary = {
    total: items.length,
    open: items.filter((item) => ['received', 'open', 'pending'].includes(item.status)).length,
    urgent: items.filter((item) => item.priority === 'urgent' || item.priority === 'high').length,
    converted: items.filter((item) => ['converted', 'completed', 'done'].includes(item.status)).length,
    assisted_count: assisted.items.length,
    care_intake_count: careIntake.items.length
  }

  return NextResponse.json({
    ok: true,
    items,
    summary,
    sources: {
      care_assisted_intake_requests: { ok: assisted.ok, error: assisted.ok ? null : assisted.error },
      care_intake_entries: { ok: careIntake.ok, error: careIntake.ok ? null : careIntake.error }
    }
  })
}

async function patchStatus(input: {
  source: IntakeSource
  id: string
  status: string
}) {
  const now = new Date().toISOString()

  const fullPayload: Record<string, unknown> = {
    status: input.status,
    ops_status: input.status,
    updated_at: now
  }

  if (input.status === 'processing') fullPayload.processed_at = now
  if (input.status === 'converted') fullPayload.converted_at = now

  const fullPatch = await rest(input.source + '?id=eq.' + encodeURIComponent(input.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(fullPayload)
  })

  if (fullPatch.ok) return fullPatch

  const fallbackPatch = await rest(input.source + '?id=eq.' + encodeURIComponent(input.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      ops_status: input.status,
      updated_at: now
    })
  })

  return fallbackPatch
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const id = text(body.id)
  const sourceRaw = text(body.source)
  const status = text(body.status) || 'processing'

  const source: IntakeSource =
    sourceRaw === 'care_intake_entries'
      ? 'care_intake_entries'
      : 'care_assisted_intake_requests'

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (status === 'converted') {
    const converted = await convertIntakeToCareCase({ id, source })

    if (!converted.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: converted.message || '케어 케이스 변환 중 오류가 발생했습니다.',
          detail: converted.detail || null
        },
        { status: converted.status || 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: converted.message,
      careCase: converted.careCase,
      matchingRequest: converted.matchingRequest || null
    })
  }

  const patched = await patchStatus({ source, id, status })

  if (!patched.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '상태 변경 중 오류가 발생했습니다.',
        detail: patched.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '상태가 변경됐습니다.',
    item: firstRow(patched)
  })
}
