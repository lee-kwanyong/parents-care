import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>
type SlotKey = 'morning' | 'lunch' | 'evening'
type RoutineAction =
  | 'all_done'
  | 'meal_only'
  | 'medication_only'
  | 'meal_done'
  | 'medication_done'
  | 'meal_not_done'
  | 'medication_not_done'
  | 'later'
  | 'condition_issue'
  | 'need_help'

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

type StatusValue = 'done' | 'not_done' | 'unknown' | 'not_applicable' | 'needs_help'

type SlotState = {
  slot: SlotKey
  mealStatus: StatusValue
  medicationStatus: StatusValue
  conditionStatus: StatusValue
  emergency: boolean
  complete: boolean
  needsAttention: boolean
  responded: boolean
  lastAction: string
  lastLabel: string
  lastAt: string | null
  snoozedUntil: string | null
}

const DEFAULT_SCHEDULE: Schedule = {
  breakfastTime: '08:00',
  lunchTime: '12:30',
  dinnerTime: '18:30',
  morningMedication: true,
  noonMedication: false,
  eveningMedication: true,
  reminderDelayMinutes: 30,
  escalationDelayMinutes: 90
}

const SLOT_LABELS: Record<SlotKey, string> = {
  morning: '아침',
  lunch: '점심',
  evening: '저녁'
}

const ALLOWED_ACTIONS = new Set<RoutineAction>([
  'all_done',
  'meal_only',
  'medication_only',
  'meal_done',
  'medication_done',
  'meal_not_done',
  'medication_not_done',
  'later',
  'condition_issue',
  'need_help'
])

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanFamilyCode(value: unknown) {
  return text(value).replace(/[^\w-]/g, '').slice(0, 48)
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

function isTime(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return false
  const [hour, minute] = value.split(':').map(Number)
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

function toMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function parsePayload(value: unknown): Row {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Row
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Row
        : {}
    } catch {
      return {}
    }
  }

  return {}
}

function normalizeSchedule(value: unknown): Schedule {
  const input = parsePayload(value)

  const breakfastTime = isTime(input.breakfastTime)
    ? input.breakfastTime
    : DEFAULT_SCHEDULE.breakfastTime
  const lunchTime = isTime(input.lunchTime)
    ? input.lunchTime
    : DEFAULT_SCHEDULE.lunchTime
  const dinnerTime = isTime(input.dinnerTime)
    ? input.dinnerTime
    : DEFAULT_SCHEDULE.dinnerTime

  return {
    breakfastTime,
    lunchTime,
    dinnerTime,
    morningMedication: bool(input.morningMedication, DEFAULT_SCHEDULE.morningMedication),
    noonMedication: bool(input.noonMedication, DEFAULT_SCHEDULE.noonMedication),
    eveningMedication: bool(input.eveningMedication, DEFAULT_SCHEDULE.eveningMedication),
    reminderDelayMinutes: clampNumber(
      input.reminderDelayMinutes,
      DEFAULT_SCHEDULE.reminderDelayMinutes,
      10,
      180
    ),
    escalationDelayMinutes: clampNumber(
      input.escalationDelayMinutes,
      DEFAULT_SCHEDULE.escalationDelayMinutes,
      30,
      360
    )
  }
}

