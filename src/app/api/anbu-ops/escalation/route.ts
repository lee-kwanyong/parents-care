import { NextResponse } from 'next/server'
import { buildEscalationDashboard } from '@/lib/anbu-escalation'

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

async function rest(path: string) {
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
    ok: response.ok,
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

function sinceIso(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export async function GET() {
  const since72h = sinceIso(72)

  const [
    familiesResult,
    checkinsResult,
    notificationsResult,
    eventsResult,
    careRequestsResult
  ] = await Promise.all([
    rest('anbu_family_links?select=*&link_status=eq.active&order=created_at.desc&limit=300'),
    rest(
      'daily_care_checkins?select=*&occurred_at=gte.' +
        encodeURIComponent(since72h) +
        '&order=occurred_at.desc&limit=1000'
    ),
    rest(
      'anbu_notification_outbox?select=*&created_at=gte.' +
        encodeURIComponent(since72h) +
        '&order=created_at.desc&limit=1000'
    ),
    rest(
      'anbu_escalation_events?select=*&created_at=gte.' +
        encodeURIComponent(since72h) +
        '&order=created_at.desc&limit=1000'
    ),
    rest('anbu_care_requests?select=*&order=created_at.desc&limit=1000')
  ])

  const families = familiesResult.ok && Array.isArray(familiesResult.data) ? familiesResult.data as Record<string, unknown>[] : []
  const checkins = checkinsResult.ok && Array.isArray(checkinsResult.data) ? checkinsResult.data as Record<string, unknown>[] : []
  const notifications = notificationsResult.ok && Array.isArray(notificationsResult.data) ? notificationsResult.data as Record<string, unknown>[] : []
  const events = eventsResult.ok && Array.isArray(eventsResult.data) ? eventsResult.data as Record<string, unknown>[] : []
  const careRequests = careRequestsResult.ok && Array.isArray(careRequestsResult.data) ? careRequestsResult.data as Record<string, unknown>[] : []

  const dashboard = buildEscalationDashboard({
    families,
    checkins,
    notifications,
    events,
    careRequests
  })

  return NextResponse.json({
    ok: true,
    dashboard,
    diagnostics: {
      familiesOk: familiesResult.ok,
      checkinsOk: checkinsResult.ok,
      notificationsOk: notificationsResult.ok,
      eventsOk: eventsResult.ok,
      careRequestsOk: careRequestsResult.ok,
      familiesError: familiesResult.ok ? null : familiesResult.error,
      checkinsError: checkinsResult.ok ? null : checkinsResult.error,
      notificationsError: notificationsResult.ok ? null : notificationsResult.error,
      eventsError: eventsResult.ok ? null : eventsResult.error,
      careRequestsError: careRequestsResult.ok ? null : careRequestsResult.error
    }
  })
}
