import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>

const checkSteps = [
  ['start_departure', '출발했습니다'],
  ['meet_parent', '부모님을 만났습니다'],
  ['arrive_place', '병원/장소에 도착했습니다'],
  ['reception_done', '접수·수납을 도왔습니다'],
  ['visit_done', '진료/업무가 끝났습니다'],
  ['pharmacy_done', '약국·복약 확인했습니다'],
  ['home_done', '귀가 확인했습니다'],
  ['report_done', '리포트까지 완료했습니다']
] as const

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

function firstRow(result: { data: any }) {
  return Array.isArray(result.data) ? result.data[0] : result.data
}

async function insertOne(table: string, row: Record<string, unknown>) {
  const result = await rest(table, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([row])
  })

  if (!result.ok) {
    throw new Error(`${table} insert failed: ${JSON.stringify(result.error)}`)
  }

  return firstRow(result)
}

async function insertMany(table: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return []

  const result = await rest(table, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(rows)
  })

  if (!result.ok) {
    throw new Error(`${table} insert failed: ${JSON.stringify(result.error)}`)
  }

  return Array.isArray(result.data) ? result.data : []
}

async function patchOne(table: string, id: string, row: Record<string, unknown>) {
  const result = await rest(table + '?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row)
  })

  if (!result.ok) {
    throw new Error(`${table} patch failed: ${JSON.stringify(result.error)}`)
  }

  return firstRow(result)
}

async function count(table: string) {
  const result = await rest(table + '?select=id&limit=1000')
  return result.ok && Array.isArray(result.data) ? result.data.length : 0
}

async function runCron(request: NextRequest, dryRun = false) {
  const url = new URL('/api/cron/notifications', request.url)
  url.searchParams.set('limit', '20')
  if (dryRun) url.searchParams.set('dryRun', 'true')

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: 'Bearer ' + (process.env.CRON_SECRET || '')
    },
    cache: 'no-store'
  })

  const text = await response.text()
  let parsed: any = null

  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }

  return {
    ok: response.ok,
    data: parsed
  }
}

