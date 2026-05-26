import { NextResponse } from 'next/server'
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

async function readCheckins() {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) return []

  const response = await fetch(
    base + '/rest/v1/daily_care_checkins?select=*&order=occurred_at.desc&limit=50',
    {
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    }
  )

  if (!response.ok) return []

  const data = await response.json().catch(() => [])
  return Array.isArray(data) ? (data as DailyCareCheckin[]) : []
}

export async function GET() {
  const items = await readCheckins()
  const summary = buildDailyCareSummary(items)

  return NextResponse.json({
    ok: true,
    items,
    summary
  })
}
