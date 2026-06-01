import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCode(value: unknown) {
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

  if (!base || !key) return { ok: false, data: null as unknown, error: 'Supabase env is missing' }

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

  return { ok: response.ok, data: parsed, error: response.ok ? null : parsed || bodyText }
}

function ms(value: unknown) {
  const raw = text(value)
  if (!raw) return 0
  const n = new Date(raw).getTime()
  return Number.isFinite(n) ? n : 0
}

function timeLabel(value: unknown) {
  const n = ms(value)
  if (!n) return '-'
  return new Date(n).toLocaleString('ko-KR')
}

function withinHours(value: unknown, hours: number) {
  const n = ms(value)
  if (!n) return false
  return n >= Date.now() - hours * 60 * 60 * 1000
}

function latest(rows: Record<string, unknown>[], predicate: (row: Record<string, unknown>) => boolean) {
  return rows
    .filter(predicate)
    .sort((a, b) => ms(b.occurred_at || b.created_at) - ms(a.occurred_at || a.created_at))[0] || null
}

function includesAny(value: unknown, words: string[]) {
  const raw = text(value)
  return words.some((word) => raw.includes(word))
}

function statusText(row: Record<string, unknown> | null, empty = '아직 확인 없음') {
  if (!row) return empty

  const status = text(row.status)
  const label = text(row.care_label)

  if (status === 'done') return label || '확인됨'
  if (status === 'not_done') return label || '미확인'
  if (status === 'needs_help') return label || '확인 필요'

  return label || status || '확인됨'
}

function tone(row: Record<string, unknown> | null) {
  if (!row) return 'empty'
  const status = text(row.status)
  const type = text(row.check_type)

  if (type === 'emergency' || status === 'needs_help') return 'danger'
  if (status === 'not_done') return 'warn'
  return 'good'
}

function detail(row: Record<string, unknown> | null) {
  if (!row) return '부모님이 아직 해당 항목을 누르지 않았습니다.'
  return text(row.memo) || text(row.care_label) || '기록되었습니다.'
}

async function findFamily(request: NextRequest) {
  const requested =
    normalizeCode(request.nextUrl.searchParams.get('familyCode')) ||
    normalizeCode(request.cookies.get('anbu_family_code')?.value) ||
    normalizeCode(request.cookies.get('pc_parent_invite_code')?.value)

  if (requested) {
    const found = await rest('anbu_family_links?select=*&family_code=eq.' + encodeURIComponent(requested) + '&limit=1')
    if (found.ok && Array.isArray(found.data) && found.data[0]) return found.data[0] as Record<string, unknown>
  }

  const latestCheckin = await rest('daily_care_checkins?select=family_code,occurred_at,created_at&order=occurred_at.desc&limit=1')

  if (latestCheckin.ok && Array.isArray(latestCheckin.data) && latestCheckin.data[0]) {
    const code = normalizeCode((latestCheckin.data[0] as Record<string, unknown>).family_code)
    if (code) {
      const found = await rest('anbu_family_links?select=*&family_code=eq.' + encodeURIComponent(code) + '&limit=1')
      if (found.ok && Array.isArray(found.data) && found.data[0]) return found.data[0] as Record<string, unknown>
    }
  }

  const family = await rest('anbu_family_links?select=*&order=created_at.desc&limit=1')
  if (family.ok && Array.isArray(family.data) && family.data[0]) return family.data[0] as Record<string, unknown>

  return null
}

