import { NextRequest, NextResponse } from 'next/server'
import { isSubscriptionUsable } from '@/lib/anbu-subscription'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
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

async function findFamily(request: NextRequest, requestedCode = '') {
  const requested =
    requestedCode ||
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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const family = await findFamily(request, text(body.familyCode))
  const familyCode = typeof family?.family_code === 'string' ? family.family_code : ''

  if (!familyCode) {
    return NextResponse.json(
      {
        ok: false,
        message: '부모님 연결코드가 필요합니다. 먼저 /family-link에서 부모님을 연결해주세요.'
      },
      { status: 400 }
    )
  }

  const existing = await findLatestSubscription(familyCode)

  if (isSubscriptionUsable(existing)) {
    return NextResponse.json({
      ok: true,
      message: '이미 사용 가능한 구독 또는 체험이 있습니다.',
      subscription: existing
    })
  }

  const startedAt = new Date()
  const endedAt = new Date(startedAt.getTime() + 7 * 24 * 60 * 60 * 1000)

  const insert = await rest('anbu_subscriptions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        family_code: familyCode,
        plan_name: '안부온 베이직 7일 체험',
        status: 'trial',
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString()
      }
    ])
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '체험 구독 저장 중 오류가 발생했습니다. Supabase anbu_subscriptions 테이블을 확인해주세요.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '7일 무료 체험이 시작되었습니다.',
    subscription: Array.isArray(insert.data) ? insert.data[0] : insert.data
  })
}
