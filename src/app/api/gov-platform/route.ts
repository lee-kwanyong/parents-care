import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

type Row = Record<string, unknown>

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
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function todayKstDateKey() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function dateDaysAgo(days: number) {
  const today = todayKstDateKey()
  const start = new Date(`${today}T00:00:00+09:00`)
  const d = new Date(start.getTime() - days * 24 * 60 * 60 * 1000)

  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}

function kstTime(value: unknown) {
  const raw = text(value)
  if (!raw) return '-'
  const d = new Date(raw)
  if (!Number.isFinite(d.getTime())) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

async function rest(path: string, init?: RequestInit): Promise<RestResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: 'Supabase 환경변수가 없습니다.'
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
  return result.ok && Array.isArray(result.data) ? (result.data as Row[]) : []
}

async function insertAudit(input: {
  actorName?: string
  actorRole?: string
  actionType: string
  targetType: string
  targetId?: string
  familyCode?: string
  description: string
  metadata?: Record<string, unknown>
}) {
  await rest('gov_audit_logs', {
    method: 'POST',
    body: JSON.stringify([
      {
        actor_name: input.actorName || '운영실',
        actor_role: input.actorRole || 'gov_admin',
        action_type: input.actionType,
        target_type: input.targetType,
        target_id: input.targetId || '',
        family_code: input.familyCode || '',
        description: input.description,
        metadata: input.metadata || {}
      }
    ])
  })
}

function latestByFamily(rowsInput: Row[], familyCode: string) {
  return rowsInput
    .filter((row) => text(row.family_code) === familyCode)
    .sort((a, b) => new Date(text(b.occurred_at || b.created_at)).getTime() - new Date(text(a.occurred_at || a.created_at)).getTime())[0] || null
}

function buildRecipientSummaries(input: {
  recipients: Row[]
  links: Row[]
  checkins: Row[]
  tasks: Row[]
}) {
  const familyCodes = new Set<string>()

  for (const row of input.recipients) {
    const code = code6(row.family_code)
    if (code) familyCodes.add(code)
  }

  for (const row of input.links) {
    const code = code6(row.family_code)
    if (code) familyCodes.add(code)
  }

  for (const row of input.checkins) {
    const code = code6(row.family_code)
    if (code) familyCodes.add(code)
  }

  const today = todayKstDateKey()
  const last14Start = dateDaysAgo(13)

  return Array.from(familyCodes).map((familyCode) => {
    const recipient = input.recipients.find((row) => code6(row.family_code) === familyCode)
    const link = input.links.find((row) => code6(row.family_code) === familyCode)
    const recipientName =
      text(recipient?.recipient_name) ||
      text(link?.parent_name) ||
      '대상자'

    const todayRows = input.checkins.filter((row) => text(row.family_code) === familyCode && text(row.care_date) === today)
    const recentRows = input.checkins.filter((row) => text(row.family_code) === familyCode && text(row.care_date) >= last14Start)
    const latest = latestByFamily(input.checkins, familyCode)

    const todayHelp = todayRows.filter((row) => text(row.status) === 'needs_help').length
    const todayMealRows = todayRows.filter((row) => text(row.check_type) === 'meal')
    const todayMedicationRows = todayRows.filter((row) => text(row.check_type) === 'medication')
    const todayMealMissing = Math.max(0, 3 - todayMealRows.length)
    const todayMedicationMissing = Math.max(0, 3 - todayMedicationRows.length)
    const activeTasks = input.tasks.filter((task) => text(task.family_code) === familyCode && text(task.status) !== 'done').length
    const recentRisk = recentRows.filter((row) => ['not_done', 'needs_help'].includes(text(row.status))).length

    const riskLevel =
      todayHelp > 0 || recentRisk >= 5
        ? 'high'
        : todayMealMissing > 0 || todayMedicationMissing > 0 || activeTasks > 0
          ? 'medium'
          : 'normal'

    const todayState =
      riskLevel === 'high'
        ? '확인 필요'
        : riskLevel === 'medium'
          ? '주의'
          : '정상'

    const responseDates = new Set(recentRows.map((row) => text(row.care_date)).filter(Boolean))
    const responseRate14 = Math.round((responseDates.size / 14) * 100)

    return {
      familyCode,
      recipientName,
      region:
        [text(recipient?.region_sigungu), text(recipient?.region_eupmyeondong)].filter(Boolean).join(' ') ||
        '미지정',
      householdType: text(recipient?.household_type) || '미지정',
      assignedOrgName: text(recipient?.assigned_org_name) || '미지정',
      assignedStaffName: text(recipient?.assigned_staff_name) || '미지정',
      guardianName: text(recipient?.guardian_name) || text(link?.guardian_name) || '보호자',
      consentStatus: text(recipient?.consent_status) || 'pending',
      riskLevel,
      todayState,
      responseRate14,
      todayMealMissing,
      todayMedicationMissing,
      todayHelp,
      activeTasks,
      recentRisk,
      lastResponse: latest
        ? {
            label: text(latest.care_label) || '안부 응답',
            time: kstTime(latest.occurred_at || latest.created_at)
          }
        : {
            label: '응답 없음',
            time: '-'
          }
    }
  })
}

