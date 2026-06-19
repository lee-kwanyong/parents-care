import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>
type SlotKey = 'morning' | 'lunch' | 'evening'

type Schedule = {
  breakfastTime: string
  lunchTime: string
  dinnerTime: string
  morningMedication: boolean
  noonMedication: boolean
  eveningMedication: boolean
  reminderDelayMinutes: number
  escalationDelayMinutes: number
}

type SlotState = {
  mealStatus: string
  medicationStatus: string
  conditionStatus: string
  emergency: boolean
  complete: boolean
  needsAttention: boolean
  responded: boolean
  snoozedUntil: string | null
}

type RoutineView = {
  ok: boolean
  date: string
  schedule: Schedule
  slots: Record<SlotKey, SlotState>
}

const SLOT_LABELS: Record<SlotKey, string> = {
  morning: '아침',
  lunch: '점심',
  evening: '저녁'
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET || ''
  const token = text(request.nextUrl.searchParams.get('token'))
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')

  if (secret && (token === secret || auth === secret)) return true

  const userAgent = text(request.headers.get('user-agent')).toLowerCase()
  return !secret && userAgent.includes('vercel-cron')
}

function supabaseBaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function restBaseUrl() {
  const base = supabaseBaseUrl()
  return base ? `${base}/rest/v1` : ''
}

type RestResult = {
  ok: boolean
  rows: Row[]
  error?: string
}

