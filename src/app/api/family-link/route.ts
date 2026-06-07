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

  const bodyText = await response.text()
  let parsed: unknown = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return {
    ok: response.ok,
    status: response.status,
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

async function exists(code: string) {
  const result = await rest('anbu_family_links?select=family_code&family_code=eq.' + encodeURIComponent(code) + '&limit=1')
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
    message: '/api/family-link API is alive'
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const parentPhone = digits(body.parentPhone)
  const guardianPhone = digits(body.guardianPhone)

  if (parentPhone.length < 10) {
    return NextResponse.json(
      {
        ok: false,
        message: '부모님 휴대폰 번호를 정확히 입력해주세요.'
      },
      { status: 400 }
    )
  }

  const familyCode = code6(body.familyCode) || await generateUniqueCode()

  const payload = {
    family_code: familyCode,
    guardian_id: text(body.guardianId),
    guardian_email: text(body.guardianEmail),
    guardian_name: text(body.guardianName) || '보호자',
    guardian_phone: guardianPhone,
    parent_name: text(body.parentName) || '부모님',
    parent_phone: parentPhone,
    parent_phone_last4: parentPhone.slice(-4),
    link_status: 'pending',
    code_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    payload: body,
    updated_at: new Date().toISOString()
  }

  const result = await rest('anbu_family_links', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '연결코드 저장에 실패했습니다. Supabase SQL을 먼저 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  const family = Array.isArray(result.data) ? result.data[0] : result.data

  return NextResponse.json({
    ok: true,
    saved: true,
    message: '부모님께 보낼 6자리 연결코드가 생성되었습니다.',
    familyCode,
    family
  })
}
