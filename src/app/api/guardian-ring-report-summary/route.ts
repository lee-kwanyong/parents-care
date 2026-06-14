import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>
type Tone = 'safe' | 'watch' | 'danger' | 'neutral'

type RingMetric = {
  key: string
  label: string
  value: string
  desc: string
  tone: Tone
}

type Insight = {
  title: string
  desc: string
  tone: Tone
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function isObject(value: unknown): value is Row {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function payloadOf(row: Row | null | undefined) {
  if (!row) return {}
  return isObject(row.payload) ? row.payload : {}
}

function getValue(row: Row | null | undefined, keys: string[]) {
  if (!row) return undefined

  const payload = payloadOf(row)

  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key]
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') return payload[key]
  }

  return undefined
}

function getText(row: Row | null | undefined, keys: string[], fallback = '') {
  return text(getValue(row, keys)) || fallback
}

function getNumber(row: Row | null | undefined, keys: string[], fallback = 0) {
  return num(getValue(row, keys), fallback)
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

function cleanFamilyCode(value: unknown) {
  return text(value).replace(/[^\w-]/g, '').slice(0, 32)
}

function kstNowLabel() {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date())
}

function maskName(value: unknown) {
  const name = text(value)

  if (!name) return ''
  if (name.length === 1) return name
  if (name.length === 2) return `${name[0]}*`

  return `${name[0]}*${name[name.length - 1]}`
}

