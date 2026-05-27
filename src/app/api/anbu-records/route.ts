import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const allowedTables = new Set([
  'anbu_guardians',
  'anbu_parents',
  'anbu_family_links',
  'anbu_schedules',
  'anbu_notifications',
  'anbu_weekly_reports',
  'anbu_care_partner_applications',
  'anbu_partner_verifications',
  'anbu_ops_cases',
  'anbu_outreach_organizations',
  'anbu_data_deletion_requests',
  'anbu_contacts',
  'anbu_audit_logs'
])

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

async function insertRow(table: string, payload: Record<string, unknown>) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      mode: 'local-fallback',
      error: 'Supabase env is missing'
    }
  }

  const response = await fetch(base + '/rest/v1/' + table, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify([payload]),
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
    mode: 'supabase',
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const table = typeof body.table === 'string' ? body.table.trim() : ''
  const payload =
    body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
      ? body.payload
      : {}

  if (!allowedTables.has(table)) {
    return NextResponse.json(
      { ok: false, message: '허용되지 않은 저장 대상입니다.' },
      { status: 400 }
    )
  }

  const result = await insertRow(table, {
    ...(payload as Record<string, unknown>),
    created_at: new Date().toISOString()
  })

  if (!result.ok) {
    return NextResponse.json({
      ok: true,
      mode: 'local-fallback',
      message: 'Supabase 저장은 아직 연결되지 않았지만, 화면 동작은 계속됩니다.',
      detail: result.error
    })
  }

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    data: result.data
  })
}
