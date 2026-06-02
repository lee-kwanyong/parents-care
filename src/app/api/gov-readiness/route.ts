import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Status = 'ready' | 'warning' | 'missing'

type CheckItem = {
  key: string
  label: string
  status: Status
  detail: string
  action?: string
}

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

type Row = Record<string, unknown>

function env(name: string) {
  return process.env[name] || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function mask(value: string) {
  if (!value) return ''
  if (value.length <= 8) return '설정됨'
  return value.slice(0, 4) + '...' + value.slice(-4)
}

function supabaseBaseUrl() {
  const raw = env('NEXT_PUBLIC_SUPABASE_URL')
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return env('SUPABASE_SERVICE_ROLE_KEY') || env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

async function rest(path: string): Promise<RestResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
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
    status: response.status,
    data: parsed,
    error: response.ok ? null : parsed || raw
  }
}

function score(items: CheckItem[]) {
  if (items.length === 0) return 0

  const points = items.reduce((sum, item) => {
    if (item.status === 'ready') return sum + 1
    if (item.status === 'warning') return sum + 0.5
    return sum
  }, 0)

  return Math.round((points / items.length) * 100)
}

function overallStatus(value: number): Status {
  if (value >= 85) return 'ready'
  if (value >= 60) return 'warning'
  return 'missing'
}

async function checkTable(key: string, label: string, table: string, action?: string): Promise<CheckItem> {
  const result = await rest(`${table}?select=*&limit=1`)

  if (result.ok) {
    return {
      key,
      label,
      status: 'ready',
      detail: '테이블 접근 가능'
    }
  }

  return {
    key,
    label,
    status: 'missing',
    detail: typeof result.error === 'string' ? result.error : JSON.stringify(result.error),
    action: action || 'Supabase SQL Editor에서 관련 migration SQL을 실행하세요.'
  }
}

async function complianceFlags() {
  const result = await rest('gov_compliance_records?select=*&order=created_at.desc&limit=200')

  const flags = {
    privacy: false,
    accessibility: false,
    loaded: false
  }

  if (!result.ok || !Array.isArray(result.data)) return flags

  flags.loaded = true

  for (const row of result.data as Row[]) {
    const type = text(row.record_type)
    const status = text(row.status)

    if (type === 'privacy-minimization' && status === 'done') {
      flags.privacy = true
    }

    if (type === 'senior-accessibility' && status === 'done') {
      flags.accessibility = true
    }
  }

  return flags
}

