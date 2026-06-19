import { NextRequest, NextResponse } from 'next/server'
import {
  assessAnbuAuto,
  AUTO_PROFILES,
  normalizeAutoMode,
  outcomeLabel,
  type AutoMode,
  type Row
} from '@/lib/anbu-auto-engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RestResult = {
  ok: boolean
  rows: Row[]
  error?: string
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanFamilyCode(value: unknown) {
  return text(value).replace(/[^\w-]/g, '').slice(0, 48)
}

function objectValue(value: unknown): Row {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Row
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Row
        : {}
    } catch {
      return {}
    }
  }

  return {}
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

async function restRows(table: string, params: Record<string, string>): Promise<RestResult> {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [],
      error: 'Supabase 환경변수가 설정되지 않았습니다.'
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

async function insertRow(table: string, row: Row): Promise<RestResult> {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [],
      error: 'Supabase 환경변수가 설정되지 않았습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/${table}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(row),
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
        error: `${table}: ${response.status} ${raw.slice(0, 280)}`
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

async function patchRows(table: string, params: Record<string, string>, patch: Row): Promise<RestResult> {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [],
      error: 'Supabase 환경변수가 설정되지 않았습니다.'
    }
  }

  const search = new URLSearchParams(params)

  try {
    const response = await fetch(`${base}/${table}?${search.toString()}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(patch),
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
        error: `${table}: ${response.status} ${raw.slice(0, 280)}`
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

function createdTime(row: Row) {
  const parsed = Date.parse(text(row.created_at || row.updated_at))
  return Number.isFinite(parsed) ? parsed : 0
}

function latestProfile(events: Row[], requests: Row[]): AutoMode {
  const candidates = [
    ...events.filter((row) => text(row.event_type) === 'automation_profile_saved'),
    ...requests.filter((row) => text(row.signal_type) === 'automation_profile')
  ].sort((a, b) => createdTime(b) - createdTime(a))

  const payload = objectValue(candidates[0]?.payload)
  return normalizeAutoMode(payload.mode)
}

function latestOpenIncident(requests: Row[]) {
  return requests
    .filter((row) => text(row.request_type) === 'anbu_incident')
    .sort((a, b) => createdTime(b) - createdTime(a))
    .find((row) => !['resolved', 'completed', 'closed', 'cancelled'].includes(text(row.status).toLowerCase())) || null
}

function feedbackEvents(events: Row[]) {
  return events
    .filter((row) => text(row.event_type) === 'incident_resolved')
    .sort((a, b) => createdTime(b) - createdTime(a))
    .slice(0, 30)
}

function maskPhone(value: unknown) {
  const digits = text(value).replace(/[^\d]/g, '')
  if (digits.length >= 10) return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
  if (digits.length >= 4) return `****-${digits.slice(-4)}`
  return ''
}

function eventTimeline(events: Row[], requests: Row[]) {
  const eventItems = events
    .filter((row) => [
      'incident_claimed',
      'incident_delegated',
      'incident_resolved',
      'guardian_call_started',
      'automation_profile_saved'
    ].includes(text(row.event_type)))
    .map((row) => {
      const payload = objectValue(row.payload)
      const type = text(row.event_type)
      const titleMap: Record<string, string> = {
        incident_claimed: '가족이 확인을 맡았습니다.',
        incident_delegated: '다른 가족에게 확인을 부탁했습니다.',
        incident_resolved: `확인 완료: ${outcomeLabel(text(payload.outcome))}`,
        guardian_call_started: '부모님께 전화 연결을 시작했습니다.',
        automation_profile_saved: `안부 자동모드를 ${AUTO_PROFILES[normalizeAutoMode(payload.mode)].label}로 변경했습니다.`
      }

      return {
        id: text(row.id),
        title: titleMap[type] || type,
        createdAt: text(row.created_at),
        tone: type === 'incident_resolved' ? 'safe' : 'neutral'
      }
    })

  const requestItems = requests
    .filter((row) => text(row.request_type) === 'anbu_incident')
    .map((row) => ({
      id: text(row.id),
      title: text(row.signal_label) || '안부 확인 사건이 생성되었습니다.',
      createdAt: text(row.created_at),
      tone: text(row.risk_level) === 'high' ? 'danger' : 'watch'
    }))

  return [...eventItems, ...requestItems]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 12)
}

async function loadBundle(familyCode: string) {
  const [familyResult, reportResult, requestResult, eventResult] = await Promise.all([
    restRows('anbu_family_links', {
      select: '*',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '1'
    }),
    restRows('ring_daily_reports', {
      select: '*',
      family_code: `eq.${familyCode}`,
      order: 'report_date.desc,created_at.desc',
      limit: '1'
    }),
    restRows('care_response_requests', {
      select: '*',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '120'
    }),
    restRows('ring_report_lab_events', {
      select: '*',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '120'
    })
  ])

  const family = familyResult.rows[0] || null
  const report = reportResult.rows[0] || null
  const requests = requestResult.rows
  const events = eventResult.rows
  const mode = latestProfile(events, requests)
  const openIncident = latestOpenIncident(requests)
  const feedback = feedbackEvents(events)
  const assessment = assessAnbuAuto({
    report,
    recentRequests: requests,
    openIncident,
    feedbackRows: feedback,
    mode
  })

  const incidentPayload = objectValue(openIncident?.payload)

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    family: {
      familyCode,
      parentName: text(family?.parent_name) || '부모님',
      guardianName: text(family?.guardian_name) || '보호자',
      parentPhone: text(family?.parent_phone).replace(/[^\d+]/g, ''),
      parentPhoneMasked: maskPhone(family?.parent_phone),
      guardianPhoneMasked: maskPhone(family?.guardian_phone)
    },
    profile: AUTO_PROFILES[mode],
    profiles: Object.values(AUTO_PROFILES),
    assessment,
    ring: {
      reportId: text(report?.id),
      reportDate: text(report?.report_date),
      score: Number(report?.anbu_score) || null,
      summary: text(report?.summary_text),
      recommendedAction: text(report?.recommended_action),
      source: text(report?.source),
      metrics: objectValue(report?.metrics)
    },
    incident: openIncident
      ? {
          id: text(openIncident.id),
          status: text(openIncident.status) || 'open',
          riskLevel: text(openIncident.risk_level) || 'medium',
          title: text(openIncident.signal_label) || assessment.reason,
          assignee: text(incidentPayload.assignee),
          delegatedTo: text(incidentPayload.delegatedTo),
          createdAt: text(openIncident.created_at)
        }
      : null,
    outcomes: [
      { key: 'normal', label: outcomeLabel('normal') },
      { key: 'ring_off', label: outcomeLabel('ring_off') },
      { key: 'charging', label: outcomeLabel('charging') },
      { key: 'late_sleep', label: outcomeLabel('late_sleep') },
      { key: 'outside', label: outcomeLabel('outside') },
      { key: 'meal_missed', label: outcomeLabel('meal_missed') },
      { key: 'unwell', label: outcomeLabel('unwell') },
      { key: 'unreachable', label: outcomeLabel('unreachable') }
    ],
    timeline: eventTimeline(events, requests),
    sourceErrors: [
      familyResult.error,
      reportResult.error,
      requestResult.error,
      eventResult.error
    ].filter(Boolean),
    notice: '스마트링 정보는 의료 진단이 아닌 일상 안부 확인을 돕는 참고 신호입니다.'
  }
}

async function recordEvent(input: {
  familyCode: string
  eventType: string
  payload: Row
  createdBy?: string
}) {
  const primary = await insertRow('ring_report_lab_events', {
    event_type: input.eventType,
    family_code: input.familyCode,
    payload: input.payload,
    created_by: input.createdBy || '보호자 앱'
  })

  if (primary.ok) return primary

  return insertRow('care_response_requests', {
    family_code: input.familyCode,
    signal_type: input.eventType,
    signal_label: input.eventType,
    request_type: 'anbu_auto_event',
    risk_level: 'low',
    status: 'completed',
    payload: input.payload
  })
}

async function familyNames(familyCode: string) {
  const result = await restRows('anbu_family_links', {
    select: 'parent_name,guardian_name',
    family_code: `eq.${familyCode}`,
    order: 'created_at.desc',
    limit: '1'
  })

  const row = result.rows[0] || {}
  return {
    parentName: text(row.parent_name) || '부모님',
    guardianName: text(row.guardian_name) || '보호자'
  }
}

async function createOrClaimIncident(input: {
  familyCode: string
  incidentId?: string
  assignee: string
  reason: string
  riskLevel: string
}) {
  const now = new Date().toISOString()

  if (input.incidentId) {
    const current = await restRows('care_response_requests', {
      select: '*',
      id: `eq.${input.incidentId}`,
      limit: '1'
    })
    const row = current.rows[0] || {}
    const payload = objectValue(row.payload)

    return patchRows('care_response_requests', { id: `eq.${input.incidentId}` }, {
      status: 'claimed',
      payload: {
        ...payload,
        assignee: input.assignee,
        claimedAt: now,
        updatedAt: now
      }
    })
  }

  const names = await familyNames(input.familyCode)

  return insertRow('care_response_requests', {
    family_code: input.familyCode,
    parent_name: names.parentName,
    guardian_name: names.guardianName,
    signal_type: 'anbu_incident',
    signal_label: input.reason || '부모님 안부 확인이 필요합니다.',
    request_type: 'anbu_incident',
    risk_level: input.riskLevel || 'medium',
    status: 'claimed',
    payload: {
      source: 'anbu_auto',
      assignee: input.assignee,
      claimedAt: now,
      createdAt: now
    }
  })
}

export async function GET(request: NextRequest) {
  const familyCode = cleanFamilyCode(request.nextUrl.searchParams.get('familyCode'))

  if (!familyCode) {
    return NextResponse.json({
      ok: false,
      message: '가족코드가 필요합니다.'
    }, { status: 400 })
  }

  return NextResponse.json(await loadBundle(familyCode))
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const familyCode = cleanFamilyCode(body.familyCode)
  const action = text(body.action)

  if (!familyCode) {
    return NextResponse.json({ ok: false, message: '가족코드가 필요합니다.' }, { status: 400 })
  }

  if (action === 'save_mode') {
    const mode = normalizeAutoMode(body.mode)
    const result = await recordEvent({
      familyCode,
      eventType: 'automation_profile_saved',
      payload: {
        mode,
        savedAt: new Date().toISOString(),
        source: 'guardian_three_second_dashboard'
      }
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: '자동모드 저장에 실패했습니다.', detail: result.error }, { status: 500 })
    }

    return NextResponse.json(await loadBundle(familyCode))
  }

  if (action === 'claim') {
    const bundle = await loadBundle(familyCode)
    const assignee = text(body.assignee) || bundle.family.guardianName || '보호자'
    const incidentResult = await createOrClaimIncident({
      familyCode,
      incidentId: text(body.incidentId),
      assignee,
      reason: bundle.assessment.reason,
      riskLevel: bundle.assessment.key === 'needs_check' ? 'high' : 'medium'
    })

    if (!incidentResult.ok) {
      return NextResponse.json({ ok: false, message: '확인 담당 지정에 실패했습니다.', detail: incidentResult.error }, { status: 500 })
    }

    const incidentId = text(incidentResult.rows[0]?.id || body.incidentId)
    await recordEvent({
      familyCode,
      eventType: 'incident_claimed',
      payload: { incidentId, assignee, claimedAt: new Date().toISOString() }
    })

    return NextResponse.json(await loadBundle(familyCode))
  }

  if (action === 'delegate') {
    const incidentId = text(body.incidentId)
    const delegatedTo = text(body.delegatedTo) || '다른 가족'

    if (!incidentId) {
      return NextResponse.json({ ok: false, message: '먼저 확인 사건을 맡아주세요.' }, { status: 400 })
    }

    const current = await restRows('care_response_requests', {
      select: '*',
      id: `eq.${incidentId}`,
      limit: '1'
    })
    const row = current.rows[0] || {}
    const payload = objectValue(row.payload)
    const updated = await patchRows('care_response_requests', { id: `eq.${incidentId}` }, {
      status: 'open',
      payload: {
        ...payload,
        assignee: '',
        delegatedTo,
        delegatedAt: new Date().toISOString()
      }
    })

    if (!updated.ok) {
      return NextResponse.json({ ok: false, message: '가족에게 부탁하기 저장에 실패했습니다.', detail: updated.error }, { status: 500 })
    }

    await recordEvent({
      familyCode,
      eventType: 'incident_delegated',
      payload: { incidentId, delegatedTo, delegatedAt: new Date().toISOString() }
    })

    return NextResponse.json(await loadBundle(familyCode))
  }

  if (action === 'call') {
    await recordEvent({
      familyCode,
      eventType: 'guardian_call_started',
      payload: {
        incidentId: text(body.incidentId),
        startedAt: new Date().toISOString()
      }
    })
    return NextResponse.json(await loadBundle(familyCode))
  }

  if (action === 'resolve') {
    const incidentId = text(body.incidentId)
    const outcome = text(body.outcome)

    if (!incidentId || !outcome) {
      return NextResponse.json({ ok: false, message: '확인 사건과 결과가 필요합니다.' }, { status: 400 })
    }

    const current = await restRows('care_response_requests', {
      select: '*',
      id: `eq.${incidentId}`,
      limit: '1'
    })
    const row = current.rows[0]

    if (!row) {
      return NextResponse.json({ ok: false, message: '확인 사건을 찾지 못했습니다.' }, { status: 404 })
    }

    const payload = objectValue(row.payload)
    const resolvedAt = new Date().toISOString()
    const updated = await patchRows('care_response_requests', { id: `eq.${incidentId}` }, {
      status: 'resolved',
      payload: {
        ...payload,
        outcome,
        outcomeLabel: outcomeLabel(outcome),
        resolutionMemo: text(body.memo),
        resolvedAt
      }
    })

    if (!updated.ok) {
      return NextResponse.json({ ok: false, message: '확인 결과 저장에 실패했습니다.', detail: updated.error }, { status: 500 })
    }

    await recordEvent({
      familyCode,
      eventType: 'incident_resolved',
      payload: {
        incidentId,
        outcome,
        outcomeLabel: outcomeLabel(outcome),
        memo: text(body.memo),
        resolvedAt
      }
    })

    return NextResponse.json(await loadBundle(familyCode))
  }

  return NextResponse.json({ ok: false, message: '지원하지 않는 작업입니다.' }, { status: 400 })
}
