import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function code6(value: unknown) {
  return text(value).replace(/[^\d]/g, '').slice(0, 6)
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

async function rest(path: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      data: null as unknown,
      error: 'Supabase 환경변수가 없습니다.'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  })

  const raw = await response.text()
  let parsed: unknown = null

  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = raw
  }

  return {
    ok: response.ok,
    data: parsed,
    error: response.ok ? null : parsed || raw
  }
}

function ms(value: unknown) {
  const raw = text(value)
  if (!raw) return 0
  const n = new Date(raw).getTime()
  return Number.isFinite(n) ? n : 0
}

function kstDateKey(value: unknown) {
  const n = ms(value)
  if (!n) return ''
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(n))
}

function todayKstDateKey() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function kstTime(value: unknown) {
  const n = ms(value)
  if (!n) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(n))
}

function latest(rows: Record<string, unknown>[], predicate: (row: Record<string, unknown>) => boolean) {
  return rows
    .filter(predicate)
    .sort((a, b) => ms(b.occurred_at || b.created_at) - ms(a.occurred_at || a.created_at))[0] || null
}

function slotRow(rows: Record<string, unknown>[], checkType: string, checkSlot: string) {
  return latest(rows, (row) => text(row.check_type) === checkType && text(row.check_slot || 'day') === checkSlot)
}

function itemValue(row: Record<string, unknown> | null, none: string) {
  if (!row) return none

  const status = text(row.status)
  const label = text(row.care_label)

  if (status === 'done') return label || '확인 완료'
  if (status === 'not_done') return label || '미완료'
  if (status === 'needs_help') return label || '확인 필요'

  return label || status || '확인됨'
}

function itemTone(row: Record<string, unknown> | null) {
  if (!row) return 'empty'
  const status = text(row.status)

  if (status === 'needs_help') return 'danger'
  if (status === 'not_done') return 'warn'
  return 'good'
}

function itemDetail(row: Record<string, unknown> | null) {
  if (!row) return '아직 부모님이 해당 항목을 누르지 않았습니다.'
  return text(row.memo) || text(row.care_label) || '기록되었습니다.'
}

