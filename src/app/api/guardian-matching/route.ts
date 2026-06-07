import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null as any,
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
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: parsed,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    status: response.status,
    data: parsed,
    error: null
  }
}

function rows(result: { ok: boolean; data: any }) {
  return result.ok && Array.isArray(result.data) ? result.data : []
}

function firstRow(result: { data: any }) {
  return Array.isArray(result.data) ? result.data[0] : result.data
}

function decisionLabel(type: string) {
  if (type === 'confirmed') return '이 케어파트너로 진행 요청을 접수했습니다.'
  if (type === 'call_requested') return '전화 상담 요청을 접수했습니다.'
  if (type === 'other_requested') return '다른 후보 요청을 접수했습니다.'
  return '요청을 접수했습니다.'
}

export async function GET() {
  const [requestsResult, offersResult, decisionsResult] = await Promise.all([
    rest('care_manager_matching_requests?select=*&order=created_at.desc&limit=100'),
    rest('care_manager_match_offers?select=*&order=created_at.desc&limit=300'),
    rest('care_guardian_match_decisions?select=*&order=created_at.desc&limit=300')
  ])

  const requests = rows(requestsResult)
  const offers = rows(offersResult)
  const decisions = rows(decisionsResult)

  return NextResponse.json({
    ok: true,
    requests,
    offers,
    decisions,
    warning: decisionsResult.ok ? null : 'care_guardian_match_decisions 테이블이 없으면 선택 기록은 저장되지 않습니다.'
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)
  const matchingRequestId = text(body.matchingRequestId)
  const offerId = text(body.offerId)
  const managerProfileId = text(body.managerProfileId)
  const managerName = text(body.managerName)
  const note = text(body.note)

  const decisionType =
    action === 'confirm_offer'
      ? 'confirmed'
      : action === 'request_call'
        ? 'call_requested'
        : action === 'request_other'
          ? 'other_requested'
          : ''

  if (!decisionType) {
    return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
  }

  if (!matchingRequestId) {
    return NextResponse.json({ ok: false, message: 'matchingRequestId가 필요합니다.' }, { status: 400 })
  }

  const insert = await rest('care_guardian_match_decisions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        matching_request_id: matchingRequestId || null,
        match_offer_id: offerId || null,
        manager_profile_id: managerProfileId || null,
        manager_name: managerName || null,
        decision_type: decisionType,
        decision_status: 'received',
        guardian_note: note || null
      }
    ])
  })

  await rest('care_manager_matching_requests?id=eq.' + encodeURIComponent(matchingRequestId), {
    method: 'PATCH',
    body: JSON.stringify({
      matching_status: decisionType === 'confirmed' ? 'guardian_confirmed' : 'guardian_reviewing',
      updated_at: new Date().toISOString()
    })
  })

  if (!insert.ok) {
    return NextResponse.json({
      ok: true,
      message: decisionLabel(decisionType),
      warning: '선택 기록 테이블이 아직 없어 임시로 처리했습니다. Supabase에서 guardian_match_decisions SQL을 실행하면 기록이 저장됩니다.',
      decision: null
    })
  }

  return NextResponse.json({
    ok: true,
    message: decisionLabel(decisionType),
    decision: firstRow(insert)
  })
}
