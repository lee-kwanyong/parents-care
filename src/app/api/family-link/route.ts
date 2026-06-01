import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCode(value: unknown) {
  return text(value).replace(/[^\d]/g, '').slice(0, 6)
}

function normalizePhone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
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

  if (!base || !key) return { ok: false, data: null as unknown, error: 'Supabase env is missing' }

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

  return { ok: response.ok, data: parsed, error: response.ok ? null : parsed || bodyText }
}

async function existsCode(code: string) {
  const found = await rest('anbu_family_links?select=family_code&family_code=eq.' + encodeURIComponent(code) + '&limit=1')
  return found.ok && Array.isArray(found.data) && found.data.length > 0
}

async function createCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = makeCode()
    if (!(await existsCode(code))) return code
  }

  return makeCode()
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode = normalizeCode(body.familyCode) || await createCode()

  const payload = {
    family_code: familyCode,
    guardian_name: text(body.guardianName) || '보호자',
    guardian_phone: normalizePhone(body.guardianPhone),
    parent_name: text(body.parentName) || '부모님',
    parent_phone: normalizePhone(body.parentPhone),
    link_status: 'active',
    updated_at: new Date().toISOString()
  }

  const existing = await existsCode(familyCode)

  const result = existing
    ? await rest('anbu_family_links?family_code=eq.' + encodeURIComponent(familyCode), {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload)
      })
    : await rest('anbu_family_links', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify([payload])
      })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '부모님 연결코드 저장에 실패했습니다.',
        detail: result.error,
        fallbackCode: familyCode
      },
      { status: 500 }
    )
  }

  const row = Array.isArray(result.data) ? result.data[0] : result.data

  return NextResponse.json({
    ok: true,
    message: '부모님 연결코드가 생성되었습니다.',
    familyCode,
    family: row
  })
}
