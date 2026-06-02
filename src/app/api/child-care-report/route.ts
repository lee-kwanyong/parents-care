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

  const bodyText = await response.text()
  let parsed: unknown = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return {
    ok: response.ok,
    data: parsed,
    error: response.ok ? null : parsed || bodyText
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
  const type = text(row.check_type)

  if (status === 'needs_help') return 'danger'
  if (status === 'not_done') return 'warn'
  return 'good'
}

function itemDetail(row: Record<string, unknown> | null) {
  if (!row) return '아직 부모님이 해당 항목을 누르지 않았습니다.'
  return text(row.memo) || text(row.care_label) || '기록되었습니다.'
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

  const checkinsResult = await rest(
    'daily_care_checkins?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&order=occurred_at.desc&limit=500'
  )

  const rows = checkinsResult.ok && Array.isArray(checkinsResult.data)
    ? checkinsResult.data as Record<string, unknown>[]
    : []

  const todayKey = kstDateKey(new Date().toISOString())
  const todayRows = rows.filter((row) => kstDateKey(row.occurred_at || row.created_at) === todayKey)

  const meal = latest(todayRows, (row) => text(row.check_type) === 'meal')
  const medication = latest(todayRows, (row) => text(row.check_type) === 'medication')
  const condition = latest(todayRows, (row) => text(row.check_type) === 'condition')
  const emergency = latest(todayRows, (row) => text(row.check_type) === 'emergency')
  const latestAny = rows[0] || null

  const warnings: string[] = []

  if (!meal) warnings.push('오늘 식사 확인이 아직 없습니다.')
  if (!medication) warnings.push('오늘 복약 확인이 아직 없습니다.')
  if (!condition) warnings.push('오늘 몸 상태 확인이 아직 없습니다.')

  for (const row of [meal, medication, condition, emergency]) {
    if (!row) continue

    const status = text(row.status)
    const type = text(row.check_type)

    if (status === 'not_done') warnings.push(`${text(row.care_label) || '미완료'} 기록이 있습니다.`)
    if (status === 'needs_help') warnings.push(`${text(row.care_label) || '도움 요청'} 신호가 있습니다.`)
  }

  const score =
    100 -
    (meal ? 0 : 20) -
    (medication ? 0 : 25) -
    (condition ? 0 : 15) -
    (emergency && text(emergency.status) === 'needs_help' ? 35 : 0)

  const safeScore = Math.max(0, Math.min(100, score))
  const state = safeScore < 60 ? '확인 필요' : safeScore < 85 ? '주의' : '정상'

  return NextResponse.json({
    ok: true,
    report: {
      familyCode,
      parentName: '부모님',
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
      items: [
        {
          key: 'meal',
          title: '식사',
          value: itemValue(meal, '식사 미확인'),
          detail: itemDetail(meal),
          time: meal ? kstTime(meal.occurred_at || meal.created_at) : '-',
          tone: itemTone(meal)
        },
        {
          key: 'medication',
          title: '복약',
          value: itemValue(medication, '복약 미확인'),
          detail: itemDetail(medication),
          time: medication ? kstTime(medication.occurred_at || medication.created_at) : '-',
          tone: itemTone(medication)
        },
        {
          key: 'condition',
          title: '몸 상태',
          value: itemValue(condition, '몸 상태 미확인'),
          detail: itemDetail(condition),
          time: condition ? kstTime(condition.occurred_at || condition.created_at) : '-',
          tone: itemTone(condition)
        },
        {
          key: 'emergency',
          title: '도움 요청',
          value: emergency ? itemValue(emergency, '도움 요청 없음') : '도움 요청 없음',
          detail: emergency ? itemDetail(emergency) : '현재 도움 요청 기록은 없습니다.',
          time: emergency ? kstTime(emergency.occurred_at || emergency.created_at) : '-',
          tone: itemTone(emergency)
        }
      ],
      warnings: warnings.length > 0 ? warnings : ['오늘 안부는 현재 안정적으로 보입니다.'],
      actions:
        state === '확인 필요'
          ? ['부모님께 전화하기', '식사 여부 확인하기', '약 복용 여부 확인하기', '불편한 곳 확인하기']
          : ['저녁에 한 번 더 안부 확인하기', '부모님이 편한 시간대 확인하기']
    }
  })
}
