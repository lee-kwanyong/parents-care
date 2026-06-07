import { NextResponse } from 'next/server'

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

async function rest(path: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      data: null as unknown,
      error: 'Supabase 환경변수가 없습니다.'
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

  const raw = await response.text()
  let parsed: unknown = null

  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = raw
  }

  return {
    ok: response.ok,
    data: parsed,
    error: response.ok ? null : parsed || raw
  }
}

function csvCell(value: unknown) {
  const raw = String(value ?? '')
  return '"' + raw.replace(/"/g, '""') + '"'
}

export async function GET() {
  const result = await rest('gov_recipients?select=*&order=created_at.desc&limit=1000')
  const rows = result.ok && Array.isArray(result.data) ? result.data as Record<string, unknown>[] : []

  const header = [
    'family_code',
    'recipient_name',
    'region_sigungu',
    'region_eupmyeondong',
    'household_type',
    'program_type',
    'assigned_org_name',
    'assigned_staff_name',
    'guardian_name',
    'risk_level',
    'consent_status',
    'service_status',
    'created_at'
  ]

  const csv = [
    header.join(','),
    ...rows.map((row) =>
      header.map((key) => csvCell(text(row[key]))).join(',')
    )
  ].join('\n')

  return new NextResponse('\ufeff' + csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="anbuworks-gov-recipients.csv"'
    }
  })
}
