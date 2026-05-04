import { NextRequest, NextResponse } from 'next/server'
import {
  build30SecSummary,
  buildDefaultScript,
  type ContactAudience,
  type ContactChannel,
  type ContactPriority,
  type ContactStatus,
  type ContactType,
  type ReassuranceState,
  type SummaryStatus
} from '@/lib/communication-care-engine'

export const dynamic = 'force-dynamic'

const allowedAudiences = new Set(['guardian', 'parent', 'manager', 'ops'])
const allowedChannels = new Set(['phone', 'kakao', 'app', 'sms', 'email'])
const allowedContactTypes = new Set([
  'pre_reassurance_call',
  'care_plan_explain',
  'report_summary',
  'meal_check',
  'medication_check',
  'discharge_followup',
  'document_reminder',
  'social_support',
  'emergency_callback',
  'general'
])
const allowedContactStatuses = new Set(['queued', 'scheduled', 'in_progress', 'completed', 'no_answer', 'retry_needed', 'failed', 'cancelled'])
const allowedSummaryStatuses = new Set(['draft', 'ready', 'sent', 'read', 'archived'])
const allowedReassurance = new Set(['안심', '확인 필요', '긴급'])
const allowedPriorities = new Set(['low', 'normal', 'high', 'urgent'])

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

