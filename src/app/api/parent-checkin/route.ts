import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCode(value: unknown) {
  return text(value).replace(/[^\d]/g, '').slice(0, 6)
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

async function findFamily(familyCode: string) {
  const result = await rest('anbu_family_links?select=*&family_code=eq.' + encodeURIComponent(familyCode) + '&limit=1')
  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null
  return result.data[0] as Record<string, unknown>
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode =
    normalizeCode(body.familyCode) ||
    normalizeCode(request.cookies.get('anbu_family_code')?.value) ||
    normalizeCode(request.cookies.get('pc_parent_invite_code')?.value) ||
    normalizeCode(request.cookies.get('anbu_parent_code')?.value) ||
    normalizeCode(request.cookies.get('parent_family_code')?.value)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json({ ok: false, message: '부모님 연결이 없습니다. 6자리 코드를 다시 입력해주세요.' }, { status: 401 })
  }

  const family = await findFamily(familyCode)

  if (!family) {
    return NextResponse.json({ ok: false, message: '가족 연결 정보를 찾지 못했습니다.' }, { status: 404 })
  }

  const payload = {
    family_code: familyCode,
    elder_name: text(family.parent_name) || '부모님',
    check_type: text(body.checkType) || 'condition',
    care_label: text(body.careLabel) || '안부 확인',
    status: text(body.status) || 'done',
    memo: text(body.memo) || text(body.careLabel) || '안부 확인',
    occurred_at: new Date().toISOString()
  }

  const result = await rest('daily_care_checkins', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: '안부 기록 저장에 실패했습니다.', detail: result.error }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    message: `${payload.care_label} 기록이 저장되었습니다.`,
    checkin: Array.isArray(result.data) ? result.data[0] : result.data,
    session: {
      familyCode,
      parentName: text(family.parent_name) || '부모님',
      guardianName: text(family.guardian_name) || '보호자',
      role: 'parent',
      loggedIn: true,
      connected: true
    }
  })
}
