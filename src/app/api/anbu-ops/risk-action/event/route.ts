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

async function insert(table: string, payload: Record<string, unknown>) {
  return rest(table, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([payload])
  })
}

async function findFamily(familyCode: string) {
  if (!familyCode) return null

  const result = await rest(
    'anbu_family_links?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null

  return result.data[0] as Record<string, unknown>
}

function actionLabel(actionType: string) {
  if (actionType === 'record_call_parent') return '부모님 전화 확인'
  if (actionType === 'send_guardian_notice') return '보호자 확인 요청'
  if (actionType === 'request_family_check') return '가족 2차 확인'
  if (actionType === 'request_partner_check') return '케어파트너 현장확인 요청'
  if (actionType === 'review_report') return '리포트 검수'
  if (actionType === 'mark_resolved') return '확인 완료'
  if (actionType === 'adjust_burden') return '알림 부담 조정'
  return actionType
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode = text(body.familyCode)
  const actionType = text(body.actionType)
  const memo = text(body.memo)
  const guide = body.guide || null

  if (!familyCode) {
    return NextResponse.json(
      { ok: false, message: '가족 연결코드가 필요합니다.' },
      { status: 400 }
    )
  }

  if (!actionType) {
    return NextResponse.json(
      { ok: false, message: 'actionType이 필요합니다.' },
      { status: 400 }
    )
  }

  const family = await findFamily(familyCode)
  const label = actionLabel(actionType)

  const event = await insert('anbu_risk_action_events', {
    family_code: familyCode,
    action_type: actionType,
    action_label: label,
    risk_level: text(body.riskLevel) || text(guide?.riskLevel) || null,
    risk_score: typeof body.riskScore === 'number' ? body.riskScore : typeof guide?.riskScore === 'number' ? guide.riskScore : null,
    actor_role: 'ops',
    actor_name: text(body.actorName) || '운영실',
    status: actionType === 'mark_resolved' ? 'completed' : 'recorded',
    memo: memo || null,
    guide_payload: guide || {},
    payload: {
      body,
      family
    }
  })

  let careRequest = null

  if (actionType === 'request_partner_check') {
    careRequest = await insert('anbu_care_requests', {
      family_code: familyCode,
      guardian_name: text(family?.guardian_name) || '보호자',
      guardian_phone: text(family?.guardian_phone),
      parent_name: text(family?.parent_name) || '부모님',
      region: text(body.region) || '미입력',
      request_type: 'visit',
      details: memo || 'Risk-to-Action AI 가이드에서 케어파트너 현장확인을 요청했습니다.',
      status: 'requested'
    })
  }

  if (actionType === 'mark_resolved') {
    await insert('anbu_safety_loop_actions', {
      family_code: familyCode,
      action_type: 'mark_complete',
      action_label: 'Risk-to-Action 확인 완료',
      actor_role: 'ops',
      actor_name: '운영실',
      status: 'completed',
      memo: memo || 'Risk-to-Action 가이드에서 확인 완료 처리했습니다.',
      payload: { body, family }
    })
  }

  return NextResponse.json({
    ok: event.ok,
    message: event.ok ? `${label} 기록이 저장되었습니다.` : 'Risk-to-Action 이벤트 저장에 실패했습니다. Supabase SQL을 먼저 실행해주세요.',
    event,
    careRequest
  })
}
