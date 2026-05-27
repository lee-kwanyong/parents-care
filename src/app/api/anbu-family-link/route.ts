import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function createCode() {
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
      data: null as unknown,
      error: 'NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.'
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

async function createFamilyLink(payload: Record<string, unknown>) {
  for (let i = 0; i < 5; i += 1) {
    const familyCode = i === 0 && typeof payload.family_code === 'string'
      ? payload.family_code
      : createCode()

    const result = await rest('anbu_family_links', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([{ ...payload, family_code: familyCode }])
    })

    if (result.ok) {
      return { ...result, familyCode }
    }
  }

  return {
    ok: false,
    familyCode: '',
    data: null,
    error: '연결코드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.'
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create') {
    const guardianName = text(body.guardianName) || '보호자'
    const guardianPhone = text(body.guardianPhone)
    const parentName = text(body.parentName) || '부모님'
    const parentPhone = text(body.parentPhone)

    const created = await createFamilyLink({
      family_code: text(body.familyCode) || createCode(),
      guardian_name: guardianName,
      guardian_phone: guardianPhone || null,
      parent_name: parentName,
      parent_phone: parentPhone || null,
      consent_status: 'pending',
      link_status: 'active'
    })

    if (!created.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Supabase 서버 저장에 실패했습니다. /setup/supabase에서 DB 설정을 먼저 확인해주세요.',
          detail: created.error
        },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      ok: true,
      familyCode: created.familyCode,
      message: '부모님 연결코드가 서버에 저장되었습니다.'
    })

    response.cookies.set('anbu_role', 'guardian', { path: '/', sameSite: 'lax' })
    response.cookies.set('anbu_family_code', created.familyCode, { path: '/', sameSite: 'lax' })
    response.cookies.set('pc_guardian_phone', guardianPhone || '', { path: '/', sameSite: 'lax' })

    return response
  }

  if (action === 'join') {
    const familyCode = text(body.familyCode)

    if (!/^\d{6}$/.test(familyCode)) {
      return NextResponse.json(
        { ok: false, message: '6자리 연결코드를 입력해주세요.' },
        { status: 400 }
      )
    }

    const found = await rest(
      'anbu_family_links?select=id,parent_name,family_code,link_status&family_code=eq.' +
        encodeURIComponent(familyCode) +
        '&link_status=eq.active&limit=1'
    )

    if (!found.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Supabase 연결 확인이 필요합니다. /setup/supabase에서 DB 설정을 먼저 확인해주세요.',
          detail: found.error
        },
        { status: 500 }
      )
    }

    const rows = Array.isArray(found.data) ? found.data : []

    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, message: '연결코드를 찾지 못했습니다. 보호자에게 코드를 다시 확인해주세요.' },
        { status: 404 }
      )
    }

    const parentName = text(body.parentName) || '부모님'

    await rest('anbu_family_links?family_code=eq.' + encodeURIComponent(familyCode), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        parent_name: parentName,
        consent_status: 'agreed',
        parent_joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })

    const response = NextResponse.json({
      ok: true,
      familyCode,
      message: '부모님 연결이 완료되었습니다.'
    })

    response.cookies.set('anbu_role', 'parent', { path: '/', sameSite: 'lax' })
    response.cookies.set('anbu_family_code', familyCode, { path: '/', sameSite: 'lax' })
    response.cookies.set('pc_role', 'parent', { path: '/', sameSite: 'lax' })
    response.cookies.set('pc_parent_invite_code', familyCode, { path: '/', sameSite: 'lax' })
    response.cookies.set('pc_parent_name', parentName, { path: '/', sameSite: 'lax' })

    return response
  }

  return NextResponse.json(
    { ok: false, message: '지원하지 않는 요청입니다.' },
    { status: 400 }
  )
}
