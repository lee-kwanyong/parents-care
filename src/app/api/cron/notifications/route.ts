import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>

type SendResult = {
  ok: boolean
  status: 'sent' | 'failed' | 'skipped'
  provider: string
  providerMessageId?: string | null
  title?: string
  body?: string
  errorMessage?: string | null
  requestPayload?: Record<string, unknown>
  responsePayload?: Record<string, unknown>
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

function getSecretFromRequest(request: NextRequest) {
  const querySecret = request.nextUrl.searchParams.get('secret') || ''
  const headerSecret = request.headers.get('x-cron-secret') || ''
  const authHeader = request.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  return querySecret || headerSecret || bearer
}

function isAuthorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET || ''

  if (process.env.NODE_ENV !== 'production' && (!expected || expected === 'change-me')) {
    return true
  }

  if (!expected || expected === 'change-me') {
    return false
  }

  return getSecretFromRequest(request) === expected
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

async function createRun() {
  const result = await rest('notification_cron_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        run_status: 'started',
        started_at: new Date().toISOString(),
        summary: {}
      }
    ])
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
  if (!input.runId) return null

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

  return null
}

async function fetchQueued(limit: number) {
  const result = await rest(
    'notification_outbox?select=*&status=eq.queued&order=created_at.asc&limit=' + limit
  )

  if (!result.ok) {
    throw new Error(typeof result.error === 'string' ? result.error : JSON.stringify(result.error))
  }

  return Array.isArray(result.data) ? result.data : []
}

async function fetchTemplate(templateCode: string, channel: string) {
  if (!templateCode) return null

  const byTemplateCode = await rest(
    'notification_templates?select=*&template_code=eq.' +
      encodeURIComponent(templateCode) +
      '&channel=eq.' +
      encodeURIComponent(channel || 'app') +
      '&limit=1'
  )

  if (byTemplateCode.ok && Array.isArray(byTemplateCode.data) && byTemplateCode.data[0]) {
    return byTemplateCode.data[0]
  }

  const byCode = await rest(
    'notification_templates?select=*&code=eq.' +
      encodeURIComponent(templateCode) +
      '&channel=eq.' +
      encodeURIComponent(channel || 'app') +
      '&limit=1'
  )

  if (byCode.ok && Array.isArray(byCode.data) && byCode.data[0]) {
    return byCode.data[0]
  }

  return null
}

function renderTemplate(template: string, variables: Record<string, unknown>) {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, key) => {
    const value = variables[String(key).trim()]
    if (value === null || value === undefined) return ''
    return String(value)
  })
}

async function buildMessage(notification: AnyRow) {
  const channel = text(notification.channel) || 'app'
  const templateCode = text(notification.template_code)
  const payload = asRecord(notification.payload)
  const template = await fetchTemplate(templateCode, channel)

  const variables: Record<string, unknown> = {
    ...payload,
    elder_name: notification.elder_name || payload.elder_name || '부모님',
    recipient_name: notification.recipient_name || payload.recipient_name || '',
    recipient_phone: notification.recipient_phone || payload.recipient_phone || '',
    recipient_role: notification.recipient_role || payload.recipient_role || '',
    template_code: templateCode,
    title: notification.title || '',
    body: notification.body || ''
  }

  const titleTemplate =
    text(template?.title_template) ||
    text(template?.title) ||
    text(notification.title) ||
    '알림'

  const bodyTemplate =
    text(template?.body_template) ||
    text(template?.body) ||
    text(notification.body) ||
    ''

  return {
    channel,
    templateCode,
    title: renderTemplate(titleTemplate, variables),
    body: renderTemplate(bodyTemplate, variables),
    variables,
    template
  }
}

