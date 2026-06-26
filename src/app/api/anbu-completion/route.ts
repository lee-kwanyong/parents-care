import { NextRequest, NextResponse } from 'next/server'
import {
  type AnbuCase,
  type AnbuCaseEvent,
  buildCompletionDashboard,
  kstDayRange,
  kstNowLabel,
  kstTodayDate,
  normalizeCaseStatus,
  parsePayload,
  text
} from '@/lib/anbu-case-core'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

function cleanFamilyCode(value: unknown) {
  return text(value).replace(/[^\w-]/g, '').slice(0, 64)
}

function cleanToken(value: unknown) {
  return text(value).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://parents-care.net').replace(/\/$/, '')
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

async function restRows(table: string, params: Record<string, string>) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [] as Row[],
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
        rows: [] as Row[],
        error: `${table}: ${response.status} ${raw.slice(0, 300)}`
      }
    }

    return {
      ok: true,
      rows: Array.isArray(parsed) ? parsed as Row[] : [],
      error: ''
    }
  } catch (error) {
    return {
      ok: false,
      rows: [] as Row[],
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

async function insertRow(table: string, row: Row) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [] as Row[],
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
        rows: [] as Row[],
        error: `${table}: ${response.status} ${raw.slice(0, 300)}`
      }
    }

    return {
      ok: true,
      rows: Array.isArray(parsed) ? parsed as Row[] : [],
      error: ''
    }
  } catch (error) {
    return {
      ok: false,
      rows: [] as Row[],
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

async function patchRows(table: string, filter: string, patch: Row) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [] as Row[],
      error: 'Supabase 환경변수가 설정되지 않았습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/${table}?${filter}`, {
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
        rows: [] as Row[],
        error: `${table}: ${response.status} ${raw.slice(0, 300)}`
      }
    }

    return {
      ok: true,
      rows: Array.isArray(parsed) ? parsed as Row[] : [],
      error: ''
    }
  } catch (error) {
    return {
      ok: false,
      rows: [] as Row[],
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function newLegacyCaseId(familyCode: string) {
  return `legacy-${familyCode}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

async function loadFamily(familyCode: string) {
  const result = await restRows('anbu_family_links', {
    select: '*',
    family_code: `eq.${familyCode}`,
    order: 'created_at.desc',
    limit: '1'
  })

  return {
    family: result.rows[0] || null,
    error: result.ok ? '' : result.error
  }
}

function dedicatedEventFromRow(row: Row): AnbuCaseEvent {
  return {
    id: text(row.id),
    caseId: text(row.case_id),
    familyCode: text(row.family_code),
    eventType: text(row.event_type) || 'note',
    actorName: text(row.actor_name),
    actorRole: text(row.actor_role),
    method: text(row.method),
    resultType: text(row.result_type),
    note: text(row.note),
    payload: parsePayload(row.payload),
    createdAt: text(row.created_at)
  }
}

function dedicatedCaseFromRow(row: Row, events: AnbuCaseEvent[]): AnbuCase {
  const id = text(row.id)
  const timeline = events
    .filter((event) => event.caseId === id)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))

  return {
    id,
    familyCode: text(row.family_code),
    parentName: text(row.parent_name),
    guardianName: text(row.guardian_name),
    title: text(row.title) || '안부 확인 필요',
    reasonType: text(row.reason_type) || 'manual',
    riskLevel: text(row.risk_level) || 'medium',
    status: normalizeCaseStatus(row.status),
    source: text(row.source) || 'manual',
    openedBy: text(row.opened_by),
    assignedTo: text(row.assigned_to),
    assignedRole: text(row.assigned_role),
    assignedAt: text(row.assigned_at),
    dueAt: text(row.due_at),
    resolvedAt: text(row.resolved_at),
    cancelledAt: text(row.cancelled_at),
    closeResult: text(row.close_result),
    closeNote: text(row.close_note),
    dataQuality: text(row.data_quality) || 'unknown',
    ringReference: parsePayload(row.ring_reference),
    metadata: parsePayload(row.metadata),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
    timeline
  }
}

function legacyEventFromRow(row: Row): AnbuCaseEvent | null {
  const signalType = text(row.signal_type)
  const payload = parsePayload(row.payload)
  const source = text(payload.source)

  if (source !== 'anbu_completion' && !signalType.startsWith('completion_')) {
    return null
  }

  let eventType = text(payload.eventType)

  if (!eventType) {
    if (signalType === 'completion_daily_ok') eventType = 'daily_ok'
    else if (signalType.includes('opened')) eventType = 'opened'
    else if (signalType.includes('accepted') || signalType.includes('assigned')) eventType = 'accepted'
    else if (signalType.includes('checking') || signalType.includes('called')) eventType = 'checking'
    else if (signalType.includes('resolved') || signalType.includes('closed')) eventType = 'resolved'
    else if (signalType.includes('cancelled')) eventType = 'cancelled'
    else eventType = 'note'
  }

  return {
    id: text(row.id) || `${text(payload.caseId)}-${text(row.created_at)}`,
    caseId: text(payload.caseId),
    familyCode: text(row.family_code),
    eventType,
    actorName: text(payload.actorName),
    actorRole: text(payload.actorRole),
    method: text(payload.method),
    resultType: text(payload.resultType),
    note: text(payload.note),
    payload,
    createdAt: text(row.created_at) || new Date().toISOString()
  }
}

function legacyCasesFromEvents(events: AnbuCaseEvent[], family: Row | null): AnbuCase[] {
  const map = new Map<string, AnbuCase>()

  for (const event of events) {
    if (!event.caseId || event.eventType === 'daily_ok') continue

    const current = map.get(event.caseId) || {
      id: event.caseId,
      familyCode: event.familyCode,
      parentName: text(family?.parent_name) || '부모님',
      guardianName: text(family?.guardian_name) || '보호자',
      title: text(event.payload.title) || event.note || '안부 확인 필요',
      reasonType: text(event.payload.reasonType) || 'manual',
      riskLevel: text(event.payload.riskLevel) || 'medium',
      status: 'opened' as const,
      source: 'legacy',
      openedBy: '',
      assignedTo: '',
      assignedRole: '',
      assignedAt: '',
      dueAt: '',
      resolvedAt: '',
      cancelledAt: '',
      closeResult: '',
      closeNote: '',
      dataQuality: text(event.payload.dataQuality) || 'unknown',
      ringReference: parsePayload(event.payload.ringReference),
      metadata: event.payload,
      createdAt: event.createdAt,
      updatedAt: event.createdAt,
      timeline: []
    }

    current.timeline.push(event)

    if (event.eventType === 'opened') {
      current.status = 'opened'
      current.title = text(event.payload.title) || event.note || current.title
      current.reasonType = text(event.payload.reasonType) || current.reasonType
      current.riskLevel = text(event.payload.riskLevel) || current.riskLevel
      current.createdAt = event.createdAt
    }

    if (event.eventType === 'accepted' || event.eventType === 'assigned') {
      current.status = current.status === 'resolved' ? current.status : 'accepted'
      current.assignedTo = event.actorName || current.assignedTo
      current.assignedRole = event.actorRole || current.assignedRole
      current.assignedAt = event.createdAt
    }

    if (event.eventType === 'checking' || event.eventType === 'called') {
      current.status = current.status === 'resolved' ? current.status : 'checking'
      current.assignedTo = event.actorName || current.assignedTo
    }

    if (event.eventType === 'unreachable') {
      current.status = 'unreachable'
      current.closeResult = 'contact_failed'
      current.closeNote = event.note
    }

    if (event.eventType === 'escalated') {
      current.status = 'escalated'
    }

    if (event.eventType === 'resolved' || event.eventType === 'closed') {
      current.status = 'resolved'
      current.resolvedAt = event.createdAt
      current.closeResult = event.resultType || 'same_as_usual'
      current.closeNote = event.note
      current.assignedTo = event.actorName || current.assignedTo
    }

    if (event.eventType === 'cancelled') {
      current.status = 'cancelled'
      current.cancelledAt = event.createdAt
      current.closeResult = event.resultType || 'wrong_press'
      current.closeNote = event.note
    }

    current.updatedAt = event.createdAt
    map.set(event.caseId, current)
  }

  return Array.from(map.values()).map((caseItem) => ({
    ...caseItem,
    timeline: caseItem.timeline.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  }))
}

async function loadCompletionData(familyCode: string, family: Row | null) {
  const today = kstTodayDate()
  const range = kstDayRange(today)
  const since = new Date(Date.parse(range.start) - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [caseResult, eventResult, legacyResult] = await Promise.all([
    restRows('anbu_cases', {
      select: '*',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '250'
    }),
    restRows('anbu_case_events', {
      select: '*',
      family_code: `eq.${familyCode}`,
      created_at: `gte.${since}`,
      order: 'created_at.asc',
      limit: '800'
    }),
    restRows('care_response_requests', {
      select: 'id,family_code,parent_name,guardian_name,signal_type,signal_label,request_type,risk_level,status,payload,created_at',
      family_code: `eq.${familyCode}`,
      created_at: `gte.${since}`,
      order: 'created_at.asc',
      limit: '800'
    })
  ])

  const dedicatedEvents = eventResult.ok ? eventResult.rows.map(dedicatedEventFromRow) : []
  const dedicatedCases = caseResult.ok
    ? caseResult.rows.map((row) => dedicatedCaseFromRow(row, dedicatedEvents))
    : []

  const legacyEvents = legacyResult.ok
    ? legacyResult.rows
        .map(legacyEventFromRow)
        .filter((event): event is AnbuCaseEvent => Boolean(event))
    : []

  const dailyOkCount =
    dedicatedEvents.filter((event) => event.eventType === 'daily_ok').length +
    legacyEvents.filter((event) => event.eventType === 'daily_ok').length

  const cases = [
    ...dedicatedCases,
    ...legacyCasesFromEvents(legacyEvents, family)
  ]

  return {
    cases,
    dailyOkCount,
    errors: [caseResult.error, eventResult.error, legacyResult.error].filter(Boolean)
  }
}

async function buildView(familyCode: string) {
  if (!familyCode) {
    return {
      ok: true,
      demo: true,
      generatedKst: kstNowLabel(),
      family: {
        familyCode: '',
        parentName: '부모님',
        guardianName: '보호자'
      },
      dashboard: buildCompletionDashboard({
        parentName: '부모님',
        guardianName: '보호자',
        cases: [],
        dailyOkCount: 0
      }),
      sourceErrors: [] as string[]
    }
  }

  const familyResult = await loadFamily(familyCode)
  const family = familyResult.family || {}
  const parentName = text(family.parent_name) || '부모님'
  const guardianName = text(family.guardian_name) || '보호자'
  const completion = await loadCompletionData(familyCode, family)

  return {
    ok: true,
    demo: false,
    generatedKst: kstNowLabel(),
    family: {
      familyCode,
      parentName,
      guardianName
    },
    dashboard: buildCompletionDashboard({
      parentName,
      guardianName,
      cases: completion.cases,
      dailyOkCount: completion.dailyOkCount
    }),
    sourceErrors: [familyResult.error, ...completion.errors].filter(Boolean)
  }
}

function reasonMeta(reasonType: string) {
  const map: Record<string, { label: string; riskLevel: 'low' | 'medium' | 'high'; title: string }> = {
    no_response: {
      label: '미응답 확인 필요',
      riskLevel: 'medium',
      title: '부모님 안부 미응답'
    },
    condition: {
      label: '몸 상태 확인 필요',
      riskLevel: 'medium',
      title: '몸 상태 확인 필요'
    },
    help: {
      label: '도움 요청',
      riskLevel: 'high',
      title: '도움 요청 확인 필요'
    },
    meal: {
      label: '식사 확인 필요',
      riskLevel: 'medium',
      title: '식사 확인 필요'
    },
    medication: {
      label: '복약 확인 필요',
      riskLevel: 'medium',
      title: '복약 확인 필요'
    },
    data_gap: {
      label: '데이터 부족 확인',
      riskLevel: 'medium',
      title: '데이터 부족 확인 필요'
    },
    manual: {
      label: '수동 확인 필요',
      riskLevel: 'medium',
      title: '수동 안부 확인 필요'
    }
  }

  return map[reasonType] || {
    label: '안부 확인 필요',
    riskLevel: 'medium' as const,
    title: '안부 확인 필요'
  }
}

async function insertLegacyEvent(input: {
  familyCode: string
  family: Row | null
  caseId: string
  eventType: string
  reasonType: string
  label: string
  riskLevel: string
  status: string
  actorName?: string
  actorRole?: string
  method?: string
  resultType?: string
  note?: string
  extra?: Record<string, unknown>
}) {
  const family = input.family || {}
  const signalType = input.eventType === 'daily_ok'
    ? 'completion_daily_ok'
    : `completion_case_${input.eventType}`

  return insertRow('care_response_requests', {
    family_code: input.familyCode,
    parent_name: text(family.parent_name) || '부모님',
    guardian_name: text(family.guardian_name) || '보호자',
    signal_type: signalType,
    signal_label: input.label,
    request_type: 'completion_care',
    risk_level: input.riskLevel,
    status: input.status,
    payload: {
      source: 'anbu_completion',
      caseId: input.caseId,
      eventType: input.eventType,
      reasonType: input.reasonType,
      label: input.label,
      actorName: input.actorName || '',
      actorRole: input.actorRole || '',
      method: input.method || '',
      resultType: input.resultType || '',
      note: input.note || '',
      siteUrl: siteUrl(),
      createdAtKst: kstNowLabel(),
      ...(input.extra || {})
    }
  })
}

async function createCase(input: {
  familyCode: string
  family: Row | null
  reasonType: string
  title?: string
  riskLevel?: string
  openedBy?: string
  source?: string
  note?: string
  dataQuality?: string
  ringReference?: Record<string, unknown>
}) {
  const family = input.family || {}
  const meta = reasonMeta(input.reasonType)
  const title = input.title || meta.title
  const riskLevel = input.riskLevel || meta.riskLevel

  const dedicated = await insertRow('anbu_cases', {
    family_code: input.familyCode,
    parent_name: text(family.parent_name) || '부모님',
    guardian_name: text(family.guardian_name) || '보호자',
    title,
    reason_type: input.reasonType,
    risk_level: riskLevel,
    status: 'opened',
    source: input.source || 'manual',
    opened_by: input.openedBy || '',
    data_quality: input.dataQuality || 'unknown',
    ring_reference: input.ringReference || {},
    metadata: {
      nonMedicalNotice: true,
      createdAtKst: kstNowLabel()
    }
  })

  if (dedicated.ok && dedicated.rows[0]) {
    const caseId = text(dedicated.rows[0].id)

    await insertRow('anbu_case_events', {
      case_id: caseId,
      family_code: input.familyCode,
      event_type: 'opened',
      actor_name: input.openedBy || '',
      actor_role: 'guardian',
      note: input.note || title,
      payload: {
        source: 'anbu_completion',
        reasonType: input.reasonType,
        riskLevel,
        title,
        nonMedicalNotice: true
      }
    })

    return {
      ok: true,
      caseId,
      fallback: false,
      error: ''
    }
  }

  const legacyCaseId = newLegacyCaseId(input.familyCode)

  const legacy = await insertLegacyEvent({
    familyCode: input.familyCode,
    family: input.family,
    caseId: legacyCaseId,
    eventType: 'opened',
    reasonType: input.reasonType,
    label: title,
    riskLevel,
    status: 'opened',
    actorName: input.openedBy,
    note: input.note || title,
    extra: {
      title,
      dataQuality: input.dataQuality || 'unknown',
      ringReference: input.ringReference || {}
    }
  })

  return {
    ok: legacy.ok,
    caseId: legacyCaseId,
    fallback: true,
    error: dedicated.error || legacy.error
  }
}

async function recordEvent(input: {
  familyCode: string
  family: Row | null
  caseId: string
  eventType: string
  status: string
  reasonType?: string
  label: string
  actorName?: string
  actorRole?: string
  method?: string
  resultType?: string
  note?: string
  riskLevel?: string
  patch?: Row
}) {
  let dedicatedOk = false

  if (isUuid(input.caseId)) {
    if (input.patch) {
      await patchRows('anbu_cases', `id=eq.${encodeURIComponent(input.caseId)}`, input.patch)
    }

    const dedicated = await insertRow('anbu_case_events', {
      case_id: input.caseId,
      family_code: input.familyCode,
      event_type: input.eventType,
      actor_name: input.actorName || '',
      actor_role: input.actorRole || 'guardian',
      method: input.method || '',
      result_type: input.resultType || '',
      note: input.note || '',
      payload: {
        source: 'anbu_completion',
        caseId: input.caseId,
        reasonType: input.reasonType || 'manual',
        label: input.label,
        riskLevel: input.riskLevel || 'medium',
        nonMedicalNotice: true
      }
    })

    dedicatedOk = dedicated.ok
  }

  if (!dedicatedOk) {
    await insertLegacyEvent({
      familyCode: input.familyCode,
      family: input.family,
      caseId: input.caseId,
      eventType: input.eventType,
      reasonType: input.reasonType || 'manual',
      label: input.label,
      riskLevel: input.riskLevel || 'medium',
      status: input.status,
      actorName: input.actorName,
      actorRole: input.actorRole,
      method: input.method,
      resultType: input.resultType,
      note: input.note
    })
  }

  return {
    ok: true
  }
}

async function recordDailyOk(input: {
  familyCode: string
  family: Row | null
}) {
  const dedicated = await insertRow('anbu_case_events', {
    case_id: null,
    family_code: input.familyCode,
    event_type: 'daily_ok',
    actor_name: text(input.family?.parent_name) || '부모님',
    actor_role: 'parent',
    note: '부모님이 정상 안부를 남겼습니다.',
    payload: {
      source: 'anbu_completion',
      eventType: 'daily_ok',
      nonMedicalNotice: true
    }
  })

  if (!dedicated.ok) {
    await insertLegacyEvent({
      familyCode: input.familyCode,
      family: input.family,
      caseId: '',
      eventType: 'daily_ok',
      reasonType: 'daily_ok',
      label: '괜찮아요',
      riskLevel: 'low',
      status: 'completed',
      actorName: text(input.family?.parent_name) || '부모님',
      actorRole: 'parent',
      note: '부모님이 정상 안부를 남겼습니다.'
    })
  }

  return {
    ok: true
  }
}

async function saveReport(familyCode: string, family: Row | null, createdBy: string) {
  const view = await buildView(familyCode)
  const dashboard = view.dashboard
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
  const familyInfo = view.family

  const dedicated = await insertRow('anbu_completion_reports', {
    family_code: familyCode,
    parent_name: familyInfo.parentName,
    guardian_name: familyInfo.guardianName,
    report_type: 'daily',
    status_summary: dashboard.status.label,
    completion_rate: dashboard.metrics.completionRate,
    average_close_minutes: dashboard.metrics.averageCloseMinutes,
    case_count: dashboard.metrics.totalCases,
    open_count: dashboard.metrics.activeCount,
    resolved_count: dashboard.metrics.resolvedCount,
    report_text: dashboard.reportText,
    report_json: dashboard,
    created_by: createdBy || '보호자',
    share_token: token
  })

  if (dedicated.ok && dedicated.rows[0]) {
    return {
      ok: true,
      fallback: false,
      report: dedicated.rows[0],
      shareToken: text(dedicated.rows[0].share_token) || token,
      shareUrl: `${siteUrl()}/reports/anbu/${text(dedicated.rows[0].share_token) || token}`
    }
  }

  const legacy = await insertLegacyEvent({
    familyCode,
    family,
    caseId: '',
    eventType: 'report_created',
    reasonType: 'report',
    label: '안부완료 리포트 저장',
    riskLevel: 'low',
    status: 'completed',
    actorName: createdBy || '보호자',
    actorRole: 'guardian',
    note: '안부완료 리포트가 저장되었습니다.',
    extra: {
      shareToken: token,
      reportText: dashboard.reportText,
      reportJson: dashboard
    }
  })

  return {
    ok: legacy.ok,
    fallback: true,
    report: legacy.rows[0] || null,
    shareToken: token,
    shareUrl: `${siteUrl()}/reports/anbu/${token}`,
    error: dedicated.error || legacy.error
  }
}

async function loadSharedReport(token: string) {
  const dedicated = await restRows('anbu_completion_reports', {
    select: '*',
    share_token: `eq.${token}`,
    limit: '1'
  })

  if (dedicated.ok && dedicated.rows[0]) {
    const row = dedicated.rows[0]

    if (text(row.id)) {
      await patchRows(
        'anbu_completion_reports',
        `id=eq.${encodeURIComponent(text(row.id))}`,
        {
          viewed_count: Number(row.viewed_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        }
      )
    }

    return {
      ok: true,
      report: {
        reportNo: text(row.report_no),
        parentName: text(row.parent_name) || '부모님',
        guardianName: text(row.guardian_name) || '보호자',
        reportText: text(row.report_text),
        reportJson: parsePayload(row.report_json),
        createdAt: text(row.created_at),
        fallback: false
      }
    }
  }

  const legacy = await restRows('care_response_requests', {
    select: 'id,family_code,parent_name,guardian_name,signal_type,signal_label,risk_level,status,payload,created_at',
    signal_type: 'eq.completion_case_report_created',
    order: 'created_at.desc',
    limit: '1000'
  })

  const row = legacy.rows.find((item) => text(parsePayload(item.payload).shareToken) === token)

  if (!row) {
    return {
      ok: false,
      message: '공유 리포트를 찾지 못했습니다.'
    }
  }

  const payload = parsePayload(row.payload)

  return {
    ok: true,
    report: {
      reportNo: `LEGACY-${text(row.id).slice(0, 8)}`,
      parentName: text(row.parent_name) || '부모님',
      guardianName: text(row.guardian_name) || '보호자',
      reportText: text(payload.reportText),
      reportJson: parsePayload(payload.reportJson),
      createdAt: text(row.created_at),
      fallback: true
    }
  }
}

export async function GET(request: NextRequest) {
  const shareToken = cleanToken(request.nextUrl.searchParams.get('shareToken'))

  if (shareToken) {
    const shared = await loadSharedReport(shareToken)
    return NextResponse.json(shared, { status: shared.ok ? 200 : 404 })
  }

  const familyCode = cleanFamilyCode(request.nextUrl.searchParams.get('familyCode'))
  const view = await buildView(familyCode)

  return NextResponse.json(view)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const familyCode = cleanFamilyCode(body.familyCode)

  if (!familyCode) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족코드가 필요합니다.'
      },
      { status: 400 }
    )
  }

  const action = text(body.action)
  const familyResult = await loadFamily(familyCode)
  const family = familyResult.family

  if (action === 'parent_signal') {
    const signal = text(body.signal)

    if (signal === 'ok') {
      await recordDailyOk({ familyCode, family })

      return NextResponse.json({
        ...(await buildView(familyCode)),
        saved: true,
        createdCaseId: '',
        message: '정상 안부가 조용히 기록되었습니다.'
      })
    }

    const reasonType = signal === 'help' ? 'help' : 'condition'
    const meta = reasonMeta(reasonType)

    const created = await createCase({
      familyCode,
      family,
      reasonType,
      title: meta.title,
      riskLevel: meta.riskLevel,
      openedBy: text(family?.parent_name) || '부모님',
      source: 'parent_button',
      note:
        signal === 'help'
          ? '부모님이 도움이 필요하다고 눌렀습니다.'
          : '부모님이 조금 불편하다고 눌렀습니다.'
    })

    return NextResponse.json({
      ...(await buildView(familyCode)),
      saved: created.ok,
      createdCaseId: created.caseId,
      message:
        signal === 'help'
          ? '도움 요청 확인 사건이 생성되었습니다.'
          : '몸 상태 확인 사건이 생성되었습니다.'
    })
  }

  if (action === 'open_case') {
    const reasonType = text(body.reasonType) || 'manual'
    const meta = reasonMeta(reasonType)

    const created = await createCase({
      familyCode,
      family,
      reasonType,
      title: text(body.title) || meta.title,
      riskLevel: text(body.riskLevel) || meta.riskLevel,
      openedBy: text(body.actorName) || '보호자',
      source: 'guardian_manual',
      note: text(body.note),
      dataQuality: text(body.dataQuality) || 'unknown',
      ringReference: parsePayload(body.ringReference)
    })

    return NextResponse.json({
      ...(await buildView(familyCode)),
      saved: created.ok,
      createdCaseId: created.caseId,
      message: '확인필요 사건이 생성되었습니다.'
    })
  }

  if (action === 'accept_case') {
    const caseId = text(body.caseId)

    if (!caseId) {
      return NextResponse.json({ ok: false, message: 'caseId가 필요합니다.' }, { status: 400 })
    }

    await recordEvent({
      familyCode,
      family,
      caseId,
      eventType: 'accepted',
      status: 'accepted',
      reasonType: text(body.reasonType) || 'manual',
      label: '확인 담당자 지정',
      actorName: text(body.actorName) || '보호자',
      actorRole: text(body.actorRole) || 'guardian',
      note: text(body.note) || '확인을 맡았습니다.',
      riskLevel: text(body.riskLevel) || 'medium',
      patch: {
        status: 'accepted',
        assigned_to: text(body.actorName) || '보호자',
        assigned_role: text(body.actorRole) || 'guardian',
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    return NextResponse.json({
      ...(await buildView(familyCode)),
      saved: true,
      message: '확인 담당자로 지정되었습니다.'
    })
  }

  if (action === 'call_log') {
    const caseId = text(body.caseId)

    if (!caseId) {
      return NextResponse.json({ ok: false, message: 'caseId가 필요합니다.' }, { status: 400 })
    }

    await recordEvent({
      familyCode,
      family,
      caseId,
      eventType: 'checking',
      status: 'checking',
      reasonType: text(body.reasonType) || 'manual',
      label: '전화 확인 기록',
      actorName: text(body.actorName) || '보호자',
      actorRole: text(body.actorRole) || 'guardian',
      method: text(body.method) || '전화',
      note: text(body.note) || '전화 확인을 진행했습니다.',
      riskLevel: text(body.riskLevel) || 'medium',
      patch: {
        status: 'checking',
        updated_at: new Date().toISOString()
      }
    })

    return NextResponse.json({
      ...(await buildView(familyCode)),
      saved: true,
      message: '전화 확인 기록이 남았습니다.'
    })
  }

  if (action === 'close_case') {
    const caseId = text(body.caseId)

    if (!caseId) {
      return NextResponse.json({ ok: false, message: 'caseId가 필요합니다.' }, { status: 400 })
    }

    const resultType = text(body.resultType) || 'same_as_usual'
    const status = resultType === 'contact_failed' ? 'unreachable' : 'resolved'
    const eventType = resultType === 'contact_failed' ? 'unreachable' : 'resolved'

    await recordEvent({
      familyCode,
      family,
      caseId,
      eventType,
      status,
      reasonType: text(body.reasonType) || 'manual',
      label: resultType === 'contact_failed' ? '연락 실패' : '안부 확인 완료',
      actorName: text(body.actorName) || '보호자',
      actorRole: text(body.actorRole) || 'guardian',
      method: text(body.method) || '전화',
      resultType,
      note: text(body.note),
      riskLevel: 'low',
      patch: {
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        close_result: resultType,
        close_note: text(body.note),
        updated_at: new Date().toISOString()
      }
    })

    return NextResponse.json({
      ...(await buildView(familyCode)),
      saved: true,
      message: status === 'resolved' ? '안부 확인이 완료 처리되었습니다.' : '연락 실패로 기록되었습니다.'
    })
  }

  if (action === 'cancel_case') {
    const caseId = text(body.caseId)

    if (!caseId) {
      return NextResponse.json({ ok: false, message: 'caseId가 필요합니다.' }, { status: 400 })
    }

    await recordEvent({
      familyCode,
      family,
      caseId,
      eventType: 'cancelled',
      status: 'cancelled',
      reasonType: text(body.reasonType) || 'manual',
      label: '잘못 눌림 또는 취소',
      actorName: text(body.actorName) || '보호자',
      actorRole: text(body.actorRole) || 'guardian',
      resultType: text(body.resultType) || 'wrong_press',
      note: text(body.note) || '잘못 눌림 또는 오류로 취소되었습니다.',
      riskLevel: 'low',
      patch: {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        close_result: text(body.resultType) || 'wrong_press',
        close_note: text(body.note) || '잘못 눌림 또는 오류로 취소되었습니다.',
        updated_at: new Date().toISOString()
      }
    })

    return NextResponse.json({
      ...(await buildView(familyCode)),
      saved: true,
      message: '확인 사건이 취소되었습니다.'
    })
  }

  if (action === 'escalate_case') {
    const caseId = text(body.caseId)

    if (!caseId) {
      return NextResponse.json({ ok: false, message: 'caseId가 필요합니다.' }, { status: 400 })
    }

    await recordEvent({
      familyCode,
      family,
      caseId,
      eventType: 'escalated',
      status: 'escalated',
      reasonType: text(body.reasonType) || 'manual',
      label: '운영실 또는 다른 담당자에게 이관',
      actorName: text(body.actorName) || '보호자',
      actorRole: text(body.actorRole) || 'guardian',
      note: text(body.note) || '추가 확인을 위해 이관했습니다.',
      riskLevel: text(body.riskLevel) || 'medium',
      patch: {
        status: 'escalated',
        updated_at: new Date().toISOString()
      }
    })

    return NextResponse.json({
      ...(await buildView(familyCode)),
      saved: true,
      message: '확인 사건이 이관되었습니다.'
    })
  }

  if (action === 'save_report') {
    const saved = await saveReport(familyCode, family, text(body.actorName) || '보호자')

    return NextResponse.json({
      ...(await buildView(familyCode)),
      saved: saved.ok,
      savedReport: saved,
      message: saved.ok
        ? '안부완료 리포트가 저장되었습니다.'
        : '리포트 저장 중 일부 오류가 발생했습니다.'
    })
  }

  return NextResponse.json({ ok: false, message: '지원하지 않는 action입니다.' }, { status: 400 })
}
