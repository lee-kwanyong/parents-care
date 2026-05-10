import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>

const fieldSteps = [
  {
    code: 'start_departure',
    title: '출발했습니다',
    description: '약속 장소로 출발할 때 눌러주세요.',
    checkinStatus: 'departed',
    assignmentStatus: 'in_progress',
    timeColumn: 'started_at'
  },
  {
    code: 'meet_parent',
    title: '부모님을 만났습니다',
    description: '만남 암호와 성함을 확인한 뒤 눌러주세요.',
    checkinStatus: 'met_parent',
    assignmentStatus: 'in_progress',
    timeColumn: 'met_parent_at'
  },
  {
    code: 'arrive_place',
    title: '병원/장소에 도착했습니다',
    description: '병원, 약국, 관공서 등 목적지 도착 후 눌러주세요.',
    checkinStatus: 'arrived',
    assignmentStatus: 'in_progress',
    timeColumn: 'arrived_at'
  },
  {
    code: 'reception_done',
    title: '접수·수납을 도왔습니다',
    description: '번호표, 접수, 수납 등 필요한 도움을 마친 뒤 눌러주세요.',
    checkinStatus: 'reception_done',
    assignmentStatus: 'in_progress',
    timeColumn: 'reception_at'
  },
  {
    code: 'visit_done',
    title: '진료/업무가 끝났습니다',
    description: '진료, 검사, 상담, 관공서 업무가 끝난 뒤 눌러주세요.',
    checkinStatus: 'visit_done',
    assignmentStatus: 'in_progress',
    timeColumn: 'visit_completed_at'
  },
  {
    code: 'pharmacy_done',
    title: '약국·복약 확인했습니다',
    description: '약 봉투, 복용 시간, 보호자 공유 내용을 확인한 뒤 눌러주세요.',
    checkinStatus: 'pharmacy_done',
    assignmentStatus: 'in_progress',
    timeColumn: 'pharmacy_at'
  },
  {
    code: 'home_done',
    title: '귀가 확인했습니다',
    description: '부모님이 안전하게 귀가했거나 보호자에게 인계한 뒤 눌러주세요.',
    checkinStatus: 'home_returned',
    assignmentStatus: 'in_progress',
    timeColumn: 'home_returned_at'
  },
  {
    code: 'report_done',
    title: '리포트까지 완료했습니다',
    description: '특이사항과 다음 할 일을 정리한 뒤 눌러주세요.',
    checkinStatus: 'completed',
    assignmentStatus: 'completed',
    timeColumn: 'completed_at'
  }
]

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

function arrayFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean)
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean)
    }
  }

  return []
}