async function restRows(
  table: string,
  params: Record<string, string>
): Promise<RestResult> {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [],
      error: 'Supabase 환경변수가 설정되지 않았습니다.'
    }
  }

  const search = new URLSearchParams(params)

  try {
    const response = await fetch(`${base}/${table}?${search.toString()}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = []

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      parsed = []
    }

    if (!response.ok) {
      return {
        ok: false,
        rows: [],
        error: `${table}: ${response.status} ${raw.slice(0, 240)}`
      }
    }

    return {
      ok: true,
      rows: Array.isArray(parsed) ? parsed as Row[] : []
    }
  } catch (error) {
    return {
      ok: false,
      rows: [],
      error: error instanceof Error ? error.message : 'fetch failed'
    }
  }
}

async function insertRow(table: string, row: Row): Promise<RestResult> {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [],
      error: 'Supabase 환경변수가 설정되지 않았습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/${table}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(row),
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = []

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      parsed = []
    }

    if (!response.ok) {
      return {
        ok: false,
        rows: [],
        error: `${table}: ${response.status} ${raw.slice(0, 300)}`
      }
    }

    return {
      ok: true,
      rows: Array.isArray(parsed) ? parsed as Row[] : []
    }
  } catch (error) {
    return {
      ok: false,
      rows: [],
      error: error instanceof Error ? error.message : 'fetch failed'
    }
  }
}

function kstInfo(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const hour = Number(values.hour || '0')
  const minute = Number(values.minute || '0')

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minuteOfDay: hour * 60 + minute
  }
}

function toMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function slotTime(schedule: Schedule, slot: SlotKey) {
  if (slot === 'morning') return schedule.breakfastTime
  if (slot === 'lunch') return schedule.lunchTime
  return schedule.dinnerTime
}

function slotHasAnyResponse(state: SlotState) {
  return (
    state.responded ||
    state.mealStatus !== 'unknown' ||
    (state.medicationStatus !== 'unknown' && state.medicationStatus !== 'not_applicable')
  )
}

function kstDayRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00+09:00`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

async function reminderAlreadyRecorded(
  familyCode: string,
  date: string,
  slot: SlotKey,
  stage: number
) {
  const key = `${date}:${slot}:stage${stage}`
  const range = kstDayRange(date)
  const result = await restRows('care_response_requests', {
    select: 'id',
    family_code: `eq.${familyCode}`,
    signal_type: 'eq.routine_reminder_sent',
    signal_label: `eq.${key}`,
    created_at: `gte.${range.start}`,
    and: `(created_at.lt.${range.end})`,
    limit: '1'
  })

  return result.ok && result.rows.length > 0
}

async function queueNotification(row: Row) {
  const primary = await insertRow('notification_outbox', row)
  if (primary.ok) return { ok: true, table: 'notification_outbox' }

  const fallback = await insertRow('anbu_notification_outbox', row)
  return {
    ok: fallback.ok,
    table: fallback.ok ? 'anbu_notification_outbox' : null,
    error: fallback.error || primary.error
  }
}

async function recordReminder(input: {
  family: Row
  familyCode: string
  date: string
  slot: SlotKey
  stage: number
  queued: boolean
  target: 'parent' | 'guardian'
  queueError?: string
}) {
  const key = `${input.date}:${input.slot}:stage${input.stage}`

  return insertRow('care_response_requests', {
    family_code: input.familyCode,
    parent_name: text(input.family.parent_name) || '부모님',
    guardian_name: text(input.family.guardian_name) || '보호자',
    signal_type: 'routine_reminder_sent',
    signal_label: key,
    request_type: 'parent_checkin',
    risk_level: input.stage === 1 ? 'low' : 'medium',
    status: input.queued ? 'completed' : 'manual_needed',
    payload: {
      source: 'parent_routine_cron',
      slot: input.slot,
      stage: input.stage,
      target: input.target,
      queued: input.queued,
      queueError: input.queueError || null,
      reminderMeaning: '미응답은 미확인이며 식사 또는 복약 미실시를 뜻하지 않음',
      createdAt: new Date().toISOString()
    }
  })
}

function dedupeFamilies(rows: Row[]) {
  const seen = new Set<string>()
  const result: Row[] = []

  for (const row of rows) {
    const code = text(row.family_code)
    if (!code || seen.has(code)) continue
    seen.add(code)
    result.push(row)
  }

  return result
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Cron 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const familyResult = await restRows('anbu_family_links', {
    select: '*',
    order: 'created_at.desc',
    limit: '1000'
  })

  if (!familyResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 목록을 불러오지 못했습니다.',
        detail: familyResult.error
      },
      { status: 500 }
    )
  }

  const now = kstInfo()
  const families = dedupeFamilies(familyResult.rows)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, '')
  const slotKeys: SlotKey[] = ['morning', 'lunch', 'evening']
  const results: Row[] = []

  for (const family of families) {
    const familyCode = text(family.family_code)

    try {
      const viewResponse = await fetch(
        new URL(
          `/api/parent-routine-checkin?familyCode=${encodeURIComponent(familyCode)}`,
          request.nextUrl.origin
        ),
        {
          headers: {
            Authorization: process.env.CRON_SECRET
              ? `Bearer ${process.env.CRON_SECRET}`
              : ''
          },
          cache: 'no-store'
        }
      )

      const view = await viewResponse.json().catch(() => ({})) as RoutineView

      if (!viewResponse.ok || !view.ok) {
        results.push({
          familyCode,
          ok: false,
          reason: 'routine_view_failed'
        })
        continue
      }

      for (const slot of slotKeys) {
        const state = view.slots[slot]
        if (!state) continue
        if (state.complete || state.needsAttention || state.emergency) continue

        if (state.snoozedUntil) {
          const snoozedUntil = Date.parse(state.snoozedUntil)
          if (Number.isFinite(snoozedUntil) && Date.now() < snoozedUntil) continue
        }

        const due = toMinutes(slotTime(view.schedule, slot))
        const firstDue = due + view.schedule.reminderDelayMinutes
        const escalationDue = due + view.schedule.escalationDelayMinutes

        if (now.minuteOfDay < firstDue) continue

        const stage = now.minuteOfDay >= escalationDue ? 2 : 1
        const alreadyRecorded = await reminderAlreadyRecorded(
          familyCode,
          now.date,
          slot,
          stage
        )

        if (alreadyRecorded) continue

        const parentName = text(family.parent_name) || '부모님'
        const guardianName = text(family.guardian_name) || '보호자'
        const parentPhone = text(family.parent_phone).replace(/[^\d+]/g, '')
        const guardianPhone = text(family.guardian_phone).replace(/[^\d+]/g, '')
        const hasResponse = slotHasAnyResponse(state)
        const target = stage === 1 ? 'parent' as const : 'guardian' as const
        const toPhone = stage === 1 ? parentPhone : guardianPhone
        const toName = stage === 1 ? parentName : guardianName
        const title =
          stage === 1
            ? `${SLOT_LABELS[slot]} 안부를 확인해주세요`
            : `${SLOT_LABELS[slot]} 안부 미응답 확인 필요`
        const body =
          stage === 1
            ? `[안부웍스] ${parentName}님, ${SLOT_LABELS[slot]} 식사와 약을 확인해주세요. 정상적인 날에는 “모두 했어요” 한 번만 누르면 됩니다.\n\n${siteUrl}/parent/today`
            : `[안부웍스] ${parentName}님의 ${SLOT_LABELS[slot]} 안부가 아직 ${hasResponse ? '일부만 확인되었습니다' : '응답되지 않았습니다'}. 이는 식사나 복약을 하지 않았다는 뜻이 아니라 “미확인” 상태입니다. 가능하면 전화로 확인해주세요.\n\n${siteUrl}/child/dashboard`

        if (!toPhone) {
          await recordReminder({
            family,
            familyCode,
            date: now.date,
            slot,
            stage,
            queued: false,
            target,
            queueError: `${target}_phone_missing`
          })

          results.push({
            familyCode,
            slot,
            stage,
            ok: false,
            reason: `${target}_phone_missing`
          })
          continue
        }

        const queued = await queueNotification({
          family_code: familyCode,
          channel: 'sms',
          to_name: toName,
          to_phone: toPhone,
          title,
          body,
          template_code: stage === 1 ? 'parent-routine-reminder' : 'guardian-routine-escalation',
          reason: stage === 1 ? 'parent-routine-reminder' : 'guardian-routine-escalation',
          target_url: stage === 1 ? `${siteUrl}/parent/today` : `${siteUrl}/child/dashboard`,
          status: 'queued',
          payload: {
            source: 'parent_routine_cron',
            date: now.date,
            slot,
            stage,
            partialResponse: hasResponse,
            nonMedicalNotice: true
          }
        })

        await recordReminder({
          family,
          familyCode,
          date: now.date,
          slot,
          stage,
          queued: queued.ok,
          target,
          queueError: queued.error
        })

        results.push({
          familyCode,
          slot,
          stage,
          ok: queued.ok,
          table: queued.table || null,
          error: queued.error || null
        })
      }
    } catch (error) {
      results.push({
        familyCode,
        ok: false,
        reason: error instanceof Error ? error.message : 'unknown_error'
      })
    }
  }

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    familyCount: families.length,
    processed: results.length,
    results
  })
}
