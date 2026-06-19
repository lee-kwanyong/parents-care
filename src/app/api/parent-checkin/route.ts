import { NextRequest, NextResponse } from 'next/server'
import { sendCareNotification } from '@/lib/quiet-care-notifications'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

type ParentCheckinKind =
  | 'ok'
  | 'meal_ok'
  | 'medication_ok'
  | 'feeling_sick'
  | 'need_help'
  | 'custom'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanFamilyCode(value: unknown) {
  return text(value).replace(/[^\w-]/g, '').slice(0, 32)
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

function maskName(value: unknown) {
  const name = text(value)

  if (!name) return ''
  if (name.length === 1) return name
  if (name.length === 2) return `${name[0]}*`

  return `${name[0]}*${name[name.length - 1]}`
}

function maskPhone(value: unknown) {
  const digits = text(value).replace(/[^\d]/g, '')

  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
  }

  if (digits.length >= 4) return `****-${digits.slice(-4)}`

  return ''
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

async function insertRow(table: string, row: Row) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [],
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
    }
  }

  async function post(body: Row) {
    const response = await fetch(`${base}/${table}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = null

    try {
      parsed = raw ? JSON.parse(raw) : null
    } catch {
      parsed = null
    }

    return {
      response,
      raw,
      parsed
    }
  }

  const first = await post(row)

  if (first.response.ok) {
    return {
      ok: true,
      rows: Array.isArray(first.parsed) ? first.parsed as Row[] : []
    }
  }

  /*
    payload 컬럼이 없는 환경을 대비해 payload 제거 후 재시도합니다.
  */
  const { payload: _payload, ...minimal } = row
  const retry = await post(minimal)

  if (retry.response.ok) {
    return {
      ok: true,
      rows: Array.isArray(retry.parsed) ? retry.parsed as Row[] : []
    }
  }

  return {
    ok: false,
    rows: [],
    error: retry.raw.slice(0, 240) || first.raw.slice(0, 240)
  }
}

function kindMeta(kind: ParentCheckinKind, note = '') {
  if (kind === 'ok') {
    return {
      signalType: 'daily_ok',
      signalLabel: '괜찮아요',
      requestType: 'parent_checkin',
      riskLevel: 'low',
      status: 'completed',
      title: '부모님 안부 확인'
    }
  }

  if (kind === 'meal_ok') {
    return {
      signalType: 'meal_ok',
      signalLabel: '밥 먹었어요',
      requestType: 'parent_checkin',
      riskLevel: 'low',
      status: 'completed',
      title: '식사 확인'
    }
  }

  if (kind === 'medication_ok') {
    return {
      signalType: 'medication_ok',
      signalLabel: '약 먹었어요',
      requestType: 'parent_checkin',
      riskLevel: 'low',
      status: 'completed',
      title: '복약 확인'
    }
  }

  if (kind === 'feeling_sick') {
    return {
      signalType: 'feeling_sick',
      signalLabel: '몸이 아파요',
      requestType: 'parent_checkin',
      riskLevel: 'medium',
      status: 'manual_needed',
      title: '몸 상태 확인 필요'
    }
  }

  if (kind === 'need_help') {
    return {
      signalType: 'urgent_neighbor_help',
      signalLabel: '도움이 필요해요',
      requestType: 'urgent_neighbor_help',
      riskLevel: 'high',
      status: 'manual_needed',
      title: '도움 요청'
    }
  }

  return {
    signalType: 'parent_note',
    signalLabel: note || '부모님 메모',
    requestType: 'parent_checkin',
    riskLevel: 'low',
    status: 'completed',
    title: '부모님 메모'
  }
}

function demoResponse(familyCode = '') {
  return {
    ok: true,
    demo: true,
    generatedKst: kstNowLabel(),
    family: {
      familyCode,
      parentName: '부모님',
      guardianName: '보호자',
      guardianPhoneMasked: ''
    },
    recentRecords: [],
    sourceErrors: []
  }
}

export async function GET(request: NextRequest) {
  const familyCode = cleanFamilyCode(request.nextUrl.searchParams.get('familyCode'))

  if (!familyCode) {
    return NextResponse.json(demoResponse())
  }

  const sourceErrors: string[] = []

  const [familyResult, recentResult] = await Promise.all([
    restRows('anbu_family_links', {
      select: 'family_code,parent_name,guardian_name,guardian_phone,created_at',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '1'
    }),
    restRows('care_response_requests', {
      select: 'id,family_code,parent_name,guardian_name,signal_type,signal_label,request_type,risk_level,status,created_at',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '8'
    })
  ])

  if (!familyResult.ok && familyResult.error) sourceErrors.push(familyResult.error)
  if (!recentResult.ok && recentResult.error) sourceErrors.push(recentResult.error)

  const family = familyResult.rows[0] || {}

  return NextResponse.json({
    ok: true,
    demo: false,
    generatedKst: kstNowLabel(),
    family: {
      familyCode,
      parentName: maskName(family.parent_name) || '부모님',
      guardianName: maskName(family.guardian_name) || '보호자',
      guardianPhoneMasked: maskPhone(family.guardian_phone)
    },
    recentRecords: recentResult.rows.map((row) => ({
      id: text(row.id),
      label: text(row.signal_label) || text(row.signal_type) || '안부 기록',
      signalType: text(row.signal_type),
      riskLevel: text(row.risk_level) || 'low',
      status: text(row.status) || 'recorded',
      createdAt: text(row.created_at)
    })),
    sourceErrors
  })
}

async function maybeQueueGuardianNotification(input: {
  enabled: boolean
  familyCode: string
  guardianName: string
  guardianPhone: string
  meta: ReturnType<typeof kindMeta>
  note: string
}) {
  if (input.meta.riskLevel === 'low') {
    return {
      ok: true,
      skipped: true,
      reason: 'normal_response_saved_for_daily_summary'
    }
  }

  const guardianPhone = input.guardianPhone.replace(/[^\d+]/g, '')

  if (!guardianPhone) {
    return {
      ok: false,
      skipped: true,
      reason: 'guardian_phone_missing'
    }
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://parents-care.net'
  ).replace(/\/$/, '')

  return sendCareNotification({
    familyCode: input.familyCode,
    toName: input.guardianName || '보호자',
    toPhone: guardianPhone,
    title: input.meta.title,
    body: `[안부웍스] 부모님 안부: ${input.meta.signalLabel}${input.note ? ` / ${input.note}` : ''}`,
    reason: 'parent-checkin-risk',
    targetUrl: `${siteUrl}/guardian/today?familyCode=${encodeURIComponent(input.familyCode)}`,
    eventType: 'guardian_parent_checkin_risk',
    metadata: {
      source: 'parent-checkin',
      signalType: input.meta.signalType,
      signalLabel: input.meta.signalLabel,
      riskLevel: input.meta.riskLevel,
      legacyNotificationSetting: input.enabled
    }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const familyCode = cleanFamilyCode(body.familyCode)
  const kind = text(body.kind) as ParentCheckinKind
  const note = text(body.note).slice(0, 1000)
  const checklist = body.checklist && typeof body.checklist === 'object' ? body.checklist : {}

  if (!familyCode) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족코드가 필요합니다.'
      },
      { status: 400 }
    )
  }

  const familyResult = await restRows('anbu_family_links', {
    select: 'family_code,parent_name,guardian_name,guardian_phone,created_at',
    family_code: `eq.${familyCode}`,
    order: 'created_at.desc',
    limit: '1'
  })

  const family = familyResult.rows[0] || {}
  const meta = kindMeta(kind, note)

  const row = {
    family_code: familyCode,
    parent_name: text(family.parent_name) || '부모님',
    guardian_name: text(family.guardian_name) || '보호자',
    signal_type: meta.signalType,
    signal_label: meta.signalLabel,
    request_type: meta.requestType,
    risk_level: meta.riskLevel,
    status: meta.status,
    payload: {
      source: 'parent_checkin',
      title: meta.title,
      note,
      checklist,
      kind,
      submittedAtKst: kstNowLabel()
    }
  }

  const insertResult = await insertRow('care_response_requests', row)

  const notificationResult = await maybeQueueGuardianNotification({
    enabled: process.env.ANBU_PARENT_CHECKIN_QUEUE_NOTIFICATION === 'true',
    familyCode,
    guardianName: text(family.guardian_name) || '보호자',
    guardianPhone: text(family.guardian_phone),
    meta,
    note
  })

  return NextResponse.json({
    ok: true,
    persisted: insertResult.ok,
    warning: insertResult.ok ? null : insertResult.error || '서버 저장에 실패했지만 브라우저 기록은 유지됩니다.',
    notification: notificationResult,
    record: {
      id: insertResult.ok && insertResult.rows[0] ? text(insertResult.rows[0].id) : `local-${Date.now()}`,
      label: meta.signalLabel,
      signalType: meta.signalType,
      riskLevel: meta.riskLevel,
      status: meta.status,
      createdAt: new Date().toISOString(),
      note
    }
  })
}
