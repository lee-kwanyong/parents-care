import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AnyRow = Record<string, any>

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
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
      status: 500,
      data: null as any,
      error: 'Supabase 환경변수가 없습니다.'
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
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: parsed,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    status: response.status,
    data: parsed,
    error: null
  }
}

function pickTodayAssignment(assignments: AnyRow[]) {
  const active = assignments.find((item) => ['assigned', 'in_progress'].includes(item.status))
  if (active) return active

  const completed = assignments.find((item) => item.status === 'completed')
  if (completed) return completed

  return assignments[0] || null
}

export async function GET() {
  const result = await rest(
    'manager_field_assignments?select=*&order=created_at.desc&limit=20'
  )

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '부모님 오늘 화면 정보를 불러오지 못했습니다.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  const assignments = Array.isArray(result.data) ? result.data : []
  const assignment = pickTodayAssignment(assignments)

  return NextResponse.json({
    ok: true,
    assignment,
    assignments
  })
}