async function createFullDemoScenario() {
  const scenarioTag = `demo-${Date.now()}`
  const now = new Date()
  const nowIso = now.toISOString()
  const today = nowIso.slice(0, 10)
  const nextWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10)

  const intake = await insertOne('care_assisted_intake_requests', {
    elder_name: '어머니',
    contact_name: '홍길동',
    contact_phone: '01000000000',
    channel: 'memo',
    raw_text: '어머니가 무릎이 안 좋으셔서 강남구 정형외과 병원동행이 필요합니다. 접수, 이동 보조, 진료 후 약국, 귀가 확인까지 부탁드립니다.',
    summary_title: '무릎 통증으로 정형외과 병원동행 필요',
    worry_type: 'hospital_visit',
    status: 'converted',
    ops_status: 'converted',
    priority: 'high',
    social_care_requested: true,
    metadata: {
      scenario_tag: scenarioTag,
      source: 'one_click_demo'
    },
    converted_at: nowIso
  })

  const manager = await insertOne('care_manager_profiles', {
    manager_name: '김하나 케어파트너',
    manager_phone: '01033334444',
    profile_status: 'active',
    trust_level: 'standard',
    identity_verified: true,
    identity_verified_at: nowIso,
    certifications: ['요양보호사 자격 확인', '병원동행 기본교육 확인', '응급상황 대응 교육 확인'],
    available_regions: ['강남구', '서초구', '송파구'],
    specialties: ['정형외과', '병원동행', '약국·복약 확인', '어르신 응대'],
    service_scopes: ['병원 앞 만남', '접수·수납 도움', '진료실 동행', '약국 동행', '복약 확인', '귀가 확인'],
    vehicle_owned: false,
    driving_license_owned: false,
    direct_transport_included: false,
    trust_card_summary: '최초 검증 완료 · 병원동행 · 약국/복약 확인 가능',
    public_notes: '검증 완료 케어파트너입니다. 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.',
    completed_cases: 12,
    rating_safety: 4.9,
    rating_kindness: 4.8,
    rating_accuracy: 4.8,
    rating_punctuality: 4.9,
    evaluation_count: 12,
    review_summary: '차분한 설명과 보호자 공유가 좋은 매니저',
    approved_at: nowIso
  })

  const matchingRequest = await insertOne('care_manager_matching_requests', {
    elder_name: '어머니',
    guardian_name: '홍길동',
    guardian_phone: '01000000000',
    request_title: '강남구 정형외과 병원동행',
    request_type: 'hospital_visit',
    region_text: '강남구',
    hospital_name: '강남안심정형외과',
    appointment_date: today,
    appointment_time: '오전 10시',
    meeting_location: '병원 정문',
    required_specialties: ['정형외과', '약국·복약 확인'],
    required_service_scopes: ['병원 앞 만남', '접수·수납 도움', '약국 동행', '귀가 확인', '30초 리포트 작성'],
    mobility_support_needed: true,
    hearing_support_needed: false,
    allergy_attention_needed: false,
    medication_attention_needed: true,
    transport_mode: 'hospital_meet',
    vehicle_required: false,
    direct_transport_required: false,
    priority: 'high',
    matching_status: 'assigned',
    selected_manager_profile_id: manager.id,
    ops_memo: '원클릭 데모 시나리오에서 자동 생성됨',
    created_by_role: 'ops'
  })

  const careCase = await insertOne('care_cases', {
    intake_source: 'care_assisted_intake_requests',
    intake_id: intake.id,
    elder_name: '어머니',
    guardian_name: '홍길동',
    guardian_phone: '01000000000',
    case_title: '병원동행 케어: 무릎 통증으로 정형외과 병원동행 필요',
    care_case_type: 'hospital_visit',
    case_status: 'completed',
    priority: 'high',
    raw_text: intake.raw_text,
    summary_text: intake.summary_title,
    recommended_next_action: '병원 일정, 만남 장소, 약국/서류 필요 여부를 확인하고 보호자에게 리포트 공유',
    matching_request_id: matchingRequest.id,
    created_by_role: 'ops'
  })

  await insertMany('care_case_tasks', [
    {
      care_case_id: careCase.id,
      task_title: '보호자 연락처 확인',
      task_description: '보호자 연락처와 요청 내용을 확인했습니다.',
      task_status: 'completed',
      assigned_to_role: 'ops',
      sort_order: 10,
      completed_at: nowIso
    },
    {
      care_case_id: careCase.id,
      task_title: '부모님 주의사항 확인',
      task_description: '무릎 통증이 있어 계단을 피하고 천천히 이동해야 합니다.',
      task_status: 'completed',
      assigned_to_role: 'ops',
      sort_order: 20,
      completed_at: nowIso
    },
    {
      care_case_id: careCase.id,
      task_title: '검증 매니저에게 알림',
      task_description: '강남구 병원동행 가능 매니저에게 제안을 발송했습니다.',
      task_status: 'completed',
      assigned_to_role: 'ops',
      sort_order: 30,
      completed_at: nowIso
    }
  ])

  const offer = await insertOne('care_manager_match_offers', {
    matching_request_id: matchingRequest.id,
    manager_profile_id: manager.id,
    manager_name: manager.manager_name,
    manager_phone: manager.manager_phone,
    offer_status: 'assigned',
    offer_score: 94,
    offer_reasons: ['본인확인 완료', '검증 매니저', '지역 가능', '약국·복약 확인 가능'],
    request_snapshot: {
      elder_name: '어머니',
      request_title: '강남구 정형외과 병원동행',
      request_type: 'hospital_visit',
      region_text: '강남구',
      hospital_name: '강남안심정형외과',
      appointment_date: today,
      appointment_time: '오전 10시',
      meeting_location: '병원 정문'
    },
    manager_snapshot: {
      manager_name: manager.manager_name,
      trust_level: manager.trust_level,
      identity_verified: manager.identity_verified,
      trust_card_summary: manager.trust_card_summary
    },
    expected_fee: 39000,
    estimated_minutes: 120,
    response_deadline: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    manager_response_memo: '오전 시간 가능합니다. 병원 정문에서 부모님을 모시겠습니다.',
    responded_at: nowIso,
    assigned_at: nowIso
  })

  const assignment = await insertOne('manager_field_assignments', {
    matching_request_id: matchingRequest.id,
    manager_profile_id: manager.id,
    elder_name: '어머니',
    manager_name: manager.manager_name,
    manager_phone: manager.manager_phone,
    assignment_type: 'hospital_visit',
    title: '강남구 정형외과 병원동행',
    appointment_date: today,
    appointment_time: '오전 10시',
    meeting_location: '병원 정문',
    meeting_code: '2580',
    transport_mode: 'hospital_meet',
    vehicle_owned: false,
    direct_transport_included: false,
    transport_policy_acknowledged: true,
    status: 'completed',
    checkin_status: 'completed',
    expected_fee: 39000,
    estimated_minutes: 120,
    payout_status: 'pending',
    care_passport_snapshot: {
      mobility: '무릎 통증, 계단 주의',
      medication: '약국 복약 확인 필요',
      communication: '천천히 설명하면 이해 가능'
    },
    safety_notes: [
      '무릎 통증이 있어 계단 대신 엘리베이터를 이용합니다.',
      '개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.',
      '약국에서 복약 시간과 약 봉투를 확인합니다.'
    ],
    guardian_questions: ['다음 외래 날짜 확인', '약 복용 시간 확인'],
    required_documents: ['영수증', '처방전', '세부내역서'],
    manager_trust_snapshot: {
      manager_profile_id: manager.id,
      trust_level: manager.trust_level,
      identity_verified: true,
      trust_card_summary: manager.trust_card_summary
    },
    matching_gate_checked: true,
    ops_memo: '원클릭 데모 현장 배정',
    report_memo: '무릎 통증이 있어 이동 시 천천히 걸으셨고, 약국에서 복약 시간을 확인했습니다.',
    started_at: nowIso,
    met_parent_at: nowIso,
    arrived_at: nowIso,
    reception_at: nowIso,
    visit_completed_at: nowIso,
    pharmacy_at: nowIso,
    home_returned_at: nowIso,
    completed_at: nowIso,
    created_by_role: 'ops'
  })

  await patchOne('care_manager_matching_requests', matchingRequest.id, {
    manager_assignment_id: assignment.id,
    updated_at: nowIso
  })

  await patchOne('care_cases', careCase.id, {
    assignment_id: assignment.id,
    updated_at: nowIso
  })

  await patchOne('care_assisted_intake_requests', intake.id, {
    care_case_id: careCase.id,
    matching_request_id: matchingRequest.id,
    updated_at: nowIso
  })

  await insertMany('manager_field_check_events', checkSteps.map(([stepCode, stepTitle], index) => ({
    assignment_id: assignment.id,
    manager_profile_id: manager.id,
    step_code: stepCode,
    step_title: stepTitle,
    event_status: 'checked',
    memo: index === checkSteps.length - 1
      ? '현장 완료 후 보호자에게 공유할 30초 리포트를 작성했습니다.'
      : null,
    payload: {
      scenario_tag: scenarioTag,
      order: index + 1,
      checked_at: nowIso
    },
    created_by_role: 'manager'
  })))

  await insertOne('manager_field_reports', {
    assignment_id: assignment.id,
    visit_summary: '정형외과 병원동행을 완료했습니다.',
    doctor_guidance: '무릎 통증 관련 진료를 받았고 다음 외래 일정을 보호자가 확인하면 좋습니다.',
    medication_summary: '약국에서 복약 시간과 약 봉투를 확인했습니다.',
    document_summary: '영수증, 처방전, 세부내역서를 챙겼습니다.',
    meal_condition_summary: '식사는 별도 확인이 필요합니다.',
    parent_condition: '이동은 천천히 진행했고 큰 이상 없이 귀가 확인했습니다.',
    family_next_actions: ['약 복용 시간 확인', '다음 외래 일정 확인', '서류 보관'],
    reassurance_state: '안심',
    status: 'ready'
  })

  const guardianReport = await insertOne('care_guardian_reports', {
    assignment_id: assignment.id,
    care_case_id: careCase.id,
    matching_request_id: matchingRequest.id,
    elder_name: '어머니',
    guardian_name: '홍길동',
    guardian_phone: '01000000000',
    manager_name: manager.manager_name,
    report_title: '어머니 병원동행 30초 요약',
    report_status: 'ready',
    reassurance_state: '안심',
    summary_30sec: '어머니 병원동행이 완료됐습니다. 병원 정문에서 만나 접수와 이동을 도왔고, 진료 후 약국에서 복약 시간을 확인했습니다. 무릎 통증이 있어 이동은 천천히 진행했으며 귀가 확인까지 마쳤습니다.',
    parent_condition: '무릎 통증으로 이동은 천천히 했지만 큰 이상 없이 귀가했습니다.',
    visit_result: '정형외과 진료와 접수·수납을 완료했습니다.',
    medication_result: '약국에서 약 봉투와 복용 시간을 확인했습니다.',
    document_result: '영수증, 처방전, 세부내역서를 챙겼습니다.',
    meal_result: '식사 확인은 필요 시 별도 케어로 이어갈 수 있습니다.',
    next_actions: ['약 복용 시간 확인', '다음 외래 일정 확인', '서류 보관'],
    check_events: checkSteps.map(([stepCode, stepTitle]) => ({
      step_code: stepCode,
      step_title: stepTitle,
      created_at: nowIso
    })),
    report_memo: '무릎 통증이 있어 계단 대신 엘리베이터를 이용했습니다.',
    created_by_role: 'system'
  })

  await insertMany('care_guardian_report_actions', [
    {
      care_report_id: guardianReport.id,
      assignment_id: assignment.id,
      action_title: '약 복용 시간 확인하기',
      action_description: '약국에서 받은 복용 안내를 어머니와 한 번 더 확인해주세요.',
      action_status: 'open',
      assigned_to_role: 'guardian',
      sort_order: 10
    },
    {
      care_report_id: guardianReport.id,
      assignment_id: assignment.id,
      action_title: '다음 외래 일정 확인하기',
      action_description: '다음 진료나 검사 일정이 있는지 병원 안내문을 확인해주세요.',
      action_status: 'open',
      assigned_to_role: 'guardian',
      sort_order: 20
    },
    {
      care_report_id: guardianReport.id,
      assignment_id: assignment.id,
      action_title: '서류 보관하기',
      action_description: '영수증, 처방전, 세부내역서를 보험 청구나 기록용으로 보관해주세요.',
      action_status: 'open',
      assigned_to_role: 'guardian',
      sort_order: 30
    }
  ])

  await insertMany('notification_outbox', [
    {
      elder_name: '어머니',
      recipient_role: 'guardian',
      recipient_name: '홍길동',
      recipient_phone: '01000000000',
      channel: 'app',
      template_code: 'care_case_created',
      title: '부모님 케어 요청이 정리됐습니다',
      body: '어머니 병원동행 케어 요청을 운영실이 정리했습니다.',
      payload: {
        scenario_tag: scenarioTag,
        care_case_id: careCase.id,
        url: '/child/cases'
      },
      priority: 'high',
      status: 'queued',
      created_by_role: 'system',
      dedupe_key: `${scenarioTag}-care-case-created`
    },
    {
      elder_name: '어머니',
      recipient_role: 'manager',
      recipient_name: manager.manager_name,
      recipient_phone: manager.manager_phone,
      channel: 'app',
      template_code: 'manager_offer_sent',
      title: '새 케어 요청이 도착했습니다',
      body: '강남구 정형외과 병원동행 요청이 도착했습니다.',
      payload: {
        scenario_tag: scenarioTag,
        offer_id: offer.id,
        url: '/manager'
      },
      priority: 'normal',
      status: 'queued',
      created_by_role: 'system',
      dedupe_key: `${scenarioTag}-manager-offer`
    },
    {
      elder_name: '어머니',
      recipient_role: 'guardian',
      recipient_name: '홍길동',
      recipient_phone: '01000000000',
      channel: 'app',
      template_code: 'guardian_report_ready',
      title: '부모님 케어 리포트가 도착했습니다',
      body: '어머니 케어 30초 요약이 준비됐습니다.',
      payload: {
        scenario_tag: scenarioTag,
        report_id: guardianReport.id,
        url: '/child/reports'
      },
      priority: 'normal',
      status: 'queued',
      created_by_role: 'system',
      dedupe_key: `${scenarioTag}-guardian-report`
    }
  ])

  const earning = await insertOne('care_manager_earnings', {
    manager_profile_id: manager.id,
    assignment_id: assignment.id,
    earning_title: '강남구 정형외과 병원동행 정산',
    amount: 39000,
    earning_status: 'expected',
    payout_due_date: nextWeek,
    memo: '원클릭 데모 시나리오 정산 예정'
  })

  return {
    scenarioTag,
    intake,
    careCase,
    matchingRequest,
    manager,
    offer,
    assignment,
    guardianReport,
    earning
  }
}

