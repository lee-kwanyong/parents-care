import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>
type Tone = 'safe' | 'watch' | 'danger' | 'neutral'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
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

function kstTodayStartUtcIso() {
  const kstDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())

  const [year, month, day] = kstDate.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, -9, 0, 0)).toISOString()
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

function signalRisk(row: Row) {
  const signalType = text(row.signal_type)
  const riskLevel = text(row.risk_level)
  const status = text(row.status)
  const label = text(row.signal_label)

  let points = 0

  if (riskLevel === 'high') points += 3
  if (status === 'manual_needed') points += 3
  if (signalType === 'urgent_neighbor_help') points += 3
  if (['meal_missed', 'medication_missed', 'feeling_sick'].includes(signalType)) points += 2
  if (label.includes('도움') || label.includes('아파') || label.includes('못')) points += 1

  return points
}

function ringRisk(row: Row | null) {
  if (!row) return 0

  const status = text(row.overall_status)
  const quality = num(row.data_quality_score, 100)
  const battery = num(row.battery_level ?? row.battery_pct ?? row.battery, 100)
  const wearMinutes = num(row.wear_minutes ?? row.wear_time_minutes, 999)

  let points = 0

  if (status === 'check_needed') points += 2
  if (status === 'watch') points += 1
  if (quality > 0 && quality < 45) points += 1
  if (battery > 0 && battery < 20) points += 1
  if (wearMinutes > 0 && wearMinutes < 360) points += 1

  return points
}

function statusFromPoints(points: number): { level: Tone; label: string; title: string; desc: string } {
  if (points >= 3) {
    return {
      level: 'danger',
      label: '확인필요',
      title: '오늘은 보호자 확인이 필요합니다.',
      desc: '안부 신호 또는 리포트에서 바로 확인해야 할 내용이 있습니다. 전화 확인 후 결과를 남겨주세요.'
    }
  }

  if (points >= 1) {
    return {
      level: 'watch',
      label: '주의',
      title: '오늘은 가볍게 확인해 주세요.',
      desc: '큰 위험 신호는 아니지만 평소와 다른 신호가 있습니다. 짧은 전화나 메시지 확인을 권장합니다.'
    }
  }

  return {
    level: 'safe',
    label: '괜찮아요',
    title: '오늘은 큰 이상 없이 기록되었습니다.',
    desc: '현재 확인된 안부 신호 기준으로는 특별한 후속 조치가 필요하지 않습니다.'
  }
}

function careLabel(row: Row) {
  return (
    text(row.signal_label) ||
    text(row.signal_type) ||
    text(row.request_type) ||
    '안부 신호'
  )
}

function careSummary(row: Row) {
  const type = text(row.signal_type)
  const label = careLabel(row)

  if (type === 'daily_ok') return '오늘 안부가 정상적으로 기록되었습니다.'
  if (type === 'meal_missed') return '식사 확인이 필요할 수 있습니다.'
  if (type === 'medication_missed') return '복약 확인이 필요할 수 있습니다.'
  if (type === 'feeling_sick') return '몸 상태 확인이 필요할 수 있습니다.'
  if (type === 'urgent_neighbor_help') return '도움 요청 신호가 있어 바로 확인이 필요합니다.'

  return `${label} 신호가 기록되었습니다.`
}

function ringInsights(row: Row | null) {
  if (!row) {
    return [
      {
        label: '안부리포트 데이터',
        value: '대기',
        desc: '가족코드에 연결된 오늘 안부완료 리포트가 아직 없습니다.',
        tone: 'neutral'
      }
    ]
  }

  const items = [
    {
      label: '안부리포트 점수',
      value: num(row.anbu_score, 0) ? `${num(row.anbu_score)}점` : '확인 중',
      desc: '수면·활동·착용·생체 참고 신호를 종합한 비의료 안부 참고 점수입니다.',
      tone: text(row.overall_status) === 'check_needed' ? 'danger' : text(row.overall_status) === 'watch' ? 'watch' : 'safe'
    },
    {
      label: '데이터 품질',
      value: num(row.data_quality_score, 0) ? `${num(row.data_quality_score)}점` : '확인 중',
      desc: '착용 시간과 데이터 수집 품질을 함께 확인합니다.',
      tone: num(row.data_quality_score, 100) < 45 ? 'watch' : 'safe'
    },
    {
      label: '배터리',
      value: num(row.battery_level ?? row.battery_pct ?? row.battery, 0) ? `${num(row.battery_level ?? row.battery_pct ?? row.battery)}%` : '확인 중',
      desc: '배터리 부족 시 보호자가 충전을 안내하면 좋습니다.',
      tone: num(row.battery_level ?? row.battery_pct ?? row.battery, 100) < 20 ? 'watch' : 'neutral'
    }
  ]

  return items
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
    status: {
      level: 'neutral',
      label: '확인 대기',
      title: '가족코드를 입력하면 오늘 안부를 확인할 수 있습니다.',
      desc: '보호자에게 전달된 가족코드 또는 초대 링크의 familyCode를 입력해 주세요.'
    },
    todayLine: '가족코드 입력 후 오늘 안부 신호와 다음 할 일을 확인합니다.',
    actions: [
      {
        title: '가족코드 입력',
        desc: '상단 입력칸에 가족코드를 넣고 리포트를 불러오세요.',
        href: '/guardian/today',
        cta: '입력하기'
      },
      {
        title: '부모님 안부 남기기',
        desc: '부모님이 직접 오늘 상태를 남길 수 있습니다.',
        href: '/mobile/parent',
        cta: '부모님 화면'
      },
      {
        title: '보호자 대리입력',
        desc: '전화 확인 후 보호자가 대신 안부를 기록할 수 있습니다.',
        href: '/guardian/proxy-checkin',
        cta: '대리입력'
      }
    ],
    timeline: [],
    ringInsights: ringInsights(null),
    notice: '본 리포트는 비의료 안부 참고 정보입니다. 응급상황이 의심되면 119 또는 의료기관에 연락하세요.',
    sourceErrors: []
  }
}

