import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
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

async function fetchNotification(id: string) {
  const result = await rest('notification_outbox?select=*&id=eq.' + encodeURIComponent(id) + '&limit=1')
  return result.ok && Array.isArray(result.data) ? result.data[0] || null : null
}

async function createLog(input: {
  notification: AnyRow
  status: string
  provider?: string
  providerMessageId?: string | null
  errorMessage?: string | null
}) {
  await rest('notification_delivery_logs', {
    method: 'POST',
    body: JSON.stringify([
      {
        notification_id: input.notification.id,
        channel: input.notification.channel || 'app',
        provider: input.provider || 'simulation',
        delivery_status: input.status,
        provider_message_id: input.providerMessageId || null,
        request_payload: {
          title: input.notification.title,
          body: input.notification.body,
          recipient_role: input.notification.recipient_role,
          recipient_name: input.notification.recipient_name,
          recipient_phone: input.notification.recipient_phone
        },
        response_payload: {
          simulated: true,
          status: input.status
        },
        error_message: input.errorMessage || null,
        created_by_role: 'ops'
      }
    ])
  })
}

async function updateNotificationStatus(input: {
  id: string
  status: 'sent' | 'failed' | 'queued'
  errorMessage?: string | null
}) {
  const notification = await fetchNotification(input.id)

  if (!notification) {
    return {
      ok: false,
      error: '알림을 찾지 못했습니다.'
    }
  }

  const now = new Date().toISOString()
  const attempts = Number(notification.delivery_attempts || 0) + (input.status === 'queued' ? 0 : 1)

  const payload: Record<string, unknown> = {
    status: input.status,
    delivery_attempts: attempts,
    updated_at: now
  }

  if (input.status === 'sent') {
    payload.sent_at = now
    payload.failed_at = null
    payload.provider = 'simulation'
    payload.provider_message_id = `sim-${input.id}-${Date.now()}`
    payload.error_message = null
  }

  if (input.status === 'failed') {
    payload.failed_at = now
    payload.error_message = input.errorMessage || '운영실 수동 실패 처리'
    payload.provider = 'simulation'
  }

  if (input.status === 'queued') {
    payload.sent_at = null
    payload.failed_at = null
    payload.error_message = null
    payload.provider_message_id = null
  }

  const patch = await rest('notification_outbox?id=eq.' + encodeURIComponent(input.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload)
  })

  if (!patch.ok) {
    return patch
  }

  if (input.status !== 'queued') {
    await createLog({
      notification,
      status: input.status,
      provider: 'simulation',
      providerMessageId: String(payload.provider_message_id || ''),
      errorMessage: String(payload.error_message || '')
    })
  }

  return {
    ok: true,
    data: firstRow(patch),
    error: null
  }
}

export async function GET() {
  const [notifications, logs] = await Promise.all([
    rest('notification_outbox?select=*&order=created_at.desc&limit=150'),
    rest('notification_delivery_logs?select=*&order=created_at.desc&limit=100')
  ])

  if (!notifications.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '알림 큐를 불러오지 못했습니다. Supabase에서 notification_outbox SQL을 확인해주세요.',
        detail: notifications.error
      },
      { status: 500 }
    )
  }

  const items = Array.isArray(notifications.data) ? notifications.data : []
  const logItems = logs.ok && Array.isArray(logs.data) ? logs.data : []

  return NextResponse.json({
    ok: true,
    items,
    logs: logItems,
    summary: {
      total: items.length,
      queued: items.filter((item: AnyRow) => item.status === 'queued').length,
      sent: items.filter((item: AnyRow) => item.status === 'sent').length,
      failed: items.filter((item: AnyRow) => item.status === 'failed').length,
      guardian: items.filter((item: AnyRow) => item.recipient_role === 'guardian').length,
      manager: items.filter((item: AnyRow) => item.recipient_role === 'manager').length,
      high: items.filter((item: AnyRow) => item.priority === 'high' || item.priority === 'urgent').length,
      logs: logItems.length
    },
    errors: logs.ok ? [] : [{ label: 'notification_delivery_logs', error: logs.error }]
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create_demo_notifications') {
    const now = Date.now()

    const rows = [
      {
        elder_name: '어머니',
        recipient_role: 'guardian',
        recipient_name: '홍길동',
        recipient_phone: '01000000000',
        channel: 'app',
        template_code: 'care_case_created',
        title: '부모님 케어 요청이 정리됐습니다',
        body: '어머니 병원동행 케어 요청을 운영실이 정리했습니다.',
        payload: { url: '/child/cases', demo: true },
        priority: 'high',
        status: 'queued',
        created_by_role: 'ops',
        dedupe_key: `demo-guardian-care-case-${now}`
      },
      {
        elder_name: '어머니',
        recipient_role: 'manager',
        recipient_name: '홍길동 케어파트너',
        recipient_phone: '01000000000',
        channel: 'app',
        template_code: 'manager_offer_sent',
        title: '새 케어 요청이 도착했습니다',
        body: '강남구 정형외과 병원동행 요청이 도착했습니다. 가능하면 수락해주세요.',
        payload: { url: '/manager', demo: true },
        priority: 'normal',
        status: 'queued',
        created_by_role: 'ops',
        dedupe_key: `demo-manager-offer-${now}`
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
        payload: { url: '/child/reports', demo: true },
        priority: 'normal',
        status: 'queued',
        created_by_role: 'ops',
        dedupe_key: `demo-guardian-report-${now}`
      }
    ]

    const insert = await rest('notification_outbox', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(rows)
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '테스트 알림 생성 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: '테스트 알림을 생성했습니다.',
      items: insert.data
    })
  }

  if (action === 'mark_sent' || action === 'mark_failed' || action === 'requeue') {
    const id = text(body.id)
    if (!id) return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })

    const status = action === 'mark_sent' ? 'sent' : action === 'mark_failed' ? 'failed' : 'queued'
    const updated = await updateNotificationStatus({
      id,
      status,
      errorMessage: text(body.errorMessage) || null
    })

    if (!updated.ok) {
      return NextResponse.json({ ok: false, message: '알림 상태 변경 실패', detail: updated.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: status === 'sent' ? '발송 완료로 표시했습니다.' : status === 'failed' ? '실패로 표시했습니다.' : '재시도 대기로 변경했습니다.',
      item: updated.data
    })
  }

  if (action === 'send_next_batch') {
    const limit = Math.min(Math.max(Number(body.limit || 10), 1), 30)
    const queued = await rest('notification_outbox?select=*&status=eq.queued&order=created_at.asc&limit=' + limit)

    if (!queued.ok) {
      return NextResponse.json({ ok: false, message: '대기 알림을 불러오지 못했습니다.', detail: queued.error }, { status: 500 })
    }

    const queueItems = Array.isArray(queued.data) ? queued.data : []
    const results = []

    for (const item of queueItems) {
      const updated = await updateNotificationStatus({ id: item.id, status: 'sent' })
      results.push({ id: item.id, ok: updated.ok, error: updated.error || null })
    }

    return NextResponse.json({
      ok: true,
      message: `${results.filter((item) => item.ok).length}건을 발송 완료로 시뮬레이션했습니다.`,
      results
    })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}
