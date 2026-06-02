import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function code6(value: unknown) {
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

async function findFamily(familyCode: string) {
  const result = await rest(
    'anbu_family_links?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&order=created_at.desc&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null

  return result.data[0] as Record<string, unknown>
}

async function saveCheckin(payload: {
  familyCode: string
  elderName: string
  checkType: string
  careLabel: string
  status: string
  memo: string
}) {
  const rpc = await rest('rpc/create_daily_care_checkin', {
    method: 'POST',
    body: JSON.stringify({
      p_family_code: payload.familyCode,
      p_elder_name: payload.elderName,
      p_check_type: payload.checkType,
      p_care_label: payload.careLabel,
      p_status: payload.status,
      p_memo: payload.memo
    })
  })

  if (rpc.ok) return rpc

  const direct = await rest('daily_care_checkins', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        family_code: payload.familyCode,
        elder_name: payload.elderName,
        check_type: payload.checkType,
        care_label: payload.careLabel,
        status: payload.status,
        memo: payload.memo,
        occurred_at: new Date().toISOString()
      }
    ])
  })

  if (direct.ok) return direct

  return {
    ok: false,
    status: direct.status || rpc.status || 500,
    data: null,
    error: {
      rpc: rpc.error,
      direct: direct.error
    }
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: '/api/parent-checkin API is alive'
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode =
    code6(body.familyCode) ||
    code6(request.cookies.get('anbu_family_code')?.value) ||
    code6(request.cookies.get('pc_parent_invite_code')?.value) ||
    code6(request.cookies.get('anbu_parent_code')?.value) ||
    code6(request.cookies.get('parent_family_code')?.value)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      {
        ok: false,
        message: '부모님 연결이 없습니다. 6자리 코드를 다시 입력해주세요.'
      },
      { status: 401 }
    )
  }

  const checkType = text(body.checkType) || 'condition'
  const careLabel = text(body.careLabel) || '안부 확인'
  const status = text(body.status) || 'done'
  const memo = text(body.memo) || careLabel

  const family = await findFamily(familyCode)

  const result = await saveCheckin({
    familyCode,
    elderName: family ? text(family.parent_name) || '부모님' : '부모님',
    checkType,
    careLabel,
    status,
    memo
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '안부 저장에 실패했습니다. Supabase SQL Editor에서 20260602_parent_checkin_fix.sql을 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: `${careLabel} 기록이 자녀 리포트에 저장되었습니다.`,
    checkin: Array.isArray(result.data) ? result.data[0] : result.data,
    session: {
      familyCode,
      parentName: family ? text(family.parent_name) || '부모님' : '부모님',
      guardianName: family ? text(family.guardian_name) || '보호자' : '보호자',
      role: 'parent',
      loggedIn: true,
      connected: true,
      verified: true
    }
  })
}