export async function GET(request: NextRequest) {
  const familyCode = cleanFamilyCode(request.nextUrl.searchParams.get('familyCode'))

  if (!familyCode) {
    return NextResponse.json(demoResponse())
  }

  const todayStart = kstTodayStartUtcIso()
  const sourceErrors: string[] = []

  const [
    familyResult,
    careResult,
    todayCareResult,
    ringResult
  ] = await Promise.all([
    restRows('anbu_family_links', {
      select: '*',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '1'
    }),
    restRows('care_response_requests', {
      select: '*',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '12'
    }),
    restRows('care_response_requests', {
      select: '*',
      family_code: `eq.${familyCode}`,
      created_at: `gte.${todayStart}`,
      order: 'created_at.desc',
      limit: '12'
    }),
    restRows('ring_daily_reports', {
      select: '*',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '4'
    })
  ])

  for (const result of [familyResult, careResult, todayCareResult, ringResult]) {
    if (!result.ok && result.error) sourceErrors.push(result.error)
  }

  const family = familyResult.rows[0] || {}
  const careRows = todayCareResult.rows.length ? todayCareResult.rows : careResult.rows
  const latestCare = careRows[0] || null
  const latestRing = ringResult.rows[0] || null

  const totalRisk =
    careRows.reduce((sum, row) => sum + signalRisk(row), 0) +
    ringRisk(latestRing)

  const status = statusFromPoints(totalRisk)

  const parentName =
    maskName(family.parent_name) ||
    maskName(latestCare?.parent_name) ||
    maskName(latestRing?.parent_name) ||
    '부모님'

  const guardianName =
    maskName(family.guardian_name) ||
    maskName(latestCare?.guardian_name) ||
    maskName(latestRing?.guardian_name) ||
    '보호자'

  const todayLine = latestCare
    ? careSummary(latestCare)
    : latestRing
      ? '오늘 안부완료 리포트가 기록되었습니다.'
      : '오늘 기록된 안부 신호가 아직 없습니다.'

  const actions = [
    status.level === 'danger'
      ? {
          title: '전화로 바로 확인하기',
          desc: '확인필요 신호가 있으므로 부모님께 전화 후 결과를 기록하세요.',
          href: '/guardian/proxy-checkin',
          cta: '확인 결과 기록'
        }
      : status.level === 'watch'
        ? {
            title: '짧게 안부 확인하기',
            desc: '평소와 다른 신호가 있어 짧은 전화나 메시지 확인을 권장합니다.',
            href: '/guardian/proxy-checkin',
            cta: '확인 기록'
          }
        : {
            title: '오늘 리포트 확인 완료',
            desc: '큰 이상 신호가 없으면 오늘 리포트를 확인 완료로 정리하세요.',
            href: '/guardian/today',
            cta: '확인 완료'
          },
    {
      title: '부모님 안부 남기기',
      desc: '부모님이 직접 식사·복약·몸 상태를 남길 수 있습니다.',
      href: `/mobile/parent?familyCode=${encodeURIComponent(familyCode)}`,
      cta: '부모님 화면'
    },
    {
      title: '안부완료 리포트 보기',
      desc: '수면·활동·착용·배터리 참고 신호를 확인합니다.',
      href: `/guardian/ring-report?familyCode=${encodeURIComponent(familyCode)}`,
      cta: '고객센터'
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
    actions,
    timeline: careRows.map((row) => ({
      id: text(row.id),
      label: careLabel(row),
      desc: careSummary(row),
      riskLevel: text(row.risk_level) || 'low',
      status: text(row.status) || 'recorded',
      signalType: text(row.signal_type),
      createdAt: text(row.created_at)
    })),
    ringInsights: ringInsights(latestRing),
    notice: '본 리포트는 비의료 안부 참고 정보입니다. 진단·치료·응급 판단을 대체하지 않으며, 응급상황이 의심되면 119 또는 의료기관에 연락하세요.',
    sourceErrors: sourceErrors.slice(0, 12)
  })
}
