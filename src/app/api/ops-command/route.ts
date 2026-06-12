import { NextRequest, NextResponse } from 'next/server'
import {
  buildOpsCommandSummary,
  inferOpsSignalCategory,
  type OpsCommandSignal,
  type OpsSignalSourceType
} from '@/lib/ops-command-engine'

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

function signal(input: {
  row: any
  sourceType: OpsSignalSourceType
  title: string
  statusLabel: string
  priority?: unknown
  reassuranceState?: unknown
  url: string
  description?: string | null
}): OpsCommandSignal {
  return {
    id: String(input.row?.id || crypto.randomUUID()),
    sourceType: input.sourceType,
    title: input.title,
    description: input.description || null,
    statusLabel: input.statusLabel,
    category: inferOpsSignalCategory({
      priority: input.priority,
      status: input.statusLabel,
      reassuranceState: input.reassuranceState
    }),
    priority:
      input.priority === 'urgent' || input.priority === 'high' || input.priority === 'low'
        ? input.priority
        : 'normal',
    url: input.url,
    createdAt: input.row?.created_at || input.row?.updated_at || input.row?.occurred_at || null
  }
}

async function collectOpsSignals() {
  const signals: OpsCommandSignal[] = []

  const careCases = await safeRows(
    'care_cases',
    'id,case_title,case_type,status,reassurance_state,priority,summary_text,created_at,updated_at',
    30
  )

  for (const row of careCases) {
    signals.push(
      signal({
        row,
        sourceType: 'care_case',
        title: row.case_title || '통합 케어 케이스',
        statusLabel: row.reassurance_state || row.status || '확인 필요',
        reassuranceState: row.reassurance_state,
        priority: row.priority,
        url: '/admin/ops/cases',
        description: row.summary_text
      })
    )
  }

  const careIntakes = await safeRows(
    'care_intake_entries',
    'id,resolved_worry,recommended_pack_code,ops_status,raw_text,contact_name,contact_phone,created_at',
    30
  )

  for (const row of careIntakes) {
    signals.push(
      signal({
        row,
        sourceType: 'care_intake',
        title: row.raw_text || row.recommended_pack_code || '부모님 안심케어 접수',
        statusLabel: row.ops_status || 'new',
        url: '/admin/ops/worry-center'
      })
    )
  }

  const assisted = await safeRows(
    'care_assisted_intake_requests',
    'id,summary_title,status,priority,recommended_pack_code,raw_text,created_at',
    30
  )

  for (const row of assisted) {
    signals.push(
      signal({
        row,
        sourceType: 'assisted_intake',
        title: row.summary_title || '사진·카톡 간편 접수',
        statusLabel: row.status || 'received',
        priority: row.priority,
        url: '/admin/ops/intake-inbox',
        description: row.raw_text
      })
    )
  }

  const dailyCare = await safeRows(
    'daily_care_checkins',
    'id,elder_name,check_type,care_label,status,memo,occurred_at,created_at',
    30
  )

  for (const row of dailyCare) {
    signals.push(
      signal({
        row,
        sourceType: 'daily_care',
        title: `${row.care_label || '오늘 확인'} · ${row.elder_name || '부모님'}`,
        statusLabel: row.status || 'unknown',
        priority: row.status === 'needs_help' ? 'urgent' : row.status === 'not_done' ? 'high' : 'normal',
        url: '/admin/ops/daily-care',
        description: row.memo
      })
    )
  }

  const familyTasks = await safeRows(
    'family_action_items',
    'id,title,category,priority,status,assigned_to_name,created_at,updated_at',
    40
  )

  for (const row of familyTasks) {
    signals.push(
      signal({
        row,
        sourceType: 'family_task',
        title: row.title || '가족 할 일',
        statusLabel: row.status || 'pending',
        priority: row.priority,
        url: '/admin/ops/tasks',
        description: row.assigned_to_name ? `담당: ${row.assigned_to_name}` : null
      })
    )
  }

  const costs = await safeRows(
    'care_cost_approval_requests',
    'id,elder_name,title,status,priority,total_amount_krw,guardian_message,created_at,updated_at',
    30
  )

  for (const row of costs) {
    signals.push(
      signal({
        row,
        sourceType: 'cost_approval',
        title: row.title || '추가비용 승인',
        statusLabel: row.status || 'pending_guardian',
        priority: row.priority,
        url: '/admin/ops/costs',
        description: row.guardian_message
      })
    )
  }

  const manager = await safeRows(
    'manager_field_assignments',
    'id,elder_name,title,status,manager_name,appointment_date,appointment_time,meeting_code,created_at,updated_at',
    30
  )

  for (const row of manager) {
    signals.push(
      signal({
        row,
        sourceType: 'manager_field',
        title: row.title || '매니저 현장 배정',
        statusLabel: row.status || 'assigned',
        priority: row.status === 'issue' ? 'urgent' : 'normal',
        url: '/admin/ops/manager-field',
        description: row.manager_name ? `매니저: ${row.manager_name}` : null
      })
    )
  }

  const documents = await safeRows(
    'care_document_requests',
    'id,elder_name,document_label,status,priority,hospital_name,created_at,updated_at',
    30
  )

  for (const row of documents) {
    signals.push(
      signal({
        row,
        sourceType: 'documents',
        title: `${row.document_label || '서류'} · ${row.elder_name || '부모님'}`,
        statusLabel: row.status || 'requested',
        priority: row.priority,
        url: '/admin/ops/documents',
        description: row.hospital_name
      })
    )
  }

  const mealEvents = await safeRows(
    'care_meal_service_events',
    'id,meal_support_request_id,event_date,meal_time,meal_status,delivery_status,memo,created_at,updated_at',
    40
  )

  for (const row of mealEvents) {
    const status = `${row.meal_status || 'planned'} / ${row.delivery_status || 'none'}`
    const priority =
      row.meal_status === 'needs_help'
        ? 'urgent'
        : row.meal_status === 'not_eaten' || row.meal_status === 'failed' || row.delivery_status === 'failed'
          ? 'high'
          : 'normal'

    signals.push(
      signal({
        row,
        sourceType: 'meal',
        title: `${row.event_date || '식사'} ${row.meal_time || ''}`,
        statusLabel: status,
        priority,
        url: '/admin/ops/meals',
        description: row.memo
      })
    )
  }

  const dischargeChecks = await safeRows(
    'post_discharge_daily_checks',
    'id,care_pack_id,day_index,check_date,title,status,medication_status,meal_status,condition_status,family_note,created_at,updated_at',
    40
  )

  for (const row of dischargeChecks) {
    signals.push(
      signal({
        row,
        sourceType: 'discharge',
        title: row.title || `${row.day_index}일차 퇴원 후 확인`,
        statusLabel: row.status || 'planned',
        priority: row.status === 'needs_attention' || row.status === 'overdue' ? 'high' : 'normal',
        url: '/admin/ops/discharge',
        description: row.family_note
      })
    )
  }

  const routines = await safeRows(
    'care_routine_schedules',
    'id,elder_name,title,status,next_due_date,hospital_name,department,created_at,updated_at',
    25
  )

  for (const row of routines) {
    signals.push(
      signal({
        row,
        sourceType: 'routine',
        title: row.title || '정기진료',
        statusLabel: row.next_due_date ? `next:${row.next_due_date}` : row.status || 'active',
        priority: 'normal',
        url: '/admin/ops/routines'
      })
    )
  }

  const nextVisits = await safeRows(
    'care_next_visit_drafts',
    'id,elder_name,title,status,suggested_date,priority,hospital_name,department,created_at,updated_at',
    25
  )

  for (const row of nextVisits) {
    signals.push(
      signal({
        row,
        sourceType: 'next_visit',
        title: row.title || '다음 예약 후보',
        statusLabel: row.status || 'draft',
        priority: row.priority,
        url: '/admin/ops/routines'
      })
    )
  }

  const social = await safeRows(
    'parent_care_social_support_cases',
    'id,elder_name,status,priority,cost_burden,meal_risk,no_family_nearby,memo,created_at,updated_at',
    30
  )

  for (const row of social) {
    signals.push(
      signal({
        row,
        sourceType: 'social_support',
        title: `${row.elder_name || '부모님'} 사회공헌 지원`,
        statusLabel: row.status || 'requested',
        priority: row.priority,
        url: '/admin/ops/social-care',
        description: row.memo
      })
    )
  }

  const contactTasks = await safeRows(
    'care_contact_tasks',
    'id,elder_name,title,contact_type,status,priority,created_at,updated_at',
    30
  )

  for (const row of contactTasks) {
    signals.push(
      signal({
        row,
        sourceType: 'communication',
        title: row.title || '연락 작업',
        statusLabel: row.status || 'queued',
        priority: row.priority,
        url: '/admin/ops/contact-center'
      })
    )
  }

  const summaries = await safeRows(
    'care_30sec_summaries',
    'id,elder_name,summary_title,reassurance_state,status,summary_text,created_at,updated_at',
    30
  )

  for (const row of summaries) {
    signals.push(
      signal({
        row,
        sourceType: 'summary_30sec',
        title: row.summary_title || '30초 요약',
        statusLabel: row.reassurance_state || row.status || 'ready',
        reassuranceState: row.reassurance_state,
        url: '/admin/ops/contact-center',
        description: row.summary_text
      })
    )
  }

  return signals
}

