import { NextRequest, NextResponse } from 'next/server'
import { supabaseSelect, text } from '@/lib/anbu-integrations'
import { sendCareNotification } from '@/lib/quiet-care-notifications'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>
type SlotKey = 'morning' | 'lunch' | 'evening'

type FamilyRow = {
  family_code?: string
  parent_name?: string
  guardian_name?: string
  guardian_phone?: string
  link_status?: string
}

type SlotState = {
  mealStatus?: string
  medicationStatus?: string
  conditionStatus?: string
  emergency?: boolean
  complete?: boolean
  needsAttention?: boolean
  responded?: boolean
}

type RoutineView = {
  ok?: boolean
  date?: string
  slots?: Record<SlotKey, SlotState>
  sourceErrors?: unknown[]
}

type RecentRecord = {
  label?: string
  riskLevel?: string
  status?: string
  createdAt?: string
}

const SLOT_LABELS: Record<SlotKey, string> = {
  morning: '아침',
  lunch: '점심',
  evening: '저녁'
}

function phone(value: unknown) {
  return text(value).replace(/[^\d+]/g, '')
}

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET || ''
  const token =
    text(request.nextUrl.searchParams.get('secret')) ||
    text(request.nextUrl.searchParams.get('token'))
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')

  if (secret) return token === secret || auth === secret

  const userAgent = text(request.headers.get('user-agent')).toLowerCase()
  return userAgent.includes('vercel-cron') || process.env.NODE_ENV !== 'production'
}

function todayKstDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function kstDayRange(date: string) {
  const start = new Date(`${date}T00:00:00+09:00`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

function siteUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.nextUrl.origin
  ).replace(/\/$/, '')
}

async function loadFamilies() {
  const result = await supabaseSelect(
    'anbu_family_links?select=family_code,parent_name,guardian_name,guardian_phone,link_status' +
      '&link_status=eq.active&order=created_at.desc&limit=1000'
  )

  if (!result.ok || !Array.isArray(result.data)) {
    return {
      ok: false,
      error: result.error,
      families: [] as FamilyRow[]
    }
  }

  const seen = new Set<string>()
  const families: FamilyRow[] = []

  for (const row of result.data as FamilyRow[]) {
    const familyCode = text(row.family_code)
    if (!familyCode || seen.has(familyCode)) continue
    seen.add(familyCode)
    families.push(row)
  }

  return { ok: true, error: null, families }
}

async function alreadySent(familyCode: string, date: string) {
  const range = kstDayRange(date)
  const result = await supabaseSelect(
    'anbu_notification_outbox?select=id' +
      '&family_code=eq.' + encodeURIComponent(familyCode) +
      '&reason=eq.guardian-daily-summary' +
      '&created_at=gte.' + encodeURIComponent(range.start) +
      '&created_at=lt.' + encodeURIComponent(range.end) +
      '&limit=1'
  )

  return result.ok && Array.isArray(result.data) && result.data.length > 0
}

function emptySlots(): Record<SlotKey, SlotState> {
  return {
    morning: {},
    lunch: {},
    evening: {}
  }
}

function slotFromTime(value: unknown): SlotKey {
  const parsed = Date.parse(text(value))
  if (!Number.isFinite(parsed)) return 'evening'

  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      hourCycle: 'h23'
    }).format(new Date(parsed))
  )

  if (hour < 11) return 'morning'
  if (hour < 16) return 'lunch'
  return 'evening'
}

function recordKstDate(value: unknown) {
  const parsed = Date.parse(text(value))
  if (!Number.isFinite(parsed)) return ''

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(parsed))
}

function fallbackView(records: RecentRecord[], date: string): RoutineView {
  const slots = emptySlots()

  for (const record of [...records].reverse()) {
    if (recordKstDate(record.createdAt) !== date) continue
    const label = text(record.label)
    const state = slots[slotFromTime(record.createdAt)]
    const risky =
      text(record.riskLevel) === 'high' ||
      text(record.riskLevel) === 'medium' ||
      text(record.status) === 'manual_needed'

    state.responded = true
    if (risky) state.needsAttention = true

    if (label.includes('도움')) {
      state.emergency = true
      state.conditionStatus = 'needs_help'
    } else if (label.includes('몸') || label.includes('아파')) {
      state.conditionStatus = risky ? 'needs_help' : 'done'
    }

    if (label.includes('식사') || label.includes('밥')) {
      state.mealStatus = risky || label.includes('못')
        ? 'not_done'
        : 'done'
    }

    if (label.includes('복약') || label.includes('약')) {
      state.medicationStatus = risky || label.includes('못')
        ? 'not_done'
        : 'done'
    }
  }

  return { ok: true, slots }
}

