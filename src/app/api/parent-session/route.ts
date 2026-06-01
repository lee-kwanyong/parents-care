import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCode(value: unknown) {
  return text(value).replace(/[^\d]/g, '').slice(0, 6)
}

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
      error: 'Supabase 환경변수가 없습니다.'
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

async function findFamily(familyCode: string) {
  const result = await rest(
    'anbu_family_links?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&limit=1'
  )

  if (!result.ok) {
    return {
      ok: false,
      family: null as Record<string, unknown> | null,
      message: '부모님 연결코드 확인 중 오류가 발생했습니다.',
      detail: result.error
    }
  }

  if (!Array.isArray(result.data) || !result.data[0]) {
    return {
      ok: false,
      family: null as Record<string, unknown> | null,
      message: '등록된 6자리 연결코드를 찾지 못했습니다.',
      detail: null
    }
  }

  const family = result.data[0] as Record<string, unknown>
  const linkStatus = text(family.link_status)

  if (['expired', 'revoked', 'disabled'].includes(linkStatus)) {
    return {
      ok: false,
      family,
      message: '이 연결코드는 더 이상 사용할 수 없습니다.',
      detail: null
    }
  }

  return {
    ok: true,
    family,
    message: '부모님 연결이 확인되었습니다.',
    detail: null
  }
}

function sessionPayload(family: Record<string, unknown>, familyCode: string) {
  return {
    familyCode,
    parentName: text(family.parent_name) || '부모님',
    parentPhone: text(family.parent_phone) || '',
    guardianName: text(family.guardian_name) || '보호자',
    guardianPhone: text(family.guardian_phone) || '',
    role: 'parent',
    loggedIn: true,
    connected: true,
    createdAt: new Date().toISOString()
  }
}

function setParentCookies(response: NextResponse, session: ReturnType<typeof sessionPayload>) {
  const maxAge = 60 * 60 * 24 * 60

  const common = {
    path: '/',
    maxAge,
    sameSite: 'lax' as const
  }

  response.cookies.set('anbu_family_code', session.familyCode, common)
  response.cookies.set('pc_parent_invite_code', session.familyCode, common)
  response.cookies.set('anbu_parent_code', session.familyCode, common)
  response.cookies.set('anbu_login_role', 'parent', common)
  response.cookies.set('anbu_parent_connected', 'true', common)
  response.cookies.set('anbu_parent_session', encodeURIComponent(JSON.stringify(session)), common)
}

function clearParentCookies(response: NextResponse) {
  const keys = [
    'anbu_family_code',
    'pc_parent_invite_code',
    'anbu_parent_code',
    'anbu_login_role',
    'anbu_parent_connected',
    'anbu_parent_session'
  ]

  for (const key of keys) {
    response.cookies.set(key, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax'
    })
  }
}

export async function GET(request: NextRequest) {
  const familyCode =
    normalizeCode(request.nextUrl.searchParams.get('familyCode')) ||
    normalizeCode(request.cookies.get('anbu_family_code')?.value) ||
    normalizeCode(request.cookies.get('pc_parent_invite_code')?.value) ||
    normalizeCode(request.cookies.get('anbu_parent_code')?.value)

  if (!familyCode) {
    return NextResponse.json({
      ok: false,
      connected: false,
      message: '부모님 연결 세션이 없습니다.'
    })
  }

  const found = await findFamily(familyCode)

  if (!found.ok || !found.family) {
    const response = NextResponse.json({
      ok: false,
      connected: false,
      message: found.message,
      detail: found.detail
    })

    clearParentCookies(response)

    return response
  }

  const session = sessionPayload(found.family, familyCode)
  const response = NextResponse.json({
    ok: true,
    connected: true,
    message: found.message,
    family: found.family,
    session
  })

  setParentCookies(response, session)

  return response
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const familyCode = normalizeCode(body.familyCode || body.code)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        message: '6자리 연결코드를 입력해주세요.'
      },
      { status: 400 }
    )
  }

  const found = await findFamily(familyCode)

  if (!found.ok || !found.family) {
    const response = NextResponse.json(
      {
        ok: false,
        connected: false,
        message: found.message,
        detail: found.detail
      },
      { status: 404 }
    )

    clearParentCookies(response)

    return response
  }

  const session = sessionPayload(found.family, familyCode)
  const response = NextResponse.json({
    ok: true,
    connected: true,
    message: found.message,
    family: found.family,
    session
  })

  setParentCookies(response, session)

  return response
}

export async function DELETE() {
  const response = NextResponse.json({
    ok: true,
    connected: false,
    message: '부모님 연결이 해제되었습니다.'
  })

  clearParentCookies(response)

  return response
}
