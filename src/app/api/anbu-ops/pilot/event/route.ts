import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
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

function label(eventType: string) {
  if (eventType === 'started') return '실증 시작'
  if (eventType === 'paused') return '실증 일시중지'
  if (eventType === 'completed') return '실증 완료'
  if (eventType === 'resolved') return '확인 완료'
  if (eventType === 'issue_reported') return '문제 신고'
  return eventType
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode = text(body.familyCode)
  const eventType = text(body.eventType)
  const memo = text(body.memo)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      { ok: false, message: '6자리 가족 연결코드를 입력해주세요.' },
      { status: 400 }
    )
  }

  if (!eventType) {
    return NextResponse.json(
      { ok: false, message: 'eventType이 필요합니다.' },
      { status: 400 }
    )
  }

  const result = await rest('anbu_pilot_events', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        family_code: familyCode,
        event_type: eventType,
        event_label: label(eventType),
        actor_role: text(body.actorRole) || 'ops',
        actor_name: text(body.actorName) || '운영실',
        status: eventType === 'completed' ? 'completed' : 'recorded',
        memo: memo || null,
        payload: body
      }
    ])
  })

  if (['paused', 'completed', 'started'].includes(eventType)) {
    const status =
      eventType === 'paused'
        ? 'paused'
        : eventType === 'completed'
          ? 'completed'
          : 'active'

    await rest('anbu_pilot_participants?family_code=eq.' + encodeURIComponent(familyCode), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        participant_status: status,
        updated_at: new Date().toISOString()
      })
    })
  }

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '실증 이벤트 저장에 실패했습니다. Supabase SQL을 먼저 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: `${label(eventType)} 기록이 저장되었습니다.`,
    event: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
