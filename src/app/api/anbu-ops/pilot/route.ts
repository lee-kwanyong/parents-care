import { NextRequest, NextResponse } from 'next/server'
import { buildPilotDashboard } from '@/lib/anbu-pilot'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
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
    participants,
    families,
    checkins,
    notifications,
    consentActions,
    safetyActions,
    escalationEvents,
    riskActionEvents,
    careRequests,
    reports,
    feedback,
    pilotEvents
  ] = await Promise.all([
    safeSelect('participants', 'anbu_pilot_participants?select=*&order=created_at.desc&limit=1000'),
    safeSelect('families', 'anbu_family_links?select=*&link_status=eq.active&order=created_at.desc&limit=1000'),
    safeSelect('checkins', 'daily_care_checkins?select=*&occurred_at=gte.' + encodeURIComponent(since30d) + '&order=occurred_at.desc&limit=3000'),
    safeSelect('notifications', 'anbu_notification_outbox?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=3000'),
    safeSelect('consentActions', 'anbu_parent_consent_actions?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=3000'),
    safeSelect('safetyActions', 'anbu_safety_loop_actions?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=3000'),
    safeSelect('escalationEvents', 'anbu_escalation_events?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=3000'),
    safeSelect('riskActionEvents', 'anbu_risk_action_events?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=3000'),
    safeSelect('careRequests', 'anbu_care_requests?select=*&order=created_at.desc&limit=3000'),
    safeSelect('reports', 'anbu_partner_task_reports?select=*&order=created_at.desc&limit=3000'),
    safeSelect('feedback', 'anbu_pilot_feedback?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=3000'),
    safeSelect('pilotEvents', 'anbu_pilot_events?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=3000')
  ])

  const dashboard = buildPilotDashboard({
    participants: participants.rows,
    families: families.rows,
    checkins: checkins.rows,
    notifications: notifications.rows,
    consentActions: consentActions.rows,
    safetyActions: safetyActions.rows,
    escalationEvents: escalationEvents.rows,
    riskActionEvents: riskActionEvents.rows,
    careRequests: careRequests.rows,
    reports: reports.rows,
    feedback: feedback.rows,
    pilotEvents: pilotEvents.rows
  })

  const diagnostics = [
    participants,
    families,
    checkins,
    notifications,
    consentActions,
    safetyActions,
    escalationEvents,
    riskActionEvents,
    careRequests,
    reports,
    feedback,
    pilotEvents
  ].map((item) => ({
    label: item.label,
    ok: item.ok,
    count: item.rows.length,
    error: item.error
  }))

  return NextResponse.json({
    ok: true,
    dashboard,
    diagnostics
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode = text(body.familyCode)
  const parentName = text(body.parentName)
  const guardianName = text(body.guardianName)
  const guardianPhone = text(body.guardianPhone)
  const cohortName = text(body.cohortName) || '기본 실증'
  const targetDays = Math.max(7, Math.min(90, Number(body.targetDays || 14)))
  const startDate = text(body.startDate) || new Date().toISOString().slice(0, 10)
  const endDate = text(body.endDate) || new Date(Date.now() + targetDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const notes = text(body.notes)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      { ok: false, message: '6자리 가족 연결코드를 입력해주세요.' },
      { status: 400 }
    )
  }

  const familyResult = await rest(
    'anbu_family_links?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&limit=1'
  )

  const family =
    familyResult.ok && Array.isArray(familyResult.data) && familyResult.data[0]
      ? familyResult.data[0] as Record<string, unknown>
      : null

  const payload = {
    family_code: familyCode,
    parent_name: parentName || text(family?.parent_name) || '부모님',
    guardian_name: guardianName || text(family?.guardian_name) || '보호자',
    guardian_phone: guardianPhone || text(family?.guardian_phone) || '',
    participant_status: 'active',
    cohort_name: cohortName,
    target_days: targetDays,
    start_date: startDate,
    end_date: endDate,
    notes: notes || null,
    updated_at: new Date().toISOString()
  }

  const result = await rest('anbu_pilot_participants?on_conflict=family_code', {
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
        message: '실증 참여자 등록에 실패했습니다. Supabase SQL을 먼저 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  await rest('anbu_pilot_events', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation'
    },
    body: JSON.stringify([
      {
        family_code: familyCode,
        event_type: 'participant_registered',
        event_label: '실증 참여자 등록',
        actor_role: 'ops',
        actor_name: '운영실',
        status: 'recorded',
        memo: notes || null,
        payload: { body, family }
      }
    ])
  })

  return NextResponse.json({
    ok: true,
    message: '실증 참여자가 등록되었습니다.',
    participant: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
