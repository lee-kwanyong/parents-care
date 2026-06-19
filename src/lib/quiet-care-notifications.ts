import {
  dispatchNotification,
  supabaseInsert,
  supabasePatch
} from '@/lib/anbu-integrations'

export type CareNotificationInput = {
  familyCode: string
  toName: string
  toPhone: string
  title: string
  body: string
  reason: string
  targetUrl: string
  eventType: string
  metadata?: Record<string, unknown>
  dryRun?: boolean
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d+]/g, '')
}

function insertedId(result: Awaited<ReturnType<typeof supabaseInsert>>) {
  if (!result.ok || !Array.isArray(result.data)) return ''
  const row = result.data[0] as { id?: string } | undefined
  return row?.id || ''
}

function dispatchStatus(result: unknown) {
  if (
    typeof result === 'object' &&
    result &&
    'ok' in result &&
    (result as { ok?: boolean }).ok
  ) {
    return 'sent'
  }

  if (
    typeof result === 'object' &&
    result &&
    'mode' in result &&
    (result as { mode?: string }).mode === 'outbox-only'
  ) {
    return 'outbox-only'
  }

  return 'failed'
}

export async function sendCareNotification(input: CareNotificationInput) {
  const toPhone = phone(input.toPhone)

  if (!toPhone) {
    return {
      ok: false,
      skipped: true,
      status: 'skipped',
      reason: 'recipient_phone_missing'
    }
  }

  const payload = {
    channel: 'sms' as const,
    toName: input.toName || '보호자',
    toPhone,
    title: input.title,
    body: input.body,
    familyCode: input.familyCode,
    url: input.targetUrl,
    reason: input.reason
  }

  if (input.dryRun) {
    return {
      ok: true,
      dryRun: true,
      status: 'dry-run',
      payload
    }
  }

  const outbox = await supabaseInsert('anbu_notification_outbox', {
    family_code: input.familyCode || null,
    channel: 'sms',
    to_name: payload.toName,
    to_phone: payload.toPhone,
    title: payload.title,
    body: payload.body,
    reason: payload.reason,
    target_url: payload.url,
    status: 'queued',
    payload: {
      ...payload,
      metadata: input.metadata || {}
    }
  })

  const dispatchResult = await dispatchNotification(payload)
  const status = dispatchStatus(dispatchResult)
  const outboxId = insertedId(outbox)

  if (outboxId) {
    await supabasePatch(
      'anbu_notification_outbox?id=eq.' + encodeURIComponent(outboxId),
      {
        status,
        provider:
          typeof dispatchResult === 'object' &&
          dispatchResult &&
          'mode' in dispatchResult
            ? String((dispatchResult as { mode?: string }).mode || '')
            : 'unknown',
        sent_at: status === 'sent' ? new Date().toISOString() : null,
        payload: {
          original: payload,
          metadata: input.metadata || {},
          dispatchResult
        }
      }
    )
  }

  await supabaseInsert('anbu_integration_events', {
    event_type: input.eventType,
    provider:
      typeof dispatchResult === 'object' &&
      dispatchResult &&
      'mode' in dispatchResult
        ? String((dispatchResult as { mode?: string }).mode || '')
        : 'unknown',
    status,
    payload: {
      outboxId,
      notification: payload,
      metadata: input.metadata || {},
      dispatchResult
    }
  })

  return {
    ok: status === 'sent' || status === 'outbox-only',
    skipped: false,
    status,
    table: 'anbu_notification_outbox',
    outboxId,
    dispatchResult,
    error:
      status === 'failed'
        ? 'notification_dispatch_failed'
        : undefined
  }
}
