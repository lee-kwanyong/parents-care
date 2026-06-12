import { NextRequest, NextResponse } from 'next/server'
import {
  applyTemplate,
  buildDedupeKey,
  type NotificationChannel,
  type NotificationPriority,
  type NotificationStatus
} from '@/lib/notification-engine'

export const dynamic = 'force-dynamic'

const allowedChannels = new Set(['app', 'kakao', 'sms', 'phone', 'email', 'push'])
const allowedPriorities = new Set(['low', 'normal', 'high', 'urgent'])
const allowedStatuses = new Set(['queued', 'ready', 'sent', 'failed', 'cancelled', 'suppressed'])

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

async function safeRows(table: string, select: string, order = 'created_at.desc', limit = 20) {
  const result = await rest(
    table + '?select=' + encodeURIComponent(select) + '&order=' + encodeURIComponent(order) + '&limit=' + limit
  )

  if (!result.ok || !Array.isArray(result.data)) return []
  return result.data as any[]
}

async function insertDeliveryEvent(input: {
  notificationId?: string | null
  eventType: string
  title: string
  description?: string | null
  actorRole?: 'family' | 'ops' | 'manager' | 'system'
}) {
  await rest('notification_delivery_events', {
    method: 'POST',
    body: JSON.stringify([
      {
        notification_outbox_id: input.notificationId || null,
        event_type: input.eventType,
        title: input.title,
        description: input.description || null,
        actor_role: input.actorRole || 'system'
      }
    ])
  })
}

