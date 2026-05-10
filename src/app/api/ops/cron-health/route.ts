import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

async function rest(path: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) return { ok: false, data: [], error: 'Supabase 환경변수가 없습니다.' }

  const response = await fetch(base + '/rest/v1/' + path, {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })

  const text = await response.text()
  let parsed: any = null

  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }

  if (!response.ok) return { ok: false, data: [], error: parsed || text || response.statusText }
  return { ok: true, data: Array.isArray(parsed) ? parsed : [], error: null }
}

export async function GET() {
  const [runs, outbox, logs] = await Promise.all([
    rest('notification_cron_runs?select=*&order=created_at.desc&limit=30'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=200'),
    rest('notification_delivery_logs?select=*&order=created_at.desc&limit=100')
  ])

  const runItems = runs.data
  const outboxItems = outbox.data
  const logItems = logs.data

  const queued = outboxItems.filter((item: any) => item.status === 'queued')
  const failed = outboxItems.filter((item: any) => item.status === 'failed')
  const sent = outboxItems.filter((item: any) => item.status === 'sent')
  const lastRun = runItems[0] || null

  return NextResponse.json({
    ok: true,
    healthState: failed.length > 0 ? '확인 필요' : '정상',
    summary: {
      queued: queued.length,
      failed: failed.length,
      sent: sent.length,
      runCount: runItems.length,
      logCount: logItems.length
    },
    lastRun,
    runs: runItems,
    recentNotifications: outboxItems.slice(0, 20),
    logs: logItems.slice(0, 20),
    config: {
      notificationSendMode: process.env.NOTIFICATION_SEND_MODE || 'simulation',
      hasCronSecret: Boolean(process.env.CRON_SECRET),
      vercelCronPath: '/api/cron/notifications'
    },
    errors: [runs, outbox, logs].filter((item) => !item.ok).map((item) => ({ error: item.error }))
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const limit = Math.min(Math.max(Number(body.limit || 10), 1), 50)
  const dryRun = body.dryRun === true

  const url = new URL('/api/cron/notifications', request.url)
  url.searchParams.set('limit', String(limit))
  if (dryRun) url.searchParams.set('dryRun', 'true')

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: 'Bearer ' + (process.env.CRON_SECRET || '')
    },
    cache: 'no-store'
  })

  const responseText = await response.text()
  let parsed: any = null

  try {
    parsed = responseText ? JSON.parse(responseText) : null
  } catch {
    parsed = responseText
  }

  return NextResponse.json({
    ok: response.ok,
    message: response.ok ? '자동 발송 워커를 실행했습니다.' : '자동 발송 실행 중 오류가 발생했습니다.',
    cronResponse: parsed
  }, { status: response.ok ? 200 : 500 })
}