export async function GET() {
  const flags = await complianceFlags()

  const environmentChecks: CheckItem[] = [
    {
      key: 'supabase-url',
      label: 'Supabase URL',
      status: env('NEXT_PUBLIC_SUPABASE_URL') ? 'ready' : 'missing',
      detail: env('NEXT_PUBLIC_SUPABASE_URL') ? mask(env('NEXT_PUBLIC_SUPABASE_URL')) : 'NEXT_PUBLIC_SUPABASE_URL 없음',
      action: 'Vercel 환경변수에 NEXT_PUBLIC_SUPABASE_URL을 설정하세요.'
    },
    {
      key: 'supabase-anon',
      label: 'Supabase Anon Key',
      status: env('NEXT_PUBLIC_SUPABASE_ANON_KEY') ? 'ready' : 'missing',
      detail: env('NEXT_PUBLIC_SUPABASE_ANON_KEY') ? mask(env('NEXT_PUBLIC_SUPABASE_ANON_KEY')) : 'NEXT_PUBLIC_SUPABASE_ANON_KEY 없음',
      action: 'Vercel 환경변수에 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.'
    },
    {
      key: 'supabase-service-role',
      label: 'Supabase Service Role Key',
      status: env('SUPABASE_SERVICE_ROLE_KEY') ? 'ready' : 'warning',
      detail: env('SUPABASE_SERVICE_ROLE_KEY') ? '서버 API용 키 설정됨' : '없어도 일부 기능은 동작하지만 공공 운영실 안정성은 낮아집니다.',
      action: '서버 전용 환경변수 SUPABASE_SERVICE_ROLE_KEY를 설정하세요.'
    },
    {
      key: 'site-url',
      label: '서비스 URL',
      status: env('NEXT_PUBLIC_SITE_URL') || env('VERCEL_URL') ? 'ready' : 'warning',
      detail: env('NEXT_PUBLIC_SITE_URL') || env('VERCEL_URL') || '서비스 URL 명시 없음',
      action: 'NEXT_PUBLIC_SITE_URL=https://parents-care.net 설정을 권장합니다.'
    },
    {
      key: 'sms-api',
      label: 'SMS/알림 발송 환경',
      status: env('SOLAPI_API_KEY') && env('SOLAPI_API_SECRET') ? 'ready' : 'warning',
      detail: env('SOLAPI_API_KEY') && env('SOLAPI_API_SECRET') ? 'SOLAPI 환경변수 설정됨' : '알림 발송은 나중에 별도 검증 필요',
      action: 'SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER를 확인하세요.'
    }
  ]

  const databaseChecks = await Promise.all([
    checkTable('daily-care-checkins', '부모님 안부 저장', 'daily_care_checkins', '20260602_anbu_fingerprint_report.sql 또는 관련 SQL 실행'),
    checkTable('family-links', '부모님·보호자 연결', 'anbu_family_links', '부모님 연결코드 SQL 실행'),
    checkTable('family-actions', '가족 실행 보드', 'family_action_tasks', '20260602_family_action_board.sql 실행'),
    checkTable('family-invites', '다른 가족 초대', 'family_member_invites', '20260602_family_member_invites.sql 실행'),
    checkTable('gov-recipients', '지자체 대상자 관리', 'gov_recipients', '20260602_gov_rnd_platform.sql 실행'),
    checkTable('gov-cases', '지자체 사례관리', 'gov_case_notes', '20260602_gov_rnd_platform.sql 실행'),
    checkTable('gov-audit', '감사로그', 'gov_audit_logs', '20260602_gov_rnd_platform.sql 실행'),
    checkTable('iot-devices', 'IoT 장비 관리', 'iot_devices', '20260602_gov_iot_rnd_package.sql 실행'),
    checkTable('iot-events', 'IoT 이벤트 관리', 'iot_device_events', '20260602_gov_iot_rnd_package.sql 실행'),
    checkTable('pilot-sites', '실증 지자체 관리', 'gov_pilot_sites', '20260602_gov_iot_rnd_package.sql 실행'),
    checkTable('submission-packages', '지자체 제출 패키지 저장', 'gov_submission_packages', '20260602_gov_submission_package.sql 실행'),
    checkTable('compliance-records', '공공 컴플라이언스 기록', 'gov_compliance_records', '20260603_gov_compliance_records.sql 실행')
  ])

  const publicSectorChecks: CheckItem[] = [
    {
      key: 'privacy-minimization',
      label: '개인정보 최소수집 원칙',
      status: flags.privacy ? 'ready' : 'warning',
      detail: flags.privacy
        ? '동의·최소수집 검토 완료 기록이 저장되었습니다.'
        : '주민등록번호 없이 가족코드·동의 기반 구조로 설계되어 있으나 제출 전 동의문 검토 기록이 필요합니다.',
      action: flags.privacy ? undefined : '/gov/compliance에서 개인정보 최소수집 검토 완료 기록을 남기세요.'
    },
    {
      key: 'accessibility',
      label: '고령친화 UI·접근성',
      status: flags.accessibility ? 'ready' : 'warning',
      detail: flags.accessibility
        ? '고령친화 UI·접근성 점검 완료 기록이 저장되었습니다.'
        : '부모님 화면은 큰 버튼·큰 글씨 중심이나 실제 고령자 테스트 기록이 필요합니다.',
      action: flags.accessibility ? undefined : '/gov/compliance에서 고령친화 UI 점검 완료 기록을 남기세요.'
    },
    {
      key: 'audit-log',
      label: '접근·처리 로그',
      status: databaseChecks.find((item) => item.key === 'gov-audit')?.status || 'missing',
      detail: '지자체 운영실에서 사례관리·제출 패키지·컴플라이언스 기록 로그를 남길 수 있습니다.',
      action: '감사로그 테이블과 운영자 권한 정책을 강화하세요.'
    },
    {
      key: 'safe-wording',
      label: '공공 제안용 표현 보정',
      status: 'ready',
      detail: '오탐률·119연계·조달연계 표현을 목표·검증·가능성 중심으로 보정하는 표가 준비되어 있습니다.'
    },
    {
      key: 'print-package',
      label: 'PDF 제출본',
      status: 'ready',
      detail: '/gov/submission/print에서 A4 제출본을 PDF로 저장할 수 있습니다.'
    }
  ]

  const routeTargets = [
    '/',
    '/parent/login',
    '/parent/today',
    '/child/dashboard',
    '/family/invite',
    '/family/join',
    '/family/actions',
    '/gov/dashboard',
    '/gov/recipients',
    '/gov/cases',
    '/gov/reports',
    '/gov/audit',
    '/gov/export',
    '/gov/iot',
    '/gov/proposal',
    '/gov/submission',
    '/gov/submission/print',
    '/gov/compliance',
    '/gov/readiness'
  ]

  const allChecks = [...environmentChecks, ...databaseChecks, ...publicSectorChecks]
  const readinessScore = score(allChecks)

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    readinessScore,
    status: overallStatus(readinessScore),
    compliance: flags,
    sections: {
      environmentChecks,
      databaseChecks,
      publicSectorChecks
    },
    routeTargets,
    manualScenarios: [
      '보호자 로그인 후 부모님 연결코드 생성',
      '부모님 코드 + 휴대폰 뒤 4자리로 연결',
      '부모님이 아침 식사·아침약·몸 상태 입력',
      '자녀 /child/dashboard에서 안부지문 리포트 확인',
      '가족 /family/actions에서 확인 완료 처리',
      '지자체 /gov/dashboard에서 위험·성과 지표 확인',
      '/gov/compliance에서 개인정보·고령친화 점검 기록',
      '/gov/submission에서 제안서 패키지 생성',
      '/gov/submission/print에서 PDF 저장'
    ],
    recommendedNextActions:
      readinessScore >= 85
        ? [
            '실제 부모님·보호자 계정으로 전체 시나리오 테스트',
            '지자체 제안 PDF 최종 저장',
            '제안 메일 발송 기관 리스트 정리'
          ]
        : [
            'missing 항목의 Supabase SQL 실행',
            'Vercel 환경변수 확인',
            '/gov/compliance에서 공공 제출 수동 증빙 기록',
            '주요 페이지 접근 테스트',
            '제출용 문서 PDF 생성 확인'
          ]
  })
}
