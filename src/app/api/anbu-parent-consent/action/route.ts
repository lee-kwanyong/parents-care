import { NextRequest, NextResponse } from 'next/server'
import { consentActionLabel, consentActionRiskLevel } from '@/lib/anbu-consent'

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
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const familyCode = text(body.familyCode)
  const actionType = text(body.actionType)
  const memo = text(body.memo)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      { ok: false, message: '6자리 가족 연결코드가 필요합니다.' },
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
  const parentName = text(family?.parent_name) || text(body.parentName) || '부모님'
  const label = consentActionLabel(actionType)
  const riskLevel = consentActionRiskLevel(actionType)

  const action = await insert('anbu_parent_consent_actions', {
    family_code: familyCode,
    parent_name: parentName,
    action_type: actionType,
    action_label: label,
    risk_level: riskLevel,
    memo: memo || null,
    payload: {
      body,
      family
    }
  })

  let checkin = null

  if (['call_guardian', 'help_needed'].includes(actionType)) {
    checkin = await insert('daily_care_checkins', {
      family_code: familyCode,
      elder_name: parentName,
      check_type: actionType === 'help_needed' ? 'emergency' : 'condition',
      care_label: label,
      status: 'needs_help',
      memo: memo || label,
      occurred_at: new Date().toISOString()
    })
  } else if (actionType === 'rest_today') {
    checkin = await insert('daily_care_checkins', {
      family_code: familyCode,
      elder_name: parentName,
      check_type: 'condition',
      care_label: label,
      status: 'done',
      memo: memo || '부모님이 오늘은 쉬고 싶다고 선택했습니다.',
      occurred_at: new Date().toISOString()
    })
  } else if (actionType === 'reply_later') {
    checkin = await insert('daily_care_checkins', {
      family_code: familyCode,
      elder_name: parentName,
      check_type: 'condition',
      care_label: label,
      status: 'done',
      memo: memo || '부모님이 나중에 답하겠다고 선택했습니다.',
      occurred_at: new Date().toISOString()
    })
  }

  return NextResponse.json({
    ok: action.ok,
    message: action.ok ? `${label} 기록이 저장되었습니다.` : '부모님 안심 행동 저장에 실패했습니다. Supabase SQL을 실행해주세요.',
    action,
    checkin
  })
}