async function simulateSend(notification: AnyRow): Promise<SendResult> {
  const message = await buildMessage(notification)
  const sendMode = process.env.NOTIFICATION_SEND_MODE || 'simulation'
  const provider = sendMode === 'live' ? message.channel : 'simulation'

  if (sendMode === 'live' && message.channel !== 'app') {
    const hasKakao =
      Boolean(process.env.KAKAO_ALIMTALK_API_KEY) &&
      Boolean(process.env.KAKAO_CHANNEL_ID)

    if ((message.channel === 'kakao' || message.channel === 'alimtalk') && !hasKakao) {
      return {
        ok: false,
        status: 'failed',
        provider,
        title: message.title,
        body: message.body,
        errorMessage: '카카오 알림톡 환경변수가 없어 live 발송을 할 수 없습니다.',
        requestPayload: {
          notification_id: notification.id,
          channel: message.channel,
          template_code: message.templateCode
        },
        responsePayload: {
          mode: sendMode,
          provider_ready: false
        }
      }
    }

    return {
      ok: false,
      status: 'failed',
      provider,
      title: message.title,
      body: message.body,
      errorMessage: 'live 발송 provider가 아직 구현되지 않았습니다. NOTIFICATION_SEND_MODE=simulation으로 사용하세요.',
      requestPayload: {
        notification_id: notification.id,
        channel: message.channel,
        template_code: message.templateCode
      },
      responsePayload: {
        mode: sendMode,
        implemented: false
      }
    }
  }

  return {
    ok: true,
    status: 'sent',
    provider: 'simulation',
    providerMessageId: `sim-${notification.id}-${Date.now()}`,
    title: message.title,
    body: message.body,
    requestPayload: {
      notification_id: notification.id,
      channel: message.channel,
      template_code: message.templateCode,
      recipient_role: notification.recipient_role,
      recipient_name: notification.recipient_name,
      recipient_phone: notification.recipient_phone,
      title: message.title,
      body: message.body
    },
    responsePayload: {
      simulated: true,
      mode: sendMode,
      delivered_at: new Date().toISOString()
    }
  }
}

async function updateNotification(notification: AnyRow, sendResult: SendResult) {
  const now = new Date().toISOString()
  const nextAttempts = Number(notification.delivery_attempts || 0) + 1

  const patchPayload: Record<string, unknown> = {
    status: sendResult.status === 'sent' ? 'sent' : 'failed',
    delivery_attempts: nextAttempts,
    provider: sendResult.provider,
    provider_message_id: sendResult.providerMessageId || null,
    error_message: sendResult.errorMessage || null,
    updated_at: now
  }

  if (sendResult.status === 'sent') {
    patchPayload.sent_at = now
    patchPayload.failed_at = null
  }

  if (sendResult.status === 'failed') {
    patchPayload.failed_at = now
  }

  const fullPatch = await rest('notification_outbox?id=eq.' + encodeURIComponent(notification.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patchPayload)
  })

  if (fullPatch.ok) return firstRow(fullPatch)

  const fallbackPatch = await rest('notification_outbox?id=eq.' + encodeURIComponent(notification.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      status: patchPayload.status,
      updated_at: now
    })
  })

  return fallbackPatch.ok ? firstRow(fallbackPatch) : null
}

async function createDeliveryLog(notification: AnyRow, sendResult: SendResult) {
  await rest('notification_delivery_logs', {
    method: 'POST',
    body: JSON.stringify([
      {
        notification_id: notification.id,
        channel: notification.channel || 'app',
        provider: sendResult.provider,
        delivery_status: sendResult.status,
        provider_message_id: sendResult.providerMessageId || null,
        request_payload: sendResult.requestPayload || {},
        response_payload: sendResult.responsePayload || {},
        error_message: sendResult.errorMessage || null,
        created_by_role: 'cron'
      }
    ])
  })
}

async function processNotifications(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'CRON_SECRET이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get('limit') || 20), 1),
    50
  )

  const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true'
  const run = await createRun()

  let processedCount = 0
  let sentCount = 0
  let failedCount = 0
  let skippedCount = 0
  const results: Array<Record<string, unknown>> = []

  try {
    const queued = await fetchQueued(limit)

    for (const notification of queued) {
      processedCount += 1

      if (dryRun) {
        skippedCount += 1
        results.push({
          id: notification.id,
          status: 'skipped',
          title: notification.title,
          reason: 'dryRun'
        })
        continue
      }

      const sendResult = await simulateSend(notification)

      if (sendResult.status === 'sent') sentCount += 1
      if (sendResult.status === 'failed') failedCount += 1

      await updateNotification(notification, sendResult)
      await createDeliveryLog(notification, sendResult)

      results.push({
        id: notification.id,
        status: sendResult.status,
        provider: sendResult.provider,
        providerMessageId: sendResult.providerMessageId || null,
        errorMessage: sendResult.errorMessage || null
      })
    }

    await finishRun({
      runId: run?.id || null,
      runStatus: 'completed',
      processedCount,
      sentCount,
      failedCount,
      skippedCount,
      summary: {
        limit,
        dryRun,
        results
      }
    })

    return NextResponse.json({
      ok: true,
      message: dryRun
        ? `${skippedCount}건을 dry run으로 확인했습니다.`
        : `${sentCount}건 발송 완료, ${failedCount}건 실패 처리했습니다.`,
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
      summary: {
        limit,
        dryRun,
        results
      },
      errorMessage
    })

    return NextResponse.json(
      {
        ok: false,
        message: errorMessage,
        processedCount,
        sentCount,
        failedCount,
        skippedCount,
        results
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return processNotifications(request)
}

export async function POST(request: NextRequest) {
  return processNotifications(request)
}
