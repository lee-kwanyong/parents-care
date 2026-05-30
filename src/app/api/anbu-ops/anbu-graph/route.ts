import { NextRequest, NextResponse } from 'next/server'
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

async function rest(label: string, path: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      label,
      ok: false,
      data: [] as Record<string, unknown>[],
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

  return {
    label,
    ok: response.ok,
    data: response.ok && Array.isArray(parsed) ? parsed as Record<string, unknown>[] : [],
    error: response.ok ? null : parsed || bodyText
  }
}

function sinceIso(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export async function GET(request: NextRequest) {
  const requestedFamilyCode = request.nextUrl.searchParams.get('familyCode') || ''
  const since30d = sinceIso(24 * 30)

  const [
    familiesResult,
    checkinsResult,
    notificationsResult,
    consentsResult,
    consentActionsResult,
    safetyActionsResult,
    escalationEventsResult,
    careRequestsResult,
    partnerMatchesResult,
    taskReportsResult,
    partnersResult,
    subscriptionsResult
  ] = await Promise.all([
    rest('families', 'anbu_family_links?select=*&link_status=eq.active&order=created_at.desc&limit=300'),
    rest('checkins', 'daily_care_checkins?select=*&occurred_at=gte.' + encodeURIComponent(since30d) + '&order=occurred_at.desc&limit=2000'),
    rest('notifications', 'anbu_notification_outbox?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=2000'),
    rest('consents', 'anbu_parent_consents?select=*&order=updated_at.desc&limit=1000'),
    rest('consentActions', 'anbu_parent_consent_actions?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=2000'),
    rest('safetyActions', 'anbu_safety_loop_actions?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=2000'),
    rest('escalationEvents', 'anbu_escalation_events?select=*&created_at=gte.' + encodeURIComponent(since30d) + '&order=created_at.desc&limit=2000'),
    rest('careRequests', 'anbu_care_requests?select=*&order=created_at.desc&limit=2000'),
    rest('partnerMatches', 'anbu_partner_matches?select=*&order=created_at.desc&limit=2000'),
    rest('taskReports', 'anbu_partner_task_reports?select=*&order=created_at.desc&limit=2000'),
    rest('partners', 'anbu_care_partner_applications?select=*&order=created_at.desc&limit=2000'),
    rest('subscriptions', 'anbu_subscriptions?select=*&order=created_at.desc&limit=1000')
  ])

  const graph = buildAnbuGraph({
    requestedFamilyCode,
    families: familiesResult.data,
    checkins: checkinsResult.data,
    notifications: notificationsResult.data,
    consents: consentsResult.data,
    consentActions: consentActionsResult.data,
    safetyActions: safetyActionsResult.data,
    escalationEvents: escalationEventsResult.data,
    careRequests: careRequestsResult.data,
    partnerMatches: partnerMatchesResult.data,
    taskReports: taskReportsResult.data,
    partners: partnersResult.data,
    subscriptions: subscriptionsResult.data
  })

  const diagnostics = [
    familiesResult,
    checkinsResult,
    notificationsResult,
    consentsResult,
    consentActionsResult,
    safetyActionsResult,
    escalationEventsResult,
    careRequestsResult,
    partnerMatchesResult,
    taskReportsResult,
    partnersResult,
    subscriptionsResult
  ].map((item) => ({
    label: item.label,
    ok: item.ok,
    count: item.data.length,
    error: item.ok ? null : item.error
  }))

  return NextResponse.json({
    ok: true,
    graph,
    diagnostics
  })
}
