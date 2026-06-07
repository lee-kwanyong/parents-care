import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
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

function rows(result: { ok: boolean; data: any }) {
  return result.ok && Array.isArray(result.data) ? result.data : []
}

export async function GET() {
  const [
    intakesResult,
    requestsResult,
    offersResult,
    assignmentsResult,
    reportsResult,
    invitesResult,
    decisionsResult
  ] = await Promise.all([
    rest('care_assisted_intake_requests?select=*&order=created_at.desc&limit=80'),
    rest('care_manager_matching_requests?select=*&order=created_at.desc&limit=80'),
    rest('care_manager_match_offers?select=*&order=created_at.desc&limit=160'),
    rest('manager_field_assignments?select=*&order=created_at.desc&limit=80'),
    rest('care_guardian_reports?select=*&order=created_at.desc&limit=80'),
    rest('care_parent_invites?select=*&order=created_at.desc&limit=80'),
    rest('care_guardian_match_decisions?select=*&order=created_at.desc&limit=80')
  ])

  return NextResponse.json({
    ok: true,
    intakes: rows(intakesResult),
    requests: rows(requestsResult),
    offers: rows(offersResult),
    assignments: rows(assignmentsResult),
    reports: rows(reportsResult),
    invites: rows(invitesResult),
    decisions: rows(decisionsResult),
    warnings: [
      !intakesResult.ok ? '간편 접수 목록을 불러오지 못했습니다.' : '',
      !requestsResult.ok ? '매칭 요청 목록을 불러오지 못했습니다.' : '',
      !offersResult.ok ? '후보 제안 목록을 불러오지 못했습니다.' : '',
      !assignmentsResult.ok ? '배정 목록을 불러오지 못했습니다.' : '',
      !reportsResult.ok ? '보호자 리포트 목록을 불러오지 못했습니다.' : '',
      !invitesResult.ok ? '부모님 초대코드 목록을 불러오지 못했습니다.' : '',
      !decisionsResult.ok ? '보호자 매칭 결정 목록을 불러오지 못했습니다.' : ''
    ].filter(Boolean)
  })
}
