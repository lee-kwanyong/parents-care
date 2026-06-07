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
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
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

async function findInvite(inviteCode: string) {
  const result = await rest(
    'family_member_invites?select=*&invite_code=eq.' +
      encodeURIComponent(inviteCode) +
      '&order=created_at.desc&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null

  return result.data[0] as Record<string, unknown>
}

async function markAccepted(id: unknown) {
  const rawId = text(id)
  if (!rawId) return

  await rest('family_member_invites?id=eq.' + encodeURIComponent(rawId), {
    method: 'PATCH',
    body: JSON.stringify({
      invite_status: 'accepted',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  })
}

function setFamilyCookies(response: NextResponse, session: Record<string, unknown>) {
  const maxAge = 60 * 60 * 24 * 90
  const common = { path: '/', maxAge, sameSite: 'lax' as const }
  const familyCode = text(session.familyCode)
  const raw = JSON.stringify(session)

  response.cookies.set('anbu_guardian_family_code', familyCode, common)
  response.cookies.set('anbu_selected_family_code', familyCode, common)
  response.cookies.set('anbu_last_family_code', familyCode, common)
  response.cookies.set('anbu_family_member_connected', 'true', common)
  response.cookies.set('anbu_family_member_session', encodeURIComponent(raw), common)
  response.cookies.set('anbu_login_role', 'family_member', common)
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: '/api/family-member-join API is alive'
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const inviteCode = code6(body.inviteCode || body.code)
  const phoneLast4 = digits(body.phoneLast4 || body.inviteePhoneLast4).slice(-4)

  if (!/^\d{6}$/.test(inviteCode)) {
    return NextResponse.json(
      {
        ok: false,
        message: '6자리 가족 초대코드를 입력해주세요.'
      },
      { status: 400 }
    )
  }

  if (!/^\d{4}$/.test(phoneLast4)) {
    return NextResponse.json(
      {
        ok: false,
        message: '초대받은 가족 휴대폰 번호 뒤 4자리를 입력해주세요.'
      },
      { status: 400 }
    )
  }

  const invite = await findInvite(inviteCode)

  if (!invite) {
    return NextResponse.json(
      {
        ok: false,
        message: '등록된 가족 초대코드를 찾지 못했습니다.'
      },
      { status: 404 }
    )
  }

  const expiresAt = text(invite.expires_at)

  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 초대코드가 만료되었습니다. 보호자에게 새 초대를 요청해주세요.'
      },
      { status: 410 }
    )
  }

  const storedLast4 =
    digits(invite.invitee_phone_last4).slice(-4) ||
    digits(invite.invitee_phone).slice(-4)

  if (!storedLast4 || storedLast4 !== phoneLast4) {
    return NextResponse.json(
      {
        ok: false,
        message: '초대코드와 휴대폰 번호 뒤 4자리가 일치하지 않습니다.'
      },
      { status: 403 }
    )
  }

  await markAccepted(invite.id)

  const session = {
    familyCode: code6(invite.family_code),
    memberName: text(invite.invitee_name) || '가족',
    inviterName: text(invite.inviter_name) || '보호자',
    role: 'family_member',
    connected: true,
    verified: true,
    savedAt: new Date().toISOString()
  }

  const response = NextResponse.json({
    ok: true,
    message: '가족 초대가 확인되었습니다. 부모님 리포트 화면으로 이동합니다.',
    invite,
    session
  })

  setFamilyCookies(response, session)

  return response
}
