import { NextRequest, NextResponse } from 'next/server'
import {
  buildCompletionDashboard,
  completionEventFromRow,
  kstDayRange,
  kstNowLabel,
  kstTodayDate,
  parsePayload,
  text
} from '@/lib/anbu-completion-core'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

function cleanFamilyCode(value: unknown) {
  return text(value).replace(/[^\w-]/g, '').slice(0, 64)
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
        error: `${table}: ${response.status} ${raw.slice(0, 260)}`
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

async function loadCompletionEvents(familyCode: string) {
  const today = kstTodayDate()
  const range = kstDayRange(today)
  const since = new Date(Date.parse(range.start) - 6 * 24 * 60 * 60 * 1000).toISOString()

  const result = await restRows('care_response_requests', {
    select: 'id,family_code,parent_name,guardian_name,signal_type,signal_label,request_type,risk_level,status,payload,created_at',
    family_code: `eq.${familyCode}`,
    created_at: `gte.${since}`,
    order: 'created_at.asc',
    limit: '500'
  })

  return {
    events: result.rows
      .map(completionEventFromRow)
      .filter((event): event is NonNullable<typeof event> => Boolean(event)),
    error: result.ok ? '' : result.error
  }
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://parents-care.net').replace(/\/$/, '')
}

function newCaseId(familyCode: string) {
  const random = Math.random().toString(36).slice(2, 8)
  return `anbu-${familyCode}-${Date.now()}-${random}`
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

function eventRow(input: {
  familyCode: string
  family: Row | null
  caseId?: string
  eventType: string
  reasonType?: string
  label: string
  riskLevel: string
  status: string
  actorName?: string
  method?: string
  resultType?: string
  note?: string
  extra?: Record<string, unknown>
}) {
  const family = input.family || {}
  const signalType =
    input.eventType === 'daily_ok'
      ? 'completion_daily_ok'
      : `completion_case_${input.eventType}`

  return {
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
      caseId: input.caseId || '',
      eventType: input.eventType,
      reasonType: input.reasonType || 'general',
      label: input.label,
      actorName: input.actorName || '',
      method: input.method || '',
      resultType: input.resultType || '',
      note: input.note || '',
      siteUrl: siteUrl(),
      createdAtKst: kstNowLabel(),
      ...(input.extra || {})
    }
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
      dashboard: {
        status: {
          key: 'data_gap',
          label: '가족코드 필요',
          title: '가족코드를 입력하면 안부완료 리포트를 볼 수 있습니다.',
          desc: '확인완료형 안부케어는 신호 발생부터 실제 확인 완료까지 기록합니다.',
          tone: 'neutral'
        },
        todayLine: '가족코드가 필요합니다.',
        openCases: [],
        closedCases: [],
        allCases: [],
        dailyOkCount: 0,
        metrics: {
          totalCases: 0,
          openCount: 0,
          closedCount: 0,
          completionRate: 0,
          averageCloseMinutes: null
        },
        reportText: '[안부웍스] 안부완료 리포트\n\n가족코드를 입력하면 리포트가 생성됩니다.',
        notice: '안부웍스는 의료 진단이 아니라 비의료 안부확인과 후속조치 기록을 지원합니다.'
      },
      sourceErrors: [] as string[]
    }
  }

  const familyResult = await loadFamily(familyCode)
  const completionResult = await loadCompletionEvents(familyCode)
  const family = familyResult.family || {}

  const parentName = text(family.parent_name) || '부모님'
  const guardianName = text(family.guardian_name) || '보호자'

  const dashboard = buildCompletionDashboard({
    familyName: parentName,
    guardianName,
    events: completionResult.events
  })

  return {
    ok: true,
    demo: false,
    generatedKst: kstNowLabel(),
    family: {
      familyCode,
      parentName,
      guardianName
    },
    dashboard,
    sourceErrors: [familyResult.error, completionResult.error].filter(Boolean)
  }
}

