import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

const allowedRoles = ['guardian', 'parent', 'provider', 'ops'] as const

const roleLabels: Record<string, string> = {
  guardian: '보호자',
  parent: '부모님',
  provider: '생활확인 파트너',
  ops: '운영실',
  unknown: '미분류'
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function anonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || serviceKey()
}

async function fetchJson(url: string, init?: RequestInit): Promise<RestResult> {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store'
  })

  const raw = await response.text()
  let parsed: unknown = null

  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = raw
  }

  return {
    ok: response.ok,
    status: response.status,
    data: parsed,
    error: response.ok ? null : parsed || raw
  }
}

async function currentUserFromRequest(request: NextRequest) {
  const base = supabaseBaseUrl()
  const key = anonKey()
  const auth = text(request.headers.get('authorization'))

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      message: 'Supabase 환경변수가 필요합니다.',
      user: null
    }
  }

  if (!auth.toLowerCase().startsWith('bearer ')) {
    return {
      ok: false,
      status: 401,
      message: '로그인 세션이 필요합니다.',
      user: null
    }
  }

  const result = await fetchJson(base + '/auth/v1/user', {
    headers: {
      apikey: key,
      Authorization: auth
    }
  })

  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      message: '현재 로그인 사용자를 확인하지 못했습니다.',
      user: null,
      detail: result.error
    }
  }

  return {
    ok: true,
    status: 200,
    message: '현재 사용자를 확인했습니다.',
    user: result.data as Row
  }
}

async function authAdmin(path: string, init?: RequestInit): Promise<RestResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: 'SUPABASE_SERVICE_ROLE_KEY가 필요합니다.'
    }
  }

  return fetchJson(base + '/auth/v1/admin/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })
}

async function rest(path: string, init?: RequestInit): Promise<RestResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: 'SUPABASE_SERVICE_ROLE_KEY가 필요합니다.'
    }
  }

  return fetchJson(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })
}

function meta(user: Row) {
  const raw = user.user_metadata || user.raw_user_meta_data

  return raw && typeof raw === 'object' ? raw as Row : {}
}

function currentRole(user: Row) {
  const m = meta(user)
  const raw =
    text(m.role) ||
    text(m.userType) ||
    text(m.accountType) ||
    text(m.type) ||
    text(m.anbuRole)

  const normalized = raw.toLowerCase()

  if (['child', 'guardian', 'protector'].includes(normalized)) return 'guardian'
  if (['parent', 'senior', 'elder'].includes(normalized)) return 'parent'
  if (['provider', 'caregiver', 'care_worker', 'care-worker', 'helper'].includes(normalized)) return 'provider'
  if (['ops', 'admin', 'operator'].includes(normalized)) return 'ops'

  return 'unknown'
}

function adminEmails() {
  return (process.env.OPS_ADMIN_EMAILS || 'mixero326@gmail.com,contact@parents-care.net')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function canSetRole(user: Row, role: string) {
  if (role !== 'ops') return true

  const email = text(user.email).toLowerCase()
  const previous = currentRole(user)

  return previous === 'ops' || adminEmails().includes(email)
}

async function logEvent(user: Row, role: string, source: string) {
  await rest('user_onboarding_events', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        event_type: 'auth_role_saved',
        role,
        source: source || 'auth-role',
        path: '/auth/role',
        email: text(user.email),
        phone: phone(user.phone),
        payload: {
          userId: text(user.id),
          previousRole: currentRole(user),
          nextRole: role,
          savedAt: new Date().toISOString()
        }
      }
    ])
  }).catch(() => null)
}

export async function GET(request: NextRequest) {
  const userResult = await currentUserFromRequest(request)

  if (!userResult.ok || !userResult.user) {
    return NextResponse.json(
      {
        ok: false,
        message: userResult.message,
        detail: (userResult as Row).detail || null
      },
      { status: userResult.status || 401 }
    )
  }

  const user = userResult.user

  return NextResponse.json({
    ok: true,
    user: {
      id: text(user.id),
      email: text(user.email),
      phone: phone(user.phone),
      role: currentRole(user),
      roleLabel: roleLabels[currentRole(user)] || currentRole(user),
      metadata: meta(user)
    }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const role = text(body.role)
  const source = text(body.source)

  if (!allowedRoles.includes(role as typeof allowedRoles[number])) {
    return NextResponse.json(
      {
        ok: false,
        message: '보호자, 부모님, 생활확인 파트너, 운영실 중 하나를 선택해주세요.'
      },
      { status: 400 }
    )
  }

  const userResult = await currentUserFromRequest(request)

  if (!userResult.ok || !userResult.user) {
    return NextResponse.json(
      {
        ok: false,
        message: userResult.message,
        detail: (userResult as Row).detail || null
      },
      { status: userResult.status || 401 }
    )
  }

  const user = userResult.user

  if (!canSetRole(user, role)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 역할은 승인된 관리자 이메일만 직접 지정할 수 있습니다.'
      },
      { status: 403 }
    )
  }

  const previousMeta = meta(user)

  const nextMeta = {
    ...previousMeta,
    role,
    userType: role,
    accountType: role,
    anbuRole: role,
    roleLabel: roleLabels[role] || role,
    roleSavedAt: new Date().toISOString()
  }

  const updateResult = await authAdmin('users/' + encodeURIComponent(text(user.id)), {
    method: 'PUT',
    body: JSON.stringify({
      user_metadata: nextMeta
    })
  })

  if (!updateResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '사용자 역할 저장에 실패했습니다.',
        detail: updateResult.error
      },
      { status: updateResult.status || 500 }
    )
  }

  await logEvent(user, role, source)

  return NextResponse.json({
    ok: true,
    message: `${roleLabels[role]} 역할로 저장했습니다.`,
    role,
    roleLabel: roleLabels[role],
    user: updateResult.data
  })
}
