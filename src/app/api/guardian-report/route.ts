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

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function last4(value: unknown) {
  const p = phone(value)
  return p.slice(-4)
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

function getSignalTone(requests: Row[]) {
  const openUrgent = requests.find((item) => {
    const status = text(item.status)
    return ['open', 'manual_needed', 'dispatched', 'accepted', 'in_progress'].includes(status) &&
      (
        text(item.signal_type) === 'urgent_neighbor_help' ||
        text(item.request_type) === 'urgent_neighbor_help' ||
        text(item.risk_level) === 'high'
      )
  })

  if (openUrgent) {
    return {
      level: 'urgent',
      label: '긴급 확인',
      message: '즉시 전화 확인이 필요합니다. 응급상황이면 119 또는 의료기관에 연락하세요.'
    }
  }

  const latest = requests[0]

  if (!latest) {
    return {
      level: 'empty',
      label: '확인 전',
      message: '아직 오늘 안부 신호가 없습니다. 부모님 앱 링크를 보내 첫 신호를 받아보세요.'
    }
  }

  const signalType = text(latest.signal_type)
  const risk = text(latest.risk_level)

  if (risk === 'high' || ['feeling_sick', 'urgent_neighbor_help'].includes(signalType)) {
    return {
      level: 'urgent',
      label: '긴급 확인',
      message: '몸 상태 또는 도움 요청 신호가 있습니다. 보호자가 먼저 전화 확인하세요.'
    }
  }

  if (['meal_missed', 'medication_missed'].includes(signalType) || risk === 'medium') {
    return {
      level: 'warning',
      label: '주의',
      message: '식사 또는 복약 확인이 필요합니다. 전화 확인 후 필요한 조치를 남겨주세요.'
    }
  }

  return {
    level: 'safe',
    label: '정상',
    message: '최근 안부 신호가 정상으로 기록되었습니다.'
  }
}

function countBy(requests: Row[], predicate: (row: Row) => boolean) {
  return requests.filter(predicate).length
}

function matchesLast4(row: Row, inputLast4: string) {
  if (!inputLast4) return false

  return [
    row.guardian_phone,
    row.parent_phone,
    row.parent_phone_last4,
    row.payload && typeof row.payload === 'object' ? (row.payload as Row).guardianPhone : '',
    row.payload && typeof row.payload === 'object' ? (row.payload as Row).parentPhone : ''
  ].some((value) => {
    const raw = text(value)
    if (!raw) return false
    if (raw === inputLast4) return true
    return last4(raw) === inputLast4
  })
}

function onboardingUrl(origin: string, household: Row) {
  const direct = text(household.onboarding_url)
  if (direct) {
    return direct.startsWith('http') ? direct : origin + direct
  }

  const params = new URLSearchParams()
  params.set('familyCode', text(household.family_code))
  params.set('parentName', text(household.parent_name) || '부모님')
  params.set('guardianName', text(household.guardian_name) || '보호자')
  params.set('guardianPhone', phone(household.guardian_phone))
  params.set('serviceArea', text(household.service_area) || '우리동네')

  if (text(household.address_hint)) params.set('addressHint', text(household.address_hint))

  return origin + '/mobile/parent?' + params.toString()
}

async function loadFamily(familyCode: string, inputLast4: string) {
  const [linkResult, householdResult] = await Promise.all([
    rest('anbu_family_links?select=*&family_code=eq.' + encodeURIComponent(familyCode) + '&limit=20'),
    rest('ops_private_pilot_households?select=*&family_code=eq.' + encodeURIComponent(familyCode) + '&limit=20')
  ])

  const linkRows: Row[] = rows(linkResult).map((item) => ({ ...(item as Row), source_table: 'anbu_family_links' }))
  const householdRows: Row[] = rows(householdResult).map((item) => ({ ...(item as Row), source_table: 'ops_private_pilot_households' }))
  const all: Row[] = [...linkRows, ...householdRows]

  const matched = all.find((item) => matchesLast4(item, inputLast4))

  return {
    all,
    matched,
    errors: {
      links: linkResult.ok ? null : linkResult.error,
      households: householdResult.ok ? null : householdResult.error
    }
  }
}

export async function GET(request: NextRequest) {
  const familyCode = text(request.nextUrl.searchParams.get('familyCode')).replace(/[^0-9A-Za-z]/g, '').slice(0, 12)
  const inputLast4 = phone(request.nextUrl.searchParams.get('last4')).slice(-4)

  if (!familyCode || !inputLast4) {
    return NextResponse.json({
      ok: true,
      needsLookup: true,
      message: '가족코드와 보호자 또는 부모님 휴대폰 뒤 4자리를 입력하면 오늘 리포트를 확인할 수 있습니다.',
      report: null
    })
  }

  const family = await loadFamily(familyCode, inputLast4)

  if (!family.matched) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족코드 또는 휴대폰 뒤 4자리가 일치하지 않습니다.',
        hint: '부모님 연결코드와 보호자/부모님 휴대폰 뒤 4자리를 다시 확인해주세요.',
        matchedCount: family.all.length
      },
      { status: 404 }
    )
  }

  const matchedFamily = family.matched as Row

  const [requestResult, outboxResult] = await Promise.all([
    rest('care_response_requests?select=*&family_code=eq.' + encodeURIComponent(familyCode) + '&order=created_at.desc&limit=100'),
    rest('notification_outbox?select=*&family_code=eq.' + encodeURIComponent(familyCode) + '&order=created_at.desc&limit=100')
  ])

  const careRequests = rows(requestResult)
  const messages = rows(outboxResult)
  const status = getSignalTone(careRequests)
  const latest = careRequests[0] || null

  const metrics = {
    totalSignals: careRequests.length,
    okSignals: countBy(careRequests, (row) => text(row.signal_type) === 'daily_ok'),
    warningSignals: countBy(careRequests, (row) => ['meal_missed', 'medication_missed', 'feeling_sick'].includes(text(row.signal_type))),
    urgentSignals: countBy(careRequests, (row) => text(row.signal_type) === 'urgent_neighbor_help' || text(row.risk_level) === 'high'),
    completed: countBy(careRequests, (row) => text(row.status) === 'completed'),
    open: countBy(careRequests, (row) => ['open', 'manual_needed', 'dispatched', 'accepted', 'in_progress'].includes(text(row.status))),
    sentMessages: countBy(messages, (row) => text(row.status) === 'sent'),
    queuedMessages: countBy(messages, (row) => text(row.status) === 'queued'),
    failedMessages: countBy(messages, (row) => text(row.status) === 'failed')
  }

  const parentAppUrl = onboardingUrl(request.nextUrl.origin, matchedFamily)

  return NextResponse.json({
    ok: true,
    report: {
      family: matchedFamily,
      familyCode,
      parentName: text(matchedFamily.parent_name) || '부모님',
      guardianName: text(matchedFamily.guardian_name) || '보호자',
      serviceArea: text(matchedFamily.service_area) || '우리동네',
      parentAppUrl,
      status,
      latestSignal: latest ? {
        signalType: text(latest.signal_type),
        signalLabel: text(latest.signal_label) || text(latest.request_type),
        riskLevel: text(latest.risk_level),
        requestStatus: text(latest.status),
        createdKst: toKst(latest.created_at),
        requestedAction: text(latest.requested_action)
      } : null,
      metrics,
      requests: careRequests.slice(0, 20).map((item) => ({
        id: text(item.id),
        signalType: text(item.signal_type),
        signalLabel: text(item.signal_label) || text(item.request_type),
        riskLevel: text(item.risk_level),
        status: text(item.status),
        createdKst: toKst(item.created_at),
        requestedAction: text(item.requested_action)
      })),
      messages: messages.slice(0, 20).map((item) => ({
        id: text(item.id),
        title: text(item.title),
        body: text(item.body),
        status: text(item.status),
        templateCode: text(item.template_code),
        createdKst: toKst(item.created_at),
        sentKst: toKst(item.sent_at)
      })),
      nextAction:
        status.level === 'empty'
          ? '부모님 앱 링크를 보내고 “괜찮아요” 버튼을 먼저 눌러보세요.'
          : status.level === 'urgent'
            ? '보호자가 먼저 전화 확인하고, 응급상황이면 119 또는 의료기관에 연락하세요.'
            : status.level === 'warning'
              ? '식사·복약·몸 상태를 전화로 확인하고 필요한 조치를 기록하세요.'
              : '현재 추가 조치가 필요하지 않습니다.'
    },
    generatedAt: new Date().toISOString()
  })
}