async function getSummary() {
  const tables = [
    ['intakes', 'care_assisted_intake_requests'],
    ['cases', 'care_cases'],
    ['managers', 'care_manager_profiles'],
    ['matchingRequests', 'care_manager_matching_requests'],
    ['offers', 'care_manager_match_offers'],
    ['assignments', 'manager_field_assignments'],
    ['checkEvents', 'manager_field_check_events'],
    ['guardianReports', 'care_guardian_reports'],
    ['notifications', 'notification_outbox'],
    ['earnings', 'care_manager_earnings']
  ] as const

  const summary: Record<string, number> = {}

  for (const [key, table] of tables) {
    summary[key] = await count(table)
  }

  const latestCases = await rest('care_cases?select=*&order=created_at.desc&limit=5')
  const latestReports = await rest('care_guardian_reports?select=*&order=created_at.desc&limit=5')
  const latestNotifications = await rest('notification_outbox?select=*&order=created_at.desc&limit=5')

  return {
    summary,
    latestCases: latestCases.ok && Array.isArray(latestCases.data) ? latestCases.data : [],
    latestReports: latestReports.ok && Array.isArray(latestReports.data) ? latestReports.data : [],
    latestNotifications: latestNotifications.ok && Array.isArray(latestNotifications.data) ? latestNotifications.data : []
  }
}