export async function GET(request: NextRequest) {
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

  let row: Row | null = null

  if (action === 'parent_signal') {
    const signal = text(body.signal)

    if (signal === 'ok') {
      row = eventRow({
        familyCode,
        family,
        eventType: 'daily_ok',
        label: '괜찮아요',
        riskLevel: 'low',
        status: 'completed',
        note: '부모님이 정상 안부를 직접 남겼습니다.'
      })
    } else if (signal === 'uncomfortable') {
      const meta = reasonMeta('condition')

      row = eventRow({
        familyCode,
        family,
        caseId: newCaseId(familyCode),
        eventType: 'opened',
        reasonType: 'condition',
        label: meta.label,
        riskLevel: meta.riskLevel,
        status: 'open',
        note: '부모님이 몸이 조금 불편하다고 응답했습니다.',
        extra: {
          title: meta.title,
          signal
        }
      })
    } else if (signal === 'help') {
      const meta = reasonMeta('help')

      row = eventRow({
        familyCode,
        family,
        caseId: newCaseId(familyCode),
        eventType: 'opened',
        reasonType: 'help',
        label: meta.label,
        riskLevel: meta.riskLevel,
        status: 'open',
        note: '부모님이 도움이 필요하다고 응답했습니다.',
        extra: {
          title: meta.title,
          signal
        }
      })
    } else {
      return NextResponse.json({ ok: false, message: '지원하지 않는 부모님 신호입니다.' }, { status: 400 })
    }
  } else if (action === 'open_case') {
    const reasonType = text(body.reasonType) || 'manual'
    const meta = reasonMeta(reasonType)

    row = eventRow({
      familyCode,
      family,
      caseId: newCaseId(familyCode),
      eventType: 'opened',
      reasonType,
      label: text(body.label) || meta.label,
      riskLevel: text(body.riskLevel) || meta.riskLevel,
      status: 'open',
      actorName: text(body.actorName) || '보호자',
      note: text(body.note),
      extra: {
        title: meta.title
      }
    })
  } else if (action === 'accept_case') {
    const caseId = text(body.caseId)

    if (!caseId) {
      return NextResponse.json({ ok: false, message: 'caseId가 필요합니다.' }, { status: 400 })
    }

    row = eventRow({
      familyCode,
      family,
      caseId,
      eventType: 'assigned',
      reasonType: text(body.reasonType) || 'manual',
      label: '확인 담당자 지정',
      riskLevel: text(body.riskLevel) || 'medium',
      status: 'assigned',
      actorName: text(body.actorName) || '보호자',
      note: text(body.note) || '확인을 맡았습니다.'
    })
  } else if (action === 'call_log') {
    const caseId = text(body.caseId)

    if (!caseId) {
      return NextResponse.json({ ok: false, message: 'caseId가 필요합니다.' }, { status: 400 })
    }

    row = eventRow({
      familyCode,
      family,
      caseId,
      eventType: 'called',
      reasonType: text(body.reasonType) || 'manual',
      label: '전화 확인 기록',
      riskLevel: text(body.riskLevel) || 'medium',
      status: 'checking',
      actorName: text(body.actorName) || '보호자',
      method: text(body.method) || '전화',
      note: text(body.note) || '전화 확인을 진행했습니다.'
    })
  } else if (action === 'close_case') {
    const caseId = text(body.caseId)

    if (!caseId) {
      return NextResponse.json({ ok: false, message: 'caseId가 필요합니다.' }, { status: 400 })
    }

    row = eventRow({
      familyCode,
      family,
      caseId,
      eventType: 'closed',
      reasonType: text(body.reasonType) || 'manual',
      label: '안부 확인 완료',
      riskLevel: 'low',
      status: 'closed',
      actorName: text(body.actorName) || '보호자',
      method: text(body.method) || '전화',
      resultType: text(body.resultType) || 'same_as_usual',
      note: text(body.note)
    })
  } else if (action === 'note') {
    const caseId = text(body.caseId)

    row = eventRow({
      familyCode,
      family,
      caseId,
      eventType: 'note',
      reasonType: text(body.reasonType) || 'manual',
      label: text(body.label) || '확인 메모',
      riskLevel: text(body.riskLevel) || 'low',
      status: 'recorded',
      actorName: text(body.actorName) || '보호자',
      note: text(body.note)
    })
  } else {
    return NextResponse.json({ ok: false, message: '지원하지 않는 action입니다.' }, { status: 400 })
  }

  const insert = await insertRow('care_response_requests', row)

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '안부완료 기록 저장에 실패했습니다.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  const view = await buildView(familyCode)

  return NextResponse.json({
    ...view,
    saved: true,
    inserted: insert.rows[0] || null,
    message:
      action === 'parent_signal'
        ? '안부 신호가 기록되었습니다.'
        : action === 'close_case'
          ? '안부 확인이 완료 처리되었습니다.'
          : '안부완료 기록이 저장되었습니다.'
  })
}
