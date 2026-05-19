import { NextRequest, NextResponse } from 'next/server'
import {
  buildCareCaseAggregate,
  buildTimelineDescriptionFromLink,
  buildTimelineTitleFromLink,
  timelineSeverityFromStatus,
  type CareCaseLinkCandidate,
  type CareCaseStatus,
  type CareCaseType
} from '@/lib/care-case-engine'

export const dynamic = 'force-dynamic'

const allowedCaseStatuses = new Set(['draft', 'active', 'waiting_family', 'in_progress', 'completed', 'cancelled', 'archived'])
const allowedCaseTypes = new Set(['parent_care', 'hospital_day', 'meal_care', 'medication', 'discharge', 'documents', 'routine', 'social_support', 'emergency', 'custom'])

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

function isUuid(value: string | null | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
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

async function safeRows(table: string, select: string, order = 'created_at.desc', limit = 3) {
  const result = await rest(
    `${table}?select=${encodeURIComponent(select)}&order=${encodeURIComponent(order)}&limit=${limit}`
  )

  if (!result.ok || !Array.isArray(result.data)) return []
  return result.data as any[]
}

function linkCandidate(input: {
  linkType: CareCaseLinkCandidate['link_type']
  row: any
  label: string
  status?: string | null
  url: string
}): CareCaseLinkCandidate {
  return {
    link_type: input.linkType,
    source_id: isUuid(String(input.row?.id || '')) ? String(input.row.id) : null,
    source_label: input.label,
    source_status: input.status || null,
    source_url: input.url,
    snapshot: input.row && typeof input.row === 'object' ? input.row : {}
  }
}

async function collectLatestCareLinks() {
  const candidates: CareCaseLinkCandidate[] = []

  const careIntakes = await safeRows(
    'care_intake_entries',
    'id,resolved_worry,recommended_pack_code,ops_status,raw_text,contact_name,contact_phone,created_at',
    'created_at.desc',
    2
  )

  for (const row of careIntakes) {
    candidates.push(
      linkCandidate({
        linkType: 'care_intake',
        row,
        label: row.raw_text || row.recommended_pack_code || '부모님 안심케어 접수',
        status: row.ops_status || 'new',
        url: '/ops/worry-center'
      })
    )
  }

  const assisted = await safeRows(
    'care_assisted_intake_requests',
    'id,summary_title,status,priority,recommended_pack_code,raw_text,created_at',
    'created_at.desc',
    2
  )

  for (const row of assisted) {
    candidates.push(
      linkCandidate({
        linkType: 'assisted_intake',
        row,
        label: row.summary_title || '사진·카톡 간편 접수',
        status: row.status,
        url: '/ops/intake-inbox'
      })
    )
  }

  const passports = await safeRows(
    'parent_care_passports',
    'id,elder_name,hearing_attention,mobility_attention,allergy_status,has_medications,fall_risk_level,care_summary,updated_at,created_at',
    'updated_at.desc',
    1
  )

  for (const row of passports) {
    candidates.push(
      linkCandidate({
        linkType: 'care_passport',
        row,
        label: `${row.elder_name || '부모님'} 케어패스포트`,
        status: row.care_summary?.reassuranceState || 'profile_ready',
        url: '/ops/care-passport'
      })
    )
  }

  const dailyCare = await safeRows(
    'daily_care_checkins',
    'id,elder_name,check_type,care_label,status,memo,occurred_at,created_at',
    'created_at.desc',
    3
  )

  for (const row of dailyCare) {
    candidates.push(
      linkCandidate({
        linkType: 'daily_care',
        row,
        label: `${row.care_label || '오늘 확인'} · ${row.elder_name || '부모님'}`,
        status: row.status,
        url: '/child/daily-care'
      })
    )
  }

  const tasks = await safeRows(
    'family_action_items',
    'id,title,category,priority,status,assigned_to_name,created_at',
    'created_at.desc',
    3
  )

  for (const row of tasks) {
    candidates.push(
      linkCandidate({
        linkType: 'family_task',
        row,
        label: row.title || '가족 할 일',
        status: row.status,
        url: '/child/tasks'
      })
    )
  }

  const documents = await safeRows(
    'care_document_requests',
    'id,elder_name,document_label,status,priority,hospital_name,created_at',
    'created_at.desc',
    2
  )

  for (const row of documents) {
    candidates.push(
      linkCandidate({
        linkType: 'documents',
        row,
        label: `${row.document_label || '서류'} · ${row.elder_name || '부모님'}`,
        status: row.status,
        url: '/ops/documents'
      })
    )
  }

  const routines = await safeRows(
    'care_routine_schedules',
    'id,elder_name,title,status,next_due_date,hospital_name,department,created_at',
    'created_at.desc',
    2
  )

  for (const row of routines) {
    candidates.push(
      linkCandidate({
        linkType: 'routine',
        row,
        label: row.title || '정기진료',
        status: row.status,
        url: '/ops/routines'
      })
    )
  }

  const nextVisits = await safeRows(
    'care_next_visit_drafts',
    'id,elder_name,title,status,suggested_date,priority,hospital_name,department,created_at',
    'created_at.desc',
    2
  )

  for (const row of nextVisits) {
    candidates.push(
      linkCandidate({
        linkType: 'next_visit',
        row,
        label: row.title || '다음 예약 후보',
        status: row.status,
        url: '/ops/routines'
      })
    )
  }

  const dischargePacks = await safeRows(
    'post_discharge_care_packs',
    'id,elder_name,status,discharge_date,next_visit_date,medication_risk,meal_risk,fall_risk,created_at',
    'created_at.desc',
    1
  )

  for (const row of dischargePacks) {
    candidates.push(
      linkCandidate({
        linkType: 'discharge',
        row,
        label: `${row.elder_name || '부모님'} 퇴원 후 7일 안심팩`,
        status: row.status,
        url: '/ops/discharge'
      })
    )
  }

  const meals = await safeRows(
    'care_meal_support_requests',
    'id,elder_name,support_type,diet_type,status,priority,social_care_requested,created_at',
    'created_at.desc',
    2
  )

  for (const row of meals) {
    candidates.push(
      linkCandidate({
        linkType: 'meal',
        row,
        label: `${row.elder_name || '부모님'} 안심밥상`,
        status: row.status,
        url: '/ops/meals'
      })
    )
  }

  const social = await safeRows(
    'parent_care_social_support_cases',
    'id,elder_name,status,priority,cost_burden,meal_risk,no_family_nearby,created_at',
    'created_at.desc',
    2
  )

  for (const row of social) {
    candidates.push(
      linkCandidate({
        linkType: 'social_support',
        row,
        label: `${row.elder_name || '부모님'} 사회공헌 지원`,
        status: row.status,
        url: '/ops/social-care'
      })
    )
  }

  const contactTasks = await safeRows(
    'care_contact_tasks',
    'id,elder_name,title,contact_type,status,priority,created_at',
    'created_at.desc',
    2
  )

  for (const row of contactTasks) {
    candidates.push(
      linkCandidate({
        linkType: 'communication_task',
        row,
        label: row.title || '연락 작업',
        status: row.status,
        url: '/ops/contact-center'
      })
    )
  }

  const summaries = await safeRows(
    'care_30sec_summaries',
    'id,elder_name,summary_title,reassurance_state,status,created_at',
    'created_at.desc',
    2
  )

  for (const row of summaries) {
    candidates.push(
      linkCandidate({
        linkType: 'summary_30sec',
        row,
        label: row.summary_title || '30초 요약',
        status: row.reassurance_state || row.status,
        url: '/child/summaries'
      })
    )
  }

  const manager = await safeRows(
    'manager_field_assignments',
    'id,elder_name,title,status,manager_name,appointment_date,appointment_time,meeting_code,created_at',
    'created_at.desc',
    2
  )

  for (const row of manager) {
    candidates.push(
      linkCandidate({
        linkType: 'manager_field',
        row,
        label: row.title || '매니저 현장 배정',
        status: row.status,
        url: '/ops/manager-field'
      })
    )
  }

  const costs = await safeRows(
    'care_cost_approval_requests',
    'id,elder_name,title,status,priority,total_amount_krw,created_at',
    'created_at.desc',
    2
  )

  for (const row of costs) {
    candidates.push(
      linkCandidate({
        linkType: 'cost_approval',
        row,
        label: row.title || '추가비용 승인',
        status: row.status,
        url: '/ops/costs'
      })
    )
  }

  return candidates
}

export async function GET() {
  const caseSelect = [
    'id',
    'elder_name',
    'guardian_name',
    'guardian_phone',
    'case_title',
    'case_type',
    'status',
    'reassurance_state',
    'priority',
    'summary_text',
    'family_next_actions',
    'important_notes',
    'completed_at',
    'created_at',
    'updated_at'
  ].join(',')

  const linkSelect = [
    'id',
    'care_case_id',
    'link_type',
    'source_id',
    'source_label',
    'source_status',
    'source_url',
    'snapshot',
    'created_at'
  ].join(',')

  const timelineSelect = [
    'id',
    'care_case_id',
    'event_type',
    'title',
    'description',
    'event_status',
    'actor_role',
    'severity',
    'occurred_at',
    'created_at'
  ].join(',')

  const [cases, links, timeline] = await Promise.all([
    rest('care_cases?select=' + encodeURIComponent(caseSelect) + '&order=created_at.desc&limit=100'),
    rest('care_case_links?select=' + encodeURIComponent(linkSelect) + '&order=created_at.desc&limit=1000'),
    rest('care_case_timeline_events?select=' + encodeURIComponent(timelineSelect) + '&order=occurred_at.desc&limit=1000')
  ])

  if (!cases.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '통합 케어 케이스 목록을 불러오지 못했습니다. STEP24 SQL이 실행됐는지 확인해주세요.',
        detail: cases.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    cases: Array.isArray(cases.data) ? cases.data : [],
    links: links.ok && Array.isArray(links.data) ? links.data : [],
    timeline: timeline.ok && Array.isArray(timeline.data) ? timeline.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action) || 'create_from_latest'

  const elderName = text(body.elderName) || '부모님'
  const guardianName = text(body.guardianName)
  const guardianPhone = text(body.guardianPhone)
  const caseTitle = text(body.caseTitle) || `${elderName} 통합 케어 케이스`
  const caseTypeValue = text(body.caseType) || 'parent_care'

  const caseType: CareCaseType = allowedCaseTypes.has(caseTypeValue) ? (caseTypeValue as CareCaseType) : 'parent_care'

  let linkCandidates: CareCaseLinkCandidate[] = []

  if (action === 'create_from_latest') {
    linkCandidates = await collectLatestCareLinks()
  } else if (action === 'create_empty') {
    linkCandidates = []
  } else {
    return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
  }

  const aggregate = buildCareCaseAggregate(linkCandidates)

  const caseInsert = await rest('care_cases', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: elderName,
        guardian_name: guardianName || null,
        guardian_phone: guardianPhone || null,
        case_title: caseTitle,
        case_type: caseType,
        status: 'active',
        reassurance_state: aggregate.reassuranceState,
        priority: aggregate.priority,
        summary_text: aggregate.summaryText,
        family_next_actions: aggregate.familyNextActions,
        important_notes: aggregate.importantNotes,
        created_by_role: 'ops'
      }
    ])
  })

  if (!caseInsert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '통합 케어 케이스 생성 중 오류가 발생했습니다.',
        detail: caseInsert.error
      },
      { status: 500 }
    )
  }

  const careCase = Array.isArray(caseInsert.data) ? caseInsert.data[0] : null

  if (!careCase?.id) {
    return NextResponse.json({ ok: false, message: '생성된 케이스 정보를 찾지 못했습니다.' }, { status: 500 })
  }

  if (linkCandidates.length > 0) {
    const linkRows = linkCandidates.map((link) => ({
      care_case_id: careCase.id,
      link_type: link.link_type,
      source_id: link.source_id,
      source_label: link.source_label,
      source_status: link.source_status,
      source_url: link.source_url,
      snapshot: link.snapshot
    }))

    await rest('care_case_links', {
      method: 'POST',
      body: JSON.stringify(linkRows)
    })

    const timelineRows = linkCandidates.map((link) => ({
      care_case_id: careCase.id,
      event_type: 'linked',
      title: buildTimelineTitleFromLink(link),
      description: buildTimelineDescriptionFromLink(link),
      event_status: link.source_status,
      actor_role: 'system',
      severity: timelineSeverityFromStatus(link.source_status)
    }))

    await rest('care_case_timeline_events', {
      method: 'POST',
      body: JSON.stringify(timelineRows)
    })
  } else {
    await rest('care_case_timeline_events', {
      method: 'POST',
      body: JSON.stringify([
        {
          care_case_id: careCase.id,
          event_type: 'case_created',
          title: '통합 케어 케이스 생성',
          description: '아직 연결된 기능이 없습니다. 운영실에서 필요한 항목을 연결하세요.',
          event_status: 'active',
          actor_role: 'ops',
          severity: 'attention'
        }
      ])
    })
  }

  return NextResponse.json({
    ok: true,
    case: careCase,
    linked: linkCandidates.length
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const id = text(body.id)
  const statusValue = text(body.status)
  const memo = text(body.memo)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (!allowedCaseStatuses.has(statusValue)) {
    return NextResponse.json({ ok: false, message: 'status가 올바르지 않습니다.' }, { status: 400 })
  }

  const status = statusValue as CareCaseStatus

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'completed') {
    patch.completed_at = new Date().toISOString()
    patch.reassurance_state = '안심'
  }

  const result = await rest('care_cases?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '통합 케어 케이스 상태 변경 실패',
        detail: result.error
      },
      { status: 500 }
    )
  }

  await rest('care_case_timeline_events', {
    method: 'POST',
    body: JSON.stringify([
      {
        care_case_id: id,
        event_type: 'case_status_updated',
        title: `케이스 상태 변경: ${status}`,
        description: memo || null,
        event_status: status,
        actor_role: 'ops',
        severity: status === 'completed' ? 'info' : 'attention'
      }
    ])
  })

  return NextResponse.json({
    ok: true,
    item: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