export async function GET() {
  const data = await getSummary()

  return NextResponse.json({
    ok: true,
    ...data
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = typeof body.action === 'string' ? body.action : 'create_full_demo'

  try {
    if (action === 'create_full_demo') {
      const scenario = await createFullDemoScenario()
      const summary = await getSummary()

      return NextResponse.json({
        ok: true,
        message: '원클릭 통합 시나리오를 생성했습니다.',
        scenario,
        ...summary
      })
    }

    if (action === 'run_notifications') {
      const cron = await runCron(request, false)
      const summary = await getSummary()

      return NextResponse.json({
        ok: cron.ok,
        message: cron.ok ? '알림 자동 발송을 실행했습니다.' : '알림 자동 발송 실행 중 오류가 발생했습니다.',
        cron,
        ...summary
      }, { status: cron.ok ? 200 : 500 })
    }

    if (action === 'dry_run_notifications') {
      const cron = await runCron(request, true)
      const summary = await getSummary()

      return NextResponse.json({
        ok: cron.ok,
        message: cron.ok ? 'Dry Run을 실행했습니다.' : 'Dry Run 실행 중 오류가 발생했습니다.',
        cron,
        ...summary
      }, { status: cron.ok ? 200 : 500 })
    }

    return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : '원클릭 시나리오 생성 중 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}
