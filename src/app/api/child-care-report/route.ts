import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Tone = 'good' | 'warn' | 'danger' | 'empty'

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

function itemTone(row: Record<string, unknown> | null): Tone {
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

function hasGood(row: Record<string, unknown> | null) {
  return Boolean(row && text(row.status) === 'done')
}

function hasRisk(row: Record<string, unknown> | null) {
  return Boolean(row && ['not_done', 'needs_help'].includes(text(row.status)))
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

function dateList(days: number) {
  const today = todayKstDateKey()
  const start = new Date(`${today}T00:00:00+09:00`)
  const list: string[] = []

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getTime() - i * 24 * 60 * 60 * 1000)
    list.push(
      new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(d)
    )
  }

  return list
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
      '&order=occurred_at.desc&limit=1500'
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

  const byDate = new Map<string, Record<string, unknown>[]>()

  for (const row of rows) {
    const key = text(row.care_date) || kstDateKey(row.occurred_at || row.created_at)
    if (!key) continue
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)?.push(row)
  }

  const recentDates = dateList(14)
  let mealDone = 0
  let mealRisk = 0
  let mealMissing = 0
  let medicationDone = 0
  let medicationRisk = 0
  let medicationMissing = 0
  let conditionRisk = 0
  let emergencyRisk = 0
  let responseDays = 0

  const history = recentDates.map((date) => {
    const dayRows = byDate.get(date) || []
    const hasAny = dayRows.length > 0
    if (hasAny) responseDays += 1

    const breakfastMeal = slotRow(dayRows, 'meal', 'breakfast')
    const lunchMeal = slotRow(dayRows, 'meal', 'lunch')
    const dinnerMeal = slotRow(dayRows, 'meal', 'dinner')
    const morningMedication = slotRow(dayRows, 'medication', 'morning')
    const noonMedication = slotRow(dayRows, 'medication', 'noon')
    const eveningMedication = slotRow(dayRows, 'medication', 'evening')
    const condition = slotRow(dayRows, 'condition', 'day')
    const emergency = slotRow(dayRows, 'emergency', 'day')

    const mealRows = [breakfastMeal, lunchMeal, dinnerMeal]
    const medicationRows = [morningMedication, noonMedication, eveningMedication]

    for (const row of mealRows) {
      if (!row) mealMissing += 1
      else if (hasGood(row)) mealDone += 1
      else if (hasRisk(row)) mealRisk += 1
    }

    for (const row of medicationRows) {
      if (!row) medicationMissing += 1
      else if (hasGood(row)) medicationDone += 1
      else if (hasRisk(row)) medicationRisk += 1
    }

    if (condition && hasRisk(condition)) conditionRisk += 1
    if (emergency && text(emergency.status) === 'needs_help') emergencyRisk += 1

    const dayMissing =
      mealRows.filter((row) => !row).length +
      medicationRows.filter((row) => !row).length

    const dayRisk =
      mealRows.filter(hasRisk).length +
      medicationRows.filter(hasRisk).length +
      (condition && hasRisk(condition) ? 1 : 0) +
      (emergency && text(emergency.status) === 'needs_help' ? 1 : 0)

    const dayScore = Math.max(0, Math.min(100, 100 - dayMissing * 10 - dayRisk * 15))

    return {
      date,
      score: dayScore,
      hadResponse: hasAny,
      breakfastMeal: itemValue(breakfastMeal, '미확인'),
      lunchMeal: itemValue(lunchMeal, '미확인'),
      dinnerMeal: itemValue(dinnerMeal, '미확인'),
      morningMedication: itemValue(morningMedication, '미확인'),
      noonMedication: itemValue(noonMedication, '미확인'),
      eveningMedication: itemValue(eveningMedication, '미확인'),
      condition: itemValue(condition, '미확인'),
      emergency: itemValue(emergency, '미확인')
    }
  })

  const totalMeal = recentDates.length * 3
  const totalMedication = recentDates.length * 3

  const mealRate = totalMeal > 0 ? Math.round((mealDone / totalMeal) * 100) : 0
  const medicationRate = totalMedication > 0 ? Math.round((medicationDone / totalMedication) * 100) : 0
  const responseRate = recentDates.length > 0 ? Math.round((responseDays / recentDates.length) * 100) : 0

  const todayMissing = allSlots.filter((slot) => slot.tone === 'empty').length
  const todayWarn = allSlots.filter((slot) => slot.tone === 'warn').length
  const todayDanger = allSlots.filter((slot) => slot.tone === 'danger').length

  const todayScore = Math.max(0, Math.min(100, 100 - todayMissing * 8 - todayWarn * 12 - todayDanger * 25))

  const trendScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(mealRate * 0.3 + medicationRate * 0.4 + responseRate * 0.2 - conditionRisk * 2 - emergencyRisk * 5 + 10)
    )
  )

  const state =
    emergencyRisk > 0 || todayDanger > 0 || medicationRate < 60
      ? '확인 필요'
      : mealRate < 70 || medicationRate < 75 || responseRate < 50 || todayWarn > 0
        ? '주의'
        : '정상'

  const insights: string[] = []

  if (mealRate >= 80) insights.push('최근 14일 식사 확인은 비교적 안정적입니다.')
  else insights.push(`최근 14일 식사 확인률이 ${mealRate}%입니다. 식사 누락 여부를 확인해주세요.`)

  if (medicationRate >= 85) insights.push('최근 14일 복약 확인은 안정적으로 유지되고 있습니다.')
  else insights.push(`최근 14일 복약 확인률이 ${medicationRate}%입니다. 약 복용 확인이 필요합니다.`)

  if (responseRate < 50) insights.push(`최근 14일 중 응답이 있었던 날이 ${responseDays}일입니다. 안부 확인 루틴이 필요합니다.`)
  else insights.push(`최근 14일 중 ${responseDays}일 동안 안부 응답이 있었습니다.`)

  if (conditionRisk > 0) insights.push(`최근 14일 동안 몸이 불편하다는 신호가 ${conditionRisk}회 있었습니다.`)
  if (emergencyRisk > 0) insights.push(`최근 14일 동안 도움이 필요하다는 신호가 ${emergencyRisk}회 있었습니다.`)

  if (mealRisk > 0) insights.push(`최근 14일 동안 식사를 못 했다는 기록이 ${mealRisk}회 있었습니다.`)
  if (medicationRisk > 0) insights.push(`최근 14일 동안 약을 안 먹었다는 기록이 ${medicationRisk}회 있었습니다.`)

  const summaryText =
    state === '확인 필요'
      ? '최근 식사·복약 또는 도움 요청 신호에서 확인이 필요한 패턴이 보입니다. 오늘 부모님께 직접 연락해 확인하는 것이 좋습니다.'
      : state === '주의'
        ? '전반적으로 기록은 있으나 일부 식사·복약 미확인 또는 응답 누락이 있습니다. 한 번 더 안부를 확인해주세요.'
        : '최근 부모님 상태는 비교적 안정적으로 보입니다. 식사와 복약 응답이 꾸준히 확인되고 있습니다.'

  return NextResponse.json({
    ok: true,
    report: {
      familyCode,
      parentName: family ? text(family.parent_name) || '부모님' : '부모님',
      guardianName: family ? text(family.guardian_name) || '보호자' : '보호자',
      date: todayKey,
      state,
      todayScore,
      trendScore,
      summaryText,
      metrics: {
        responseDays,
        responseRate,
        mealDone,
        mealRisk,
        mealMissing,
        mealRate,
        medicationDone,
        medicationRisk,
        medicationMissing,
        medicationRate,
        conditionRisk,
        emergencyRisk
      },
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
          title: '오늘 식사',
          desc: '아침·점심·저녁 식사 여부',
          slots: mealSlots
        },
        {
          key: 'medication',
          title: '오늘 복약',
          desc: '아침약·점심약·저녁약 복용 여부',
          slots: medicationSlots
        },
        {
          key: 'condition',
          title: '오늘 몸 상태',
          desc: '몸 상태 신호',
          slots: conditionSlots
        },
        {
          key: 'emergency',
          title: '오늘 도움 요청',
          desc: '도움 요청 여부',
          slots: emergencySlots
        }
      ],
      insights,
      actions:
        state === '확인 필요'
          ? ['부모님께 전화하기', '식사 여부 확인하기', '약 복용 여부 확인하기', '몸이 불편한 곳 확인하기']
          : state === '주의'
            ? ['저녁에 한 번 더 안부 확인하기', '복약 시간을 부모님과 다시 맞춰보기']
            : ['현재 안부 루틴 유지하기', '부모님이 편한 응답 시간 확인하기'],
      history
    }
  })
}
