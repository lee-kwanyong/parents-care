import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
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
      data: null as unknown,
      error: 'Supabase env is missing'
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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode = text(body.familyCode)
  const respondentRole = text(body.respondentRole) || 'guardian'
  const respondentName = text(body.respondentName)
  const comment = text(body.comment)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      { ok: false, message: '6자리 가족 연결코드를 입력해주세요.' },
      { status: 400 }
    )
  }

  const payload = {
    family_code: familyCode,
    respondent_role: respondentRole,
    respondent_name: respondentName || null,
    rating: clamp(num(body.rating, 5), 1, 5),
    burden_rating: clamp(num(body.burdenRating, 3), 1, 5),
    trust_rating: clamp(num(body.trustRating, 5), 1, 5),
    comment: comment || null,
    payload: body
  }

  const result = await rest('anbu_pilot_feedback', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '실증 피드백 저장에 실패했습니다. Supabase SQL을 먼저 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '실증 피드백이 저장되었습니다.',
    feedback: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
