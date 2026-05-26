import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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
      status: 500,
      data: null as any,
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
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: parsed,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    status: response.status,
    data: parsed,
    error: null
  }
}

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function findInviteByCode(code: string) {
  const result = await rest(
    'care_parent_invites?select=*&invite_code=eq.' +
      encodeURIComponent(code) +
      '&invite_status=eq.active&order=created_at.desc&limit=1'
  )

  if (!result.ok) return null

  return Array.isArray(result.data) ? result.data[0] : null
}

async function makeUniqueCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = makeCode()
    const existing = await findInviteByCode(code)

    if (!existing) return code
  }

  return makeCode()
}

function firstRow(result: { data: any }) {
  return Array.isArray(result.data) ? result.data[0] : result.data
}

function setParentSession(response: NextResponse, invite: AnyRow) {
  const options = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  }

  response.cookies.set('pc_role', 'parent', options)
  response.cookies.set('pc_parent_invite_code', String(invite.invite_code || ''), options)
  response.cookies.set('pc_parent_name', String(invite.parent_name || '부모님'), options)
  response.cookies.set('pc_guardian_phone', String(invite.guardian_phone || ''), options)
}

function setGuardianSession(response: NextResponse, name: string) {
  const options = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  }

  response.cookies.set('pc_role', 'guardian', options)
  response.cookies.set('pc_name', name || '보호자', options)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create_invite') {
    const guardianName = text(body.guardianName) || text(body.name) || '보호자'
    const guardianPhone = text(body.guardianPhone) || text(body.phone)
    const parentName = text(body.parentName) || '부모님'
    const parentPhone = text(body.parentPhone)

    if (!guardianPhone) {
      return NextResponse.json(
        {
          ok: false,
          message: '보호자 휴대폰 번호를 입력해주세요.'
        },
        { status: 400 }
      )
    }

    const inviteCode = await makeUniqueCode()

    const insert = await rest('care_parent_invites', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          guardian_name: guardianName,
          guardian_phone: guardianPhone,
          parent_name: parentName,
          parent_phone: parentPhone,
          invite_code: inviteCode,
          invite_status: 'active',
          metadata: {
            source: 'guardian_signup',
            created_from: 'web_mobile_app'
          }
        }
      ])
    })

    if (!insert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '부모님 초대코드 생성 중 오류가 발생했습니다. Supabase에서 care_parent_invites 테이블 SQL을 먼저 실행해주세요.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    const invite = firstRow(insert)
    const response = NextResponse.json({
      ok: true,
      message: '부모님 초대코드를 만들었습니다.',
      invite
    })

    setGuardianSession(response, guardianName)
    return response
  }

  if (action === 'parent_login') {
    const code = text(body.code)

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          ok: false,
          message: '6자리 숫자 코드를 입력해주세요.'
        },
        { status: 400 }
      )
    }

    const invite = await findInviteByCode(code)

    if (!invite) {
      return NextResponse.json(
        {
          ok: false,
          message: '초대코드가 맞지 않거나 만료됐습니다. 자녀에게 다시 확인해주세요.'
        },
        { status: 404 }
      )
    }

    await rest('care_parent_invites?id=eq.' + encodeURIComponent(invite.id), {
      method: 'PATCH',
      body: JSON.stringify({
        used_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })

    const response = NextResponse.json({
      ok: true,
      message: '부모님 안심 화면으로 접속합니다.',
      invite,
      home: '/parent/today'
    })

    setParentSession(response, invite)
    return response
  }

  return NextResponse.json(
    {
      ok: false,
      message: '올바른 요청이 아닙니다.'
    },
    { status: 400 }
  )
}
