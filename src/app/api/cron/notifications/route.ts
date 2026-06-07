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

function secretFromRequest(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('secret') || ''
  const header = request.headers.get('x-cron-secret') || ''
  const auth = request.headers.get('authorization') || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return query || header || bearer
}

function authorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET || ''

  if (process.env.NODE_ENV !== 'production' && (!expected || expected === 'change-me')) {
    return true
  }

  if (!expected || expected === 'change-me') return false

  return secretFromRequest(request) === expected
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
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
      data: parsed,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    data: parsed,
    error: null
  }
}

function firstRow(result: { data: any }) {
  return Array.isArray(result.data) ? result.data[0] : result.data
}

async function createRun() {
  const result = await rest('notification_cron_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([{ run_status: 'started', summary: {} }])
  })

  return result.ok ? firstRow(result) : null
}

async function finishRun(input: {
  runId?: string | null
  runStatus: 'completed' | 'failed'
  processedCount: number
  sentCount: number
  failedCount: number
  skippedCount: number
  summary: Record<string, unknown>
  errorMessage?: string | null
}) {
  if (!input.runId) return

  await rest('notification_cron_runs?id=eq.' + encodeURIComponent(input.runId), {
    method: 'PATCH',
    body: JSON.stringify({
      run_status: input.runStatus,
      processed_count: input.processedCount,
      sent_count: input.sentCount,
      failed_count: input.failedCount,
      skipped_count: input.skippedCount,
      summary: input.summary,
      error_message: input.errorMessage || null,
      finished_at: new Date().toISOString()
    })
  })
}

async function createLog(notification: AnyRow, status: string) {
  await rest('notification_delivery_logs', {
    method: 'POST',
    body: JSON.stringify([
      {
        notification_id: notification.id,
        channel: notification.channel || 'app',
        provider: 'simulation',
        delivery_status: status,
        provider_message_id: `sim-${notification.id}-${Date.now()}`,
        request_payload: {
          title: notification.title,
          body: notification.body,
          recipient_role: notification.recipient_role,
          recipient_name: notification.recipient_name,
          recipient_phone: notification.recipient_phone
        },
        response_payload: {
          simulated: true,
          delivered_at: new Date().toISOString()
        },
        created_by_role: 'cron'
      }
    ])
  })
}

async function processNotifications(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, message: 'CRON_SECRET이 필요합니다.' }, { status: 401 })
  }

  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit') || 20), 1), 50)
  const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true'
  const run = await createRun()

  let processedCount = 0
  let sentCount = 0
  let failedCount = 0
  let skippedCount = 0
  const results: Array<Record<string, unknown>> = []

  try {
    const queued = await rest('notification_outbox?select=*&status=eq.queued&order=created_at.asc&limit=' + limit)

    if (!queued.ok) {
      throw new Error(typeof queued.error === 'string' ? queued.error : JSON.stringify(queued.error))
    }

    const queueItems = Array.isArray(queued.data) ? queued.data : []

    for (const notification of queueItems) {
      processedCount += 1

      if (dryRun) {
        skippedCount += 1
        results.push({ id: notification.id, status: 'skipped' })
        continue
      }

      const now = new Date().toISOString()
      const patch = await rest('notification_outbox?id=eq.' + encodeURIComponent(notification.id), {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          status: 'sent',
          delivery_attempts: Number(notification.delivery_attempts || 0) + 1,
          provider: 'simulation',
          provider_message_id: `sim-${notification.id}-${Date.now()}`,
          sent_at: now,
          failed_at: null,
          error_message: null,
          updated_at: now
        })
      })

      if (patch.ok) {
        sentCount += 1
        await createLog(notification, 'sent')
        results.push({ id: notification.id, status: 'sent' })
      } else {
        failedCount += 1
        results.push({ id: notification.id, status: 'failed', error: patch.error })
      }
    }

    await finishRun({
      runId: run?.id || null,
      runStatus: 'completed',
      processedCount,
      sentCount,
      failedCount,
      skippedCount,
      summary: { limit, dryRun, results }
    })

    return NextResponse.json({
      ok: true,
      message: dryRun ? `${skippedCount}건 dry run 확인` : `${sentCount}건 발송 완료, ${failedCount}건 실패`,
      processedCount,
      sentCount,
      failedCount,
      skippedCount,
      results
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알림 자동 발송 중 오류가 발생했습니다.'

    await finishRun({
      runId: run?.id || null,
      runStatus: 'failed',
      processedCount,
      sentCount,
      failedCount,
      skippedCount,
      summary: { limit, dryRun, results },
      errorMessage
    })

    return NextResponse.json({
      ok: false,
      message: errorMessage,
      processedCount,
      sentCount,
      failedCount,
      skippedCount,
      results
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return processNotifications(request)
}

export async function POST(request: NextRequest) {
  return processNotifications(request)
}
