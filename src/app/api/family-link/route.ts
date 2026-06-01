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
      error: 'Supabase env missing'
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

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: '/api/family-link API is alive'
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const familyCode = code6(body.familyCode) || makeCode()

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

  let saved = false
  let detail: unknown = null
  let family: unknown = null

  try {
    const result = await rest('anbu_family_links', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([payload])
    })

    if (result.ok) {
      saved = true
      family = Array.isArray(result.data) ? result.data[0] : result.data
    } else {
      detail = result.error
    }
  } catch (error) {
    detail = error instanceof Error ? error.message : 'DB 저장 실패'
  }

  return NextResponse.json({
    ok: true,
    saved,
    message: saved
      ? '부모님께 보낼 6자리 연결코드가 생성되었습니다.'
      : '6자리 연결코드가 생성되었습니다. 서버 저장은 실패했지만 부모님께 코드는 전달할 수 있습니다.',
    familyCode,
    family,
    detail
  })
}