async function loadRoutineView(
  request: NextRequest,
  familyCode: string
): Promise<RoutineView | null> {
  const headers = {
    Authorization: process.env.CRON_SECRET
      ? `Bearer ${process.env.CRON_SECRET}`
      : ''
  }

  const routineResponse = await fetch(
    new URL(
      `/api/parent-routine-checkin?familyCode=${encodeURIComponent(familyCode)}`,
      request.nextUrl.origin
    ),
    { headers, cache: 'no-store' }
  )

  const routineData = await routineResponse.json().catch(() => ({})) as RoutineView
  if (routineResponse.ok && routineData.ok) return routineData

  const legacyResponse = await fetch(
    new URL(
      `/api/parent-checkin?familyCode=${encodeURIComponent(familyCode)}`,
      request.nextUrl.origin
    ),
    { headers, cache: 'no-store' }
  )

  const legacyData = await legacyResponse.json().catch(() => ({})) as {
    ok?: boolean
    recentRecords?: RecentRecord[]
  }

  if (!legacyResponse.ok || legacyData.ok === false) return null
  return fallbackView(legacyData.recentRecords || [], todayKstDate())
}

function slotText(state?: SlotState) {
  if (!state) return '미확인'
  if (state.emergency || state.conditionStatus === 'needs_help') {
    return '몸 상태 확인 필요'
  }
  if (state.mealStatus === 'not_done' && state.medicationStatus === 'not_done') {
    return '식사·복약 확인 필요'
  }
  if (state.mealStatus === 'not_done') return '식사 확인 필요'
  if (state.medicationStatus === 'not_done') return '복약 확인 필요'
  if (state.complete) return '식사·복약 완료'
  if (state.mealStatus === 'done' && state.medicationStatus === 'not_applicable') {
    return '식사 완료'
  }
  if (state.mealStatus === 'done' && state.medicationStatus === 'unknown') {
    return '식사 완료 · 복약 미확인'
  }
  if (state.mealStatus === 'unknown' && state.medicationStatus === 'done') {
    return '식사 미확인 · 복약 완료'
  }
  if (state.responded) return '일부 확인'
  return '미확인'
}

function summaryOf(view: RoutineView | null) {
  const slots = view?.slots
  const slotKeys: SlotKey[] = ['morning', 'lunch', 'evening']
  const hasEmergency = slotKeys.some((slot) => Boolean(slots?.[slot]?.emergency))
  const hasAttention = slotKeys.some((slot) => Boolean(slots?.[slot]?.needsAttention))
  const responseCount = slotKeys.filter((slot) => Boolean(slots?.[slot]?.responded)).length

  return {
    lines: slotKeys.map(
      (slot) => `${SLOT_LABELS[slot]}: ${slotText(slots?.[slot])}`
    ),
    overall: hasEmergency
      ? '즉시 확인이 필요한 기록이 있습니다.'
      : hasAttention
        ? '확인이 필요한 항목이 있습니다.'
        : responseCount === 0
          ? '오늘 안부가 아직 미확인입니다.'
          : '특이사항 없이 기록되었습니다.',
    hasEmergency,
    hasAttention,
    responseCount
  }
}

async function handle(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      { ok: false, message: 'Cron 인증이 필요합니다.' },
      { status: 401 }
    )
  }

  const dryRun = ['1', 'true'].includes(
    text(request.nextUrl.searchParams.get('dryRun')).toLowerCase()
  )
  const force = ['1', 'true'].includes(
    text(request.nextUrl.searchParams.get('force')).toLowerCase()
  )
  const date = todayKstDate()
  const loaded = await loadFamilies()

  if (!loaded.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 정보를 불러오지 못했습니다.',
        detail: loaded.error
      },
      { status: 500 }
    )
  }

  const results: Row[] = []

  for (const family of loaded.families) {
    const familyCode = text(family.family_code)
    const guardianPhone = phone(family.guardian_phone)
    const guardianName = text(family.guardian_name) || '보호자'
    const parentName = text(family.parent_name) || '부모님'

    if (!familyCode || !guardianPhone) {
      results.push({
        familyCode,
        skipped: true,
        reason: 'guardian_phone_missing'
      })
      continue
    }

    if (!force && await alreadySent(familyCode, date)) {
      results.push({
        familyCode,
        skipped: true,
        reason: 'already_sent_today'
      })
      continue
    }

    const view = await loadRoutineView(request, familyCode)
    const summary = summaryOf(view)
    const body = [
      `[안부웍스 오늘 요약] ${parentName}님`,
      date,
      '',
      ...summary.lines,
      `전체 상태: ${summary.overall}`,
      '',
      '정상 응답은 별도 즉시 문자 없이 이 요약으로 전달됩니다.',
      '미응답은 식사나 복약을 하지 않았다는 뜻이 아니라 “미확인”입니다.'
    ].join('\n')

    const result = await sendCareNotification({
      familyCode,
      toName: guardianName,
      toPhone: guardianPhone,
      title: `${parentName}님 오늘 안부 요약`,
      body,
      reason: 'guardian-daily-summary',
      targetUrl: `${siteUrl(request)}/child/dashboard`,
      eventType: 'guardian_daily_summary',
      metadata: {
        date,
        ...summary,
        sourceErrors: view?.sourceErrors || [],
        nonMedicalNotice: true
      },
      dryRun
    })

    results.push({ familyCode, parentName, result })
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    force,
    date,
    familyCount: loaded.families.length,
    results
  })
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
