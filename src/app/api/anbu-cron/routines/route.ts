import { NextRequest, NextResponse } from 'next/server'
import { supabaseInsert, supabaseSelect, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getNowHHMM() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function isDue(scheduleTime: unknown, nowHHMM: string) {
  if (typeof scheduleTime !== 'string') return false
  const normalized = scheduleTime.slice(0, 5)
  return normalized === nowHHMM
}

async function createOutbox(item: Record<string, unknown>) {
  const title = `${text(item.title) || text(item.routine_label) || '안부 확인'} 알림`
  const body =
    text(item.memo) ||
    text(item.message) ||
    '부모님 안부 확인이 필요한 시간입니다.'

  return supabaseInsert('anbu_notification_outbox', {
    channel: 'app',
    family_code: text(item.family_code) || null,
    title,
    body,
    reason: 'routine',
    target_url: '/parent/today',
    status: 'queued',
    payload: {
      source: 'anbu-cron-routines',
      schedule: item
    }
  })
}

async function handleRoutine(request: NextRequest) {
  const secret = process.env.CRON_SECRET || ''
  const provided =
    request.headers.get('x-cron-secret') ||
    request.nextUrl.searchParams.get('secret') ||
    ''

  if (secret && provided !== secret) {
    return NextResponse.json(
      { ok: false, message: 'Cron Secret이 올바르지 않습니다.' },
      { status: 401 }
    )
  }

  const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {}
  const dryRun = Boolean(body.dryRun)
  const nowHHMM = text(body.nowHHMM) || getNowHHMM()

  const schedules = await supabaseSelect(
    'anbu_schedules?select=*&enabled=eq.true&limit=300'
  )

  if (!schedules.ok || !Array.isArray(schedules.data)) {
    return NextResponse.json({
      ok: false,
      message: '등록된 일정 테이블을 불러오지 못했습니다. Supabase SQL을 먼저 실행해주세요.',
      detail: schedules.error
    })
  }

  const dueItems = schedules.data.filter((item) => {
    const row = item as Record<string, unknown>
    return isDue(row.schedule_time || row.time || row.routine_time, nowHHMM)
  }) as Array<Record<string, unknown>>

  const created = []

  if (!dryRun) {
    for (const item of dueItems) {
      const result = await createOutbox(item)
      created.push(result)
    }
  }

  return NextResponse.json({
    ok: true,
    nowHHMM,
    count: dueItems.length,
    dryRun,
    dueItems,
    created
  })
}

export async function GET(request: NextRequest) {
  return handleRoutine(request)
}

export async function POST(request: NextRequest) {
  return handleRoutine(request)
}
