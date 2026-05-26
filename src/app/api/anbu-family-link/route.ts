import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function createCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
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
    return { ok: false, data: null as any, error: 'Supabase env is missing' }
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

  return { ok: response.ok, data: parsed, error: response.ok ? null : parsed || bodyText }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create') {
    const familyCode = text(body.familyCode) || createCode()
    const parentName = text(body.parentName) || '부모님'
    const guardianName = text(body.guardianName) || '보호자'
    const guardianPhone = text(body.guardianPhone)
    const parentPhone = text(body.parentPhone)

    const payload = {
      family_code: familyCode,
      guardian_name: guardianName,
      guardian_phone: guardianPhone || null,
      parent_name: parentName,
      parent_phone: parentPhone || null,
      consent_status: 'pending',
      link_status: 'active'
    }

    const inserted = await rest('anbu_family_links', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([payload])
    })

    const response = NextResponse.json({
      ok: true,
      familyCode,
      mode: inserted.ok ? 'supabase' : 'local-fallback',
      message: inserted.ok
        ? '부모님 연결코드가 저장되었습니다.'
        : 'Supabase 테이블이 아직 없어서 브라우저 기준으로 코드가 생성되었습니다. SQL 마이그레이션을 실행하면 서버 저장이 됩니다.',
      detail: inserted.ok ? null : inserted.error
    })

    response.cookies.set('anbu_role', 'guardian', { path: '/', sameSite: 'lax' })
    response.cookies.set('anbu_family_code', familyCode, { path: '/', sameSite: 'lax' })
    response.cookies.set('pc_guardian_phone', guardianPhone || '', { path: '/', sameSite: 'lax' })

    return response
  }

  if (action === 'join') {
    const familyCode = text(body.familyCode)

    if (!/^\d{4,6}$/.test(familyCode)) {
      return NextResponse.json({ ok: false, message: '4자리 또는 6자리 연결코드를 입력해주세요.' }, { status: 400 })
    }

    const parentName = text(body.parentName) || '부모님'
    const found = await rest(
      'anbu_family_links?select=id,parent_name,family_code,link_status&family_code=eq.' +
        encodeURIComponent(familyCode) +
        '&link_status=eq.active&limit=1'
    )

    if (found.ok && Array.isArray(found.data) && found.data.length === 0) {
      return NextResponse.json({ ok: false, message: '연결코드를 찾지 못했습니다. 보호자에게 코드를 다시 확인해주세요.' }, { status: 404 })
    }

    if (found.ok && Array.isArray(found.data) && found.data[0]?.parent_name) {
      await rest('anbu_family_links?family_code=eq.' + encodeURIComponent(familyCode), {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          parent_name: parentName,
          consent_status: 'agreed',
          parent_joined_at: new Date().toISOString()
        })
      })
    }

    const response = NextResponse.json({
      ok: true,
      familyCode,
      mode: found.ok ? 'supabase' : 'local-fallback',
      message: '부모님 연결이 완료되었습니다.'
    })

    response.cookies.set('anbu_role', 'parent', { path: '/', sameSite: 'lax' })
    response.cookies.set('anbu_family_code', familyCode, { path: '/', sameSite: 'lax' })
    response.cookies.set('pc_role', 'parent', { path: '/', sameSite: 'lax' })
    response.cookies.set('pc_parent_invite_code', familyCode, { path: '/', sameSite: 'lax' })
    response.cookies.set('pc_parent_name', parentName, { path: '/', sameSite: 'lax' })

    return response
  }

  return NextResponse.json({ ok: false, message: '지원하지 않는 요청입니다.' }, { status: 400 })
}