async function restRows(table: string, params: Record<string, string>): Promise<{ ok: boolean; rows: Row[]; error?: string }> {
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
        error: `${table}: ${response.status} ${raw.slice(0, 180)}`
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

function statusFromRing(row: Row | null) {
  if (!row) {
    return {
      level: 'neutral' as Tone,
      label: '데이터 대기',
      title: '아직 스마트링 리포트가 없습니다.',
      desc: '가족코드를 입력하거나 오늘 스마트링 CSV 업로드 후 다시 확인해 주세요.'
    }
  }

  const explicit = getText(row, ['overall_status', 'status'])
  const score = getNumber(row, ['anbu_score', 'score', 'overall_score', 'anbu_rhythm_score'])
  const quality = getNumber(row, ['data_quality_score', 'quality_score'], 100)
  const battery = getNumber(row, ['battery_level', 'battery_pct', 'battery'], 100)
  const wearMinutes = getNumber(row, ['wear_minutes', 'wear_time_minutes', 'wear_time'], 999)
  const spo2 = getNumber(row, ['spo2', 'spo2_avg', 'blood_oxygen'])
  const temp = getNumber(row, ['skin_temp', 'body_temperature', 'temperature'])

  let points = 0

  if (explicit === 'check_needed') points += 3
  if (explicit === 'watch') points += 1
  if (score > 0 && score < 55) points += 2
  if (quality > 0 && quality < 45) points += 1
  if (battery > 0 && battery < 20) points += 1
  if (wearMinutes > 0 && wearMinutes < 360) points += 1
  if (spo2 > 0 && spo2 < 93) points += 2
  if (temp > 37.4) points += 1

  if (points >= 3) {
    return {
      level: 'danger' as Tone,
      label: '확인필요',
      title: '오늘 안부리듬에서 확인할 신호가 있습니다.',
      desc: '스마트링 참고 신호상 평소와 다른 흐름이 있습니다. 전화로 컨디션을 확인해 주세요.'
    }
  }

  if (points >= 1) {
    return {
      level: 'watch' as Tone,
      label: '주의',
      title: '오늘은 가볍게 안부를 확인해 주세요.',
      desc: '큰 이상으로 단정할 수는 없지만 수면, 활동, 착용, 배터리 중 확인할 요소가 있습니다.'
    }
  }

  return {
    level: 'safe' as Tone,
    label: '안정',
    title: '오늘 안부리듬은 안정적으로 기록되었습니다.',
    desc: '현재 스마트링 참고 신호 기준으로 큰 후속 조치가 필요하지 않습니다.'
  }
}

function toneByScore(value: number, goodAt: number, watchAt: number) {
  if (!value) return 'neutral' as Tone
  if (value >= goodAt) return 'safe' as Tone
  if (value >= watchAt) return 'watch' as Tone
  return 'danger' as Tone
}

function toneByLowRisk(value: number, dangerBelow: number, watchBelow: number) {
  if (!value) return 'neutral' as Tone
  if (value < dangerBelow) return 'danger' as Tone
  if (value < watchBelow) return 'watch' as Tone
  return 'safe' as Tone
}

function formatHoursFromRow(row: Row | null, hourKeys: string[], minuteKeys: string[]) {
  const hours = getNumber(row, hourKeys)
  const minutes = getNumber(row, minuteKeys)

  if (hours > 0) return `${Math.round(hours * 10) / 10}시간`
  if (minutes > 0) return `${Math.round((minutes / 60) * 10) / 10}시간`

  return '확인 중'
}

function sleepHoursNumber(row: Row | null) {
  const hours = getNumber(row, ['sleep_hours', 'sleep_total_hours', 'total_sleep_hours'])
  const minutes = getNumber(row, ['sleep_minutes', 'sleep_total_minutes', 'total_sleep_minutes'])

  if (hours > 0) return hours
  if (minutes > 0) return minutes / 60

  return 0
}

function metric(key: string, label: string, value: string, desc: string, tone: Tone): RingMetric {
  return {
    key,
    label,
    value,
    desc,
    tone
  }
}

function buildMetrics(row: Row | null): RingMetric[] {
  const score = getNumber(row, ['anbu_score', 'score', 'overall_score', 'anbu_rhythm_score'])
  const quality = getNumber(row, ['data_quality_score', 'quality_score'])
  const sleepHours = sleepHoursNumber(row)
  const steps = getNumber(row, ['steps', 'step_count', 'daily_steps'])
  const activityMinutes = getNumber(row, ['activity_minutes', 'active_minutes'])
  const hr = getNumber(row, ['heart_rate', 'hr', 'hr_avg', 'avg_hr'])
  const hrv = getNumber(row, ['hrv', 'hrv_ms', 'rmssd'])
  const spo2 = getNumber(row, ['spo2', 'spo2_avg', 'blood_oxygen'])
  const temp = getNumber(row, ['skin_temp', 'body_temperature', 'temperature'])
  const wearMinutes = getNumber(row, ['wear_minutes', 'wear_time_minutes', 'wear_time'])
  const battery = getNumber(row, ['battery_level', 'battery_pct', 'battery'])

  return [
    metric(
      'score',
      '안부리듬 점수',
      score ? `${score}점` : '확인 중',
      '수면·활동·착용·배터리·생체 참고 신호를 종합한 비의료 안부 참고 점수입니다.',
      toneByScore(score, 75, 55)
    ),
    metric(
      'quality',
      '데이터 품질',
      quality ? `${quality}점` : '확인 중',
      '착용 시간과 데이터 수집 품질을 함께 반영합니다.',
      toneByScore(quality, 75, 45)
    ),
    metric(
      'sleep',
      '수면 시간',
      formatHoursFromRow(row, ['sleep_hours', 'sleep_total_hours', 'total_sleep_hours'], ['sleep_minutes', 'sleep_total_minutes', 'total_sleep_minutes']),
      '평소보다 수면이 짧거나 길면 컨디션 확인에 참고합니다.',
      sleepHours ? (sleepHours < 5 ? 'watch' : sleepHours > 10 ? 'watch' : 'safe') : 'neutral'
    ),
    metric(
      'activity',
      '활동량',
      steps ? `${steps.toLocaleString()}걸음` : activityMinutes ? `${activityMinutes}분` : '확인 중',
      '움직임이 평소보다 낮으면 식사·외출·컨디션 확인에 참고합니다.',
      steps ? toneByScore(steps, 2500, 900) : activityMinutes ? toneByScore(activityMinutes, 40, 15) : 'neutral'
    ),
    metric(
      'heart',
      '심박',
      hr ? `${hr} bpm` : '확인 중',
      '스마트링에서 측정된 심박 참고 신호입니다. 의료 진단 용도가 아닙니다.',
      hr ? (hr < 45 || hr > 110 ? 'watch' : 'safe') : 'neutral'
    ),
    metric(
      'hrv',
      'HRV',
      hrv ? `${hrv} ms` : '확인 중',
      '회복·피로 참고 신호로만 사용합니다. 개인차가 큽니다.',
      hrv ? toneByScore(hrv, 35, 20) : 'neutral'
    ),
    metric(
      'spo2',
      'SpO2',
      spo2 ? `${spo2}%` : '확인 중',
      '혈중산소 참고 신호입니다. 낮게 반복되면 컨디션 확인을 권장합니다.',
      spo2 ? toneByLowRisk(spo2, 92, 95) : 'neutral'
    ),
    metric(
      'temperature',
      '체온/피부온도 추세',
      temp ? `${Math.round(temp * 10) / 10}℃` : '확인 중',
      '피부온도 또는 체온 추세 참고 신호입니다.',
      temp ? (temp > 37.4 ? 'watch' : 'safe') : 'neutral'
    ),
    metric(
      'wear',
      '착용 시간',
      wearMinutes ? `${Math.round(wearMinutes / 60 * 10) / 10}시간` : '확인 중',
      '착용 시간이 짧으면 리포트 신뢰도가 낮아질 수 있습니다.',
      wearMinutes ? toneByScore(wearMinutes, 720, 360) : 'neutral'
    ),
    metric(
      'battery',
      '배터리',
      battery ? `${battery}%` : '확인 중',
      '배터리가 낮으면 보호자가 충전을 안내해 주세요.',
      battery ? toneByLowRisk(battery, 15, 30) : 'neutral'
    )
  ]
}

function buildInsights(row: Row | null, metrics: RingMetric[]): Insight[] {
  if (!row) {
    return [
      {
        title: '오늘 스마트링 데이터가 아직 없습니다.',
        desc: 'CSV 업로드 또는 기기 동기화 후 다시 확인해 주세요.',
        tone: 'neutral'
      }
    ]
  }

  const insights: Insight[] = []
  const score = getNumber(row, ['anbu_score', 'score', 'overall_score', 'anbu_rhythm_score'])
  const quality = getNumber(row, ['data_quality_score', 'quality_score'])
  const sleep = sleepHoursNumber(row)
  const steps = getNumber(row, ['steps', 'step_count', 'daily_steps'])
  const spo2 = getNumber(row, ['spo2', 'spo2_avg', 'blood_oxygen'])
  const battery = getNumber(row, ['battery_level', 'battery_pct', 'battery'])
  const wearMinutes = getNumber(row, ['wear_minutes', 'wear_time_minutes', 'wear_time'])

  if (score > 0 && score < 55) {
    insights.push({
      title: '안부리듬 점수가 낮습니다.',
      desc: '오늘은 전화로 식사, 수면, 컨디션을 확인해 주세요.',
      tone: 'danger'
    })
  }

  if (quality > 0 && quality < 45) {
    insights.push({
      title: '데이터 품질이 낮습니다.',
      desc: '착용 시간이 짧거나 데이터 수집이 부족할 수 있습니다. 오늘 리포트는 참고 수준으로 봐주세요.',
      tone: 'watch'
    })
  }

  if (sleep > 0 && sleep < 5) {
    insights.push({
      title: '수면 시간이 짧게 기록되었습니다.',
      desc: '피로감이나 낮잠 여부를 가볍게 확인해 주세요.',
      tone: 'watch'
    })
  }

  if (steps > 0 && steps < 900) {
    insights.push({
      title: '활동량이 낮게 기록되었습니다.',
      desc: '몸 상태가 불편한지, 외출이나 식사를 했는지 확인해 보세요.',
      tone: 'watch'
    })
  }

  if (spo2 > 0 && spo2 < 93) {
    insights.push({
      title: 'SpO2 참고 신호가 낮게 기록되었습니다.',
      desc: '반복적으로 낮게 나오거나 컨디션 이상이 있으면 의료기관 상담을 권장합니다.',
      tone: 'danger'
    })
  }

  if (battery > 0 && battery < 20) {
    insights.push({
      title: '배터리 충전이 필요합니다.',
      desc: '다음 리포트가 끊기지 않도록 충전을 안내해 주세요.',
      tone: 'watch'
    })
  }

  if (wearMinutes > 0 && wearMinutes < 360) {
    insights.push({
      title: '착용 시간이 부족합니다.',
      desc: '오늘 데이터는 실제 생활 리듬을 충분히 반영하지 못했을 수 있습니다.',
      tone: 'watch'
    })
  }

  if (!insights.length) {
    insights.push({
      title: '오늘 안부리듬은 안정적으로 보입니다.',
      desc: '현재 스마트링 참고 신호 기준으로 큰 후속 조치가 필요하지 않습니다.',
      tone: 'safe'
    })
  }

  return insights
}

function demoResponse(familyCode = '') {
  return {
    ok: true,
    demo: true,
    generatedKst: kstNowLabel(),
    family: {
      familyCode,
      parentName: '부모님',
      guardianName: '보호자'
    },
    status: statusFromRing(null),
    todayLine: '가족코드를 입력하면 스마트링 안부리듬 리포트를 확인할 수 있습니다.',
    metrics: buildMetrics(null),
    insights: buildInsights(null, []),
    actions: [
      {
        title: '가족코드 입력',
        desc: '상단 입력칸에 가족코드를 넣고 리포트를 불러오세요.',
        href: '/guardian/ring-report',
        cta: '입력하기'
      },
      {
        title: '오늘 안부 리포트 보기',
        desc: '부모님이 직접 남긴 식사·복약·몸 상태 신호를 확인합니다.',
        href: '/guardian/today',
        cta: '오늘 리포트'
      },
      {
        title: '확인 결과 기록',
        desc: '전화 확인 후 보호자가 결과를 대신 남길 수 있습니다.',
        href: '/guardian/proxy-checkin',
        cta: '대리입력'
      }
    ],
    history: [],
    notice: '본 리포트는 비의료 안부 참고 정보입니다. 진단·치료·응급 판단을 대체하지 않습니다.',
    sourceErrors: []
  }
}

export async function GET(request: NextRequest) {
  const familyCode = cleanFamilyCode(request.nextUrl.searchParams.get('familyCode'))

  if (!familyCode) {
    return NextResponse.json(demoResponse())
  }

  const sourceErrors: string[] = []

  const [
    familyResult,
    ringResult,
    careResult
  ] = await Promise.all([
    restRows('anbu_family_links', {
      select: '*',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '1'
    }),
    restRows('ring_daily_reports', {
      select: '*',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '7'
    }),
    restRows('care_response_requests', {
      select: '*',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '5'
    })
  ])

  for (const result of [familyResult, ringResult, careResult]) {
    if (!result.ok && result.error) sourceErrors.push(result.error)
  }

  const family = familyResult.rows[0] || {}
  const latest = ringResult.rows[0] || null
  const metrics = buildMetrics(latest)
  const status = statusFromRing(latest)
  const insights = buildInsights(latest, metrics)

  const parentName =
    maskName(family.parent_name) ||
    maskName(latest?.parent_name) ||
    '부모님'

  const guardianName =
    maskName(family.guardian_name) ||
    maskName(latest?.guardian_name) ||
    '보호자'

  const score = getNumber(latest, ['anbu_score', 'score', 'overall_score', 'anbu_rhythm_score'])

  const todayLine = latest
    ? score
      ? `오늘 안부리듬은 ${score}점으로 기록되었습니다.`
      : status.title
    : '오늘 스마트링 리포트가 아직 없습니다.'

  const actions =
    status.level === 'danger'
      ? [
          {
            title: '전화로 컨디션 확인',
            desc: '확인필요 신호가 있으므로 부모님께 전화 후 결과를 남겨주세요.',
            href: `/guardian/proxy-checkin?familyCode=${encodeURIComponent(familyCode)}`,
            cta: '확인 기록'
          },
          {
            title: '오늘 안부 신호 함께 보기',
            desc: '스마트링뿐 아니라 식사·복약·몸 상태 신호도 함께 확인하세요.',
            href: `/guardian/today?familyCode=${encodeURIComponent(familyCode)}`,
            cta: '오늘 리포트'
          },
          {
            title: '응급상황 의심 시',
            desc: '호흡곤란, 흉통, 의식저하 등 응급상황이 의심되면 119 또는 의료기관에 연락하세요.',
            href: '/guide',
            cta: '안내 보기'
          }
        ]
      : status.level === 'watch'
        ? [
            {
              title: '짧게 안부 확인',
              desc: '평소와 다른 참고 신호가 있으므로 짧은 전화나 메시지 확인을 권장합니다.',
              href: `/guardian/proxy-checkin?familyCode=${encodeURIComponent(familyCode)}`,
              cta: '확인 기록'
            },
            {
              title: '오늘 안부 리포트 보기',
              desc: '부모님이 직접 남긴 안부 신호와 함께 비교하세요.',
              href: `/guardian/today?familyCode=${encodeURIComponent(familyCode)}`,
              cta: '오늘 리포트'
            },
            {
              title: '충전·착용 안내',
              desc: '배터리와 착용 시간이 부족하면 다음 리포트 정확도가 낮아질 수 있습니다.',
              href: `/mobile/parent?familyCode=${encodeURIComponent(familyCode)}`,
              cta: '부모님 화면'
            }
          ]
        : [
            {
              title: '리포트 확인 완료',
              desc: '오늘은 큰 이상 신호가 없으므로 확인 완료로 정리해도 좋습니다.',
              href: `/guardian/today?familyCode=${encodeURIComponent(familyCode)}`,
              cta: '오늘 리포트'
            },
            {
              title: '부모님 안부 남기기',
              desc: '스마트링 신호와 함께 부모님 직접 입력도 같이 남기면 리포트 품질이 좋아집니다.',
              href: `/mobile/parent?familyCode=${encodeURIComponent(familyCode)}`,
              cta: '부모님 화면'
            },
            {
              title: '확인 결과 기록',
              desc: '전화 확인을 했다면 결과를 보호자 대리입력으로 남길 수 있습니다.',
              href: `/guardian/proxy-checkin?familyCode=${encodeURIComponent(familyCode)}`,
              cta: '대리입력'
            }
          ]

  return NextResponse.json({
    ok: true,
    demo: false,
    generatedKst: kstNowLabel(),
    family: {
      familyCode,
      parentName,
      guardianName
    },
    status,
    todayLine,
    metrics,
    insights,
    actions,
    history: ringResult.rows.map((row) => ({
      id: text(row.id),
      createdAt: text(row.created_at || row.report_date),
      status: getText(row, ['overall_status', 'status'], 'recorded'),
      score: getNumber(row, ['anbu_score', 'score', 'overall_score', 'anbu_rhythm_score']),
      quality: getNumber(row, ['data_quality_score', 'quality_score']),
      battery: getNumber(row, ['battery_level', 'battery_pct', 'battery'])
    })),
    latestCareSignals: careResult.rows.map((row) => ({
      id: text(row.id),
      label: getText(row, ['signal_label', 'signal_type', 'request_type'], '안부 신호'),
      status: getText(row, ['status', 'risk_level'], 'recorded'),
      createdAt: text(row.created_at)
    })),
    notice: '본 리포트는 비의료 안부 참고 정보입니다. 진단·치료·응급 판단을 대체하지 않으며, 응급상황이 의심되면 119 또는 의료기관에 연락하세요.',
    sourceErrors: sourceErrors.slice(0, 12)
  })
}
