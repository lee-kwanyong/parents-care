import { NextRequest, NextResponse } from 'next/server'
import {
  buildTodayReassuranceSummary,
  type TodayCareSource,
  type TodaySourceSeverity,
  type TodaySourceType
} from '@/lib/today-reassurance-engine'

export const dynamic = 'force-dynamic'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
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

async function safeRows(table: string, select: string, limit = 20) {
  const result = await rest(
    table + '?select=' + encodeURIComponent(select) + '&order=created_at.desc&limit=' + limit
  )

  if (!result.ok || !Array.isArray(result.data)) return []
  return result.data as any[]
}

function todaySource(input: {
  row: any
  sourceType: TodaySourceType
  label: string
  statusLabel: string
  severity: TodaySourceSeverity
  url: string
  memo?: string | null
}): TodayCareSource {
  return {
    id: String(input.row?.id || crypto.randomUUID()),
    sourceType: input.sourceType,
    label: input.label,
    statusLabel: input.statusLabel,
    severity: input.severity,
    url: input.url,
    createdAt: input.row?.created_at || input.row?.updated_at || input.row?.occurred_at || null,
    memo: input.memo || null
  }
}

function severityFromReassurance(value: unknown): TodaySourceSeverity {
  if (value === '긴급') return 'urgent'
  if (value === '확인 필요') return 'attention'
  return 'info'
}

function severityFromPriorityStatus(priority: unknown, status: unknown): TodaySourceSeverity {
  const p = String(priority || '').toLowerCase()
  const s = String(status || '').toLowerCase()

  if (
    p === 'urgent' ||
    s.includes('urgent') ||
    s.includes('긴급') ||
    s.includes('issue') ||
    s.includes('needs_help') ||
    s.includes('failed')
  ) {
    return 'urgent'
  }

  if (
    p === 'high' ||
    s.includes('pending') ||
    s.includes('requested') ||
    s.includes('received') ||
    s.includes('needs_more_info') ||
    s.includes('needs_attention') ||
    s.includes('not_done') ||
    s.includes('not_eaten') ||
    s.includes('reviewing') ||
    s.includes('draft') ||
    s.includes('no_answer') ||
    s.includes('retry') ||
    s.includes('payment_pending') ||
    s.includes('approved')
  ) {
    return 'attention'
  }

  return 'info'
}