function computeMetrics(summaryRows: ReturnType<typeof buildRecipientSummaries>, tasks: Row[], cases: Row[]) {
  const totalRecipients = summaryRows.length
  const highRisk = summaryRows.filter((row) => row.riskLevel === 'high').length
  const mediumRisk = summaryRows.filter((row) => row.riskLevel === 'medium').length
  const noResponse = summaryRows.filter((row) => row.lastResponse.label === '응답 없음').length
  const mealMissing = summaryRows.reduce((sum, row) => sum + row.todayMealMissing, 0)
  const medicationMissing = summaryRows.reduce((sum, row) => sum + row.todayMedicationMissing, 0)
  const helpRequests = summaryRows.reduce((sum, row) => sum + row.todayHelp, 0)
  const activeTasks = tasks.filter((task) => text(task.status) !== 'done').length
  const completedTasks = tasks.filter((task) => text(task.status) === 'done').length
  const openCases = cases.filter((item) => text(item.status) !== 'done').length
  const completedCases = cases.filter((item) => text(item.status) === 'done').length

  return {
    totalRecipients,
    highRisk,
    mediumRisk,
    noResponse,
    mealMissing,
    medicationMissing,
    helpRequests,
    activeTasks,
    completedTasks,
    openCases,
    completedCases,
    familyCheckRate:
      activeTasks + completedTasks > 0
        ? Math.round((completedTasks / (activeTasks + completedTasks)) * 100)
        : 0,
    caseCompleteRate:
      openCases + completedCases > 0
        ? Math.round((completedCases / (openCases + completedCases)) * 100)
        : 0
  }
}

function buildSuggestedCases(summaryRows: ReturnType<typeof buildRecipientSummaries>) {
  const list: Array<{
    familyCode: string
    recipientName: string
    title: string
    content: string
    priority: string
    caseType: string
  }> = []

  for (const row of summaryRows) {
    if (row.riskLevel === 'high') {
      list.push({
        familyCode: row.familyCode,
        recipientName: row.recipientName,
        title: `${row.recipientName} 즉시 확인 필요`,
        content: `도움 요청 또는 최근 위험 신호가 반복됩니다. 담당자 또는 가족 확인이 필요합니다.`,
        priority: 'high',
        caseType: 'urgent_check'
      })
    } else if (row.todayMedicationMissing > 0) {
      list.push({
        familyCode: row.familyCode,
        recipientName: row.recipientName,
        title: `${row.recipientName} 복약 미확인`,
        content: `오늘 복약 미확인 항목이 ${row.todayMedicationMissing}개 있습니다.`,
        priority: 'medium',
        caseType: 'medication_check'
      })
    } else if (row.todayMealMissing > 0) {
      list.push({
        familyCode: row.familyCode,
        recipientName: row.recipientName,
        title: `${row.recipientName} 식사 미확인`,
        content: `오늘 식사 미확인 항목이 ${row.todayMealMissing}개 있습니다.`,
        priority: 'medium',
        caseType: 'meal_check'
      })
    }
  }

  return list.slice(0, 10)
}

