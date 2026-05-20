import { NextRequest, NextResponse } from 'next/server'
import { homePathForRole } from '@/lib/auth-engine'

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

function anonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase service env is missing' }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return { ok: false, data: parsed, error: parsed || bodyText }
  }

  return { ok: true, data: parsed, error: null }
}

async function getUserFromAccessToken(accessToken: string) {
  const base = supabaseBaseUrl()
  const key = anonKey() || serviceKey()

  if (!base || !key || !accessToken) {
    return { ok: false, user: null as any, error: 'access token missing' }
  }

  const response = await fetch(base + '/auth/v1/user', {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + accessToken
    },
    cache: 'no-store'
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return { ok: false, user: null, error: parsed || bodyText }
  }

  return { ok: true, user: parsed, error: null }
}

async function insertLoginEvent(input: {
  userId: string
  eventType: string
  loginMethod: string
  title: string
  description?: string | null
}) {
  await rest('care_auth_login_events', {
    method: 'POST',
    body: JSON.stringify([
      {
        user_id: input.userId,
        event_type: input.eventType,
        login_method: input.loginMethod,
        title: input.title,
        description: input.description || null
      }
    ])
  })
}

export async function GET(request: NextRequest) {
  const accessToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || ''

  const userResult = await getUserFromAccessToken(accessToken)

  if (!userResult.ok || !userResult.user?.id) {
    return NextResponse.json({ ok: false, message: '로그인이 필요합니다.' }, { status: 401 })
  }

  const profileResult = await rest(
    'care_auth_profiles?select=' +
      encodeURIComponent('id,user_id,display_name,phone,email,preferred_login_method,user_role,onboarding_status,easy_mode,last_login_at,created_at,updated_at') +
      '&user_id=eq.' +
      encodeURIComponent(userResult.user.id) +
      '&limit=1'
  )

  const profile = profileResult.ok && Array.isArray(profileResult.data) ? profileResult.data[0] : null

  return NextResponse.json({
    ok: true,
    user: userResult.user,
    profile,
    homePath: homePathForRole(profile?.user_role || 'guardian')
  })
}

export async function POST(request: NextRequest) {
  const accessToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || ''
  const body = await request.json().catch(() => ({}))

  const userResult = await getUserFromAccessToken(accessToken)

  if (!userResult.ok || !userResult.user?.id) {
    return NextResponse.json({ ok: false, message: '로그인이 필요합니다.' }, { status: 401 })
  }

  const user = userResult.user
  const userMetadata = user.user_metadata || {}

  const displayName =
    text(body.displayName) ||
    text(userMetadata.display_name) ||
    text(userMetadata.full_name) ||
    text(userMetadata.name) ||
    '보호자'

  const phone =
    text(body.phone) ||
    text(user.phone) ||
    text(userMetadata.phone) ||
    null

  const email = text(user.email) || text(body.email) || null

  const roleValue = text(body.userRole) || text(userMetadata.user_role) || 'guardian'
  const userRole = ['guardian', 'family', 'parent', 'manager', 'ops'].includes(roleValue) ? roleValue : 'guardian'

  const methodValue = text(body.loginMethod) || 'easy'
  const loginMethod = ['easy', 'google', 'kakao', 'phone', 'email_magic', 'email_password'].includes(methodValue)
    ? methodValue
    : 'easy'

  const upsert = await rest('care_auth_profiles?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify([
      {
        user_id: user.id,
        display_name: displayName,
        phone,
        email,
        preferred_login_method: loginMethod,
        user_role: userRole,
        easy_mode: true,
        last_login_at: new Date().toISOString()
      }
    ])
  })

  if (!upsert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '프로필 저장 중 오류가 발생했습니다.',
        detail: upsert.error
      },
      { status: 500 }
    )
  }

  const profile = Array.isArray(upsert.data) ? upsert.data[0] : upsert.data

  await insertLoginEvent({
    userId: user.id,
    eventType: 'profile_sync',
    loginMethod,
    title: '로그인 프로필 동기화',
    description: `${displayName}님의 로그인 프로필을 동기화했습니다.`
  })

  return NextResponse.json({
    ok: true,
    user,
    profile,
    homePath: homePathForRole(userRole)
  })
}