export async function GET(request: NextRequest) {
  const family = await findFamily(request)

  if (!family) {
    return NextResponse.json({ ok: true, empty: true, message: '연결된 부모님 정보가 없습니다.', care: null })
  }

  const familyCode = text(family.family_code)

  const checkinsResult = await rest('daily_care_checkins?select=*&family_code=eq.' + encodeURIComponent(familyCode) + '&order=occurred_at.desc&limit=500')
  const reportsResult = await rest('anbu_partner_task_reports?select=*&family_code=eq.' + encodeURIComponent(familyCode) + '&order=created_at.desc&limit=20')

  const checkins = checkinsResult.ok && Array.isArray(checkinsResult.data) ? checkinsResult.data as Record<string, unknown>[] : []
  const reports = reportsResult.ok && Array.isArray(reportsResult.data) ? reportsResult.data as Record<string, unknown>[] : []

  const recent24 = checkins.filter((row) => withinHours(row.occurred_at || row.created_at, 24))

  const meal = latest(checkins, (row) => text(row.check_type) === 'meal' || includesAny(row.care_label, ['식사', '먹었']))
  const medication = latest(checkins, (row) => text(row.check_type) === 'medication' || includesAny(row.care_label, ['약', '복약']))
  const condition = latest(checkins, (row) => text(row.check_type) === 'condition' || includesAny(row.care_label, ['괜찮', '불편', '나중']))
  const emergency = latest(checkins, (row) => text(row.check_type) === 'emergency' || includesAny(row.care_label, ['도움']))

  const latestCheckin = checkins[0] || null

  let score = 100
  const reasons: string[] = []

  if (recent24.length === 0) {
    score -= 40
    reasons.push('최근 24시간 안부 응답이 없습니다.')
  }

  for (const row of [meal, medication, condition, emergency]) {
    if (!row) continue
    const status = text(row.status)
    const type = text(row.check_type)

    if (status === 'not_done') {
      score -= type === 'medication' ? 25 : 15
      reasons.push(`${text(row.care_label) || '미확인'} 기록이 있습니다.`)
    }

    if (status === 'needs_help' || type === 'emergency') {
      score -= 35
      reasons.push(`${text(row.care_label) || '도움 필요'} 신호가 있습니다.`)
    }
  }

  score = Math.max(0, Math.min(100, score))

  const state = score < 55 ? '확인 필요' : score < 80 ? '주의' : '정상'

  const care = {
    familyCode,
    parentName: text(family.parent_name) || '부모님',
    guardianName: text(family.guardian_name) || '보호자',
    guardianPhone: text(family.guardian_phone),
    state,
    score,
    summary:
      state === '확인 필요'
        ? '오늘 확인이 필요한 안부 신호가 있습니다. 부모님께 연락해 식사, 약, 몸 상태를 확인해주세요.'
        : state === '주의'
          ? '일부 확인이 필요한 항목이 있습니다. 오늘 안부를 한 번 더 확인해주세요.'
          : '오늘 안부는 현재 안정적으로 보입니다.',
    lastResponse: {
      label: latestCheckin ? text(latestCheckin.care_label) || '안부 응답' : '응답 없음',
      detail: latestCheckin ? text(latestCheckin.memo) || '-' : '아직 부모님 안부 응답이 없습니다.',
      time: latestCheckin ? timeLabel(latestCheckin.occurred_at || latestCheckin.created_at) : '-'
    },
    items: [
      { key: 'meal', title: '식사', value: statusText(meal, '식사 확인 없음'), detail: detail(meal), time: meal ? timeLabel(meal.occurred_at || meal.created_at) : '-', tone: tone(meal) },
      { key: 'medication', title: '복약', value: statusText(medication, '복약 확인 없음'), detail: detail(medication), time: medication ? timeLabel(medication.occurred_at || medication.created_at) : '-', tone: tone(medication) },
      { key: 'condition', title: '몸 상태', value: statusText(condition, '몸 상태 확인 없음'), detail: detail(condition), time: condition ? timeLabel(condition.occurred_at || condition.created_at) : '-', tone: tone(condition) },
      { key: 'emergency', title: '도움 요청', value: emergency ? statusText(emergency, '도움 요청 없음') : '도움 요청 없음', detail: emergency ? detail(emergency) : '현재 도움 요청 기록은 없습니다.', time: emergency ? timeLabel(emergency.occurred_at || emergency.created_at) : '-', tone: tone(emergency) }
    ],
    reasons: reasons.length > 0 ? reasons : ['현재 특별한 위험 사유가 없습니다.'],
    actions:
      state === '확인 필요'
        ? ['부모님께 전화하기', '식사 여부 확인', '약 복용 여부 확인', '불편한 곳 확인', '필요 시 가족 2차 확인']
        : ['정기 안부 확인 유지', '부모님이 편한 시간대 확인'],
    reports: reports.slice(0, 3).map((row) => ({
      title: text(row.title) || text(row.report_title) || '케어 리포트',
      summary: text(row.summary) || text(row.notes) || '리포트 내용이 등록되었습니다.',
      status: text(row.report_status) || text(row.status) || 'submitted',
      time: timeLabel(row.created_at || row.updated_at)
    }))
  }

  return NextResponse.json({ ok: true, care })
}
