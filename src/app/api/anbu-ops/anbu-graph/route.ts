import { NextResponse } from 'next/server'
import { buildAnbuGraph } from '@/lib/anbu-graph'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

function sinceIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export async function GET() {
  const since14d = sinceIso(14)

  const [
    families,
    checkins,
    notifications,
    consents,
    consentActions,
    safetyActions,
    escalationEvents,
    careRequests,
    matches,
    reports
  ] = await Promise.all([
    safeSelect('families', 'anbu_family_links?select=*&link_status=eq.active&order=created_at.desc&limit=300'),
    safeSelect('checkins', 'daily_care_checkins?select=*&occurred_at=gte.' + encodeURIComponent(since14d) + '&order=occurred_at.desc&limit=1500'),
    safeSelect('notifications', 'anbu_notification_outbox?select=*&created_at=gte.' + encodeURIComponent(since14d) + '&order=created_at.desc&limit=1500'),
    safeSelect('consents', 'anbu_parent_consents?select=*&order=updated_at.desc&limit=500'),
    safeSelect('consentActions', 'anbu_parent_consent_actions?select=*&created_at=gte.' + encodeURIComponent(since14d) + '&order=created_at.desc&limit=1000'),
    safeSelect('safetyActions', 'anbu_safety_loop_actions?select=*&created_at=gte.' + encodeURIComponent(since14d) + '&order=created_at.desc&limit=1000'),
    safeSelect('escalationEvents', 'anbu_escalation_events?select=*&created_at=gte.' + encodeURIComponent(since14d) + '&order=created_at.desc&limit=1000'),
    safeSelect('careRequests', 'anbu_care_requests?select=*&order=created_at.desc&limit=1000'),
    safeSelect('matches', 'anbu_partner_matches?select=*&order=created_at.desc&limit=1000'),
    safeSelect('reports', 'anbu_partner_task_reports?select=*&order=created_at.desc&limit=1000')
  ])

  const graph = buildAnbuGraph({
    families: families.rows,
    checkins: checkins.rows,
    notifications: notifications.rows,
    consents: consents.rows,
    consentActions: consentActions.rows,
    safetyActions: safetyActions.rows,
    escalationEvents: escalationEvents.rows,
    careRequests: careRequests.rows,
    matches: matches.rows,
    reports: reports.rows
  })

  const diagnostics = [
    families,
    checkins,
    notifications,
    consents,
    consentActions,
    safetyActions,
    escalationEvents,
    careRequests,
    matches,
    reports
  ].map((item) => ({
    label: item.label,
    ok: item.ok,
    count: item.rows.length,
    error: item.error
  }))

  return NextResponse.json({
    ok: true,
    graph,
    diagnostics
  })
}
