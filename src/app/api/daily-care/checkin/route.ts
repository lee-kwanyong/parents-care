import { NextRequest, NextResponse } from 'next/server'
import type { DailyCareStatus, DailyCareType } from '@/lib/daily-care-engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const allowedTypes = new Set(['meal', 'medication', 'condition', 'safe_return', 'emergency'])
const allowedStatuses = new Set(['done', 'not_done', 'needs_help', 'unknown'])

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
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

  if (!response.ok) {
    return { ok: false, data: parsed, error: parsed || bodyText }
  }

  return { ok: true, data: parsed, error: null }
}

async function findParentInvite(inviteCode: string) {
  const result = await rest(
    'care_parent_invites?select=*&invite_code=eq.' +
      encodeURIComponent(inviteCode) +
      '&invite_status=eq.active&order=created_at.desc&limit=1'
  )

  if (!result.ok) return null
  return Array.isArray(result.data) ? result.data[0] : null
}

export async function POST(request: NextRequest) {
  const role = request.cookies.get('pc_role')?.value || ''
  const inviteCode = request.cookies.get('pc_parent_invite_code')?.value || ''

  if (role !== 'parent' || !inviteCode) {
    return NextResponse.json(
      {
        ok: false,
        message: '먼저 부모님 4자리 코드로 접속해주세요.'
      },
      { status: 401 }
    )
  }

  const invite = await findParentInvite(inviteCode)

  if (!invite) {
    const response = NextResponse.json(
      {
        ok: false,
        message: '부모님 연결 정보가 만료됐습니다. 자녀에게 4자리 코드를 다시 받아주세요.'
      },
      { status: 401 }
    )

    response.cookies.delete('pc_role')
    response.cookies.delete('pc_parent_invite_code')
    response.cookies.delete('pc_parent_name')
    response.cookies.delete('pc_guardian_phone')

    return response
  }

  const body = await request.json().catch(() => ({}))

  const elderName =
    text(invite.parent_name) ||
    text(request.cookies.get('pc_parent_name')?.value) ||
    '부모님'

  const checkType = text(body.checkType) as DailyCareType
  const careLabel = text(body.careLabel) || '오늘 확인'
  const status = text(body.status) as DailyCareStatus
  const memo = text(body.memo)

  if (!allowedTypes.has(checkType)) {
    return NextResponse.json({ ok: false, message: 'checkType이 올바르지 않습니다.' }, { status: 400 })
  }

  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ ok: false, message: 'status가 올바르지 않습니다.' }, { status: 400 })
  }

  const insert = await rest('daily_care_checkins', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        elder_name: elderName,
        check_type: checkType,
        care_label: careLabel,
        status,
        actor_role: 'parent',
        source: 'anbuon_parent_big_button',
        memo: memo || null,
        occurred_at: new Date().toISOString()
      }
    ])
  })

  if (!insert.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '안부온 확인 저장 중 오류가 발생했습니다.',
        detail: insert.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    checkin: Array.isArray(insert.data) ? insert.data[0] : insert.data
  })
}
