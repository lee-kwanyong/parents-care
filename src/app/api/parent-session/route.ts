import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function digits(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function code6(value: unknown) {
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
      '&order=created_at.desc&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null

  return result.data[0] as Record<string, unknown>
}

async function markVerified(id: unknown) {
  const rawId = text(id)
  if (!rawId) return

  await rest('anbu_family_links?id=eq.' + encodeURIComponent(rawId), {
    method: 'PATCH',
    body: JSON.stringify({
      link_status: 'active',
      parent_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  })
}

function makeSession(familyCode: string, family: Record<string, unknown>) {
  return {
    familyCode,
    parentName: text(family.parent_name) || '부모님',
    parentPhone: text(family.parent_phone) || '',
    guardianName: text(family.guardian_name) || '보호자',
    guardianPhone: text(family.guardian_phone) || '',
    role: 'parent',
    loggedIn: true,
    connected: true,
    verified: true,
    savedAt: new Date().toISOString()
  }
}

function setCookies(response: NextResponse, session: ReturnType<typeof makeSession>) {
  const maxAge = 60 * 60 * 24 * 90
  const common = { path: '/', maxAge, sameSite: 'lax' as const }

  response.cookies.set('anbu_family_code', session.familyCode, common)
  response.cookies.set('pc_parent_invite_code', session.familyCode, common)
  response.cookies.set('anbu_parent_code', session.familyCode, common)
  response.cookies.set('parent_family_code', session.familyCode, common)
  response.cookies.set('parent_invite_code', session.familyCode, common)
  response.cookies.set('anbu_login_role', 'parent', common)
  response.cookies.set('anbu_parent_connected', 'true', common)
  response.cookies.set('anbu_parent_verified', 'true', common)
  response.cookies.set('anbu_parent_session', encodeURIComponent(JSON.stringify(session)), common)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode = code6(body.familyCode || body.code)
  const phoneLast4 = digits(body.parentPhoneLast4 || body.phoneLast4).slice(-4)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      { ok: false, connected: false, message: '6자리 연결코드를 입력해주세요.' },
      { status: 400 }
    )
  }

  if (!/^\d{4}$/.test(phoneLast4)) {
    return NextResponse.json(
      { ok: false, connected: false, message: '부모님 휴대폰 번호 뒤 4자리를 입력해주세요.' },
      { status: 400 }
    )
  }

  const family = await findFamily(familyCode)

  if (!family) {
    return NextResponse.json(
      { ok: false, connected: false, message: '등록된 연결코드를 찾지 못했습니다.' },
      { status: 404 }
    )
  }

  const storedLast4 =
    digits(family.parent_phone_last4).slice(-4) ||
    digits(family.parent_phone).slice(-4)

  if (!storedLast4 || storedLast4 !== phoneLast4) {
    return NextResponse.json(
      { ok: false, connected: false, message: '연결코드와 부모님 휴대폰 번호가 일치하지 않습니다.' },
      { status: 403 }
    )
  }

  await markVerified(family.id)

  const session = makeSession(familyCode, family)
  const response = NextResponse.json({
    ok: true,
    connected: true,
    message: '부모님과 보호자 연결이 완료되었습니다.',
    family,
    session
  })

  setCookies(response, session)

  return response
}

export async function GET(request: NextRequest) {
  const verified = request.cookies.get('anbu_parent_verified')?.value === 'true'

  if (!verified) {
    return NextResponse.json(
      { ok: false, connected: false, message: '검증된 부모님 세션이 없습니다.' },
      { status: 401 }
    )
  }

  const familyCode =
    code6(request.cookies.get('anbu_family_code')?.value) ||
    code6(request.cookies.get('pc_parent_invite_code')?.value) ||
    code6(request.cookies.get('anbu_parent_code')?.value) ||
    code6(request.cookies.get('parent_family_code')?.value)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      { ok: false, connected: false, message: '부모님 연결 세션이 없습니다.' },
      { status: 400 }
    )
  }

  const family = await findFamily(familyCode)

  if (!family) {
    return NextResponse.json(
      { ok: false, connected: false, message: '연결 정보를 찾지 못했습니다.' },
      { status: 404 }
    )
  }

  const session = makeSession(familyCode, family)
  const response = NextResponse.json({
    ok: true,
    connected: true,
    family,
    session
  })

  setCookies(response, session)

  return response
}
