import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type CheckStatus = 'pass' | 'warn' | 'fail'

type FlowCheck = {
  group: string
  label: string
  status: CheckStatus
  description: string
  href?: string
  detail?: unknown
  count?: number
  critical?: boolean
}

type RestResult = {
  ok: boolean
  status?: number
  data: any
  error: unknown | null
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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

function countOf(result: RestResult) {
  return result.ok && Array.isArray(result.data) ? result.data.length : 0
}

function envCheck(label: string, key: string, options?: { critical?: boolean; expected?: string }) {
  const value = process.env[key]
  const exists = Boolean(value && value !== 'change-me' && value !== 'replace-with-strong-random-string')
  const matches = options?.expected ? value === options.expected : true

  let status: CheckStatus = 'pass'

  if (!exists) {
    status = options?.critical ? 'fail' : 'warn'
  } else if (!matches) {
    status = 'warn'
  }

  return {
    group: '환경변수',
    label,
    status,
    description: exists
      ? `${key} 설정됨`
      : `${key} 설정이 필요합니다.`,
    critical: options?.critical || false,
    detail: {
      key,
      configured: exists,
      expected: options?.expected || null,
      current:
        key.includes('KEY') || key.includes('SECRET') || key.includes('CODE')
          ? exists
            ? '설정됨'
            : '없음'
          : value || null
    }
  } satisfies FlowCheck
}

async function tableCheck(input: {
  group: string
  label: string
  table: string
  href?: string
  critical?: boolean
}) {
  const result = await rest(`${input.table}?select=id&limit=1`)

  return {
    group: input.group,
    label: input.label,
    status: result.ok ? 'pass' : input.critical ? 'fail' : 'warn',
    description: result.ok
      ? `${input.table} 테이블 접근 가능`
      : `${input.table} 테이블 또는 권한을 확인해야 합니다.`,
    href: input.href,
    critical: input.critical || false,
    count: countOf(result),
    detail: result.ok ? null : result.error
  } satisfies FlowCheck
}

async function dataCheck(input: {
  group: string
  label: string
  path: string
  emptyStatus?: CheckStatus
  descriptionWhenHasData: string
  descriptionWhenEmpty: string
  href?: string
  critical?: boolean
}) {
  const result = await rest(input.path)
  const count = countOf(result)

  let status: CheckStatus = 'pass'

  if (!result.ok) {
    status = input.critical ? 'fail' : 'warn'
  } else if (count === 0) {
    status = input.emptyStatus || 'warn'
  }

  return {
    group: input.group,
    label: input.label,
    status,
    description: result.ok
      ? count > 0
        ? input.descriptionWhenHasData
        : input.descriptionWhenEmpty
      : '데이터 조회 중 오류가 발생했습니다.',
    href: input.href,
    critical: input.critical || false,
    count,
    detail: result.ok ? null : result.error
  } satisfies FlowCheck
}

function buildNextActions(checks: FlowCheck[]) {
  const actions: Array<{
    title: string
    description: string
    href: string
    priority: 'urgent' | 'high' | 'normal'
  }> = []

  const failedCritical = checks.filter((check) => check.status === 'fail' && check.critical)
  const warned = checks.filter((check) => check.status === 'warn')

  if (failedCritical.length > 0) {
    actions.push({
      title: '필수 테이블 또는 환경변수 오류를 먼저 해결하세요',
      description: `${failedCritical.length}개의 필수 점검 항목이 실패했습니다.`,
      href: '/deploy-readiness',
      priority: 'urgent'
    })
  }

  if (checks.some((check) => check.label === '보호자 접수 데이터' && check.status !== 'pass')) {
    actions.push({
      title: '보호자 안심케어 접수를 먼저 생성하세요',
      description: '/care-request에서 테스트 접수를 만들면 운영 흐름을 확인할 수 있습니다.',
      href: '/care-request',
      priority: 'high'
    })
  }

  if (checks.some((check) => check.label === '케어 케이스' && check.status !== 'pass')) {
    actions.push({
      title: '접수함에서 케어 케이스로 변환하세요',
      description: '/ops/intake-inbox에서 “케어 요청으로 정리”를 눌러 케이스를 생성합니다.',
      href: '/ops/intake-inbox',
      priority: 'high'
    })
  }

  if (checks.some((check) => check.label === '검증 매니저' && check.status !== 'pass')) {
    actions.push({
      title: '검증 완료 매니저를 1명 이상 만드세요',
      description: '/manager/apply와 /ops/manager-vetting에서 최초 검증을 완료합니다.',
      href: '/ops/manager-vetting',
      priority: 'high'
    })
  }

  if (checks.some((check) => check.label === '보호자 리포트' && check.status !== 'pass')) {
    actions.push({
      title: '매니저 현장 체크를 완료해 리포트를 생성하세요',
      description: '/manager/today에서 마지막 “리포트까지 완료했습니다”를 누르면 보호자 리포트가 생깁니다.',
      href: '/manager/today',
      priority: 'normal'
    })
  }

  if (checks.some((check) => check.label === '알림 큐' && check.status !== 'pass')) {
    actions.push({
      title: '테스트 알림을 생성하고 자동 발송을 확인하세요',
      description: '/ops/notifications에서 테스트 알림을 만들고 /ops/cron-health에서 실행합니다.',
      href: '/ops/notifications',
      priority: 'normal'
    })
  }

  if (actions.length === 0 && warned.length > 0) {
    actions.push({
      title: '경고 항목을 확인하세요',
      description: `${warned.length}개의 경고 항목이 있습니다. 실제 오픈 전 보강하면 좋습니다.`,
      href: '/ops',
      priority: 'normal'
    })
  }

  if (actions.length === 0) {
    actions.push({
      title: '핵심 운영 흐름이 준비됐습니다',
      description: '접수부터 리포트와 알림까지 주요 흐름이 연결되어 있습니다.',
      href: '/ops',
      priority: 'normal'
    })
  }

  return actions.slice(0, 8)
}

export async function GET() {
  const checks: FlowCheck[] = []

  checks.push(envCheck('Supabase URL', 'NEXT_PUBLIC_SUPABASE_URL', { critical: true }))
  checks.push(envCheck('Supabase Anon Key', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', { critical: true }))
  checks.push(envCheck('Supabase Service Role Key', 'SUPABASE_SERVICE_ROLE_KEY', { critical: true }))
  checks.push(envCheck('Cron Secret', 'CRON_SECRET', { critical: true }))
  checks.push(envCheck('알림 발송 모드', 'NOTIFICATION_SEND_MODE'))
  checks.push(envCheck('접근 보호 설정', 'ACCESS_GUARD_ENABLED'))

  const tableChecks = await Promise.all([
    tableCheck({
      group: '핵심 테이블',
      label: '보호자 접수 테이블',
      table: 'care_assisted_intake_requests',
      href: '/ops/intake-inbox',
      critical: true
    }),
    tableCheck({
      group: '핵심 테이블',
      label: '케어 케이스 테이블',
      table: 'care_cases',
      href: '/ops/care-cases',
      critical: true
    }),
    tableCheck({
      group: '핵심 테이블',
      label: '매칭 요청 테이블',
      table: 'care_manager_matching_requests',
      href: '/ops/manager-offers',
      critical: true
    }),
    tableCheck({
      group: '핵심 테이블',
      label: '매니저 프로필 테이블',
      table: 'care_manager_profiles',
      href: '/ops/manager-vetting',
      critical: true
    }),
    tableCheck({
      group: '핵심 테이블',
      label: '현장 배정 테이블',
      table: 'manager_field_assignments',
      href: '/manager/today',
      critical: true
    }),
    tableCheck({
      group: '핵심 테이블',
      label: '보호자 리포트 테이블',
      table: 'care_guardian_reports',
      href: '/child/reports',
      critical: true
    }),
    tableCheck({
      group: '알림/정산',
      label: '알림 큐 테이블',
      table: 'notification_outbox',
      href: '/ops/notifications',
      critical: true
    }),
    tableCheck({
      group: '알림/정산',
      label: '자동 발송 기록 테이블',
      table: 'notification_cron_runs',
      href: '/ops/cron-health',
      critical: false
    }),
    tableCheck({
      group: '알림/정산',
      label: '정산 테이블',
      table: 'care_manager_earnings',
      href: '/manager/earnings',
      critical: false
    })
  ])

  checks.push(...tableChecks)

  const dataChecks = await Promise.all([
    dataCheck({
      group: '운영 흐름',
      label: '보호자 접수 데이터',
      path: 'care_assisted_intake_requests?select=id,created_at&order=created_at.desc&limit=5',
      emptyStatus: 'warn',
      descriptionWhenHasData: '보호자 접수 데이터가 있습니다.',
      descriptionWhenEmpty: '아직 보호자 접수 데이터가 없습니다.',
      href: '/care-request',
      critical: false
    }),
    dataCheck({
      group: '운영 흐름',
      label: '케어 케이스',
      path: 'care_cases?select=id,created_at&order=created_at.desc&limit=5',
      emptyStatus: 'warn',
      descriptionWhenHasData: '케어 케이스가 생성되어 있습니다.',
      descriptionWhenEmpty: '아직 케어 케이스가 없습니다.',
      href: '/ops/care-cases',
      critical: false
    }),
    dataCheck({
      group: '운영 흐름',
      label: '검증 매니저',
      path: 'care_manager_profiles?select=id,manager_name&identity_verified=eq.true&profile_status=eq.active&limit=5',
      emptyStatus: 'warn',
      descriptionWhenHasData: '검증 완료 매니저가 있습니다.',
      descriptionWhenEmpty: '검증 완료 매니저가 아직 없습니다.',
      href: '/ops/manager-vetting',
      critical: false
    }),
    dataCheck({
      group: '운영 흐름',
      label: '매니저 일감 제안',
      path: 'care_manager_match_offers?select=id,offer_status&order=created_at.desc&limit=5',
      emptyStatus: 'warn',
      descriptionWhenHasData: '매니저 일감 제안 기록이 있습니다.',
      descriptionWhenEmpty: '매니저 일감 제안 기록이 없습니다.',
      href: '/ops/manager-offers',
      critical: false
    }),
    dataCheck({
      group: '운영 흐름',
      label: '현장 배정',
      path: 'manager_field_assignments?select=id,status&order=created_at.desc&limit=5',
      emptyStatus: 'warn',
      descriptionWhenHasData: '현장 배정 데이터가 있습니다.',
      descriptionWhenEmpty: '현장 배정 데이터가 없습니다.',
      href: '/manager/today',
      critical: false
    }),
    dataCheck({
      group: '운영 흐름',
      label: '보호자 리포트',
      path: 'care_guardian_reports?select=id,report_status&order=created_at.desc&limit=5',
      emptyStatus: 'warn',
      descriptionWhenHasData: '보호자 30초 리포트가 생성되어 있습니다.',
      descriptionWhenEmpty: '보호자 리포트가 아직 없습니다.',
      href: '/child/reports',
      critical: false
    }),
    dataCheck({
      group: '알림/정산',
      label: '알림 큐',
      path: 'notification_outbox?select=id,status&order=created_at.desc&limit=5',
      emptyStatus: 'warn',
      descriptionWhenHasData: '알림 큐 데이터가 있습니다.',
      descriptionWhenEmpty: '알림 큐 데이터가 없습니다.',
      href: '/ops/notifications',
      critical: false
    }),
    dataCheck({
      group: '알림/정산',
      label: '자동 발송 실행 기록',
      path: 'notification_cron_runs?select=id,run_status&order=created_at.desc&limit=5',
      emptyStatus: 'warn',
      descriptionWhenHasData: '자동 발송 실행 기록이 있습니다.',
      descriptionWhenEmpty: '자동 발송 실행 기록이 아직 없습니다.',
      href: '/ops/cron-health',
      critical: false
    }),
    dataCheck({
      group: '알림/정산',
      label: '정산 예정',
      path: 'care_manager_earnings?select=id,earning_status&order=created_at.desc&limit=5',
      emptyStatus: 'warn',
      descriptionWhenHasData: '정산 예정 데이터가 있습니다.',
      descriptionWhenEmpty: '정산 예정 데이터가 없습니다.',
      href: '/manager/earnings',
      critical: false
    })
  ])

  checks.push(...dataChecks)

  const passCount = checks.filter((check) => check.status === 'pass').length
  const warnCount = checks.filter((check) => check.status === 'warn').length
  const failCount = checks.filter((check) => check.status === 'fail').length
  const criticalFailCount = checks.filter((check) => check.status === 'fail' && check.critical).length
  const readinessScore = Math.round((passCount / Math.max(checks.length, 1)) * 100)

  const healthState =
    criticalFailCount > 0
      ? '배포 전 수정'
      : warnCount > 0
        ? '확인 필요'
        : '준비됨'

  return NextResponse.json({
    ok: true,
    healthState,
    readinessScore,
    summary: {
      total: checks.length,
      pass: passCount,
      warn: warnCount,
      fail: failCount,
      criticalFail: criticalFailCount
    },
    checks,
    nextActions: buildNextActions(checks),
    generatedAt: new Date().toISOString()
  })
}
