import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

type Card = {
  key: string
  title: string
  status: 'normal' | 'watch' | 'check_needed'
  value: string
  detail: string
}

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'OPS_SESSION_TOKEN',
  'ops_session_token',
  'ops_session'
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function num(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function positive(value: unknown) {
  const n = num(value, 0)
  return n > 0 ? n : 0
}

function opsPassword() {
  return process.env.ANBU_OPS_PASSWORD || process.env.OPS_PASSWORD || ''
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || process.env.OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
}

function tokenFor(password: string) {
  return createHash('sha256').update(password + ':' + authSecret()).digest('hex')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function isOpsAuthed(request: NextRequest) {
  const password = opsPassword()
  if (!password) return false

  const expected = tokenFor(password)

  for (const name of OPS_COOKIE_NAMES) {
    const token = request.cookies.get(name)?.value || ''
    if (!token) continue

    try {
      if (safeEqual(token, expected)) return true
    } catch {
      continue
    }
  }

  return false
}

function hasSecret(request: NextRequest) {
  const secrets = [
    process.env.CRON_SECRET || '',
    process.env.OPS_AUTOPILOT_SECRET || '',
    process.env.RESPONSE_ESCALATION_SECRET || ''
  ].filter(Boolean)

  if (secrets.length === 0) return false

  const queryToken = text(request.nextUrl.searchParams.get('token'))
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')

  return secrets.includes(queryToken) || secrets.includes(auth)
}

function authorized(request: NextRequest) {
  return isOpsAuthed(request) || hasSecret(request)
}

function responseStatus(result: unknown) {
  const maybe = result as { ok?: boolean; status?: number }
  return maybe.ok ? 200 : maybe.status || 500
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

async function rest(path: string, init?: RequestInit): Promise<RestResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: 'SUPABASE_SERVICE_ROLE_KEY가 필요합니다.'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
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
    status: response.status,
    data: parsed,
    error: response.ok ? null : parsed || raw
  }
}

function rows(result: RestResult): Row[] {
  return result.ok && Array.isArray(result.data) ? result.data as Row[] : []
}

async function insertRows(table: string, values: Row[]) {
  if (values.length === 0) {
    return {
      ok: true,
      status: 200,
      data: [],
      error: null
    } as RestResult
  }

  return rest(table, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(values)
  })
}

function kstDate() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function toKst(value: unknown) {
  const raw = text(value)
  if (!raw) return ''

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function statusLabel(status: string) {
  if (status === 'normal') return '정상'
  if (status === 'watch') return '주의'
  return '확인필요'
}

function minutesLabel(minutes: number) {
  if (!minutes) return '입력 없음'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h <= 0) return `${m}분`
  return `${h}시간 ${m}분`
}

function deltaPercent(current: number, baseline: number) {
  if (!current || !baseline) return 0
  return Math.round(((current - baseline) / baseline) * 100)
}

function cardStatusFromSeverity(severity: number): 'normal' | 'watch' | 'check_needed' {
  if (severity >= 2) return 'check_needed'
  if (severity >= 1) return 'watch'
  return 'normal'
}