function scheduleIsOrdered(schedule: Schedule) {
  const breakfast = toMinutes(schedule.breakfastTime)
  const lunch = toMinutes(schedule.lunchTime)
  const dinner = toMinutes(schedule.dinnerTime)
  return breakfast < lunch && lunch < dinner
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

type RestRowsResult = {
  ok: boolean
  rows: Row[]
  error?: string
}

async function restRows(
  table: string,
  params: Record<string, string>
): Promise<RestRowsResult> {
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
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

async function insertRow(table: string, row: Row): Promise<RestRowsResult> {
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
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
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
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const hour = Number(values.hour || '0')
  const minute = Number(values.minute || '0')

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minuteOfDay: hour * 60 + minute,
    label: `${values.month}.${values.day} ${values.hour}:${values.minute}`,
    iso: date.toISOString()
  }
}

function kstDayRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00+09:00`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

function medicationEnabled(schedule: Schedule, slot: SlotKey) {
  if (slot === 'morning') return schedule.morningMedication
  if (slot === 'lunch') return schedule.noonMedication
  return schedule.eveningMedication
}

function slotTime(schedule: Schedule, slot: SlotKey) {
  if (slot === 'morning') return schedule.breakfastTime
  if (slot === 'lunch') return schedule.lunchTime
  return schedule.dinnerTime
}

function currentSlot(schedule: Schedule, minuteOfDay: number): SlotKey | null {
  const breakfast = toMinutes(schedule.breakfastTime)
  const lunch = toMinutes(schedule.lunchTime)
  const dinner = toMinutes(schedule.dinnerTime)
  const firstVisible = Math.max(0, breakfast - 90)
  const morningEnd = Math.floor((breakfast + lunch) / 2)
  const lunchEnd = Math.floor((lunch + dinner) / 2)

  if (minuteOfDay < firstVisible) return null
  if (minuteOfDay < morningEnd) return 'morning'
  if (minuteOfDay < lunchEnd) return 'lunch'
  return 'evening'
}

function nextSlotKey(current: SlotKey | null): SlotKey {
  if (current === 'morning') return 'lunch'
  if (current === 'lunch') return 'evening'
  return 'morning'
}

async function loadFamily(familyCode: string) {
  const result = await restRows('anbu_family_links', {
    select: '*',
    family_code: `eq.${familyCode}`,
    order: 'created_at.desc',
    limit: '1'
  })

  if (!result.ok) return { family: null, error: result.error }
  return { family: result.rows[0] || null, error: undefined }
}

async function loadSchedule(familyCode: string) {
  const result = await restRows('care_response_requests', {
    select: 'payload,created_at',
    family_code: `eq.${familyCode}`,
    signal_type: 'eq.routine_schedule',
    order: 'created_at.desc',
    limit: '1'
  })

  if (!result.ok || !result.rows[0]) {
    return {
      schedule: DEFAULT_SCHEDULE,
      source: 'default' as const,
      error: result.ok ? undefined : result.error
    }
  }

  const payload = parsePayload(result.rows[0].payload)
  const stored = payload.schedule ?? payload
  const schedule = normalizeSchedule(stored)

  return {
    schedule: scheduleIsOrdered(schedule) ? schedule : DEFAULT_SCHEDULE,
    source: 'saved' as const,
    error: undefined
  }
}

async function loadTodayRows(familyCode: string, dateString: string) {
  const range = kstDayRange(dateString)

  return restRows('care_response_requests', {
    select: 'id,signal_type,signal_label,risk_level,status,payload,created_at',
    family_code: `eq.${familyCode}`,
    created_at: `gte.${range.start}`,
    and: `(created_at.lt.${range.end})`,
    order: 'created_at.asc',
    limit: '300'
  })
}

function statusValue(value: unknown): StatusValue | null {
  if (
    value === 'done' ||
    value === 'not_done' ||
    value === 'unknown' ||
    value === 'not_applicable' ||
    value === 'needs_help'
  ) {
    return value
  }

  return null
}

function aggregateSlot(
  rows: Row[],
  slot: SlotKey,
  isMedicationEnabled: boolean
): SlotState {
  let mealStatus: StatusValue = 'unknown'
  let medicationStatus: StatusValue = isMedicationEnabled ? 'unknown' : 'not_applicable'
  let conditionStatus: StatusValue = 'unknown'
  let emergency = false
  let responded = false
  let lastAction = ''
  let lastLabel = ''
  let lastAt: string | null = null
  let snoozedUntil: string | null = null

  for (const row of rows) {
    if (!text(row.signal_type).startsWith('routine_')) continue
    if (text(row.signal_type) === 'routine_schedule') continue
    if (text(row.signal_type) === 'routine_reminder_sent') continue

    const payload = parsePayload(row.payload)
    if (text(payload.source) !== 'parent_routine') continue
    if (text(payload.slot) !== slot) continue

    const meal = statusValue(payload.mealStatus)
    const medication = statusValue(payload.medicationStatus)
    const condition = statusValue(payload.conditionStatus)

    if (meal && meal !== 'unknown') mealStatus = meal
    if (medication && medication !== 'unknown') medicationStatus = medication
    if (condition && condition !== 'unknown') conditionStatus = condition

    if (payload.emergency === true) emergency = true

    const action = text(payload.action)
    if (action && action !== 'later') responded = true

    if (text(payload.snoozeUntil)) {
      snoozedUntil = text(payload.snoozeUntil)
    }

    lastAction = action || lastAction
    lastLabel = text(row.signal_label) || lastLabel
    lastAt = text(row.created_at) || lastAt
  }

  const complete =
    mealStatus === 'done' &&
    (medicationStatus === 'done' || medicationStatus === 'not_applicable') &&
    conditionStatus !== 'needs_help' &&
    !emergency

  const needsAttention =
    mealStatus === 'not_done' ||
    medicationStatus === 'not_done' ||
    conditionStatus === 'needs_help' ||
    emergency

  return {
    slot,
    mealStatus,
    medicationStatus,
    conditionStatus,
    emergency,
    complete,
    needsAttention,
    responded,
    lastAction,
    lastLabel,
    lastAt,
    snoozedUntil
  }
}

async function buildView(familyCode: string, family?: Row | null) {
  const now = kstInfo()
  const scheduleResult = await loadSchedule(familyCode)
  const todayRowsResult = await loadTodayRows(familyCode, now.date)
  const rows = todayRowsResult.ok ? todayRowsResult.rows : []
  const slotKeys: SlotKey[] = ['morning', 'lunch', 'evening']
  const slots = Object.fromEntries(
    slotKeys.map((slot) => [
      slot,
      aggregateSlot(rows, slot, medicationEnabled(scheduleResult.schedule, slot))
    ])
  ) as Record<SlotKey, SlotState>

  const active = currentSlot(scheduleResult.schedule, now.minuteOfDay)
  const next = nextSlotKey(active)

  return {
    ok: true,
    date: now.date,
    generatedKst: now.label,
    family: {
      familyCode,
      parentName: text(family?.parent_name) || '부모님',
      guardianName: text(family?.guardian_name) || '보호자'
    },
    schedule: scheduleResult.schedule,
    scheduleSource: scheduleResult.source,
    currentSlot: active
      ? {
          key: active,
          label: SLOT_LABELS[active],
          time: slotTime(scheduleResult.schedule, active),
          medicationEnabled: medicationEnabled(scheduleResult.schedule, active)
        }
      : null,
    nextSlot: {
      key: next,
      label: SLOT_LABELS[next],
      time: slotTime(scheduleResult.schedule, next),
      medicationEnabled: medicationEnabled(scheduleResult.schedule, next)
    },
    slots,
    currentState: active ? slots[active] : null,
    sourceErrors: [scheduleResult.error, todayRowsResult.error].filter(Boolean)
  }
}

function actionMeta(
  action: RoutineAction,
  slot: SlotKey,
  schedule: Schedule
) {
  const label = SLOT_LABELS[slot]
  const hasMedication = medicationEnabled(schedule, slot)
  const base = {
    mealStatus: 'unknown' as StatusValue,
    medicationStatus: hasMedication ? 'unknown' as StatusValue : 'not_applicable' as StatusValue,
    conditionStatus: 'unknown' as StatusValue,
    emergency: false,
    snoozeUntil: null as string | null,
    riskLevel: 'low',
    status: 'completed',
    signalLabel: `${label} 안부 확인`
  }

  if (action === 'all_done') {
    return {
      ...base,
      mealStatus: 'done' as StatusValue,
      medicationStatus: hasMedication ? 'done' as StatusValue : 'not_applicable' as StatusValue,
      signalLabel: hasMedication
        ? `${label} 식사·복약 완료`
        : `${label} 식사 완료`
    }
  }

  if (action === 'meal_only' || action === 'meal_done') {
    return {
      ...base,
      mealStatus: 'done' as StatusValue,
      signalLabel: `${label} 식사 완료`
    }
  }

  if (action === 'medication_only' || action === 'medication_done') {
    return {
      ...base,
      medicationStatus: 'done' as StatusValue,
      signalLabel: `${label} 복약 완료`
    }
  }

  if (action === 'meal_not_done') {
    return {
      ...base,
      mealStatus: 'not_done' as StatusValue,
      riskLevel: 'medium',
      status: 'manual_needed',
      signalLabel: `${label} 식사 확인 필요`
    }
  }

  if (action === 'medication_not_done') {
    return {
      ...base,
      medicationStatus: 'not_done' as StatusValue,
      riskLevel: 'medium',
      status: 'manual_needed',
      signalLabel: `${label} 복약 확인 필요`
    }
  }

  if (action === 'later') {
    const snoozeUntil = new Date(
      Date.now() + schedule.reminderDelayMinutes * 60 * 1000
    ).toISOString()

    return {
      ...base,
      status: 'pending',
      snoozeUntil,
      signalLabel: `${label} ${schedule.reminderDelayMinutes}분 후 재알림`
    }
  }

  if (action === 'condition_issue') {
    return {
      ...base,
      conditionStatus: 'needs_help' as StatusValue,
      riskLevel: 'medium',
      status: 'manual_needed',
      signalLabel: `${label} 몸 상태 확인 필요`
    }
  }

  return {
    ...base,
    conditionStatus: 'needs_help' as StatusValue,
    emergency: true,
    riskLevel: 'high',
    status: 'manual_needed',
    signalLabel: `${label} 도움 요청`
  }
}

function guardianAlertText(action: RoutineAction, parentName: string, slot: SlotKey) {
  const label = SLOT_LABELS[slot]

  if (action === 'need_help') {
    return {
      title: '도움 요청 확인 필요',
      body: `[안부웍스] ${parentName}님이 “도움이 필요해요”를 눌렀습니다. 즉시 전화로 상태를 확인해주세요. 응급상황이면 119에 연락해주세요.`
    }
  }

  if (action === 'condition_issue') {
    return {
      title: '몸 상태 확인 필요',
      body: `[안부웍스] ${parentName}님이 ${label} 확인에서 몸이 불편하다고 응답했습니다. 가능한 한 빠르게 전화로 상태를 확인해주세요.`
    }
  }

  if (action === 'meal_not_done') {
    return {
      title: '식사 확인 필요',
      body: `[안부웍스] ${parentName}님의 ${label} 식사가 “확인 필요”로 기록되었습니다. 식사하지 않았다고 단정하지 말고 전화로 확인해주세요.`
    }
  }

  return {
    title: '복약 확인 필요',
    body: `[안부웍스] ${parentName}님의 ${label} 복약이 “확인 필요”로 기록되었습니다. 복약하지 않았다고 단정하지 말고 전화로 확인해주세요.`
  }
}

async function queueGuardianAlert(input: {
  familyCode: string
  family: Row
  action: RoutineAction
  slot: SlotKey
}) {
  if (
    input.action !== 'need_help' &&
    input.action !== 'condition_issue' &&
    input.action !== 'meal_not_done' &&
    input.action !== 'medication_not_done'
  ) {
    return {
      ok: true,
      skipped: true,
      reason: 'normal_or_partial_response'
    }
  }

  const guardianPhone = text(input.family.guardian_phone).replace(/[^\d+]/g, '')

  if (!guardianPhone) {
    return {
      ok: false,
      skipped: true,
      reason: 'guardian_phone_missing'
    }
  }

  const parentName = text(input.family.parent_name) || '부모님'
  const guardianName = text(input.family.guardian_name) || '보호자'
  const message = guardianAlertText(input.action, parentName, input.slot)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://parents-care.net').replace(/\/$/, '')
  const row = {
    family_code: input.familyCode,
    channel: 'sms',
    to_name: guardianName,
    to_phone: guardianPhone,
    title: message.title,
    body: message.body,
    template_code: 'parent-routine-alert',
    reason: 'parent-routine-alert',
    target_url: `${siteUrl}/child/dashboard`,
    status: 'queued',
    payload: {
      source: 'parent_routine',
      action: input.action,
      slot: input.slot,
      nonMedicalNotice: true
    }
  }

  const primary = await insertRow('notification_outbox', row)
  if (primary.ok) return { ok: true, table: 'notification_outbox' }

  const fallback = await insertRow('anbu_notification_outbox', row)
  return {
    ok: fallback.ok,
    table: fallback.ok ? 'anbu_notification_outbox' : null,
    error: fallback.error || primary.error
  }
}

function familyCodeFromRequest(request: NextRequest, bodyCode?: unknown) {
  return cleanFamilyCode(
    bodyCode ||
      request.cookies.get('pc_parent_invite_code')?.value ||
      request.cookies.get('anbu_family_code')?.value ||
      ''
  )
}

export async function GET(request: NextRequest) {
  const familyCode = familyCodeFromRequest(
    request,
    request.nextUrl.searchParams.get('familyCode')
  )

  if (!familyCode) {
    return NextResponse.json(
      {
        ok: false,
        message: '부모님 연결코드가 필요합니다.'
      },
      { status: 400 }
    )
  }

  const familyResult = await loadFamily(familyCode)

  if (!familyResult.family) {
    return NextResponse.json(
      {
        ok: false,
        message: '연결된 가족 정보를 찾지 못했습니다.',
        detail: familyResult.error
      },
      { status: familyResult.error ? 500 : 404 }
    )
  }

  return NextResponse.json(await buildView(familyCode, familyResult.family))
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as Row
  const familyCode = familyCodeFromRequest(request, body.familyCode)

  if (!familyCode) {
    return NextResponse.json(
      {
        ok: false,
        message: '부모님 연결코드가 필요합니다.'
      },
      { status: 400 }
    )
  }

  const familyResult = await loadFamily(familyCode)

  if (!familyResult.family) {
    return NextResponse.json(
      {
        ok: false,
        message: '연결된 가족 정보를 찾지 못했습니다.',
        detail: familyResult.error
      },
      { status: familyResult.error ? 500 : 404 }
    )
  }

  const mode = text(body.mode) || 'checkin'

  if (mode === 'save_schedule') {
    const schedule = normalizeSchedule(body.schedule)

    if (!scheduleIsOrdered(schedule)) {
      return NextResponse.json(
        {
          ok: false,
          message: '아침·점심·저녁 시간은 순서대로 설정해주세요.'
        },
        { status: 400 }
      )
    }

    if (schedule.escalationDelayMinutes <= schedule.reminderDelayMinutes) {
      return NextResponse.json(
        {
          ok: false,
          message: '보호자 확인 시간은 첫 재알림 시간보다 늦어야 합니다.'
        },
        { status: 400 }
      )
    }

    const insert = await insertRow('care_response_requests', {
      family_code: familyCode,
      parent_name: text(familyResult.family.parent_name) || '부모님',
      guardian_name: text(familyResult.family.guardian_name) || '보호자',
      signal_type: 'routine_schedule',
      signal_label: '부모님 식사·복약 일정 설정',
      request_type: 'parent_checkin',
      risk_level: 'low',
      status: 'completed',
      payload: {
        source: 'parent_routine_schedule',
        schedule,
        savedAt: new Date().toISOString()
      }
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '일정 저장에 실패했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...(await buildView(familyCode, familyResult.family)),
      message: '부모님별 확인 일정이 저장되었습니다.'
    })
  }

  const slot = text(body.slot) as SlotKey
  const action = text(body.action) as RoutineAction

  if (slot !== 'morning' && slot !== 'lunch' && slot !== 'evening') {
    return NextResponse.json(
      {
        ok: false,
        message: '확인 시간대가 올바르지 않습니다.'
      },
      { status: 400 }
    )
  }

  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(
      {
        ok: false,
        message: '확인 버튼 값이 올바르지 않습니다.'
      },
      { status: 400 }
    )
  }

  const scheduleResult = await loadSchedule(familyCode)
  const meta = actionMeta(action, slot, scheduleResult.schedule)
  const now = kstInfo()

  const insert = await insertRow('care_response_requests', {
    family_code: familyCode,
    parent_name: text(familyResult.family.parent_name) || '부모님',
    guardian_name: text(familyResult.family.guardian_name) || '보호자',
    signal_type: `routine_${action}`,
    signal_label: meta.signalLabel,
    request_type: 'parent_checkin',
    risk_level: meta.riskLevel,
    status: meta.status,
    payload: {
      source: 'parent_routine',
      slot,
      action,
      mealStatus: meta.mealStatus,
      medicationStatus: meta.medicationStatus,
      conditionStatus: meta.conditionStatus,
      emergency: meta.emergency,
      snoozeUntil: meta.snoozeUntil,
      medicationEnabled: medicationEnabled(scheduleResult.schedule, slot),
      occurredAtKst: now.label,
      clickedAt: now.iso
    }
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '안부 확인 저장에 실패했습니다.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  const guardianAlert = await queueGuardianAlert({
    familyCode,
    family: familyResult.family,
    action,
    slot
  })

  const view = await buildView(familyCode, familyResult.family)

  return NextResponse.json({
    ...view,
    message:
      action === 'later'
        ? `${scheduleResult.schedule.reminderDelayMinutes}분 후 다시 알려드릴게요.`
        : action === 'need_help'
          ? '도움 요청을 보호자 확인 대상으로 기록했습니다.'
          : action === 'condition_issue'
            ? '몸 상태를 보호자 확인 대상으로 기록했습니다.'
            : `${meta.signalLabel}로 저장했습니다.`,
    guardianAlert
  })
}
