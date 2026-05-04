import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function canUseOpsRoute(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return true
  const secret = process.env.CRON_SECRET || ''
  const given = request.headers.get('x-ops-dev-secret') || ''
  return Boolean(secret && given && secret === given)
}

async function supabaseFetch(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase service env is missing' }
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
  if (!canUseOpsRoute(request)) {
    return NextResponse.json({ ok: false, message: 'ops route locked in production' }, { status: 403 })
  }

  const select = [
    'id',
    'family_id',
    'elder_id',
    'resolved_worry',
    'recommended_pack_code',
    'intake_channel',
    'ops_status',
    'contact_name',
    'contact_phone',
    'raw_text',
    'ai_summary',
    'social_care_requested',
    'created_at',
    'updated_at'
  ].join(',')

  const result = await supabaseFetch(
    'care_intake_entries?select=' +
      encodeURIComponent(select) +
      '&order=created_at.desc&limit=50'
  )

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: '접수 목록을 불러오지 못했습니다.', detail: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, items: Array.isArray(result.data) ? result.data : [] })
}

export async function PATCH(request: NextRequest) {
  if (!canUseOpsRoute(request)) {
    return NextResponse.json({ ok: false, message: 'ops route locked in production' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const id = typeof body.id === 'string' ? body.id : ''
  const status = typeof body.status === 'string' ? body.status : ''

  const allowed = ['new', 'triaged', 'plan_created', 'waiting_family', 'in_progress', 'resolved', 'cancelled']

  if (!id || !allowed.includes(status)) {
    return NextResponse.json({ ok: false, message: '상태 변경 값이 올바르지 않습니다.' }, { status: 400 })
  }

  const result = await supabaseFetch(
    'care_intake_entries?id=eq.' + encodeURIComponent(id),
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ ops_status: status, updated_at: new Date().toISOString() })
    }
  )

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: '상태 변경 실패', detail: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, item: Array.isArray(result.data) ? result.data[0] : result.data })
}