export async function GET() {
  const signals = await collectOpsSignals()
  const summary = buildOpsCommandSummary(signals)

  const snapshots = await rest(
    'care_ops_command_snapshots?select=' +
      encodeURIComponent('id,snapshot_date,reassurance_state,summary_text,total_count,urgent_count,attention_count,in_progress_count,completed_count,ops_next_actions,top_signals,source_counts,created_at') +
      '&order=created_at.desc&limit=10'
  )

  return NextResponse.json({
    ok: true,
    summary,
    signals,
    snapshots: snapshots.ok && Array.isArray(snapshots.data) ? snapshots.data : []
  })
}

export async function POST(_request: NextRequest) {
  const signals = await collectOpsSignals()
  const summary = buildOpsCommandSummary(signals)

  const insert = await rest('care_ops_command_snapshots', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        snapshot_date: new Date().toISOString().slice(0, 10),
        reassurance_state: summary.reassuranceState,
        summary_text: summary.summaryText,
        total_count: summary.totalCount,
        urgent_count: summary.urgentCount,
        attention_count: summary.attentionCount,
        in_progress_count: summary.inProgressCount,
        completed_count: summary.completedCount,
        ops_next_actions: summary.opsNextActions,
        top_signals: summary.topSignals,
        source_counts: summary.sourceCounts,
        created_by_role: 'system'
      }
    ])
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 관제 스냅샷 저장 실패',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    snapshot: Array.isArray(insert.data) ? insert.data[0] : insert.data,
    summary,
    signals
  })
}