function won(value: number) {
  return Math.max(0, Math.round(value || 0))
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

async function getFirstVerifiedManager() {
  const result = await rest(
    'care_manager_profiles?select=*&profile_status=eq.active&identity_verified=eq.true&direct_transport_included=eq.false&order=created_at.desc&limit=1'
  )

  return result.ok && Array.isArray(result.data) ? result.data[0] : null
}

async function getCurrentAssignment(managerProfileId: string) {
  const active = await rest(
    'manager_field_assignments?select=*&manager_profile_id=eq.' +
      encodeURIComponent(managerProfileId) +
      '&status=in.(assigned,in_progress)&order=created_at.desc&limit=1'
  )

  if (active.ok && Array.isArray(active.data) && active.data[0]) {
    return active.data[0]
  }

  const latest = await rest(
    'manager_field_assignments?select=*&manager_profile_id=eq.' +
      encodeURIComponent(managerProfileId) +
      '&order=created_at.desc&limit=1'
  )

  return latest.ok && Array.isArray(latest.data) ? latest.data[0] || null : null
}

async function getEvents(assignmentId: string) {
  const result = await rest(
    'manager_field_check_events?select=*&assignment_id=eq.' +
      encodeURIComponent(assignmentId) +
      '&order=created_at.asc'
  )

  return result.ok && Array.isArray(result.data) ? result.data : []
}

async function createDemoManagerIfNeeded() {
  const existing = await getFirstVerifiedManager()

  if (existing) return existing

  const now = new Date().toISOString()

  const insert = await rest('care_manager_profiles', {
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

  return insert.ok ? firstRow(insert) : null
}

async function createDemoAssignment() {
  const manager = await createDemoManagerIfNeeded()

  if (!manager) {
    return {
      ok: false,
      error: '검증 매니저 생성 실패'
    }
  }

  const insert = await rest('manager_field_assignments', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        manager_profile_id: manager.id,
        elder_name: '어머니',
        manager_name: manager.manager_name,
        manager_phone: manager.manager_phone,
        assignment_type: 'hospital_visit',
        title: '강남구 정형외과 병원동행',
        appointment_date: '2026-05-10',
        appointment_time: '오전 10시',
        meeting_location: '병원 정문',
        meeting_code: '2580',
        transport_mode: 'hospital_meet',
        vehicle_owned: false,
        direct_transport_included: false,
        transport_policy_acknowledged: true,
        status: 'assigned',
        checkin_status: 'not_started',
        expected_fee: 39000,
        estimated_minutes: 120,
        care_passport_snapshot: {
          hearing: '천천히 설명하면 이해 가능',
          mobility: '무릎 통증, 계단 주의',
          medication: '약국 복약 확인 필요'
        },
        safety_notes: [
          '부모님께 천천히 설명해주세요.',
          '무릎 통증이 있어 계단 이동을 줄여주세요.',
          '약국에서 복약 시간과 약 봉투를 확인해주세요.',
          '개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.'
        ],
        required_documents: ['영수증', '처방전', '세부내역서'],
        guardian_questions: ['다음 외래 날짜 확인', '약 복용 시간 확인'],
        manager_trust_snapshot: {
          manager_profile_id: manager.id,
          trust_level: manager.trust_level,
          identity_verified: true,
          trust_card_summary: manager.trust_card_summary
        },
        matching_gate_checked: true,
        created_by_role: 'ops'
      }
    ])
  })

  return {
    ok: insert.ok,
    manager,
    assignment: firstRow(insert),
    error: insert.error
  }
}

function buildGuardianNextActions(assignment: AnyRow) {
  const requiredDocuments = arrayFrom(assignment.required_documents)
  const guardianQuestions = arrayFrom(assignment.guardian_questions)

  const actions: Array<{
    action_title: string
    action_description: string
    sort_order: number
  }> = []

  if (guardianQuestions.length > 0) {
    actions.push({
      action_title: '진료 후 확인할 질문 다시 보기',
      action_description: guardianQuestions.join(' / '),
      sort_order: 10
    })
  }

  if (requiredDocuments.length > 0) {
    actions.push({
      action_title: '서류와 영수증 보관하기',
      action_description: requiredDocuments.join(' / '),
      sort_order: 20
    })
  }

  actions.push({
    action_title: '약 복용 시간 확인하기',
    action_description: '약국에서 받은 복용 안내를 부모님과 한 번 더 확인해주세요.',
    sort_order: 30
  })

  actions.push({
    action_title: '다음 일정 확인하기',
    action_description: '다음 외래, 검사, 서류 제출 일정이 있는지 확인해주세요.',
    sort_order: 40
  })

  return actions
}

function buildSummary(assignment: AnyRow, memo: string) {
  const elderName = assignment.elder_name || '부모님'
  const title = assignment.title || '부모님 케어'
  const managerName = assignment.manager_name || '케어파트너'

  const base = `${elderName} ${title}이 완료됐습니다. ${managerName} 매니저가 현장 체크를 마쳤고, 특이사항과 가족이 할 일을 정리했습니다.`

  if (memo) return `${base} 메모: ${memo}`

  return base
}

