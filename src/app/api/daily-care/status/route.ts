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
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

async function rest(path: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase env is missing' }
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
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return { ok: response.ok, data: parsed, error: response.ok ? null : parsed || bodyText }
}

export async function GET(request: NextRequest) {
  const familyCode =
    request.cookies.get('anbu_family_code')?.value ||
    request.cookies.get('pc_parent_invite_code')?.value ||
    ''

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

  const basePath =
    'daily_care_checkins?select=' +
    encodeURIComponent(select) +
    '&order=occurred_at.desc&limit=100'

  const filtered = familyCode
    ? await rest(basePath + '&family_code=eq.' + encodeURIComponent(familyCode))
    : { ok: false, data: null, error: 'no family code' }

  const result = filtered.ok ? filtered : await rest(basePath)

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '안부온 상태를 불러오지 못했습니다. Supabase daily_care_checkins 테이블을 확인해주세요.',
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
