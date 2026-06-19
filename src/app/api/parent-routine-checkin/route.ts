import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>
type TimeSlot = 'morning' | 'lunch' | 'dinner'
type RoutineAction =
  | 'all_done'
  | 'meal_only'
  | 'medication_only'
  | 'snooze'
  | 'feeling_sick'
  | 'need_help'

const allowedSlots = new Set<TimeSlot>(['morning', 'lunch', 'dinner'])
const allowedActions = new Set<RoutineAction>([
  'all_done',
  'meal_only',
  'medication_only',
  'snooze',
  'feeling_sick',
  'need_help'
])

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanFamilyCode(value: unknown) {
  return text(value).replace(/[^\w-]/g, '').slice(0, 32)
}

function bool(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
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

function maskName(value: unknown) {
  const name = text(value)
  if (!name) return ''
  if (name.length === 1) return name
  if (name.length === 2) return `${name[0]}*`
  return `${name[0]}*${name[name.length - 1]}`
}

function maskPhone(value: unknown) {
  const digits = text(value).replace(/[^\d]/g, '')
  if (digits.length >= 10) return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
  if (digits.length >= 4) return `****-${digits.slice(-4)}`
  return ''
}

function kstNowLabel() {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date())
}

function slotLabel(slot: TimeSlot) {
  if (slot === 'morning') return '아침'
  if (slot === 'lunch') return '점심'
  return '저녁'
}