async function createGuardianReport(input: {
  assignment: AnyRow
  memo: string
}) {
  const assignment = input.assignment
  const memo = input.memo || text(assignment.report_memo)
  const events = assignment.id ? await getEvents(assignment.id) : []
  const nextActions = buildGuardianNextActions(assignment)
  const summary30sec = buildSummary(assignment, memo)

  const requiredDocuments = arrayFrom(assignment.required_documents)

  const managerReport = await rest('manager_field_reports?on_conflict=assignment_id', {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify([
      {
        assignment_id: assignment.id,
        visit_summary: `${assignment.title || '현장 케어'} 완료`,
        doctor_guidance: '진료 또는 업무 관련 안내는 보호자가 다시 확인해주세요.',
        medication_summary: '약국·복약 확인이 필요한 경우 보호자에게 공유했습니다.',
        document_summary: requiredDocuments.length > 0 ? requiredDocuments.join(' / ') : '필수 서류 없음',
        meal_condition_summary: '식사 상태는 필요 시 별도 확인이 필요합니다.',
        parent_condition: '현장 진행이 완료됐습니다. 특이사항은 리포트 메모를 확인해주세요.',
        family_next_actions: nextActions.map((item) => item.action_title),
        reassurance_state: '안심',
        status: 'ready'
      }
    ])
  })

  const guardianReport = await rest('care_guardian_reports?on_conflict=assignment_id', {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify([
      {
        assignment_id: assignment.id,
        matching_request_id: assignment.matching_request_id || null,
        elder_name: assignment.elder_name || '부모님',
        guardian_name: null,
        guardian_phone: null,
        manager_name: assignment.manager_name || null,
        report_title: `${assignment.elder_name || '부모님'} 케어 30초 요약`,
        report_status: 'ready',
        reassurance_state: '안심',
        summary_30sec: summary30sec,
        parent_condition: '현장 케어가 완료됐습니다.',
        visit_result: `${assignment.title || '케어'} 완료`,
        medication_result: '약국·복약 확인이 필요한 경우 현장 체크 기준으로 공유됐습니다.',
        document_result: requiredDocuments.length > 0 ? requiredDocuments.join(' / ') : '필수 서류 없음',
        meal_result: '식사 확인이 필요한 경우 별도 케어로 이어갈 수 있습니다.',
        next_actions: nextActions.map((item) => item.action_title),
        check_events: events.map((event: AnyRow) => ({
          step_code: event.step_code,
          step_title: event.step_title,
          created_at: event.created_at
        })),
        report_memo: memo || null,
        created_by_role: 'system'
      }
    ])
  })

  if (!guardianReport.ok) {
    return {
      ok: false,
      error: guardianReport.error,
      managerReport: managerReport.ok ? firstRow(managerReport) : null
    }
  }

  const report = firstRow(guardianReport)

  const actionRows = nextActions.map((action) => ({
    care_report_id: report.id,
    assignment_id: assignment.id,
    action_title: action.action_title,
    action_description: action.action_description,
    action_status: 'open',
    assigned_to_role: 'guardian',
    sort_order: action.sort_order
  }))

  if (actionRows.length > 0) {
    await rest('care_guardian_report_actions?on_conflict=care_report_id,action_title', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify(actionRows)
    })
  }

  await rest('notification_outbox', {
    method: 'POST',
    body: JSON.stringify([
      {
        elder_name: assignment.elder_name || '부모님',
        recipient_role: 'guardian',
        recipient_name: null,
        recipient_phone: null,
        channel: 'app',
        template_code: 'guardian_report_ready',
        title: '부모님 케어 리포트가 도착했습니다',
        body: `${assignment.elder_name || '부모님'} 케어 30초 요약이 준비됐습니다.`,
        payload: {
          report_id: report.id,
          assignment_id: assignment.id,
          url: '/child/reports'
        },
        priority: 'normal',
        status: 'queued',
        created_by_role: 'system',
        dedupe_key: `guardian-report-${report.id}`
      }
    ])
  })

  return {
    ok: true,
    report,
    managerReport: managerReport.ok ? firstRow(managerReport) : null
  }
}

