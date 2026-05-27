import { NextRequest, NextResponse } from 'next/server'
import {
  dispatchNotification,
  normalizePhone,
  supabaseInsert,
  supabasePatch,
  text
} from '@/lib/anbu-integrations'
import type { AnbuNotificationPayload, AnbuNotificationChannel } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const allowedChannels = new Set(['app', 'sms', 'kakao', 'email'])

function getInsertedId(result: Awaited<ReturnType<typeof supabaseInsert>>) {
  if (!result.ok || !Array.isArray(result.data)) return ''
  const row = result.data[0] as { id?: string } | undefined
  return row?.id || ''
}

async function updateOutboxStatus(id: string, status: string, dispatchResult: unknown) {
  if (!id) return null

  return supabasePatch(
    'anbu_notification_outbox?id=eq.' + encodeURIComponent(id),
    {
      status,
      provider:
        typeof dispatchResult === 'object' &&
        dispatchResult &&
        'mode' in dispatchResult
          ? String((dispatchResult as { mode?: string }).mode || '')
          : null,
      sent_at:
        typeof dispatchResult === 'object' &&
        dispatchResult &&
        'ok' in dispatchResult &&
        (dispatchResult as { ok?: boolean }).ok
          ? new Date().toISOString()
          : null,
      payload: {
        dispatchResult
      }
    }
  )
}

function statusFromDispatchResult(dispatchResult: unknown) {
  if (
    typeof dispatchResult === 'object' &&
    dispatchResult &&
    'ok' in dispatchResult &&
    (dispatchResult as { ok?: boolean }).ok
  ) {
    return 'sent'
  }

  if (
    typeof dispatchResult === 'object' &&
    dispatchResult &&
    'mode' in dispatchResult &&
    (dispatchResult as { mode?: string }).mode === 'outbox-only'
  ) {
    return 'outbox-only'
  }

  return 'failed'
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const rawPayload = body.payload || {}

  const channel = text(rawPayload.channel) as AnbuNotificationChannel

  if (!allowedChannels.has(channel)) {
    return NextResponse.json(
      { ok: false, message: '지원하지 않는 알림 채널입니다.' },
      { status: 400 }
    )
  }

  const payload: AnbuNotificationPayload = {
    channel,
    toName: text(rawPayload.toName),
    toPhone: normalizePhone(rawPayload.toPhone),
    toEmail: text(rawPayload.toEmail),
    title: text(rawPayload.title) || '안부웍스 알림',
    body: text(rawPayload.body) || '확인이 필요한 안부 알림입니다.',
    familyCode: text(rawPayload.familyCode),
    url: text(rawPayload.url) || '/child/dashboard',
    templateCode: text(rawPayload.templateCode),
    reason: text(rawPayload.reason)
  }

  const outbox = await supabaseInsert('anbu_notification_outbox', {
    channel: payload.channel,
    to_name: payload.toName || null,
    to_phone: payload.toPhone || null,
    to_email: payload.toEmail || null,
    title: payload.title,
    body: payload.body,
    family_code: payload.familyCode || null,
    template_code: payload.templateCode || null,
    reason: payload.reason || null,
    target_url: payload.url || null,
    status: 'queued',
    payload
  })

  const shouldDispatch = text(body.deliveryMode) === 'send'
  let dispatchResult: unknown = null
  let outboxUpdate: unknown = null

  if (shouldDispatch) {
    dispatchResult = await dispatchNotification(payload)
    const nextStatus = statusFromDispatchResult(dispatchResult)
    const outboxId = getInsertedId(outbox)

    outboxUpdate = await updateOutboxStatus(outboxId, nextStatus, dispatchResult)

    await supabaseInsert('anbu_integration_events', {
      event_type: 'notification_dispatch',
      provider:
        typeof dispatchResult === 'object' &&
        dispatchResult &&
        'mode' in dispatchResult
          ? String((dispatchResult as { mode?: string }).mode || '')
          : 'unknown',
      status: nextStatus,
      payload: {
        notification: payload,
        dispatchResult
      }
    })
  }

  return NextResponse.json({
    ok: true,
    message: shouldDispatch
      ? '알림 발송을 처리했습니다.'
      : '알림 발송함에 저장했습니다.',
    mode: shouldDispatch ? 'queued-and-dispatched' : 'queued',
    outbox,
    outboxUpdate,
    dispatchResult
  })
}
