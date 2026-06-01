import { NextRequest, NextResponse } from 'next/server'
import { buildOutcomeDashboard, outcomeCategories } from '@/lib/anbu-outcomes'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function bool(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === 'true'
  return Boolean(value)
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

async function safeSelect(label: string, path: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      label,
      ok: false,
      rows: [] as Array<Record<string, unknown>>,
      error: 'Supabase env is missing'
    }
  }

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

  if (!response.ok || !Array.isArray(parsed)) {
    return {
      label,
      ok: false,
      rows: [] as Array<Record<string, unknown>>,
      error: parsed || bodyText
    }
  }

  return {
    label,
    ok: true,
    rows: parsed as Array<Record<string, unknown>>,
    error: null
  }
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      data: null as unknown,
      error: 'Supabase env is missing'
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

  const bodyText = await response.text()
  let parsed: unknown = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return {
    ok: response.ok,
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

function sinceIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export async function GET() {
  const since30d = sinceIso(30)

  const [
    families,
    riskActionEvents,
    escalationEvents,
    safetyActions,
    careRequests,
    reports,
    pilotEvents,
    outcomeLabels
  ] = await Promise.all([
    safeSelect('families', 'anbu_family_links?select=*&link_status=eq.active&order=created_at.desc&limit=1000'),
    safeSelect('riskActionEvents', 'anbu_risk_action_events?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=3000'),
    safeSelect('escalationEvents', 'anbu_escalation_events?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=3000'),
    safeSelect('safetyActions', 'anbu_safety_loop_actions?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=3000'),
    safeSelect('careRequests', 'anbu_care_requests?select=*&order=created_at.desc&limit=3000'),
    safeSelect('reports', 'anbu_partner_task_reports?select=*&order=created_at.desc&limit=3000'),
    safeSelect('pilotEvents', 'anbu_pilot_events?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=3000'),
    safeSelect('outcomeLabels', 'anbu_outcome_labels?select=*&order=updated_at.desc&limit=3000')
  ])

  const dashboard = buildOutcomeDashboard({
    families: families.rows,
    riskActionEvents: riskActionEvents.rows,
    escalationEvents: escalationEvents.rows,
    safetyActions: safetyActions.rows,
    careRequests: careRequests.rows,
    reports: reports.rows,
    pilotEvents: pilotEvents.rows,
    outcomeLabels: outcomeLabels.rows
  })

  const diagnostics = [
    families,
    riskActionEvents,
    escalationEvents,
    safetyActions,
    careRequests,
    reports,
    pilotEvents,
    outcomeLabels
  ].map((item) => ({
    label: item.label,
    ok: item.ok,
    count: item.rows.length,
    error: item.error
  }))

  return NextResponse.json({
    ok: true,
    dashboard,
    outcomeCategories,
    diagnostics
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const sourceType = text(body.sourceType)
  const sourceId = text(body.sourceId)
  const familyCode = text(body.familyCode)
  const outcomeCategory = text(body.outcomeCategory)
  const selectedCategory = outcomeCategories.find((item) => item.value === outcomeCategory)

  if (!sourceType || !sourceId) {
    return NextResponse.json(
      { ok: false, message: 'sourceType과 sourceId가 필요합니다.' },
      { status: 400 }
    )
  }

  if (!outcomeCategory || !selectedCategory) {
    return NextResponse.json(
      { ok: false, message: '결과 라벨을 선택해주세요.' },
      { status: 400 }
    )
  }

  const confidenceScore = Math.max(1, Math.min(5, num(body.confidenceScore, 4)))
  const impactScore = Math.max(1, Math.min(5, num(body.impactScore, 3)))
  const followUpRequired = bool(body.followUpRequired)
  const outcomeStatus = followUpRequired ? 'labeled' : text(body.outcomeStatus) || 'closed'

  const payload = {
    source_type: sourceType,
    source_id: sourceId,
    family_code: familyCode || null,
    outcome_category: outcomeCategory,
    outcome_label: selectedCategory.label,
    outcome_status: outcomeStatus,
    confidence_score: confidenceScore,
    impact_score: impactScore,
    follow_up_required: followUpRequired,
    follow_up_note: text(body.followUpNote) || null,
    actor_role: text(body.actorRole) || 'ops',
    actor_name: text(body.actorName) || '운영실',
    memo: text(body.memo) || null,
    source_payload: body.sourcePayload || {},
    payload: body,
    updated_at: new Date().toISOString()
  }

  const result = await rest('anbu_outcome_labels?on_conflict=source_type,source_id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify([payload])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '결과 라벨 저장에 실패했습니다. Supabase SQL을 먼저 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '결과 라벨이 저장되었습니다.',
    outcome: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