export async function GET() {
  const manager = await getFirstVerifiedManager()

  if (!manager) {
    return NextResponse.json({
      ok: true,
      manager: null,
      assignment: null,
      steps: fieldSteps,
      events: [],
      completedStepCodes: [],
      summary: {
        progress: 0,
        expectedFee: 0,
        status: 'no_manager'
      }
    })
  }

  const assignment = await getCurrentAssignment(manager.id)
  const events = assignment?.id ? await getEvents(assignment.id) : []
  const completedStepCodes = events.map((event: AnyRow) => event.step_code)
  const progress = Math.round((completedStepCodes.length / fieldSteps.length) * 100)

  return NextResponse.json({
    ok: true,
    manager,
    assignment,
    steps: fieldSteps,
    events,
    completedStepCodes,
    summary: {
      progress,
      expectedFee: assignment?.expected_fee || 0,
      status: assignment?.status || 'no_assignment'
    }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create_demo_assignment') {
    const result = await createDemoAssignment()

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '테스트 배정 생성 중 오류가 발생했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: '테스트 현장 배정을 만들었습니다.',
      manager: result.manager,
      assignment: result.assignment
    })
  }

  if (action !== 'check_step') {
    return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
  }

  const assignmentId = text(body.assignmentId)
  const stepCode = text(body.stepCode)
  const memo = text(body.memo)

  if (!assignmentId || !stepCode) {
    return NextResponse.json({ ok: false, message: 'assignmentId와 stepCode가 필요합니다.' }, { status: 400 })
  }

  const step = fieldSteps.find((item) => item.code === stepCode)

  if (!step) {
    return NextResponse.json({ ok: false, message: '체크 단계가 올바르지 않습니다.' }, { status: 400 })
  }

  const manager = await getFirstVerifiedManager()

  const assignmentResult = await rest(
    'manager_field_assignments?select=*&id=eq.' + encodeURIComponent(assignmentId) + '&limit=1'
  )

  const assignment = assignmentResult.ok && Array.isArray(assignmentResult.data)
    ? assignmentResult.data[0]
    : null

  if (!assignment) {
    return NextResponse.json({ ok: false, message: '현장 배정을 찾지 못했습니다.' }, { status: 404 })
  }

  const now = new Date().toISOString()

  const eventInsert = await rest('manager_field_check_events?on_conflict=assignment_id,step_code', {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify([
      {
        assignment_id: assignmentId,
        manager_profile_id: assignment.manager_profile_id || manager?.id || null,
        step_code: step.code,
        step_title: step.title,
        event_status: 'checked',
        memo: memo || null,
        payload: {
          checked_at: now,
          description: step.description
        },
        created_by_role: 'manager'
      }
    ])
  })

  if (!eventInsert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '현장 체크 저장 중 오류가 발생했습니다.',
        detail: eventInsert.error
      },
      { status: 500 }
    )
  }

  const patchPayload: Record<string, unknown> = {
    status: step.assignmentStatus,
    checkin_status: step.checkinStatus,
    updated_at: now
  }

  patchPayload[step.timeColumn] = now

  if (memo) {
    if (step.code === 'report_done') {
      patchPayload.report_memo = memo
    } else {
      patchPayload.field_memo = memo
    }
  }

  const assignmentPatch = await rest('manager_field_assignments?id=eq.' + encodeURIComponent(assignmentId), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patchPayload)
  })

  if (!assignmentPatch.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '현장 배정 상태 변경 중 오류가 발생했습니다.',
        detail: assignmentPatch.error
      },
      { status: 500 }
    )
  }

  const patchedAssignment = firstRow(assignmentPatch)
  let guardianReportResult: { ok: boolean; report?: AnyRow; error?: unknown } | null = null

  if (step.code === 'report_done') {
    await rest('care_manager_earnings?on_conflict=assignment_id', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify([
        {
          manager_profile_id: patchedAssignment.manager_profile_id || manager?.id || null,
          assignment_id: patchedAssignment.id,
          earning_title: patchedAssignment.title || '케어 수행 정산',
          amount: won(patchedAssignment.expected_fee || 35000),
          earning_status: 'expected',
          payout_due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
          memo: '현장 체크 완료 후 정산 예정'
        }
      ])
    })

    guardianReportResult = await createGuardianReport({
      assignment: patchedAssignment,
      memo
    })
  }

  return NextResponse.json({
    ok: true,
    message:
      step.code === 'report_done'
        ? '현장 체크와 보호자 30초 리포트가 저장됐습니다.'
        : `${step.title} 체크가 저장됐습니다.`,
    event: firstRow(eventInsert),
    assignment: patchedAssignment,
    guardianReport: guardianReportResult
  })
}