async function restRows(
  table: string,
  params: Record<string, string>
): Promise<{ ok: boolean; rows: Row[]; error?: string }> {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [],
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
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
      rows: Array.isArray(parsed) ? (parsed as Row[]) : []
    }
  } catch (error) {
    return {
      ok: false,
      rows: [],
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

async function insertRow(table: string, row: Row) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [] as Row[],
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
    }
  }

  async function post(body: Row) {
    const response = await fetch(`${base}/${table}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = null

    try {
      parsed = raw ? JSON.parse(raw) : null
    } catch {
      parsed = null
    }

    return { response, raw, parsed }
  }

  const first = await post(row)

  if (first.response.ok) {
    return {
      ok: true,
      rows: Array.isArray(first.parsed) ? (first.parsed as Row[]) : [],
      error: ''
    }
  }

  // 일부 구형 테이블에 payload 컬럼이 없을 수 있어 한 번 더 시도합니다.
  const { payload: _payload, ...minimal } = row
  const retry = await post(minimal)

  if (retry.response.ok) {
    return {
      ok: true,
      rows: Array.isArray(retry.parsed) ? (retry.parsed as Row[]) : [],
      error: ''
    }
  }

  return {
    ok: false,
    rows: [] as Row[],
    error: retry.raw.slice(0, 300) || first.raw.slice(0, 300)
  }
}

function actionMeta(action: RoutineAction, slot: TimeSlot, medicationDue: boolean) {
  const period = slotLabel(slot)

  if (action === 'all_done') {
    return {
      signalType: 'routine_all_done',
      signalLabel: medicationDue
        ? `${period} 식사·복약·몸 상태 완료`
        : `${period} 식사·몸 상태 완료`,
      requestType: 'parent_routine_checkin',
      riskLevel: 'low',
      status: 'completed',
      title: `${period} 안부 확인 완료`,
      meal: 'done',
      medication: medicationDue ? 'done' : 'not_applicable',
      condition: 'done'
    }
  }

  if (action === 'meal_only') {
    return {
      signalType: 'routine_meal_only',
      signalLabel: medicationDue ? `${period} 식사 완료·복약 미확인` : `${period} 식사 완료`,
      requestType: 'parent_routine_checkin',
      riskLevel: medicationDue ? 'medium' : 'low',
      status: medicationDue ? 'manual_needed' : 'completed',
      title: `${period} 일부 안부 확인`,
      meal: 'done',
      medication: medicationDue ? 'unknown' : 'not_applicable',
      condition: 'unknown'
    }
  }

  if (action === 'medication_only') {
    return {
      signalType: 'routine_medication_only',
      signalLabel: `${period} 복약 완료·식사 미확인`,
      requestType: 'parent_routine_checkin',
      riskLevel: 'medium',
      status: 'manual_needed',
      title: `${period} 일부 안부 확인`,
      meal: 'unknown',
      medication: 'done',
      condition: 'unknown'
    }
  }

  if (action === 'snooze') {
    return {
      signalType: 'routine_snoozed',
      signalLabel: `${period} 30분 후 다시 알림`,
      requestType: 'parent_routine_checkin',
      riskLevel: 'low',
      status: 'pending',
      title: `${period} 확인 연기`,
      meal: 'unknown',
      medication: medicationDue ? 'unknown' : 'not_applicable',
      condition: 'unknown'
    }
  }

  if (action === 'feeling_sick') {
    return {
      signalType: 'feeling_sick',
      signalLabel: `${period} 몸이 불편해요`,
      requestType: 'parent_routine_checkin',
      riskLevel: 'medium',
      status: 'manual_needed',
      title: '몸 상태 확인 필요',
      meal: 'unknown',
      medication: medicationDue ? 'unknown' : 'not_applicable',
      condition: 'needs_help'
    }
  }

  return {
    signalType: 'urgent_neighbor_help',
    signalLabel: '도움이 필요해요',
    requestType: 'urgent_neighbor_help',
    riskLevel: 'high',
    status: 'manual_needed',
    title: '도움 요청',
    meal: 'unknown',
    medication: medicationDue ? 'unknown' : 'not_applicable',
    condition: 'needs_help'
  }
}

async function mirrorDailyCareEvents(input: {
  familyCode: string
  parentName: string
  action: RoutineAction
  slot: TimeSlot
  medicationDue: boolean
  eventId: string
}) {
  const period = slotLabel(input.slot)
  const occurredAt = new Date().toISOString()
  const rows: Row[] = []

  const add = (checkType: string, careLabel: string, status: string, memo: string) => {
    rows.push({
      family_code: input.familyCode,
      elder_name: input.parentName,
      check_type: checkType,
      care_label: careLabel,
      status,
      actor_role: 'parent',
      source: 'parent_routine_checkin',
      memo: `[${input.eventId}] ${memo}`,
      occurred_at: occurredAt
    })
  }

  if (input.action === 'all_done') {
    add('meal', `${period} 식사`, 'done', '통합 버튼으로 식사 완료')
    if (input.medicationDue) {
      add('medication', `${period} 복약`, 'done', '통합 버튼으로 복약 완료')
    }
    add('condition', `${period} 몸 상태`, 'done', '통합 버튼으로 몸 상태 괜찮음')
  } else if (input.action === 'meal_only') {
    add('meal', `${period} 식사`, 'done', '식사만 완료')
    if (input.medicationDue) {
      add('medication', `${period} 복약`, 'unknown', '미복약이 아니라 복약 여부 미확인')
    }
  } else if (input.action === 'medication_only') {
    add('medication', `${period} 복약`, 'done', '복약만 완료')
    add('meal', `${period} 식사`, 'unknown', '미식사가 아니라 식사 여부 미확인')
  } else if (input.action === 'snooze') {
    add('condition', `${period} 안부 확인`, 'unknown', '30분 후 다시 알림 요청')
  } else if (input.action === 'feeling_sick') {
    add('condition', `${period} 몸 상태`, 'needs_help', '몸이 불편하다고 응답')
  } else {
    add('emergency', '도움 요청', 'needs_help', '빠른 보호자 또는 운영실 확인 필요')
  }

  const results = await Promise.all(rows.map((row) => insertRow('daily_care_checkins', row)))

  return {
    attempted: rows.length,
    saved: results.filter((result) => result.ok).length,
    errors: results.filter((result) => !result.ok).map((result) => result.error)
  }
}

async function maybeQueueGuardianNotification(input: {
  action: RoutineAction
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  title: string
  signalLabel: string
  riskLevel: string
  eventId: string
}) {
  if (input.action !== 'feeling_sick' && input.action !== 'need_help') {
    return { ok: true, skipped: true, reason: 'normal_or_partial_event' }
  }

  if (process.env.ANBU_PARENT_CHECKIN_QUEUE_NOTIFICATION !== 'true') {
    return { ok: true, skipped: true, reason: 'notification_queue_disabled' }
  }

  if (!input.guardianPhone) {
    return { ok: false, skipped: true, reason: 'guardian_phone_missing' }
  }

  const urgent = input.action === 'need_help'
  const body = urgent
    ? `[긴급][안부웍스] ${input.parentName}님이 “도움이 필요해요”를 눌렀습니다. 즉시 전화로 확인해주세요. 응급상황이면 119에 연락해주세요.`
    : `[안부웍스 확인 요청] ${input.parentName}님이 “몸이 불편해요”를 눌렀습니다. 전화로 상태를 확인해주세요.`

  const result = await insertRow('notification_outbox', {
    family_code: input.familyCode,
    channel: 'sms',
    to_name: input.guardianName || '보호자',
    to_phone: input.guardianPhone,
    title: input.title,
    body,
    template_code: urgent ? 'guardian_urgent_help' : 'guardian_sick',
    reason: urgent ? 'parent-urgent-help' : 'parent-feeling-sick',
    target_url: `/guardian/today?familyCode=${encodeURIComponent(input.familyCode)}`,
    status: 'queued',
    payload: {
      source: 'parent_routine_checkin',
      eventId: input.eventId,
      signalLabel: input.signalLabel,
      riskLevel: input.riskLevel
    }
  })

  return {
    ok: result.ok,
    skipped: false,
    reason: result.error || null
  }
}

export async function GET(request: NextRequest) {
  const familyCode = cleanFamilyCode(request.nextUrl.searchParams.get('familyCode'))

  if (!familyCode) {
    return NextResponse.json({
      ok: true,
      demo: true,
      generatedKst: kstNowLabel(),
      family: null,
      recentRecords: []
    })
  }

  const [familyResult, recentResult] = await Promise.all([
    restRows('anbu_family_links', {
      select: 'family_code,parent_name,guardian_name,guardian_phone,created_at',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '1'
    }),
    restRows('care_response_requests', {
      select: 'id,signal_type,signal_label,risk_level,status,created_at',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '12'
    })
  ])

  if (!familyResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 정보를 불러오지 못했습니다.',
        detail: familyResult.error
      },
      { status: 500 }
    )
  }

  const family = familyResult.rows[0]

  if (!family) {
    return NextResponse.json(
      {
        ok: false,
        message: '등록된 가족코드를 찾지 못했습니다.'
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ok: true,
    demo: false,
    generatedKst: kstNowLabel(),
    family: {
      familyCode,
      parentName: maskName(family.parent_name) || '부모님',
      guardianName: maskName(family.guardian_name) || '보호자',
      guardianPhoneMasked: maskPhone(family.guardian_phone)
    },
    recentRecords: recentResult.rows.map((row) => ({
      id: text(row.id),
      label: text(row.signal_label) || text(row.signal_type) || '안부 기록',
      signalType: text(row.signal_type),
      riskLevel: text(row.risk_level) || 'low',
      status: text(row.status) || 'recorded',
      createdAt: text(row.created_at)
    })),
    sourceErrors: recentResult.ok ? [] : [recentResult.error]
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const familyCode = cleanFamilyCode(body.familyCode)
  const slot = text(body.timeSlot) as TimeSlot
  const action = text(body.action) as RoutineAction
  const medicationDue = bool(body.medicationDue, true)

  if (!familyCode) {
    return NextResponse.json({ ok: false, message: '가족코드가 필요합니다.' }, { status: 400 })
  }

  if (!allowedSlots.has(slot)) {
    return NextResponse.json({ ok: false, message: '시간대가 올바르지 않습니다.' }, { status: 400 })
  }

  if (!allowedActions.has(action)) {
    return NextResponse.json({ ok: false, message: '안부 응답이 올바르지 않습니다.' }, { status: 400 })
  }

  if (action === 'medication_only' && !medicationDue) {
    return NextResponse.json(
      { ok: false, message: '약이 없는 시간대에는 복약 완료를 선택할 수 없습니다.' },
      { status: 400 }
    )
  }

  const familyResult = await restRows('anbu_family_links', {
    select: 'family_code,parent_name,guardian_name,guardian_phone,created_at',
    family_code: `eq.${familyCode}`,
    order: 'created_at.desc',
    limit: '1'
  })

  const family = familyResult.rows[0]

  if (!family) {
    return NextResponse.json(
      { ok: false, message: '등록된 가족코드를 찾지 못했습니다.' },
      { status: 404 }
    )
  }

  const parentName = text(family.parent_name) || '부모님'
  const guardianName = text(family.guardian_name) || '보호자'
  const guardianPhone = text(family.guardian_phone)
  const eventId = randomUUID()
  const meta = actionMeta(action, slot, medicationDue)
  const reminderAt = action === 'snooze'
    ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
    : null

  const insertResult = await insertRow('care_response_requests', {
    family_code: familyCode,
    parent_name: parentName,
    guardian_name: guardianName,
    signal_type: meta.signalType,
    signal_label: meta.signalLabel,
    request_type: meta.requestType,
    risk_level: meta.riskLevel,
    status: meta.status,
    payload: {
      source: 'parent_routine_checkin',
      eventId,
      action,
      timeSlot: slot,
      timeSlotLabel: slotLabel(slot),
      mealStatus: meta.meal,
      medicationStatus: meta.medication,
      conditionStatus: meta.condition,
      medicationDue,
      reminderAt,
      submittedAtKst: kstNowLabel(),
      interpretationRule: 'unknown은 미식사·미복약을 뜻하지 않고 미확인을 뜻함'
    }
  })

  const mirrorResult = await mirrorDailyCareEvents({
    familyCode,
    parentName,
    action,
    slot,
    medicationDue,
    eventId
  })

  const notification = await maybeQueueGuardianNotification({
    action,
    familyCode,
    parentName,
    guardianName,
    guardianPhone,
    title: meta.title,
    signalLabel: meta.signalLabel,
    riskLevel: meta.riskLevel,
    eventId
  })

  return NextResponse.json({
    ok: true,
    persisted: insertResult.ok,
    warning: insertResult.ok ? null : insertResult.error || '서버 저장에 실패했습니다.',
    eventId,
    reminderAt,
    mirror: mirrorResult,
    notification,
    record: {
      id: insertResult.ok && insertResult.rows[0] ? text(insertResult.rows[0].id) : `local-${Date.now()}`,
      label: meta.signalLabel,
      signalType: meta.signalType,
      riskLevel: meta.riskLevel,
      status: meta.status,
      createdAt: new Date().toISOString()
    }
  })
}
