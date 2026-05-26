import { NextRequest, NextResponse } from 'next/server'
import { buildDailyCareSummary } from '@/lib/daily-care-engine'
import type { DailyCareCheckin } from '@/lib/daily-care-engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

async function rest(path: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      data: null as unknown,
      error: 'NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json'
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

export async function GET(request: NextRequest) {
  const familyCode =
    request.cookies.get('anbu_family_code')?.value ||
    request.cookies.get('pc_parent_invite_code')?.value ||
    ''

  if (!familyCode) {
    const summary = buildDailyCareSummary([])

    return NextResponse.json({
      ok: true,
      items: [],
      summary,
      message: '아직 연결된 부모님 코드가 없습니다. /family-link에서 부모님을 먼저 연결하세요.'
    })
  }

  const select = [
    'id',
    'elder_name',
    'check_type',
    'care_label',
    'status',
    'actor_role',
    'source',
    'memo',
    'occurred_at',
    'created_at'
  ].join(',')

  const result = await rest(
    'daily_care_checkins?select=' +
      encodeURIComponent(select) +
      '&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&order=occurred_at.desc&limit=100'
  )

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '안부온 상태를 불러오지 못했습니다. /setup/supabase에서 DB 설정을 확인해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  const items = Array.isArray(result.data) ? (result.data as DailyCareCheckin[]) : []
  const summary = buildDailyCareSummary(items)

  return NextResponse.json({
    ok: true,
    items,
    summary
  })
}