export async function GET() {
  const [
    recipientsResult,
    linksResult,
    checkinsResult,
    tasksResult,
    casesResult,
    auditResult
  ] = await Promise.all([
    rest('gov_recipients?select=*&order=created_at.desc&limit=500'),
    rest('anbu_family_links?select=*&order=created_at.desc&limit=500'),
    rest('daily_care_checkins?select=*&order=occurred_at.desc&limit=1500'),
    rest('family_action_tasks?select=*&order=created_at.desc&limit=500'),
    rest('gov_case_notes?select=*&order=created_at.desc&limit=500'),
    rest('gov_audit_logs?select=*&order=created_at.desc&limit=200')
  ])

  const recipients = rows(recipientsResult)
  const links = rows(linksResult)
  const checkins = rows(checkinsResult)
  const tasks = rows(tasksResult)
  const cases = rows(casesResult)
  const auditLogs = rows(auditResult)

  const recipientSummaries = buildRecipientSummaries({
    recipients,
    links,
    checkins,
    tasks
  })

  const metrics = computeMetrics(recipientSummaries, tasks, cases)
  const suggestedCases = buildSuggestedCases(recipientSummaries)

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    recipients,
    links,
    checkins,
    tasks,
    cases,
    auditLogs,
    recipientSummaries,
    metrics,
    suggestedCases
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'createRecipient') {
    const familyCode = code6(body.familyCode)

    if (!/^\d{6}$/.test(familyCode)) {
      return NextResponse.json(
        {
          ok: false,
          message: '가족코드 6자리를 입력해주세요.'
        },
        { status: 400 }
      )
    }

    const payload = {
      family_code: familyCode,
      recipient_name: text(body.recipientName) || '대상자',
      birth_year: Number(body.birthYear) || null,
      age_band: text(body.ageBand) || '75세 이상',
      region_sido: text(body.regionSido) || '',
      region_sigungu: text(body.regionSigungu) || '',
      region_eupmyeondong: text(body.regionEupmyeondong) || '',
      household_type: text(body.householdType) || '독거',
      program_type: text(body.programType) || '지역사회 통합돌봄',
      assigned_org_name: text(body.assignedOrgName) || '',
      assigned_staff_name: text(body.assignedStaffName) || '',
      guardian_name: text(body.guardianName) || '',
      consent_status: text(body.consentStatus) || 'pending',
      risk_level: text(body.riskLevel) || 'normal',
      service_status: 'active',
      payload: body,
      updated_at: new Date().toISOString()
    }

    const result = await rest('gov_recipients', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([payload])
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '대상자를 저장하지 못했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    await insertAudit({
      actorName: text(body.actorName) || '운영실',
      actorRole: 'gov_admin',
      actionType: 'create',
      targetType: 'recipient',
      familyCode,
      description: `대상자 ${payload.recipient_name} 등록`
    })

    return NextResponse.json({
      ok: true,
      message: '대상자가 등록되었습니다.',
      recipient: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  if (action === 'createCase') {
    const familyCode = code6(body.familyCode)

    const payload = {
      family_code: familyCode,
      case_type: text(body.caseType) || 'phone_check',
      title: text(body.title) || '사례관리 기록',
      content: text(body.content) || '',
      status: text(body.status) || 'open',
      priority: text(body.priority) || 'medium',
      actor_name: text(body.actorName) || '운영실',
      actor_role: text(body.actorRole) || 'staff',
      org_name: text(body.orgName) || '',
      next_action: text(body.nextAction) || '',
      payload: body,
      updated_at: new Date().toISOString()
    }

    const result = await rest('gov_case_notes', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([payload])
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '사례관리 기록을 저장하지 못했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    await insertAudit({
      actorName: payload.actor_name,
      actorRole: payload.actor_role,
      actionType: 'create',
      targetType: 'case',
      familyCode,
      description: `사례관리 기록 생성: ${payload.title}`
    })

    return NextResponse.json({
      ok: true,
      message: '사례관리 기록이 저장되었습니다.',
      caseNote: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  if (action === 'updateCase') {
    const id = text(body.id)

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message: '사례관리 ID가 없습니다.'
        },
        { status: 400 }
      )
    }

    const status = text(body.status) || 'done'

    const patch: Row = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'done') {
      patch.completed_at = new Date().toISOString()
    }

    if (text(body.content)) {
      patch.content = text(body.content)
    }

    const result = await rest('gov_case_notes?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '사례관리 상태를 변경하지 못했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    await insertAudit({
      actorName: text(body.actorName) || '운영실',
      actorRole: 'staff',
      actionType: 'update',
      targetType: 'case',
      targetId: id,
      familyCode: code6(body.familyCode),
      description: `사례관리 상태 변경: ${status}`
    })

    return NextResponse.json({
      ok: true,
      message: '사례관리 상태가 변경되었습니다.',
      caseNote: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  return NextResponse.json(
    {
      ok: false,
      message: '알 수 없는 action 입니다.'
    },
    { status: 400 }
  )
}