function dateDiffDays(ymd?: string | null) {
  if (!ymd) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(ymd + 'T00:00:00')
  if (!Number.isFinite(target.getTime())) return null

  return Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

async function collectTodaySources() {
  const sources: TodayCareSource[] = []

  const careCases = await safeRows(
    'care_cases',
    'id,elder_name,case_title,status,reassurance_state,priority,summary_text,created_at,updated_at',
    20
  )

  for (const row of careCases) {
    sources.push(
      todaySource({
        row,
        sourceType: 'care_case',
        label: row.case_title || '부모님 통합 케이스',
        statusLabel: row.reassurance_state || row.status || '상태 미확인',
        severity: severityFromReassurance(row.reassurance_state),
        url: '/child/cases',
        memo: row.summary_text
      })
    )
  }

  const careIntakes = await safeRows(
    'care_intake_entries',
    'id,resolved_worry,recommended_pack_code,ops_status,raw_text,contact_name,contact_phone,created_at',
    10
  )

  for (const row of careIntakes) {
    sources.push(
      todaySource({
        row,
        sourceType: 'care_intake',
        label: row.raw_text || row.recommended_pack_code || '부모님 안심케어 접수',
        statusLabel: row.ops_status || 'new',
        severity: severityFromPriorityStatus('normal', row.ops_status || 'new'),
        url: '/admin/ops/worry-center'
      })
    )
  }

  const assisted = await safeRows(
    'care_assisted_intake_requests',
    'id,summary_title,status,priority,recommended_pack_code,raw_text,created_at',
    10
  )

  for (const row of assisted) {
    sources.push(
      todaySource({
        row,
        sourceType: 'assisted_intake',
        label: row.summary_title || '사진·카톡 간편 접수',
        statusLabel: row.status || 'received',
        severity: severityFromPriorityStatus(row.priority, row.status),
        url: '/child/intake-inbox',
        memo: row.raw_text
      })
    )
  }

  const passports = await safeRows(
    'parent_care_passports',
    'id,elder_name,allergy_status,has_medications,fall_risk_level,care_summary,created_at,updated_at',
    1
  )

  for (const row of passports) {
    sources.push(
      todaySource({
        row,
        sourceType: 'care_passport',
        label: `${row.elder_name || '부모님'} 케어패스포트`,
        statusLabel: row.care_summary?.reassuranceState || 'profile_ready',
        severity: row.care_summary?.reassuranceState === '확인 필요' ? 'attention' : 'info',
        url: '/care-passport',
        memo: row.care_summary?.oneMinuteSummary || null
      })
    )
  }

  const dailyCare = await safeRows(
    'daily_care_checkins',
    'id,elder_name,check_type,care_label,status,memo,occurred_at,created_at',
    30
  )

  for (const row of dailyCare) {
    const severity =
      row.status === 'needs_help'
        ? 'urgent'
        : row.status === 'not_done'
          ? 'attention'
          : 'info'

    sources.push(
      todaySource({
        row,
        sourceType: 'daily_care',
        label: `${row.care_label || '오늘 확인'} · ${row.elder_name || '부모님'}`,
        statusLabel: row.status || 'unknown',
        severity,
        url: '/child/daily-care',
        memo: row.memo
      })
    )
  }

  const familyTasks = await safeRows(
    'family_action_items',
    'id,title,category,priority,status,assigned_to_name,created_at,updated_at',
    30
  )

  for (const row of familyTasks) {
    const closed = row.status === 'done' || row.status === 'cancelled'

    sources.push(
      todaySource({
        row,
        sourceType: 'family_task',
        label: row.title || '가족 할 일',
        statusLabel: row.status || 'pending',
        severity: closed ? 'info' : severityFromPriorityStatus(row.priority, row.status),
        url: '/child/tasks'
      })
    )
  }

  const costs = await safeRows(
    'care_cost_approval_requests',
    'id,elder_name,title,status,priority,total_amount_krw,guardian_message,created_at,updated_at',
    20
  )

  for (const row of costs) {
    sources.push(
      todaySource({
        row,
        sourceType: 'cost_approval',
        label: row.title || '추가비용 승인',
        statusLabel: row.status || 'pending_guardian',
        severity: severityFromPriorityStatus(row.priority, row.status),
        url: '/child/costs',
        memo: row.guardian_message
      })
    )
  }

  const documents = await safeRows(
    'care_document_requests',
    'id,elder_name,document_label,status,priority,hospital_name,created_at,updated_at',
    20
  )

  for (const row of documents) {
    const severity =
      row.status === 'failed'
        ? 'urgent'
        : ['requested', 'preparing', 'ready', 'collected'].includes(row.status)
          ? 'attention'
          : 'info'

    sources.push(
      todaySource({
        row,
        sourceType: 'documents',
        label: `${row.document_label || '서류'} · ${row.elder_name || '부모님'}`,
        statusLabel: row.status || 'requested',
        severity,
        url: '/child/documents'
      })
    )
  }

  const mealEvents = await safeRows(
    'care_meal_service_events',
    'id,meal_support_request_id,event_date,meal_time,meal_status,delivery_status,memo,created_at,updated_at',
    30
  )

  for (const row of mealEvents) {
    const severity =
      row.meal_status === 'needs_help'
        ? 'urgent'
        : row.meal_status === 'not_eaten' || row.meal_status === 'failed' || row.delivery_status === 'failed'
          ? 'attention'
          : 'info'

    sources.push(
      todaySource({
        row,
        sourceType: 'meal',
        label: `${row.event_date || '식사'} ${row.meal_time || ''}`,
        statusLabel: `${row.meal_status || 'planned'} / ${row.delivery_status || 'none'}`,
        severity,
        url: '/child/meals',
        memo: row.memo
      })
    )
  }

  const dischargeChecks = await safeRows(
    'post_discharge_daily_checks',
    'id,care_pack_id,day_index,check_date,title,status,medication_status,meal_status,condition_status,family_note,created_at,updated_at',
    30
  )

  for (const row of dischargeChecks) {
    const diff = dateDiffDays(row.check_date)
    const isOverdue = row.status === 'planned' && diff !== null && diff < 0
    const severity =
      row.status === 'needs_attention'
        ? 'attention'
        : row.status === 'overdue' || isOverdue
          ? 'attention'
          : 'info'

    sources.push(
      todaySource({
        row,
        sourceType: 'discharge',
        label: row.title || `${row.day_index}일차 퇴원 후 확인`,
        statusLabel: isOverdue ? 'overdue' : row.status || 'planned',
        severity,
        url: '/child/discharge',
        memo: row.family_note
      })
    )
  }

  const routines = await safeRows(
    'care_routine_schedules',
    'id,elder_name,title,status,next_due_date,hospital_name,department,created_at,updated_at',
    20
  )

  for (const row of routines) {
    const diff = dateDiffDays(row.next_due_date)
    const severity =
      row.status !== 'active'
        ? 'info'
        : diff !== null && diff < 0
          ? 'urgent'
          : diff !== null && diff <= 14
            ? 'attention'
            : 'info'

    sources.push(
      todaySource({
        row,
        sourceType: 'routine',
        label: row.title || '정기진료',
        statusLabel: row.next_due_date ? `다음 ${row.next_due_date}` : row.status || 'active',
        severity,
        url: '/child/routines'
      })
    )
  }

  const nextVisits = await safeRows(
    'care_next_visit_drafts',
    'id,elder_name,title,status,suggested_date,priority,hospital_name,department,created_at,updated_at',
    20
  )

  for (const row of nextVisits) {
    const done = ['booked', 'done', 'cancelled'].includes(row.status)

    sources.push(
      todaySource({
        row,
        sourceType: 'next_visit',
        label: row.title || '다음 예약 후보',
        statusLabel: row.status || 'draft',
        severity: done ? 'info' : severityFromPriorityStatus(row.priority, row.status),
        url: '/child/routines'
      })
    )
  }

  const socialCases = await safeRows(
    'parent_care_social_support_cases',
    'id,elder_name,status,priority,cost_burden,meal_risk,no_family_nearby,memo,created_at,updated_at',
    20
  )

  for (const row of socialCases) {
    sources.push(
      todaySource({
        row,
        sourceType: 'social_support',
        label: `${row.elder_name || '부모님'} 사회공헌 지원`,
        statusLabel: row.status || 'requested',
        severity: severityFromPriorityStatus(row.priority, row.status),
        url: '/child/social-care',
        memo: row.memo
      })
    )
  }

  const contactTasks = await safeRows(
    'care_contact_tasks',
    'id,elder_name,title,contact_type,status,priority,created_at,updated_at',
    20
  )

  for (const row of contactTasks) {
    sources.push(
      todaySource({
        row,
        sourceType: 'communication',
        label: row.title || '연락 작업',
        statusLabel: row.status || 'queued',
        severity: severityFromPriorityStatus(row.priority, row.status),
        url: '/child/summaries'
      })
    )
  }

  const summaries = await safeRows(
    'care_30sec_summaries',
    'id,elder_name,summary_title,reassurance_state,status,summary_text,created_at,updated_at',
    20
  )

  for (const row of summaries) {
    sources.push(
      todaySource({
        row,
        sourceType: 'summary_30sec',
        label: row.summary_title || '30초 요약',
        statusLabel: row.reassurance_state || row.status || 'ready',
        severity: severityFromReassurance(row.reassurance_state),
        url: '/child/summaries',
        memo: row.summary_text
      })
    )
  }

  const manager = await safeRows(
    'manager_field_assignments',
    'id,elder_name,title,status,manager_name,appointment_date,appointment_time,meeting_code,created_at,updated_at',
    20
  )

  for (const row of manager) {
    const severity =
      row.status === 'issue'
        ? 'urgent'
        : ['assigned', 'accepted', 'en_route', 'met_parent', 'at_hospital', 'in_consultation', 'pharmacy', 'documents', 'meal_check', 'safe_return', 'reporting'].includes(row.status)
          ? 'attention'
          : 'info'

    sources.push(
      todaySource({
        row,
        sourceType: 'manager_field',
        label: row.title || '매니저 현장 배정',
        statusLabel: row.status || 'assigned',
        severity,
        url: '/child/cases'
      })
    )
  }

  return sources
}

export async function GET() {
  const sources = await collectTodaySources()
  const summary = buildTodayReassuranceSummary(sources)

  const snapshotResult = await rest(
    'care_today_reassurance_snapshots?select=' +
      encodeURIComponent('id,elder_name,snapshot_date,reassurance_state,summary_text,top_reasons,family_next_actions,important_notes,source_counts,source_count,urgent_count,attention_count,created_at') +
      '&order=created_at.desc&limit=10'
  )

  return NextResponse.json({
    ok: true,
    summary,
    sources,
    snapshots: snapshotResult.ok && Array.isArray(snapshotResult.data) ? snapshotResult.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const elderName = typeof body.elderName === 'string' && body.elderName.trim() ? body.elderName.trim() : '부모님'

  const sources = await collectTodaySources()
  const summary = buildTodayReassuranceSummary(sources)

  const insert = await rest('care_today_reassurance_snapshots', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: elderName,
        snapshot_date: new Date().toISOString().slice(0, 10),
        reassurance_state: summary.reassuranceState,
        summary_text: summary.summaryText,
        top_reasons: summary.topReasons,
        family_next_actions: summary.familyNextActions,
        important_notes: summary.importantNotes,
        source_counts: summary.sourceCounts,
        source_count: summary.sourceCount,
        urgent_count: summary.urgentCount,
        attention_count: summary.attentionCount,
        created_by_role: 'system'
      }
    ])
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '오늘의 안심판 스냅샷 저장 실패',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    snapshot: Array.isArray(insert.data) ? insert.data[0] : insert.data,
    summary,
    sources
  })
}