async function findFamily(familyCode: string) {
  const result = await rest(
    'anbu_family_links?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&order=created_at.desc&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null

  return result.data[0] as Record<string, unknown>
}

async function findLatestFamilyCode() {
  const checkin = await rest('daily_care_checkins?select=family_code,occurred_at&order=occurred_at.desc&limit=1')

  if (checkin.ok && Array.isArray(checkin.data) && checkin.data[0]) {
    return code6((checkin.data[0] as Record<string, unknown>).family_code)
  }

  const family = await rest('anbu_family_links?select=family_code,created_at&order=created_at.desc&limit=1')

  if (family.ok && Array.isArray(family.data) && family.data[0]) {
    return code6((family.data[0] as Record<string, unknown>).family_code)
  }

  return ''
}

function makeSlotItem(rows: Record<string, unknown>[], checkType: string, checkSlot: string, title: string, emptyText: string) {
  const row = slotRow(rows, checkType, checkSlot)

  return {
    key: `${checkType}:${checkSlot}`,
    title,
    value: itemValue(row, emptyText),
    detail: itemDetail(row),
    time: row ? kstTime(row.occurred_at || row.created_at) : '-',
    tone: itemTone(row)
  }
}

export async function GET(request: NextRequest) {
  const familyCode =
    code6(request.nextUrl.searchParams.get('familyCode')) ||
    code6(request.nextUrl.searchParams.get('code')) ||
    code6(request.cookies.get('anbu_guardian_family_code')?.value) ||
    code6(request.cookies.get('anbu_family_code')?.value) ||
    await findLatestFamilyCode()

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json({
      ok: true,
      empty: true,
      message: '가족코드가 없습니다.',
      report: null
    })
  }

  const family = await findFamily(familyCode)

  const checkinsResult = await rest(
    'daily_care_checkins?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&order=occurred_at.desc&limit=1000'
  )

  const rows = checkinsResult.ok && Array.isArray(checkinsResult.data)
    ? checkinsResult.data as Record<string, unknown>[]
    : []

  const todayKey = todayKstDateKey()
  const todayRows = rows.filter((row) => {
    const careDate = text(row.care_date)
    if (careDate) return careDate === todayKey
    return kstDateKey(row.occurred_at || row.created_at) === todayKey
  })

  const latestAny = rows[0] || null

  const mealSlots = [
    makeSlotItem(todayRows, 'meal', 'breakfast', '아침 식사', '아침 식사 미확인'),
    makeSlotItem(todayRows, 'meal', 'lunch', '점심 식사', '점심 식사 미확인'),
    makeSlotItem(todayRows, 'meal', 'dinner', '저녁 식사', '저녁 식사 미확인')
  ]

  const medicationSlots = [
    makeSlotItem(todayRows, 'medication', 'morning', '아침약', '아침약 미확인'),
    makeSlotItem(todayRows, 'medication', 'noon', '점심약', '점심약 미확인'),
    makeSlotItem(todayRows, 'medication', 'evening', '저녁약', '저녁약 미확인')
  ]

  const conditionSlots = [
    makeSlotItem(todayRows, 'condition', 'day', '몸 상태', '몸 상태 미확인')
  ]

  const emergencySlots = [
    makeSlotItem(todayRows, 'emergency', 'day', '도움 요청', '도움 요청 미확인')
  ]

  const allSlots = [...mealSlots, ...medicationSlots, ...conditionSlots, ...emergencySlots]

  const warnings: string[] = []

  for (const slot of allSlots) {
    if (slot.tone === 'empty') warnings.push(`${slot.title} 확인이 아직 없습니다.`)
    if (slot.tone === 'warn') warnings.push(`${slot.title}: ${slot.value}`)
    if (slot.tone === 'danger') warnings.push(`${slot.title}: ${slot.value}`)
  }

  const missingCount = allSlots.filter((slot) => slot.tone === 'empty').length
  const warnCount = allSlots.filter((slot) => slot.tone === 'warn').length
  const dangerCount = allSlots.filter((slot) => slot.tone === 'danger').length

  const score = 100 - missingCount * 8 - warnCount * 12 - dangerCount * 25
  const safeScore = Math.max(0, Math.min(100, score))
  const state = safeScore < 60 ? '확인 필요' : safeScore < 85 ? '주의' : '정상'

  const byDate = new Map<string, Record<string, unknown>[]>()

  for (const row of rows) {
    const key = text(row.care_date) || kstDateKey(row.occurred_at || row.created_at)
    if (!key) continue
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)?.push(row)
  }

  const history = Array.from(byDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .map(([date, dayRows]) => ({
      date,
      breakfastMeal: itemValue(slotRow(dayRows, 'meal', 'breakfast'), '미확인'),
      lunchMeal: itemValue(slotRow(dayRows, 'meal', 'lunch'), '미확인'),
      dinnerMeal: itemValue(slotRow(dayRows, 'meal', 'dinner'), '미확인'),
      morningMedication: itemValue(slotRow(dayRows, 'medication', 'morning'), '미확인'),
      noonMedication: itemValue(slotRow(dayRows, 'medication', 'noon'), '미확인'),
      eveningMedication: itemValue(slotRow(dayRows, 'medication', 'evening'), '미확인')
    }))

  return NextResponse.json({
    ok: true,
    report: {
      familyCode,
      parentName: family ? text(family.parent_name) || '부모님' : '부모님',
      guardianName: family ? text(family.guardian_name) || '보호자' : '보호자',
      date: todayKey,
      state,
      score: safeScore,
      lastResponse: latestAny
        ? {
            label: text(latestAny.care_label) || '안부 응답',
            detail: text(latestAny.memo) || '-',
            time: kstTime(latestAny.occurred_at || latestAny.created_at)
          }
        : {
            label: '응답 없음',
            detail: '아직 부모님 안부 응답이 없습니다.',
            time: '-'
          },
      sections: [
        {
          key: 'meal',
          title: '식사',
          desc: '아침·점심·저녁 식사 여부',
          slots: mealSlots
        },
        {
          key: 'medication',
          title: '복약',
          desc: '아침약·점심약·저녁약 복용 여부',
          slots: medicationSlots
        },
        {
          key: 'condition',
          title: '몸 상태',
          desc: '오늘 몸 상태',
          slots: conditionSlots
        },
        {
          key: 'emergency',
          title: '도움 요청',
          desc: '도움 요청 여부',
          slots: emergencySlots
        }
      ],
      warnings: warnings.length > 0 ? warnings : ['오늘 안부는 현재 안정적으로 보입니다.'],
      actions:
        state === '확인 필요'
          ? ['부모님께 전화하기', '식사 여부 확인하기', '약 복용 여부 확인하기', '불편한 곳 확인하기']
          : ['저녁에 한 번 더 안부 확인하기', '부모님이 편한 시간대 확인하기'],
      history
    }
  })
}
