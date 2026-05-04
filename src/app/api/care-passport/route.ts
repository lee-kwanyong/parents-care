import { NextRequest, NextResponse } from 'next/server'
import {
  buildPassportPayload,
  normalizePassportInput
} from '@/lib/care-passport-engine'

export const dynamic = 'force-dynamic'

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
    }
  })

  const bodyText = await response.text()
  let parsed: any = null

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

export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get('limit') || '1'

  const result = await rest(
    'parent_care_passports?select=*&order=updated_at.desc&limit=' + encodeURIComponent(limit)
  )

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '케어패스포트를 불러오지 못했습니다. 011 SQL이 실행됐는지 확인해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    items: Array.isArray(result.data) ? result.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const input = normalizePassportInput(body)

  if (!input.elderName) {
    return NextResponse.json(
      { ok: false, message: '부모님 성함은 꼭 입력해주세요.' },
      { status: 400 }
    )
  }

  const payload = buildPassportPayload(input)

  const insertResult = await rest('parent_care_passports', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })

  if (!insertResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '케어패스포트 저장 중 오류가 발생했습니다.',
        detail: insertResult.error
      },
      { status: 500 }
    )
  }

  const saved = Array.isArray(insertResult.data) ? insertResult.data[0] : null

  if (saved?.id) {
    await rest('parent_care_passport_events', {
      method: 'POST',
      body: JSON.stringify([
        {
          passport_id: saved.id,
          event_type: 'care_passport_saved',
          title: '부모님 케어패스포트 저장',
          description: payload.care_summary.oneMinuteSummary,
          actor_role: 'family'
        }
      ])
    })
  }

  return NextResponse.json({
    ok: true,
    passport: saved,
    summary: payload.care_summary
  })
}