function buildReport(body: Row) {
  const familyCode = text(body.familyCode).replace(/[^0-9A-Za-z_-]/g, '').slice(0, 40)
  const parentName = text(body.parentName) || '부모님'
  const guardianName = text(body.guardianName) || '보호자'
  const guardianPhone = phone(body.guardianPhone)
  const parentPhone = phone(body.parentPhone)
  const reportDate = text(body.reportDate) || kstDate()

  const sleepMinutes = positive(body.sleepMinutes)
  const baselineSleepMinutes = positive(body.baselineSleepMinutes)
  const steps = positive(body.steps)
  const baselineSteps = positive(body.baselineSteps)
  const restingHr = positive(body.restingHr)
  const baselineRestingHr = positive(body.baselineRestingHr)
  const hrv = positive(body.hrv)
  const baselineHrv = positive(body.baselineHrv)
  const spo2 = positive(body.spo2)
  const baselineSpo2 = positive(body.baselineSpo2)
  const temperatureDelta = num(body.temperatureDelta, 0)
  const wearMinutes = positive(body.wearMinutes)
  const batteryLevel = positive(body.batteryLevel)
  const notes = text(body.notes)

  let score = 100
  let hard = 0
  let watch = 0
  const reasons: string[] = []
  const cards: Card[] = []

  let sleepSeverity = 0
  if (sleepMinutes > 0 && baselineSleepMinutes > 0) {
    if (sleepMinutes < baselineSleepMinutes * 0.65 || sleepMinutes < 240) sleepSeverity = 2
    else if (sleepMinutes < baselineSleepMinutes * 0.8) sleepSeverity = 1
  } else if (sleepMinutes === 0) {
    sleepSeverity = 1
  }

  if (sleepSeverity === 2) {
    score -= 18
    hard += 1
    reasons.push('수면이 평소보다 많이 짧음')
  } else if (sleepSeverity === 1) {
    score -= 9
    watch += 1
    reasons.push('수면이 평소보다 짧음')
  }

  cards.push({
    key: 'sleep',
    title: '수면 리듬',
    status: cardStatusFromSeverity(sleepSeverity),
    value: `${minutesLabel(sleepMinutes)}${baselineSleepMinutes ? ` / 평소 ${minutesLabel(baselineSleepMinutes)}` : ''}`,
    detail: baselineSleepMinutes
      ? `평소 대비 ${deltaPercent(sleepMinutes, baselineSleepMinutes)}% 변화`
      : '평소 수면 기준선을 입력하면 비교 문구가 더 정확해집니다.'
  })

  let activitySeverity = 0
  if (steps > 0 && baselineSteps > 0) {
    if (steps < baselineSteps * 0.45) activitySeverity = 2
    else if (steps < baselineSteps * 0.7) activitySeverity = 1
  } else if (steps === 0) {
    activitySeverity = 1
  }

  if (activitySeverity === 2) {
    score -= 18
    hard += 1
    reasons.push('활동량이 평소보다 크게 낮음')
  } else if (activitySeverity === 1) {
    score -= 9
    watch += 1
    reasons.push('활동량이 평소보다 낮음')
  }

  cards.push({
    key: 'activity',
    title: '활동 리듬',
    status: cardStatusFromSeverity(activitySeverity),
    value: `${steps ? `${steps.toLocaleString('ko-KR')}보` : '입력 없음'}${baselineSteps ? ` / 평소 ${baselineSteps.toLocaleString('ko-KR')}보` : ''}`,
    detail: baselineSteps
      ? `평소 대비 ${deltaPercent(steps, baselineSteps)}% 변화`
      : '평소 활동 기준선을 입력하면 비교 문구가 더 정확해집니다.'
  })

  let heartSeverity = 0
  const hrHigh = restingHr > 0 && baselineRestingHr > 0 && restingHr > baselineRestingHr * 1.18
  const hrvLow = hrv > 0 && baselineHrv > 0 && hrv < baselineHrv * 0.75
  const spo2Low = spo2 > 0 && spo2 < 94

  if (spo2Low) heartSeverity = 2
  else if (hrHigh || hrvLow) heartSeverity = 1

  if (heartSeverity === 2) {
    score -= 16
    hard += 1
    reasons.push('SpO2 또는 심박 리듬 확인 필요')
  } else if (heartSeverity === 1) {
    score -= 8
    watch += 1
    reasons.push('심박·회복 리듬이 평소와 다름')
  }

  cards.push({
    key: 'heart',
    title: '심박·회복 리듬',
    status: cardStatusFromSeverity(heartSeverity),
    value: `HR ${restingHr || '-'} / HRV ${hrv || '-'} / SpO2 ${spo2 || '-'}`,
    detail: '의료 판단이 아닌 평소 리듬 대비 참고 신호입니다.'
  })

  let tempSeverity = 0
  if (Math.abs(temperatureDelta) >= 0.7) tempSeverity = 2
  else if (Math.abs(temperatureDelta) >= 0.4) tempSeverity = 1

  if (tempSeverity === 2) {
    score -= 12
    hard += 1
    reasons.push('체온 추세가 평소와 크게 다름')
  } else if (tempSeverity === 1) {
    score -= 6
    watch += 1
    reasons.push('체온 추세가 평소와 다름')
  }

  cards.push({
    key: 'temperature',
    title: '체온 추세',
    status: cardStatusFromSeverity(tempSeverity),
    value: `${temperatureDelta >= 0 ? '+' : ''}${temperatureDelta.toFixed(1)}℃`,
    detail: '피부온도 또는 체온 추세 변화값 기준입니다.'
  })

  let wearSeverity = 0
  if (wearMinutes < 360) wearSeverity = 2
  else if (wearMinutes < 720) wearSeverity = 1

  if (wearSeverity === 2) {
    score -= 18
    hard += 1
    reasons.push('반지 착용 시간이 짧아 판단 어려움')
  } else if (wearSeverity === 1) {
    score -= 8
    watch += 1
    reasons.push('반지 착용 시간이 다소 짧음')
  }

  cards.push({
    key: 'wear',
    title: '착용 여부',
    status: cardStatusFromSeverity(wearSeverity),
    value: minutesLabel(wearMinutes),
    detail: wearMinutes >= 960 ? '데이터 신뢰도가 좋습니다.' : '하루 16시간 이상 착용하면 리포트 신뢰도가 좋아집니다.'
  })

  let batterySeverity = 0
  if (batteryLevel > 0 && batteryLevel < 10) batterySeverity = 2
  else if (batteryLevel > 0 && batteryLevel < 20) batterySeverity = 1

  if (batterySeverity === 2) {
    score -= 8
    hard += 1
    reasons.push('배터리 부족')
  } else if (batterySeverity === 1) {
    score -= 4
    watch += 1
    reasons.push('배터리 충전 권장')
  }

  cards.push({
    key: 'battery',
    title: '배터리',
    status: cardStatusFromSeverity(batterySeverity),
    value: batteryLevel ? `${batteryLevel}%` : '입력 없음',
    detail: batteryLevel && batteryLevel < 20 ? '충전을 권장합니다.' : '충전 상태가 충분합니다.'
  })

  const filled = [
    sleepMinutes,
    baselineSleepMinutes,
    steps,
    baselineSteps,
    restingHr,
    baselineRestingHr,
    hrv,
    baselineHrv,
    spo2,
    temperatureDelta !== 0 ? 1 : 0,
    wearMinutes,
    batteryLevel
  ].filter((value) => Number(value) !== 0).length

  const dataQualityScore = Math.min(100, Math.round((filled / 12) * 100))

  if (dataQualityScore < 45) {
    score = Math.min(score, 58)
    hard += 1
    reasons.push('입력 데이터 부족')
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  let overallStatus: 'normal' | 'watch' | 'check_needed' = 'normal'

  if (hard > 0 || score < 60) overallStatus = 'check_needed'
  else if (watch > 0 || score < 80) overallStatus = 'watch'

  const reasonText = reasons.slice(0, 3).join(', ')

  const summaryText =
    overallStatus === 'normal'
      ? `오늘 ${parentName}의 안부리듬은 평소와 비슷합니다. 수면, 활동, 심박 리듬이 큰 변화 없이 확인됩니다.`
      : overallStatus === 'watch'
        ? `오늘 ${parentName}의 안부리듬이 평소와 조금 다릅니다. ${reasonText || '일부 지표 변화'}가 보여 전화 확인을 권장합니다.`
        : `오늘 ${parentName}의 상태 확인이 필요합니다. ${reasonText || '데이터 부족 또는 평소와 다른 변화'}가 확인되어 보호자 확인을 권장합니다.`

  const recommendedAction =
    overallStatus === 'normal'
      ? '특별한 조치가 필요하지는 않습니다. 평소처럼 짧은 안부 연락을 해주시면 좋습니다.'
      : overallStatus === 'watch'
        ? '오늘 중 전화로 컨디션을 확인하고, 확인 결과를 기록해주세요.'
        : '먼저 전화 확인을 진행하고, 연결이 어렵거나 걱정되는 경우 가족 공유 또는 생활확인 요청을 검토해주세요.'

  const shareMessage =
`[안부웍스] ${parentName} 스마트링 안부리듬 리포트

오늘 상태: ${statusLabel(overallStatus)}
안부리듬 점수: ${score}점

${summaryText}

권장 행동:
${recommendedAction}

수면: ${cards[0].value}
활동: ${cards[1].value}
심박·회복: ${cards[2].value}
체온 추세: ${cards[3].value}
착용: ${cards[4].value}
배터리: ${cards[5].value}

본 리포트는 의료 진단이 아닌 가족 안부 참고 신호입니다.
응급상황이 의심되면 즉시 119 또는 의료기관에 연락하세요.`

  const timeline = [
    {
      time: '오늘',
      title: `${statusLabel(overallStatus)} 리포트 생성`,
      desc: summaryText
    },
    {
      time: '권장',
      title: '보호자 확인',
      desc: recommendedAction
    }
  ]

  return {
    family_code: familyCode || null,
    parent_name: parentName,
    guardian_name: guardianName,
    guardian_phone: guardianPhone || null,
    guardian_phone_last4: guardianPhone ? guardianPhone.slice(-4) : null,
    parent_phone: parentPhone || null,
    parent_phone_last4: parentPhone ? parentPhone.slice(-4) : null,
    report_date: reportDate,
    overall_status: overallStatus,
    anbu_score: score,
    summary_text: summaryText,
    recommended_action: recommendedAction,
    data_quality_score: dataQualityScore,
    metrics: {
      sleepMinutes,
      baselineSleepMinutes,
      sleepDeltaPercent: deltaPercent(sleepMinutes, baselineSleepMinutes),
      steps,
      baselineSteps,
      activityDeltaPercent: deltaPercent(steps, baselineSteps),
      restingHr,
      baselineRestingHr,
      hrv,
      baselineHrv,
      spo2,
      baselineSpo2,
      temperatureDelta,
      wearMinutes,
      batteryLevel,
      notes,
      reasons
    },
    cards,
    timeline,
    share_message: shareMessage,
    source: text(body.source) || 'manual',
    created_by: text(body.createdBy) || '운영실'
  }
}

function normalizeReport(row: Row) {
  return {
    id: text(row.id),
    familyCode: text(row.family_code),
    parentName: text(row.parent_name),
    guardianName: text(row.guardian_name),
    guardianPhoneLast4: text(row.guardian_phone_last4),
    parentPhoneLast4: text(row.parent_phone_last4),
    reportDate: text(row.report_date),
    overallStatus: text(row.overall_status),
    anbuScore: num(row.anbu_score, 0),
    summaryText: text(row.summary_text),
    recommendedAction: text(row.recommended_action),
    dataQualityScore: num(row.data_quality_score, 0),
    metrics: row.metrics || {},
    cards: Array.isArray(row.cards) ? row.cards : [],
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    shareMessage: text(row.share_message),
    source: text(row.source),
    createdBy: text(row.created_by),
    viewedCount: num(row.viewed_count, 0),
    createdAt: text(row.created_at),
    createdKst: toKst(row.created_at),
    lastViewedAt: text(row.last_viewed_at),
    lastViewedKst: toKst(row.last_viewed_at)
  }
}

async function logEvent(eventType: string, report: Row | null, payload: Row, createdBy: string) {
  await insertRows('ring_report_lab_events', [
    {
      event_type: eventType,
      report_id: text(report?.id) || null,
      family_code: text(report?.family_code) || text(payload.familyCode) || null,
      payload,
      created_by: createdBy
    }
  ])
}

async function publicReport(request: NextRequest) {
  const familyCode = text(request.nextUrl.searchParams.get('familyCode')).replace(/[^0-9A-Za-z_-]/g, '').slice(0, 40)
  const last4 = text(request.nextUrl.searchParams.get('last4')).replace(/[^\d]/g, '').slice(-4)

  if (!familyCode || last4.length !== 4) {
    return {
      ok: false,
      status: 400,
      message: '가족코드와 휴대폰 뒤 4자리가 필요합니다.'
    }
  }

  const result = await rest(
    'ring_daily_reports?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&order=report_date.desc,created_at.desc&limit=10'
  )

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '리포트를 불러오지 못했습니다.',
      detail: result.error
    }
  }

  const matched = rows(result).find((row) => {
    return text(row.guardian_phone_last4) === last4 || text(row.parent_phone_last4) === last4
  })

  if (!matched) {
    return {
      ok: false,
      status: 404,
      message: '일치하는 스마트링 리포트가 없습니다.'
    }
  }

  const viewedCount = num(matched.viewed_count, 0) + 1

  await rest('ring_daily_reports?id=eq.' + encodeURIComponent(text(matched.id)), {
    method: 'PATCH',
    body: JSON.stringify({
      viewed_count: viewedCount,
      last_viewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  })

  await logEvent(
    'public_view',
    matched,
    {
      familyCode,
      last4Masked: '****',
      userAgent: request.headers.get('user-agent') || ''
    },
    'guardian'
  )

  return {
    ok: true,
    report: normalizeReport({ ...matched, viewed_count: viewedCount, last_viewed_at: new Date().toISOString() })
  }
}

async function opsDashboard() {
  const [reportResult, eventResult, householdResult, familyLinkResult] = await Promise.all([
    rest('ring_daily_reports?select=*&order=created_at.desc&limit=200'),
    rest('ring_report_lab_events?select=*&order=created_at.desc&limit=200'),
    rest('ops_private_pilot_households?select=*&order=created_at.desc&limit=1000'),
    rest('anbu_family_links?select=*&order=created_at.desc&limit=1000')
  ])

  if (!reportResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '스마트링 리포트 목록을 불러오지 못했습니다.',
      detail: reportResult.error
    }
  }

  const reports = rows(reportResult)
  const today = kstDate()

  const metrics = {
    totalReports: reports.length,
    todayReports: reports.filter((item) => text(item.report_date) === today).length,
    normalReports: reports.filter((item) => text(item.overall_status) === 'normal').length,
    watchReports: reports.filter((item) => text(item.overall_status) === 'watch').length,
    checkNeededReports: reports.filter((item) => text(item.overall_status) === 'check_needed').length,
    publicViews: reports.reduce((sum, item) => sum + num(item.viewed_count, 0), 0),
    families:
      rows(householdResult).filter((item) => text(item.family_code)).length +
      rows(familyLinkResult).filter((item) => text(item.family_code)).length
  }

  const families = [
    ...rows(householdResult).map((item) => ({
      source: 'private_pilot',
      familyCode: text(item.family_code),
      parentName: text(item.parent_name),
      parentPhone: phone(item.parent_phone),
      guardianName: text(item.guardian_name),
      guardianPhone: phone(item.guardian_phone),
      serviceArea: text(item.service_area)
    })),
    ...rows(familyLinkResult).map((item) => ({
      source: 'family_link',
      familyCode: text(item.family_code),
      parentName: text(item.parent_name),
      parentPhone: phone(item.parent_phone),
      guardianName: text(item.guardian_name),
      guardianPhone: phone(item.guardian_phone),
      serviceArea: text(item.service_area)
    }))
  ].filter((item) => item.familyCode)

  return {
    ok: true,
    metrics,
    reports: reports.map(normalizeReport),
    events: rows(eventResult).map((item) => ({
      id: text(item.id),
      eventType: text(item.event_type),
      familyCode: text(item.family_code),
      createdBy: text(item.created_by),
      createdKst: toKst(item.created_at)
    })),
    families,
    sourceErrors: {
      reports: reportResult.ok ? null : reportResult.error,
      events: eventResult.ok ? null : eventResult.error,
      households: householdResult.ok ? null : householdResult.error,
      familyLinks: familyLinkResult.ok ? null : familyLinkResult.error
    }
  }
}

async function createReport(body: Row) {
  const report = buildReport(body)

  if (!text(report.family_code)) {
    return {
      ok: false,
      status: 400,
      message: '가족코드가 필요합니다.'
    }
  }

  const result = await insertRows('ring_daily_reports', [report as Row])

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '스마트링 리포트 저장에 실패했습니다.',
      detail: result.error
    }
  }

  const saved = rows(result)[0]

  await logEvent(
    'created',
    saved,
    {
      source: 'ring-report-lab',
      overallStatus: report.overall_status,
      anbuScore: report.anbu_score
    },
    text(body.createdBy) || '운영실'
  )

  return {
    ok: true,
    message: '스마트링 안부리듬 리포트를 생성했습니다.',
    report: normalizeReport(saved)
  }
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('public') === '1') {
    const data = await publicReport(request)
    return NextResponse.json(data, { status: responseStatus(data) })
  }

  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const data = await opsDashboard()
  return NextResponse.json(data, { status: responseStatus(data) })
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  let result

  if (action === 'createReport') result = await createReport(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
