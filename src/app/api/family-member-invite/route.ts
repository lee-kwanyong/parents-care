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

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
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

async function exists(inviteCode: string) {
  const result = await rest(
    'family_member_invites?select=invite_code&invite_code=eq.' +
      encodeURIComponent(inviteCode) +
      '&limit=1'
  )

  return result.ok && Array.isArray(result.data) && result.data.length > 0
}

async function generateUniqueCode() {
  for (let i = 0; i < 30; i += 1) {
    const candidate = makeCode()
    if (!(await exists(candidate))) return candidate
  }

  return makeCode()
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: '/api/family-member-invite API is alive'
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode = code6(body.familyCode)
  const inviteePhone = digits(body.inviteePhone)
  const inviterPhone = digits(body.inviterPhone)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      {
        ok: false,
        message: '부모님 연결코드가 없습니다. 먼저 부모님 연결코드를 만든 뒤 가족을 초대해주세요.'
      },
      { status: 400 }
    )
  }

  if (inviteePhone.length < 10) {
    return NextResponse.json(
      {
        ok: false,
        message: '초대할 가족의 휴대폰 번호를 정확히 입력해주세요.'
      },
      { status: 400 }
    )
  }

  const inviteCode = await generateUniqueCode()

  const payload = {
    invite_code: inviteCode,
    family_code: familyCode,
    inviter_id: text(body.inviterId),
    inviter_email: text(body.inviterEmail),
    inviter_name: text(body.inviterName) || '보호자',
    inviter_phone: inviterPhone,
    invitee_name: text(body.inviteeName) || '가족',
    invitee_phone: inviteePhone,
    invitee_phone_last4: inviteePhone.slice(-4),
    relationship: text(body.relationship) || 'family',
    role: 'family_viewer',
    invite_status: 'pending',
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    payload: body,
    updated_at: new Date().toISOString()
  }

  const result = await rest('family_member_invites', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 초대코드 저장에 실패했습니다. Supabase SQL을 먼저 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  const invite = Array.isArray(result.data) ? result.data[0] : result.data

  return NextResponse.json({
    ok: true,
    message: '다른 가족에게 보낼 초대코드가 생성되었습니다.',
    inviteCode,
    invite
  })
}
