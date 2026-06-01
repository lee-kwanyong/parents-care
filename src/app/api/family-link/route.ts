import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
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
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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

async function insertWithFallback(payload: Record<string, unknown>) {
  const attempts: Array<Record<string, unknown>> = [
    payload,
    {
      family_code: payload.family_code,
      guardian_name: payload.guardian_name,
      guardian_phone: payload.guardian_phone,
      parent_name: payload.parent_name,
      parent_phone: payload.parent_phone,
      link_status: 'active'
    },
    {
      family_code: payload.family_code,
      guardian_name: payload.guardian_name,
      guardian_phone: payload.guardian_phone,
      parent_name: payload.parent_name,
      link_status: 'active'
    },
    {
      family_code: payload.family_code,
      guardian_name: payload.guardian_name,
      parent_name: payload.parent_name
    },
    {
      family_code: payload.family_code
    }
  ]

  let lastError: unknown = null

  for (const attempt of attempts) {
    const result = await rest('anbu_family_links', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([attempt])
    })

    if (result.ok) return result

    lastError = result.error
  }

  return {
    ok: false,
    status: 500,
    data: null,
    error: lastError
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const familyCode = code6(body.familyCode) || await generateUniqueCode()

    const payload = {
      family_code: familyCode,
      guardian_name: text(body.guardianName) || '보호자',
      guardian_phone: phone(body.guardianPhone),
      parent_name: text(body.parentName) || '부모님',
      parent_phone: phone(body.parentPhone),
      link_status: 'active',
      payload: body,
      updated_at: new Date().toISOString()
    }

    const result = await insertWithFallback(payload)

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '부모님 연결코드 저장에 실패했습니다. Supabase SQL Editor에서 20260602_family_link_fix.sql을 실행해주세요.',
          familyCode,
          detail: result.error
        },
        { status: 500 }
      )
    }

    const family = Array.isArray(result.data) ? result.data[0] : result.data

    return NextResponse.json({
      ok: true,
      message: '부모님께 보낼 6자리 연결코드가 생성되었습니다.',
      familyCode,
      family
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : '연결코드 생성 중 서버 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}
