import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const requiredTables = [
  {
    name: 'care_parent_invites',
    label: '부모님 6자리 초대코드'
  },
  {
    name: 'care_assisted_intake_requests',
    label: '안심케어 간편 접수'
  },
  {
    name: 'care_manager_profiles',
    label: '케어파트너 프로필'
  },
  {
    name: 'care_manager_matching_requests',
    label: '케어파트너 매칭 요청'
  },
  {
    name: 'care_manager_match_offers',
    label: '케어파트너 후보 제안'
  },
  {
    name: 'manager_field_assignments',
    label: '현장 배정'
  },
  {
    name: 'care_guardian_reports',
    label: '보호자 리포트'
  },
  {
    name: 'care_partner_reviews',
    label: '케어파트너 후기'
  },
  {
    name: 'care_guardian_match_decisions',
    label: '보호자 매칭 선택'
  },
  {
    name: 'care_auth_profiles',
    label: '로그인 프로필'
  }
]

const routeChecks = [
  { path: '/', label: '홈' },
  { path: '/app', label: '메뉴' },
  { path: '/signup/guardian', label: '보호자 가입' },
  { path: '/parent/login', label: '부모님 6자리 접속' },
  { path: '/care-request', label: '안심케어 신청' },
  { path: '/child/matching', label: '보호자 매칭 확인' },
  { path: '/child/reports', label: '보호자 리포트' },
  { path: '/signup/manager', label: '케어파트너 지원' },
  { path: '/manager', label: '케어파트너 화면' },
  { path: '/ops', label: '운영실' },
  { path: '/ops/intake', label: '운영실 접수함' },
  { path: '/ops/matching', label: '운영실 매칭관리' },
  { path: '/ops/notifications', label: '운영실 알림센터' },
  { path: '/care-scope', label: '케어 범위' },
  { path: '/trust', label: '신뢰 기준' }
]

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function anonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://parents-care.net').replace(/\/$/, '')
}

function envCheck(name: string, value: string, required = true) {
  return {
    name,
    ok: required ? Boolean(value) : true,
    configured: Boolean(value),
    required,
    valuePreview: value ? '설정됨' : '없음'
  }
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey() || anonKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null as any,
      error: 'Supabase URL 또는 API Key가 없습니다.'
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

async function checkTable(table: { name: string; label: string }) {
  const result = await rest(`${table.name}?select=id&limit=1`)

  return {
    ...table,
    ok: result.ok,
    status: result.status,
    message: result.ok ? '정상' : '테이블 없음 또는 접근 오류',
    detail: result.ok ? null : result.error
  }
}

export async function GET(request: NextRequest) {
  const role = request.cookies.get('pc_role')?.value || ''

  if (role !== 'admin') {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 관리자 접속이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const envChecks = [
    envCheck('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
    envCheck('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
    envCheck('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY || ''),
    envCheck('NEXT_PUBLIC_SITE_URL', process.env.NEXT_PUBLIC_SITE_URL || '', false),
    envCheck('PARENTS_CARE_ADMIN_CODE', process.env.PARENTS_CARE_ADMIN_CODE || '', false)
  ]

  const tableChecks = await Promise.all(requiredTables.map(checkTable))

  const supabaseOk = Boolean(supabaseBaseUrl() && (serviceKey() || anonKey()))
  const envOk = envChecks.filter((item) => item.required).every((item) => item.ok)
  const tablesOk = tableChecks.every((item) => item.ok)

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    summary: {
      envOk,
      supabaseOk,
      tablesOk,
      allOk: envOk && supabaseOk && tablesOk
    },
    siteUrl: siteUrl(),
    envChecks,
    tableChecks,
    routeChecks: routeChecks.map((item) => ({
      ...item,
      url: siteUrl() + item.path
    })),
    checklist: [
      '보호자 Google 로그인 테스트',
      '보호자 Kakao 로그인 테스트',
      '이메일 회원가입 테스트',
      '부모님 6자리 코드 생성',
      '부모님 6자리 코드 접속',
      '안심케어 신청',
      '운영실 접수함 확인',
      '케어파트너 후보 생성',
      '보호자 매칭 확인',
      '케어파트너 수락',
      '부모님 오늘 안심 화면 확인',
      '보호자 리포트 확인',
      '후기 저장',
      '운영실 알림센터 문구 복사'
    ]
  })
}
