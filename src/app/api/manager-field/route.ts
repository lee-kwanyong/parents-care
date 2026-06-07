import { NextRequest, NextResponse } from 'next/server'
import {
  buildDefaultManagerChecklist,
  buildManagerSafetyNotes,
  type CarePassportSnapshot,
  type ChecklistStatus,
  type ManagerAssignmentStatus,
  type ManagerAssignmentType,
  type TransportMode
} from '@/lib/manager-field-engine'

export const dynamic = 'force-dynamic'

const allowedAssignmentTypes = new Set(['hospital_visit', 'meal_check', 'discharge_check', 'document_pickup', 'check_call', 'wellbeing', 'custom'])
const allowedTransportModes = new Set(['hospital_meet', 'home_meet_taxi_companion', 'mobility_partner', 'guardian_arranged', 'no_transport'])
const allowedAssignmentStatuses = new Set(['assigned', 'accepted', 'en_route', 'met_parent', 'at_hospital', 'in_consultation', 'pharmacy', 'documents', 'meal_check', 'safe_return', 'reporting', 'completed', 'issue', 'cancelled'])
const allowedChecklistStatuses = new Set(['pending', 'done', 'issue', 'skipped'])

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 'on'
}

function arrayOfText(value: unknown) {
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

async function fetchVerifiedManagerProfile(profileId: string) {
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
    'public_notes',
    'rating_safety',
    'rating_kindness',
    'rating_accuracy',
    'rating_punctuality',
    'review_summary'
  ].join(',')

  const result = await rest(
    'care_manager_profiles?select=' + encodeURIComponent(select) + '&id=eq.' + encodeURIComponent(profileId) + '&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data)) return null
  return result.data[0] || null
}

async function fetchLatestPassport(): Promise<CarePassportSnapshot | null> {
  const select = [
    'id',
    'elder_name',
    'hearing_attention',
    'mobility_attention',
    'allergy_status',
    'has_medications',
    'fall_risk_level',
    'body_conditions',
    'allergies',
    'medications',
    'diet_needs',
    'communication_notes',
    'emergency_notes',
    'care_summary',
    'updated_at'
  ].join(',')

  const result = await rest(
    'parent_care_passports?select=' + encodeURIComponent(select) + '&order=updated_at.desc&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data)) return null
  return result.data[0] || null
}

export async function GET() {
  const assignmentSelect = [
    'id',
    'elder_name',
    'manager_name',
    'manager_phone',
    'assignment_type',
    'title',
    'appointment_date',
    'appointment_time',
    'meeting_location',
    'meeting_code',
    'transport_mode',
    'vehicle_owned',
    'direct_transport_included',
    'transport_policy_acknowledged',
    'status',
    'care_passport_snapshot',
    'safety_notes',
    'guardian_questions',
    'required_documents',
    'ops_memo',
    'manager_memo',
    'started_at',
    'completed_at',
    'created_at',
    'updated_at'
  ].join(',')

  const checklistSelect = [
    'id',
    'assignment_id',
    'checklist_type',
    'title',
    'description',
    'status',
    'priority',
    'completed_at',
    'issue_note',
    'sort_order',
    'created_at',
    'updated_at'
  ].join(',')

  const eventSelect = [
    'id',
    'assignment_id',
    'event_type',
    'title',
    'description',
    'status_after',
    'actor_role',
    'severity',
    'created_at'
  ].join(',')

  const reportSelect = [
    'id',
    'assignment_id',
    'visit_summary',
    'doctor_guidance',
    'medication_summary',
    'document_summary',
    'meal_condition_summary',
    'parent_condition',
    'family_next_actions',
    'reassurance_state',
    'status',
    'submitted_at',
    'reviewed_at',
    'sent_at',
    'created_at',
    'updated_at'
  ].join(',')

  const [assignments, checklist, events, reports] = await Promise.all([
    rest('manager_field_assignments?select=' + encodeURIComponent(assignmentSelect) + '&order=created_at.desc&limit=50'),
    rest('manager_field_checklist_items?select=' + encodeURIComponent(checklistSelect) + '&order=sort_order.asc&limit=500'),
    rest('manager_field_progress_events?select=' + encodeURIComponent(eventSelect) + '&order=created_at.desc&limit=200'),
    rest('manager_field_report_drafts?select=' + encodeURIComponent(reportSelect) + '&order=created_at.desc&limit=100')
  ])

  if (!assignments.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '매니저 현장 배정을 불러오지 못했습니다. STEP21 SQL이 실행됐는지 확인해주세요.',
        detail: assignments.error
      },
      { status: 500 }
    )
  }

  if (!checklist.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '매니저 체크리스트를 불러오지 못했습니다. STEP21 SQL이 실행됐는지 확인해주세요.',
        detail: checklist.error
      },
      { status: 500 }
    )
  }

  const managerProfiles = await rest(
    'care_manager_profiles?select=' +
      encodeURIComponent('id,manager_name,manager_phone,profile_status,trust_level,identity_verified,available_regions,specialties,service_scopes,vehicle_owned,direct_transport_included,trust_card_summary,public_notes,rating_safety,rating_kindness,rating_accuracy,rating_punctuality,review_summary,created_at') +
      '&profile_status=eq.active&identity_verified=eq.true&direct_transport_included=eq.false&order=created_at.desc&limit=200'
  )

  return NextResponse.json({
    ok: true,
    assignments: Array.isArray(assignments.data) ? assignments.data : [],
    checklist: Array.isArray(checklist.data) ? checklist.data : [],
    events: events.ok && Array.isArray(events.data) ? events.data : [],
    reports: reports.ok && Array.isArray(reports.data) ? reports.data : [],
    managerProfiles: managerProfiles.ok && Array.isArray(managerProfiles.data) ? managerProfiles.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action) || 'create_assignment'

  if (action === 'create_assignment') {
    const elderName = text(body.elderName) || '부모님'
    const managerProfileId = text(body.managerProfileId)
    const managerName = text(body.managerName) || '동행매니저'
    const managerPhone = text(body.managerPhone)
    const title = text(body.title) || `${elderName} 현장 케어`
    const assignmentTypeValue = text(body.assignmentType) || 'hospital_visit'
    const transportModeValue = text(body.transportMode) || 'hospital_meet'

    if (!allowedAssignmentTypes.has(assignmentTypeValue)) {
      return NextResponse.json({ ok: false, message: 'assignmentType이 올바르지 않습니다.' }, { status: 400 })
    }

    if (!allowedTransportModes.has(transportModeValue)) {
      return NextResponse.json({ ok: false, message: 'transportMode가 올바르지 않습니다.' }, { status: 400 })
    }

    if (!managerProfileId) {
      return NextResponse.json(
        {
          ok: false,
          message: '검증된 매니저 프로필을 선택해야 배정할 수 있습니다. 먼저 /ops/manager-verification 에서 본인확인을 완료하세요.'
        },
        { status: 400 }
      )
    }

    const managerProfile = await fetchVerifiedManagerProfile(managerProfileId)

    if (!managerProfile || managerProfile.profile_status !== 'active' || !managerProfile.identity_verified || managerProfile.direct_transport_included) {
      return NextResponse.json(
        {
          ok: false,
          message: '본인확인 완료된 활동 매니저만 배정할 수 있습니다.'
        },
        { status: 400 }
      )
    }

    const assignmentType = assignmentTypeValue as ManagerAssignmentType
    const transportMode = transportModeValue as TransportMode
    const passport = await fetchLatestPassport()

    const safetyNotes = [
      ...buildManagerSafetyNotes(passport),
      '차량 보유 여부는 참고 정보입니다.',
      '매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.'
    ]

    const guardianQuestions = arrayOfText(body.guardianQuestions)
    const requiredDocuments = arrayOfText(body.requiredDocuments)

    const assignmentInsert = await rest('manager_field_assignments', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          elder_name: elderName,
          manager_profile_id: managerProfile.id,
          manager_name: managerProfile.manager_name,
          manager_phone: managerProfile.manager_phone || null,
          assignment_type: assignmentType,
          title,
          appointment_date: text(body.appointmentDate) || null,
          appointment_time: text(body.appointmentTime) || null,
          meeting_location: text(body.meetingLocation) || null,
          meeting_code: text(body.meetingCode) || '2580',
          transport_mode: transportMode,
          vehicle_owned: Boolean(managerProfile.vehicle_owned),
          direct_transport_included: false,
          transport_policy_acknowledged: true,
          status: 'assigned',
          care_passport_snapshot: passport || {},
          safety_notes: Array.from(new Set(safetyNotes)).slice(0, 14),
          guardian_questions: guardianQuestions,
          required_documents: requiredDocuments,
          ops_memo: text(body.opsMemo) || null,
          manager_trust_snapshot: {
            manager_profile_id: managerProfile.id,
            trust_level: managerProfile.trust_level,
            identity_verified: managerProfile.identity_verified,
            trust_card_summary: managerProfile.trust_card_summary,
            rating_safety: managerProfile.rating_safety,
            rating_kindness: managerProfile.rating_kindness,
            rating_accuracy: managerProfile.rating_accuracy,
            rating_punctuality: managerProfile.rating_punctuality
          },
          matching_gate_checked: true,
          created_by_role: 'ops'
        }
      ])
    })

    if (!assignmentInsert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '매니저 배정 저장 중 오류가 발생했습니다.',
          detail: assignmentInsert.error
        },
        { status: 500 }
      )
    }

    const assignment = Array.isArray(assignmentInsert.data) ? assignmentInsert.data[0] : null

    if (!assignment?.id) {
      return NextResponse.json({ ok: false, message: '저장된 배정 정보를 찾지 못했습니다.' }, { status: 500 })
    }

    const checklistRows = buildDefaultManagerChecklist({
      assignmentType,
      transportMode,
      passport,
      guardianQuestions,
      requiredDocuments
    }).map((item) => ({
      assignment_id: assignment.id,
      ...item
    }))

    const checklistInsert = await rest('manager_field_checklist_items', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(checklistRows)
    })

    if (!checklistInsert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '현장 체크리스트 생성 중 오류가 발생했습니다.',
          detail: checklistInsert.error
        },
        { status: 500 }
      )
    }

    await rest('manager_field_progress_events', {
      method: 'POST',
      body: JSON.stringify([
        {
          assignment_id: assignment.id,
          event_type: 'assignment_created',
          title: '매니저 현장 배정 생성',
          description: `${managerName} 매니저에게 ${title} 배정이 생성되었습니다.`,
          status_after: 'assigned',
          actor_role: 'ops',
          severity: 'info'
        }
      ])
    })

    return NextResponse.json({
      ok: true,
      assignment,
      checklist: Array.isArray(checklistInsert.data) ? checklistInsert.data : []
    })
  }

  if (action === 'create_report_draft') {
    const assignmentId = text(body.assignmentId)

    if (!assignmentId) {
      return NextResponse.json({ ok: false, message: 'assignmentId가 필요합니다.' }, { status: 400 })
    }

    const nextActions = arrayOfText(body.familyNextActions)

    const insert = await rest('manager_field_report_drafts', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          assignment_id: assignmentId,
          visit_summary: text(body.visitSummary) || null,
          doctor_guidance: text(body.doctorGuidance) || null,
          medication_summary: text(body.medicationSummary) || null,
          document_summary: text(body.documentSummary) || null,
          meal_condition_summary: text(body.mealConditionSummary) || null,
          parent_condition: text(body.parentCondition) || null,
          family_next_actions: nextActions,
          reassurance_state: text(body.reassuranceState) || '확인 필요',
          status: 'submitted',
          submitted_at: new Date().toISOString()
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '리포트 초안 저장 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    await rest('manager_field_progress_events', {
      method: 'POST',
      body: JSON.stringify([
        {
          assignment_id: assignmentId,
          event_type: 'report_draft_submitted',
          title: '보호자 리포트 초안 제출',
          description: text(body.visitSummary) || '매니저가 리포트 초안을 제출했습니다.',
          status_after: 'reporting',
          actor_role: 'manager',
          severity: 'info'
        }
      ])
    })

    return NextResponse.json({
      ok: true,
      report: Array.isArray(insert.data) ? insert.data[0] : insert.data
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const kind = text(body.kind)

  if (kind === 'assignment') {
    const id = text(body.id)
    const statusValue = text(body.status)

    if (!id) {
      return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
    }

    if (!allowedAssignmentStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'status가 올바르지 않습니다.' }, { status: 400 })
    }

    const status = statusValue as ManagerAssignmentStatus

    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'accepted' || status === 'en_route') patch.started_at = new Date().toISOString()
    if (status === 'completed') patch.completed_at = new Date().toISOString()
    if (bool(body.transportPolicyAcknowledged)) patch.transport_policy_acknowledged = true
    if (text(body.managerMemo)) patch.manager_memo = text(body.managerMemo)

    const result = await rest('manager_field_assignments?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '매니저 배정 상태 변경 실패',
          detail: result.error
        },
        { status: 500 }
      )
    }

    await rest('manager_field_progress_events', {
      method: 'POST',
      body: JSON.stringify([
        {
          assignment_id: id,
          event_type: 'status_updated',
          title: `상태 업데이트: ${status}`,
          description: text(body.managerMemo) || null,
          status_after: status,
          actor_role: 'manager',
          severity: status === 'issue' ? 'urgent' : 'info'
        }
      ])
    })

    return NextResponse.json({
      ok: true,
      item: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  if (kind === 'checklist') {
    const id = text(body.id)
    const assignmentId = text(body.assignmentId)
    const statusValue = text(body.status)

    if (!id) {
      return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
    }

    if (!allowedChecklistStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'checklist status가 올바르지 않습니다.' }, { status: 400 })
    }

    const status = statusValue as ChecklistStatus

    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'done') patch.completed_at = new Date().toISOString()
    if (status === 'issue' && text(body.issueNote)) patch.issue_note = text(body.issueNote)

    const result = await rest('manager_field_checklist_items?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '체크리스트 상태 변경 실패',
          detail: result.error
        },
        { status: 500 }
      )
    }

    if (assignmentId) {
      await rest('manager_field_progress_events', {
        method: 'POST',
        body: JSON.stringify([
          {
            assignment_id: assignmentId,
            event_type: 'checklist_updated',
            title: `체크리스트 ${status}`,
            description: text(body.issueNote) || null,
            status_after: null,
            actor_role: 'manager',
            severity: status === 'issue' ? 'attention' : 'info'
          }
        ])
      })
    }

    return NextResponse.json({
      ok: true,
      item: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  if (kind === 'report') {
    const id = text(body.id)
    const status = text(body.status)

    if (!id) {
      return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
    }

    const allowed = new Set(['draft', 'submitted', 'ops_reviewed', 'sent_to_family', 'archived'])

    if (!allowed.has(status)) {
      return NextResponse.json({ ok: false, message: 'report status가 올바르지 않습니다.' }, { status: 400 })
    }

    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'ops_reviewed') patch.reviewed_at = new Date().toISOString()
    if (status === 'sent_to_family') patch.sent_at = new Date().toISOString()

    const result = await rest('manager_field_report_drafts?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '리포트 상태 변경 실패',
          detail: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      item: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  return NextResponse.json({ ok: false, message: 'kind가 올바르지 않습니다.' }, { status: 400 })
}
