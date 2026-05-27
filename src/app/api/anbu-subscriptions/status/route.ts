import { NextRequest, NextResponse } from 'next/server'
import { anbuPlans, isSubscriptionUsable, normalizePlanName, subscriptionEndLabel } from '@/lib/anbu-subscription'

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

async function findFamily(request: NextRequest) {
  const requested =
    request.nextUrl.searchParams.get('familyCode') ||
    request.cookies.get('anbu_family_code')?.value ||
    request.cookies.get('pc_parent_invite_code')?.value ||
    ''

  if (requested) {
    const found = await rest(
      'anbu_family_links?select=family_code,parent_name,guardian_name&family_code=eq.' +
        encodeURIComponent(requested) +
        '&limit=1'
    )

    if (found.ok && Array.isArray(found.data) && found.data[0]) {
      return found.data[0] as Record<string, unknown>
    }

    return {
      family_code: requested,
      parent_name: '부모님',
      guardian_name: '보호자'
    }
  }

  const latest = await rest(
    'anbu_family_links?select=family_code,parent_name,guardian_name&link_status=eq.active&order=created_at.desc&limit=1'
  )

  if (latest.ok && Array.isArray(latest.data) && latest.data[0]) {
    return latest.data[0] as Record<string, unknown>
  }

  return null
}

async function findLatestSubscription(familyCode: string) {
  if (!familyCode) return null

  const result = await rest(
    'anbu_subscriptions?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&order=created_at.desc&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) {
    return null
  }

  return result.data[0] as Record<string, unknown>
}

export async function GET(request: NextRequest) {
  const family = await findFamily(request)
  const familyCode = typeof family?.family_code === 'string' ? family.family_code : ''
  const subscription = await findLatestSubscription(familyCode)

  const gateMode = process.env.ANBU_REPORT_GATE_MODE || 'trial'
  const usable = isSubscriptionUsable(subscription)
  const canViewWeeklyReport = gateMode === 'open' || usable

  return NextResponse.json({
    ok: true,
    gateMode,
    family,
    familyCode,
    subscription,
    currentPlanName: normalizePlanName(subscription),
    subscriptionEndLabel: subscriptionEndLabel(subscription),
    canViewWeeklyReport,
    canStartTrial: Boolean(familyCode) && !usable,
    plans: anbuPlans
  })
}