export async function GET() {
  const taskSelect = [
    'id',
    'elder_name',
    'guardian_name',
    'guardian_phone',
    'audience',
    'channel',
    'contact_type',
    'template_code',
    'title',
    'script',
    'status',
    'priority',
    'scheduled_at',
    'completed_at',
    'call_result',
    'memo',
    'ops_memo',
    'created_at',
    'updated_at'
  ].join(',')

  const summarySelect = [
    'id',
    'elder_name',
    'source_type',
    'source_id',
    'reassurance_state',
    'summary_title',
    'summary_text',
    'family_next_actions',
    'important_notes',
    'status',
    'sent_at',
    'read_at',
    'created_at',
    'updated_at'
  ].join(',')

  const templateSelect = [
    'id',
    'template_code',
    'title',
    'audience',
    'channel',
    'contact_type',
    'body',
    'easy_summary',
    'is_active',
    'created_at',
    'updated_at'
  ].join(',')

  const [tasks, summaries, templates] = await Promise.all([
    rest('care_contact_tasks?select=' + encodeURIComponent(taskSelect) + '&order=created_at.desc&limit=100'),
    rest('care_30sec_summaries?select=' + encodeURIComponent(summarySelect) + '&order=created_at.desc&limit=100'),
    rest('care_contact_templates?select=' + encodeURIComponent(templateSelect) + '&is_active=eq.true&order=created_at.asc&limit=100')
  ])

  if (!tasks.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '연락 작업 목록을 불러오지 못했습니다. STEP20 SQL이 실행됐는지 확인해주세요.',
        detail: tasks.error
      },
      { status: 500 }
    )
  }

  if (!summaries.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '30초 요약 목록을 불러오지 못했습니다. STEP20 SQL이 실행됐는지 확인해주세요.',
        detail: summaries.error
      },
      { status: 500 }
    )
  }

  if (!templates.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '연락 템플릿 목록을 불러오지 못했습니다. STEP20 SQL이 실행됐는지 확인해주세요.',
        detail: templates.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    tasks: Array.isArray(tasks.data) ? tasks.data : [],
    summaries: Array.isArray(summaries.data) ? summaries.data : [],
    templates: Array.isArray(templates.data) ? templates.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action) || 'create_contact_task'

  const elderName = text(body.elderName) || '부모님'
  const guardianName = text(body.guardianName)
  const guardianPhone = text(body.guardianPhone)
  const memo = text(body.memo)

  if (action === 'create_contact_task') {
    const contactTypeValue = text(body.contactType) || 'pre_reassurance_call'
    const channelValue = text(body.channel) || 'phone'
    const audienceValue = text(body.audience) || 'guardian'
    const priorityValue = text(body.priority) || 'normal'
    const templateCode = text(body.templateCode)
    const title = text(body.title)

    if (!allowedContactTypes.has(contactTypeValue)) {
      return NextResponse.json({ ok: false, message: 'contactType이 올바르지 않습니다.' }, { status: 400 })
    }

    if (!allowedChannels.has(channelValue)) {
      return NextResponse.json({ ok: false, message: 'channel이 올바르지 않습니다.' }, { status: 400 })
    }

    if (!allowedAudiences.has(audienceValue)) {
      return NextResponse.json({ ok: false, message: 'audience가 올바르지 않습니다.' }, { status: 400 })
    }

    if (!allowedPriorities.has(priorityValue)) {
      return NextResponse.json({ ok: false, message: 'priority가 올바르지 않습니다.' }, { status: 400 })
    }

    const contactType = contactTypeValue as ContactType
    const channel = channelValue as ContactChannel
    const audience = audienceValue as ContactAudience
    const priority = priorityValue as ContactPriority
    const script = text(body.script) || buildDefaultScript({ elderName, guardianName, contactType, memo })

    const insert = await rest('care_contact_tasks', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          elder_name: elderName,
          guardian_name: guardianName || null,
          guardian_phone: guardianPhone || null,
          audience,
          channel,
          contact_type: contactType,
          template_code: templateCode || null,
          title: title || buildContactTaskTitle(contactType, elderName),
          script,
          status: 'queued',
          priority,
          memo: memo || null,
          created_by_role: 'ops'
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '연락 작업 저장 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      task: Array.isArray(insert.data) ? insert.data[0] : insert.data
    })
  }

  if (action === 'create_summary') {
    const reassuranceValue = text(body.reassuranceState) || '확인 필요'
    const reassuranceState: ReassuranceState = allowedReassurance.has(reassuranceValue)
      ? (reassuranceValue as ReassuranceState)
      : '확인 필요'

    const nextActionsRaw = Array.isArray(body.familyNextActions) ? body.familyNextActions.map(String) : []
    const notesRaw = Array.isArray(body.importantNotes) ? body.importantNotes.map(String) : []

    const built = build30SecSummary({
      elderName,
      reassuranceState,
      memo,
      familyNextActions: nextActionsRaw,
      importantNotes: notesRaw
    })

    const insert = await rest('care_30sec_summaries', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          elder_name: elderName,
          source_type: text(body.sourceType) || 'manual',
          reassurance_state: reassuranceState,
          summary_title: text(body.summaryTitle) || built.summaryTitle,
          summary_text: built.summaryText,
          family_next_actions: built.familyNextActions,
          important_notes: built.importantNotes,
          status: 'ready',
          created_by_role: 'ops'
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '30초 요약 저장 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      summary: Array.isArray(insert.data) ? insert.data[0] : insert.data
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const kind = text(body.kind)
  const id = text(body.id)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (kind === 'task') {
    const statusValue = text(body.status)

    if (!allowedContactStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'task status가 올바르지 않습니다.' }, { status: 400 })
    }

    const status = statusValue as ContactStatus
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'completed') patch.completed_at = new Date().toISOString()
    if (text(body.callResult)) patch.call_result = text(body.callResult)
    if (text(body.opsMemo)) patch.ops_memo = text(body.opsMemo)

    const result = await rest('care_contact_tasks?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '연락 작업 상태 변경 실패',
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

  if (kind === 'summary') {
    const statusValue = text(body.status)

    if (!allowedSummaryStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'summary status가 올바르지 않습니다.' }, { status: 400 })
    }

    const status = statusValue as SummaryStatus
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'sent') patch.sent_at = new Date().toISOString()
    if (status === 'read') patch.read_at = new Date().toISOString()

    const result = await rest('care_30sec_summaries?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '30초 요약 상태 변경 실패',
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

  return NextResponse.json({ ok: false, message: 'kind는 task 또는 summary여야 합니다.' }, { status: 400 })
}

function buildContactTaskTitle(contactType: ContactType, elderName: string) {
  const map: Record<ContactType, string> = {
    pre_reassurance_call: `${elderName} 사전 안심전화`,
    care_plan_explain: `${elderName} 케어플랜 설명`,
    report_summary: `${elderName} 30초 요약 안내`,
    meal_check: `${elderName} 식사 확인`,
    medication_check: `${elderName} 복약 확인`,
    discharge_followup: `${elderName} 퇴원 후 확인`,
    document_reminder: `${elderName} 서류 안내`,
    social_support: `${elderName} 사회공헌 안내`,
    emergency_callback: `${elderName} 긴급 콜백`,
    general: `${elderName} 일반 연락`
  }

  return map[contactType]
}