async function fetchTemplate(templateCode: string) {
  const result = await rest(
    'care_notification_templates?select=' +
      encodeURIComponent('id,template_code,title,audience,channel,trigger_event,body,easy_summary,is_active') +
      '&template_code=eq.' +
      encodeURIComponent(templateCode) +
      '&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data)) return null
  return result.data[0] || null
}

function notificationRow(input: {
  elderName?: string
  recipientRole?: string
  recipientName?: string | null
  recipientPhone?: string | null
  channel?: string
  templateCode: string
  title: string
  body: string
  priority?: string
  payload?: Record<string, unknown>
  dedupeKey?: string | null
}) {
  const channel: NotificationChannel = allowedChannels.has(input.channel || '') ? (input.channel as NotificationChannel) : 'app'
  const priority: NotificationPriority = allowedPriorities.has(input.priority || '') ? (input.priority as NotificationPriority) : 'normal'

  return {
    elder_name: input.elderName || '부모님',
    recipient_role: input.recipientRole || 'guardian',
    recipient_name: input.recipientName || null,
    recipient_phone: input.recipientPhone || null,
    channel,
    template_code: input.templateCode,
    title: input.title,
    body: input.body,
    payload: input.payload || {},
    priority,
    status: 'queued',
    dedupe_key: input.dedupeKey || buildDedupeKey({
      templateCode: input.templateCode,
      elderName: input.elderName,
      recipientPhone: input.recipientPhone,
      sourceId: String(input.payload?.source_id || '')
    }),
    created_by_role: 'system'
  }
}

async function generateRowsFromSignals() {
  const rows: any[] = []

  const dailyCare = await safeRows(
    'daily_care_checkins',
    'id,elder_name,check_type,care_label,status,memo,created_at',
    'created_at.desc',
    30
  )

  for (const item of dailyCare) {
    if (item.status === 'not_done' || item.status === 'needs_help') {
      rows.push(
        notificationRow({
          elderName: item.elder_name || '부모님',
          templateCode: 'daily_care_attention',
          title: '식사·약 확인 필요',
          body: `${item.care_label || '오늘 확인'} 상태가 ${item.status}입니다. 가족 확인이 필요합니다.`,
          priority: item.status === 'needs_help' ? 'urgent' : 'high',
          payload: {
            source_type: 'daily_care',
            source_id: item.id,
            check_type: item.check_type,
            status: item.status,
            url: '/child/daily-care'
          },
          dedupeKey: `daily-care:${item.id}:${item.status}`
        })
      )
    }
  }

  const costs = await safeRows(
    'care_cost_approval_requests',
    'id,elder_name,guardian_name,guardian_phone,title,status,priority,total_amount_krw,guardian_message,created_at',
    'created_at.desc',
    30
  )

  for (const item of costs) {
    if (item.status === 'pending_guardian') {
      rows.push(
        notificationRow({
          elderName: item.elder_name || '부모님',
          recipientName: item.guardian_name,
          recipientPhone: item.guardian_phone,
          channel: item.guardian_phone ? 'kakao' : 'app',
          templateCode: 'cost_approval_requested',
          title: '추가비용 승인 필요',
          body: item.guardian_message || `${item.title || '추가비용'} 승인이 필요합니다.`,
          priority: item.priority || 'high',
          payload: {
            source_type: 'cost_approval',
            source_id: item.id,
            amount: item.total_amount_krw,
            url: '/child/costs'
          },
          dedupeKey: `cost-approval:${item.id}:pending`
        })
      )
    }
  }

  const managerAssignments = await safeRows(
    'manager_field_assignments',
    'id,elder_name,title,status,manager_name,appointment_date,appointment_time,meeting_code,created_at',
    'created_at.desc',
    20
  )

  for (const item of managerAssignments) {
    if (item.status === 'assigned' || item.status === 'accepted') {
      rows.push(
        notificationRow({
          elderName: item.elder_name || '부모님',
          templateCode: 'manager_assigned',
          title: '동행매니저 배정 완료',
          body: `${item.manager_name || '동행매니저'}가 배정됐습니다. 만남 암호는 ${item.meeting_code || '2580'}입니다.`,
          priority: 'normal',
          payload: {
            source_type: 'manager_field',
            source_id: item.id,
            meeting_code: item.meeting_code,
            url: '/child/cases'
          },
          dedupeKey: `manager-assigned:${item.id}`
        })
      )
    }

    if (item.status === 'issue') {
      rows.push(
        notificationRow({
          elderName: item.elder_name || '부모님',
          templateCode: 'manager_field_issue',
          title: '매니저 현장 이슈 확인 필요',
          body: `${item.title || '현장 케어'}에서 이슈가 발생했습니다. 운영실 확인이 필요합니다.`,
          priority: 'urgent',
          payload: {
            source_type: 'manager_field',
            source_id: item.id,
            url: '/admin/ops/manager-field'
          },
          dedupeKey: `manager-issue:${item.id}`
        })
      )
    }
  }

  const summaries = await safeRows(
    'care_30sec_summaries',
    'id,elder_name,summary_title,reassurance_state,status,summary_text,created_at',
    'created_at.desc',
    20
  )

  for (const item of summaries) {
    if (item.status === 'ready' || item.status === 'sent') {
      rows.push(
        notificationRow({
          elderName: item.elder_name || '부모님',
          templateCode: 'summary_30sec_ready',
          title: '30초 요약 도착',
          body: item.summary_text || `${item.summary_title || '30초 요약'}이 준비됐습니다.`,
          priority: item.reassurance_state === '긴급' ? 'urgent' : item.reassurance_state === '확인 필요' ? 'high' : 'normal',
          payload: {
            source_type: 'summary_30sec',
            source_id: item.id,
            url: '/child/summaries'
          },
          dedupeKey: `summary-30sec:${item.id}:${item.status}`
        })
      )
    }
  }

  const assisted = await safeRows(
    'care_assisted_intake_requests',
    'id,elder_name,contact_name,contact_phone,summary_title,status,priority,created_at',
    'created_at.desc',
    20
  )

  for (const item of assisted) {
    if (item.status === 'received' || item.status === 'needs_more_info') {
      rows.push(
        notificationRow({
          elderName: item.elder_name || '부모님',
          recipientName: item.contact_name,
          recipientPhone: item.contact_phone,
          templateCode: 'care_request_received',
          title: '사진·카톡 접수 확인',
          body: `${item.summary_title || '사진·카톡 접수'}가 운영실에서 정리 중입니다.`,
          priority: item.priority || 'normal',
          payload: {
            source_type: 'assisted_intake',
            source_id: item.id,
            url: '/child/intake-inbox'
          },
          dedupeKey: `assisted-intake:${item.id}:${item.status}`
        })
      )
    }
  }

  const familyCodes = await safeRows(
    'care_family_invite_codes',
    'id,invite_code,status,used_count,max_uses,created_at',
    'created_at.desc',
    20
  )

  for (const item of familyCodes) {
    if (item.status === 'active' && Number(item.used_count || 0) === 0) {
      rows.push(
        notificationRow({
          templateCode: 'family_invite_code_created',
          title: '가족 공동조회 코드 생성',
          body: `가족 공동조회 코드 ${item.invite_code}가 생성됐습니다.`,
          priority: 'normal',
          payload: {
            source_type: 'family_invite',
            source_id: item.id,
            invite_code: item.invite_code,
            url: '/child/family'
          },
          dedupeKey: `family-code:${item.id}:created`
        })
      )
    }
  }

  const social = await safeRows(
    'parent_care_social_support_cases',
    'id,elder_name,status,priority,memo,created_at',
    'created_at.desc',
    20
  )

  for (const item of social) {
    if (item.status === 'requested' || item.status === 'reviewing' || item.status === 'voucher_issued') {
      rows.push(
        notificationRow({
          elderName: item.elder_name || '부모님',
          templateCode: 'social_support_update',
          title: '사회공헌 지원 검토 안내',
          body: item.status === 'voucher_issued'
            ? '후원 쿠폰 또는 지원 연결이 발급됐습니다.'
            : '공공지원·후원 연결 가능성을 운영실이 검토 중입니다.',
          priority: item.priority || 'normal',
          payload: {
            source_type: 'social_support',
            source_id: item.id,
            url: '/child/social-care'
          },
          dedupeKey: `social-support:${item.id}:${item.status}`
        })
      )
    }
  }

  return rows
}

export async function GET() {
  const notificationSelect = [
    'id',
    'family_id',
    'elder_id',
    'elder_name',
    'recipient_role',
    'recipient_name',
    'recipient_phone',
    'channel',
    'template_code',
    'title',
    'body',
    'payload',
    'priority',
    'status',
    'scheduled_at',
    'sent_at',
    'failed_at',
    'provider',
    'provider_message_id',
    'failure_reason',
    'retry_count',
    'max_retries',
    'dedupe_key',
    'created_by_role',
    'created_at',
    'updated_at'
  ].join(',')

  const templateSelect = [
    'id',
    'template_code',
    'title',
    'audience',
    'channel',
    'trigger_event',
    'body',
    'easy_summary',
    'is_active',
    'created_at',
    'updated_at'
  ].join(',')

  const eventSelect = [
    'id',
    'notification_outbox_id',
    'event_type',
    'title',
    'description',
    'actor_role',
    'created_at'
  ].join(',')

  const [notifications, templates, events] = await Promise.all([
    rest('notification_outbox?select=' + encodeURIComponent(notificationSelect) + '&order=created_at.desc&limit=200'),
    rest('care_notification_templates?select=' + encodeURIComponent(templateSelect) + '&is_active=eq.true&order=created_at.asc&limit=100'),
    rest('notification_delivery_events?select=' + encodeURIComponent(eventSelect) + '&order=created_at.desc&limit=300')
  ])

  if (!notifications.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '알림 큐를 불러오지 못했습니다. STEP29 SQL이 실행됐는지 확인해주세요.',
        detail: notifications.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    notifications: Array.isArray(notifications.data) ? notifications.data : [],
    templates: templates.ok && Array.isArray(templates.data) ? templates.data : [],
    events: events.ok && Array.isArray(events.data) ? events.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action) || 'create_notification'

  if (action === 'generate_from_signals') {
    const rows = await generateRowsFromSignals()

    if (rows.length === 0) {
      return NextResponse.json({
        ok: true,
        inserted: 0,
        candidates: 0,
        message: '생성할 알림 후보가 없습니다.'
      })
    }

    const inserted = await rest('notification_outbox?on_conflict=dedupe_key', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
      body: JSON.stringify(rows)
    })

    if (!inserted.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '알림 자동 생성 중 오류가 발생했습니다.',
          detail: inserted.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      candidates: rows.length,
      inserted: Array.isArray(inserted.data) ? inserted.data.length : 0,
      notifications: Array.isArray(inserted.data) ? inserted.data : []
    })
  }

  if (action === 'create_notification') {
    const templateCode = text(body.templateCode) || 'general'
    const elderName = text(body.elderName) || '부모님'
    const recipientName = text(body.recipientName)
    const recipientPhone = text(body.recipientPhone)
    const recipientRole = text(body.recipientRole) || 'guardian'
    const channelValue = text(body.channel) || 'app'
    const priorityValue = text(body.priority) || 'normal'

    const channel: NotificationChannel = allowedChannels.has(channelValue) ? (channelValue as NotificationChannel) : 'app'
    const priority: NotificationPriority = allowedPriorities.has(priorityValue) ? (priorityValue as NotificationPriority) : 'normal'

    const template = await fetchTemplate(templateCode)
    const params = {
      elder_name: elderName,
      recipient_name: recipientName,
      meeting_code: text(body.meetingCode) || '2580'
    }

    const title = text(body.title) || template?.title || '알림'
    const bodyText = text(body.body) || applyTemplate(template?.body || '확인할 알림이 있습니다.', params)

    const row = notificationRow({
      elderName,
      recipientRole,
      recipientName,
      recipientPhone,
      channel,
      templateCode,
      title,
      body: bodyText,
      priority,
      payload: {
        source_type: text(body.sourceType) || 'manual',
        source_id: text(body.sourceId) || null,
        url: text(body.url) || null
      },
      dedupeKey: text(body.dedupeKey) || null
    })

    const insert = await rest('notification_outbox', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([row])
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '알림 생성 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    const created = Array.isArray(insert.data) ? insert.data[0] : insert.data

    await insertDeliveryEvent({
      notificationId: created?.id,
      eventType: 'notification_created',
      title: '알림 생성',
      description: bodyText,
      actorRole: 'ops'
    })

    return NextResponse.json({
      ok: true,
      notification: created
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const id = text(body.id)
  const statusValue = text(body.status)
  const failureReason = text(body.failureReason)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (!allowedStatuses.has(statusValue)) {
    return NextResponse.json({ ok: false, message: 'status가 올바르지 않습니다.' }, { status: 400 })
  }

  const status = statusValue as NotificationStatus

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'sent') {
    patch.sent_at = new Date().toISOString()
    patch.provider = text(body.provider) || 'manual'
    patch.provider_message_id = text(body.providerMessageId) || null
  }

  if (status === 'failed') {
    patch.failed_at = new Date().toISOString()
    patch.failure_reason = failureReason || '발송 실패'
  }

  if (status === 'queued') {
    patch.failed_at = null
    patch.failure_reason = null
  }

  const result = await rest('notification_outbox?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '알림 상태 변경 실패',
        detail: result.error
      },
      { status: 500 }
    )
  }

  await insertDeliveryEvent({
    notificationId: id,
    eventType: `notification_${status}`,
    title: `알림 상태 변경: ${status}`,
    description: failureReason || null,
    actorRole: 'ops'
  })

  return NextResponse.json({
    ok: true,
    item: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
