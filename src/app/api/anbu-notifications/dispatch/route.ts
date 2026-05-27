import { NextRequest, NextResponse } from 'next/server'
import {
  dispatchNotification,
  supabaseInsert,
  supabasePatch,
  supabaseSelect,
  text
} from '@/lib/anbu-integrations'
import type { AnbuNotificationPayload } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function toPayload(row: Record<string, unknown>): AnbuNotificationPayload {
  return {
    channel: text(row.channel) as AnbuNotificationPayload['channel'],
    toName: text(row.to_name),
    toPhone: text(row.to_phone),
    toEmail: text(row.to_email),
    title: text(row.title) || '안부웍스 알림',
    body: text(row.body) || '확인이 필요한 알림입니다.',
    familyCode: text(row.family_code),
    url: text(row.target_url) || '/child/dashboard',
    templateCode: text(row.template_code),
    reason: text(row.reason)
  }
}

function statusFromDispatchResult(result: unknown) {
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

async function dispatchOne(row: Record<string, unknown>) {
  const id = text(row.id)
  const payload = toPayload(row)
  const result = await dispatchNotification(payload)
  const nextStatus = statusFromDispatchResult(result)

  if (id) {
    await supabasePatch(
      'anbu_notification_outbox?id=eq.' + encodeURIComponent(id),
      {
        status: nextStatus,
        provider:
          typeof result === 'object' &&
          result &&
          'mode' in result
            ? String((result as { mode?: string }).mode || '')
            : 'unknown',
        sent_at: nextStatus === 'sent' ? new Date().toISOString() : null,
        payload: {
          original: row,
          dispatchResult: result
        }
      }
    )
  }

  await supabaseInsert('anbu_integration_events', {
    event_type: 'notification_dispatch',
    provider:
      typeof result === 'object' &&
      result &&
      'mode' in result
        ? String((result as { mode?: string }).mode || '')
        : 'unknown',
    status: nextStatus,
    payload: {
      outboxId: id,
      notification: payload,
      dispatchResult: result
    }
  })

  return {
    id,
    status: nextStatus,
    result
  }
}

async function handleDispatch(request: NextRequest) {
  const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {}
  const dryRun = Boolean(body.dryRun || request.nextUrl.searchParams.get('dryRun'))
  const limit = Math.min(Number(body.limit || request.nextUrl.searchParams.get('limit') || 20), 50)

  const result = await supabaseSelect(
    'anbu_notification_outbox?select=*&status=in.(queued,outbox-only,failed)&order=created_at.asc&limit=' +
      encodeURIComponent(String(limit))
  )

  if (!result.ok || !Array.isArray(result.data)) {
    return NextResponse.json({
      ok: false,
      message: '대기 중인 알림을 불러오지 못했습니다.',
      detail: result.error
    })
  }

  const rows = result.data as Array<Record<string, unknown>>

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      count: rows.length,
      items: rows
    })
  }

  const dispatched = []

  for (const row of rows) {
    dispatched.push(await dispatchOne(row))
  }

  return NextResponse.json({
    ok: true,
    count: dispatched.length,
    dispatched
  })
}

export async function GET(request: NextRequest) {
  return handleDispatch(request)
}

export async function POST(request: NextRequest) {
  return handleDispatch(request)
}
