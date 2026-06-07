import { NextRequest, NextResponse } from 'next/server'
import { isSixDigitParentCode, normalizeParentCode } from '@/lib/parent-code'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type SupabaseResult = {
  ok: boolean
  data: unknown
  error: unknown
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

async function rest(path: string, init?: RequestInit): Promise<SupabaseResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null, error: 'Supabase env is missing' }
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

  if (!response.ok) {
    return { ok: false, data: parsed, error: parsed || bodyText }
  }

  return { ok: true, data: parsed, error: null }
}

async function findInvite(code: string) {
  const select = encodeURIComponent('*')
  const encodedCode = encodeURIComponent(code)

  const queries = [
    `care_parent_invites?select=${select}&invite_code=eq.${encodedCode}&invite_status=eq.active&order=created_at.desc&limit=1`,
    `care_parent_invites?select=${select}&invite_code=eq.${encodedCode}&status=eq.active&order=created_at.desc&limit=1`,
    `care_parent_invites?select=${select}&invite_code=eq.${encodedCode}&order=created_at.desc&limit=1`
  ]

  for (const query of queries) {
    const result = await rest(query)
    if (!result.ok) continue

    const row = Array.isArray(result.data) ? (result.data[0] as Record<string, unknown> | undefined) : undefined
    if (!row) continue

    const inviteStatus = String(row.invite_status || row.status || 'active').toLowerCase()

    if (inviteStatus === 'active' || inviteStatus === 'issued' || inviteStatus === 'ready') {
      return row
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const code = normalizeParentCode(body.code || body.inviteCode || body.parentCode)

  if (!isSixDigitParentCode(code)) {
    return NextResponse.json(
      { ok: false, message: '부모님 코드는 숫자 6자리입니다.' },
      { status: 400 }
    )
  }

  const invite = await findInvite(code)

  if (!invite) {
    return NextResponse.json(
      { ok: false, message: '유효한 부모님 6자리 코드를 찾지 못했습니다. 보호자에게 새 코드를 받아주세요.' },
      { status: 404 }
    )
  }

  const parentName = String(invite.parent_name || invite.elder_name || '부모님')

  const response = NextResponse.json({
    ok: true,
    parentName,
    inviteCode: code
  })

  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
  const cookieOptions = {
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    expires
  }

  response.cookies.set('pc_role', 'parent', cookieOptions)
  response.cookies.set('pc_parent_invite_code', code, cookieOptions)
  response.cookies.set('pc_parent_name', parentName, cookieOptions)

  if (invite.guardian_phone) {
    response.cookies.set('pc_guardian_phone', String(invite.guardian_phone), cookieOptions)
  }

  return response
}
