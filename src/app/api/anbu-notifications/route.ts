import { NextRequest, NextResponse } from 'next/server'
import {
  dispatchNotificationWebhook,
  normalizePhone,
  supabaseInsert,
  text
} from '@/lib/anbu-integrations'
import type { AnbuNotificationPayload, AnbuNotificationChannel } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const allowedChannels = new Set(['app', 'sms', 'kakao', 'email'])

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

  if (shouldDispatch) {
    dispatchResult = await dispatchNotificationWebhook(payload)

    await supabaseInsert('anbu_integration_events', {
      event_type: 'notification_dispatch',
      provider: 'webhook',
      status:
        typeof dispatchResult === 'object' &&
        dispatchResult &&
        'ok' in dispatchResult &&
        (dispatchResult as { ok?: boolean }).ok
          ? 'sent'
          : 'outbox-only',
      payload: {
        notification: payload,
        dispatchResult
      }
    })
  }

  return NextResponse.json({
    ok: true,
    message: shouldDispatch
      ? '알림 발송을 처리했습니다. Webhook이 없으면 발송함 저장만 완료됩니다.'
      : '알림 발송함에 저장했습니다.',
    mode: shouldDispatch ? 'queued-and-dispatched' : 'queued',
    outbox,
    dispatchResult
  })
}
