import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
      data: parsed,
      error: parsed || bodyText || response.statusText
    }
  }

  return {
    ok: true,
    data: parsed,
    error: null
  }
}

export async function GET() {
  const [casesResult, tasksResult, matchingResult] = await Promise.all([
    rest('care_cases?select=*&order=created_at.desc&limit=100'),
    rest('care_case_tasks?select=*&order=sort_order.asc,created_at.asc&limit=500'),
    rest('care_manager_matching_requests?select=*&order=created_at.desc&limit=200')
  ])

  if (!casesResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '케어 케이스를 불러오지 못했습니다.',
        detail: casesResult.error
      },
      { status: 500 }
    )
  }

  const cases = Array.isArray(casesResult.data) ? casesResult.data : []
  const tasks = tasksResult.ok && Array.isArray(tasksResult.data) ? tasksResult.data : []
  const matchingRequests = matchingResult.ok && Array.isArray(matchingResult.data) ? matchingResult.data : []

  return NextResponse.json({
    ok: true,
    cases,
    tasks,
    matchingRequests,
    summary: {
      total: cases.length,
      created: cases.filter((item: any) => item.case_status === 'created').length,
      inProgress: cases.filter((item: any) => item.case_status === 'in_progress').length,
      completed: cases.filter((item: any) => item.case_status === 'completed').length,
      matchingRequests: matchingRequests.length
    }
  })
}
