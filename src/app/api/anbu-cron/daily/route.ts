import { NextRequest, NextResponse } from 'next/server'
import {
  dispatchNotification,
  supabaseInsert,
  supabasePatch,
  supabaseSelect,
  text
} from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type FamilyRow = {
  family_code?: string
  parent_name?: string
  parent_phone?: string
  guardian_name?: string
  guardian_phone?: string
  link_status?: string
}

type ScheduleRow = {
  id?: string
  family_code?: string
  schedule_type?: string
  title?: string
  schedule_date?: string
  schedule_time?: string
  memo?: string
  enabled?: boolean
}

function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/[^\d+]/g, '')
}

function checkCronSecret(request: NextRequest) {
  const secret = process.env.CRON_SECRET || ''

  if (!secret) return true

  const authorization = request.headers.get('authorization') || ''
  const bearerToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''

  const provided =
    bearerToken ||
    request.headers.get('x-cron-secret') ||
    request.nextUrl.searchParams.get('secret') ||
    ''

  return provided === secret
}

function getInsertedId(result: Awaited<ReturnType<typeof supabaseInsert>>) {
  if (!result.ok || !Array.isArray(result.data)) return ''
  const row = result.data[0] as { id?: string } | undefined
  return row?.id || ''
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

function todayKstDate() {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

function startOfTodayKstIso() {
  const today = todayKstDate()
  const utc = new Date(`${today}T00:00:00+09:00`)
  return utc.toISOString()
}

function hoursAgoIso(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function appUrl(request: NextRequest, path: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.nextUrl.origin

  return base.replace(/\/$/, '') + path
}

async function alreadySent(input: {
  familyCode: string
  reason: string
  sinceIso: string
}) {
  const result = await supabaseSelect(
    'anbu_notification_outbox?select=id&family_code=eq.' +
      encodeURIComponent(input.familyCode) +
      '&reason=eq.' +
      encodeURIComponent(input.reason) +
      '&created_at=gte.' +
      encodeURIComponent(input.sinceIso) +
      '&limit=1'
  )

  return result.ok && Array.isArray(result.data) && result.data.length > 0
}

async function hasRecentCheckin(familyCode: string, sinceIso: string) {
  const result = await supabaseSelect(
    'daily_care_checkins?select=id&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&occurred_at=gte.' +
      encodeURIComponent(sinceIso) +
      '&limit=1'
  )

  return result.ok && Array.isArray(result.data) && result.data.length > 0
}

async function insertAndDispatch(input: {
  familyCode: string
  channel: 'sms'
  toName: string
  toPhone: string
  title: string
  body: string
  reason: string
  targetUrl: string
  dryRun: boolean
}) {
  const payload = {
    channel: input.channel,
    toName: input.toName,
    toPhone: input.toPhone,
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
      payload
    }
  }

  const outbox = await supabaseInsert('anbu_notification_outbox', {
    channel: input.channel,
    to_name: input.toName,
    to_phone: input.toPhone,
    title: input.title,
    body: input.body,
    family_code: input.familyCode || null,
    reason: input.reason,
    target_url: input.targetUrl,
    status: 'queued',
    payload
  })

  const dispatchResult = await dispatchNotification(payload)
  const nextStatus = statusFromDispatchResult(dispatchResult)
  const outboxId = getInsertedId(outbox)

  if (outboxId) {
    await supabasePatch(
      'anbu_notification_outbox?id=eq.' + encodeURIComponent(outboxId),
      {
        status: nextStatus,
        provider:
          typeof dispatchResult === 'object' &&
          dispatchResult &&
          'mode' in dispatchResult
            ? String((dispatchResult as { mode?: string }).mode || '')
            : 'unknown',
        sent_at: nextStatus === 'sent' ? new Date().toISOString() : null,
        payload: {
          original: payload,
          dispatchResult
        }
      }
    )
  }

  await supabaseInsert('anbu_integration_events', {
    event_type: 'auto_notification_dispatch',
    provider:
      typeof dispatchResult === 'object' &&
      dispatchResult &&
      'mode' in dispatchResult
        ? String((dispatchResult as { mode?: string }).mode || '')
        : 'unknown',
    status: nextStatus,
    payload: {
      outboxId,
      notification: payload,
      dispatchResult
    }
  })

  return {
    ok: nextStatus === 'sent',
    status: nextStatus,
    outboxId,
    dispatchResult
  }
}

async function loadFamilies() {
  const result = await supabaseSelect(
    'anbu_family_links?select=family_code,parent_name,parent_phone,guardian_name,guardian_phone,link_status&link_status=eq.active&limit=500'
  )

  if (!result.ok || !Array.isArray(result.data)) {
    return {
      ok: false,
      error: result.error,
      families: [] as FamilyRow[]
    }
  }

  return {
    ok: true,
    error: null,
    families: result.data as FamilyRow[]
  }
}

async function loadTodaySchedules(familyCode: string) {
  const today = todayKstDate()

  const result = await supabaseSelect(
    'anbu_schedules?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&schedule_date=eq.' +
      encodeURIComponent(today) +
      '&enabled=eq.true&limit=50'
  )

  if (!result.ok || !Array.isArray(result.data)) return []
  return result.data as ScheduleRow[]
}

async function processParentMorningPrompt(request: NextRequest, family: FamilyRow, dryRun: boolean) {
  const familyCode = text(family.family_code)
  const parentPhone = normalizePhone(family.parent_phone || '')
  const parentName = text(family.parent_name) || '부모님'

  if (!familyCode || !parentPhone) {
    return {
      type: 'parent-morning-prompt',
      skipped: true,
      reason: 'missing_family_code_or_parent_phone',
      familyCode
    }
  }

  const reason = 'daily-parent-check'
  const todayStart = startOfTodayKstIso()

  if (await alreadySent({ familyCode, reason, sinceIso: todayStart })) {
    return {
      type: 'parent-morning-prompt',
      skipped: true,
      reason: 'already_sent_today',
      familyCode
    }
  }

  return {
    type: 'parent-morning-prompt',
    familyCode,
    result: await insertAndDispatch({
      familyCode,
      channel: 'sms',
      toName: parentName,
      toPhone: parentPhone,
      title: '오늘 안부 체크',
      body:
        `${parentName}, 오늘 식사·약·몸 상태를 버튼으로 알려주세요.\n` +
        `안부 체크: ${appUrl(request, '/parent/today')}`,
      reason,
      targetUrl: appUrl(request, '/parent/today'),
      dryRun
    })
  }
}

async function processNoResponseGuardianAlert(request: NextRequest, family: FamilyRow, dryRun: boolean) {
  const familyCode = text(family.family_code)
  const guardianPhone = normalizePhone(family.guardian_phone || '')
  const guardianName = text(family.guardian_name) || '보호자'
  const parentName = text(family.parent_name) || '부모님'

  if (!familyCode || !guardianPhone) {
    return {
      type: 'guardian-no-response',
      skipped: true,
      reason: 'missing_family_code_or_guardian_phone',
      familyCode
    }
  }

  const noResponseSince = hoursAgoIso(12)
  const alertSince = hoursAgoIso(12)

  if (await hasRecentCheckin(familyCode, noResponseSince)) {
    return {
      type: 'guardian-no-response',
      skipped: true,
      reason: 'recent_checkin_exists',
      familyCode
    }
  }

  const reason = 'no-response'

  if (await alreadySent({ familyCode, reason, sinceIso: alertSince })) {
    return {
      type: 'guardian-no-response',
      skipped: true,
      reason: 'already_alerted_recently',
      familyCode
    }
  }

  return {
    type: 'guardian-no-response',
    familyCode,
    result: await insertAndDispatch({
      familyCode,
      channel: 'sms',
      toName: guardianName,
      toPhone: guardianPhone,
      title: '부모님 안부 응답 없음',
      body:
        `${parentName}의 안부 응답이 최근 12시간 동안 확인되지 않았습니다.\n` +
        `보호자 확인이 필요할 수 있습니다.\n` +
        `확인하기: ${appUrl(request, '/child/dashboard')}`,
      reason,
      targetUrl: appUrl(request, '/child/dashboard'),
      dryRun
    })
  }
}

async function processTodayScheduleAlerts(request: NextRequest, family: FamilyRow, dryRun: boolean) {
  const familyCode = text(family.family_code)
  const guardianPhone = normalizePhone(family.guardian_phone || '')
  const guardianName = text(family.guardian_name) || '보호자'
  const parentName = text(family.parent_name) || '부모님'

  if (!familyCode || !guardianPhone) {
    return [
      {
        type: 'today-schedule',
        skipped: true,
        reason: 'missing_family_code_or_guardian_phone',
        familyCode
      }
    ]
  }

  const schedules = await loadTodaySchedules(familyCode)

  if (schedules.length === 0) {
    return [
      {
        type: 'today-schedule',
        skipped: true,
        reason: 'no_schedule_today',
        familyCode
      }
    ]
  }

  const todayStart = startOfTodayKstIso()
  const results = []

  for (const schedule of schedules) {
    const scheduleId = text(schedule.id)
    const reason = scheduleId ? `schedule-${scheduleId}` : 'schedule-today'

    if (await alreadySent({ familyCode, reason, sinceIso: todayStart })) {
      results.push({
        type: 'today-schedule',
        skipped: true,
        reason: 'already_sent_today',
        familyCode,
        scheduleId
      })
      continue
    }

    const scheduleTitle = text(schedule.title) || text(schedule.schedule_type) || '오늘 일정'
    const scheduleTime = text(schedule.schedule_time)

    results.push({
      type: 'today-schedule',
      familyCode,
      scheduleId,
      result: await insertAndDispatch({
        familyCode,
        channel: 'sms',
        toName: guardianName,
        toPhone: guardianPhone,
        title: '오늘 부모님 일정',
        body:
          `${parentName}의 오늘 일정이 있습니다.\n` +
          `일정: ${scheduleTitle}${scheduleTime ? `\n시간: ${scheduleTime}` : ''}` +
          `${schedule.memo ? `\n메모: ${schedule.memo}` : ''}\n` +
          `확인하기: ${appUrl(request, '/child/dashboard')}`,
        reason,
        targetUrl: appUrl(request, '/child/dashboard'),
        dryRun
      })
    })
  }

  return results
}

async function handleDailyAutomation(request: NextRequest) {
  if (!checkCronSecret(request)) {
    return NextResponse.json(
      { ok: false, message: 'Cron Secret이 올바르지 않습니다.' },
      { status: 401 }
    )
  }

  const dryRun =
    request.nextUrl.searchParams.get('dryRun') === '1' ||
    request.nextUrl.searchParams.get('dryRun') === 'true'

  const sendParentPrompt = request.nextUrl.searchParams.get('parentPrompt') !== '0'
  const sendNoResponse = request.nextUrl.searchParams.get('noResponse') !== '0'
  const sendSchedules = request.nextUrl.searchParams.get('schedules') !== '0'

  const loaded = await loadFamilies()

  if (!loaded.ok) {
    return NextResponse.json({
      ok: false,
      message: '가족 연결 데이터를 불러오지 못했습니다.',
      detail: loaded.error
    })
  }

  const results = []

  for (const family of loaded.families) {
    if (sendParentPrompt) {
      results.push(await processParentMorningPrompt(request, family, dryRun))
    }

    if (sendNoResponse) {
      results.push(await processNoResponseGuardianAlert(request, family, dryRun))
    }

    if (sendSchedules) {
      const scheduleResults = await processTodayScheduleAlerts(request, family, dryRun)
      results.push(...scheduleResults)
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    families: loaded.families.length,
    options: {
      sendParentPrompt,
      sendNoResponse,
      sendSchedules
    },
    todayKst: todayKstDate(),
    results
  })
}

export async function GET(request: NextRequest) {
  return handleDailyAutomation(request)
}

export async function POST(request: NextRequest) {
  return handleDailyAutomation(request)
}
