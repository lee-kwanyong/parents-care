import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const requiredTables = [
  'anbu_family_links',
  'daily_care_checkins',
  'anbu_routines',
  'anbu_weekly_reports',
  'anbu_partner_applications',
  'anbu_privacy_consents'
]

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

async function checkTable(table: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      table,
      ok: false,
      message: '환경변수 없음'
    }
  }

  try {
    const response = await fetch(base + '/rest/v1/' + table + '?select=id&limit=1', {
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    const body = await response.text()

    return {
      table,
      ok: response.ok,
      status: response.status,
      message: response.ok ? '정상' : body.slice(0, 300)
    }
  } catch (error) {
    return {
      table,
      ok: false,
      message: error instanceof Error ? error.message : '확인 실패'
    }
  }
}

export async function GET() {
  const hasUrl = Boolean(supabaseBaseUrl())
  const hasServiceRole = Boolean(serviceKey())

  const tables = await Promise.all(requiredTables.map(checkTable))
  const allTablesOk = tables.every((item) => item.ok)

  return NextResponse.json({
    ok: hasUrl && hasServiceRole && allTablesOk,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: hasUrl,
      SUPABASE_SERVICE_ROLE_KEY: hasServiceRole
    },
    tables,
    requiredTables
  })
}
