export type DeployCheckStatus = 'pass' | 'warning' | 'fail' | 'optional'

export type DeployCheck = {
  key: string
  label: string
  status: DeployCheckStatus
  message: string
  group: 'public_env' | 'server_secret' | 'supabase' | 'storage' | 'optional_provider' | 'vercel' | 'security'
}

export type DeployReadinessSummary = {
  readinessState: '배포 가능' | '확인 필요' | '배포 전 수정'
  total: number
  pass: number
  warning: number
  fail: number
  optional: number
  nextActions: string[]
}

export const publicEnvKeys = [
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
] as const

export const serverSecretKeys = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'CRON_SECRET'
] as const

export const optionalProviderKeys = [
  'KAKAO_ALIMTALK_API_KEY',
  'KAKAO_CHANNEL_ID',
  'GOOGLE_MAPS_API_KEY',
  'SERPAPI_API_KEY',
  'PAYMENT_PROVIDER_SECRET',
  'ESIGN_PROVIDER_SECRET'
] as const

export function normalizeSupabaseUrl(raw: string) {
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function isMissing(value: string | undefined | null) {
  return !value || value.trim().length === 0 || value.trim() === 'optional'
}

function secretLooksWeak(key: string, value: string | undefined | null) {
  const normalizedValue = value ?? ''

  if (isMissing(normalizedValue)) return false

  if (key === 'CRON_SECRET') {
    return normalizedValue === 'change-me' || normalizedValue.length < 16
  }

  return false
}

export function maskPresence(value: string | undefined | null) {
  if (isMissing(value)) return '없음'
  return '설정됨'
}

export function buildDeployEnvChecks(env: Record<string, string | undefined>): DeployCheck[] {
  const checks: DeployCheck[] = []

  for (const key of publicEnvKeys) {
    const value = env[key]
    checks.push({
      key,
      label: key,
      group: 'public_env',
      status: isMissing(value) ? 'fail' : 'pass',
      message: isMissing(value)
        ? '필수 공개 환경변수가 없습니다.'
        : `공개 환경변수 ${maskPresence(value)}`
    })
  }

  for (const key of serverSecretKeys) {
    const value = env[key]
    checks.push({
      key,
      label: key,
      group: 'server_secret',
      status: isMissing(value) ? 'fail' : secretLooksWeak(key, value) ? 'warning' : 'pass',
      message: isMissing(value)
        ? '필수 서버 전용 시크릿이 없습니다.'
        : secretLooksWeak(key, value)
          ? '값이 너무 단순합니다. 배포 전 강한 값으로 변경하세요.'
          : `서버 전용 시크릿 ${maskPresence(value)}`
    })
  }

  for (const key of optionalProviderKeys) {
    const value = env[key]
    checks.push({
      key,
      label: key,
      group: 'optional_provider',
      status: isMissing(value) ? 'optional' : 'pass',
      message: isMissing(value)
        ? '배포 직전 실제 연동 시 설정하면 됩니다.'
        : `선택 연동값 ${maskPresence(value)}`
    })
  }

  const rawSupabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (rawSupabaseUrl.includes('/rest/v1')) {
    checks.push({
      key: 'NEXT_PUBLIC_SUPABASE_URL_FORMAT',
      label: 'Supabase URL 형식',
      group: 'supabase',
      status: 'warning',
      message: 'NEXT_PUBLIC_SUPABASE_URL은 /rest/v1 이 붙은 주소보다 프로젝트 기본 URL을 권장합니다.'
    })
  } else if (!isMissing(rawSupabaseUrl)) {
    checks.push({
      key: 'NEXT_PUBLIC_SUPABASE_URL_FORMAT',
      label: 'Supabase URL 형식',
      group: 'supabase',
      status: 'pass',
      message: 'Supabase 프로젝트 기본 URL 형식입니다.'
    })
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL || ''
  const vercelEnv = env.VERCEL_ENV || 'local'

  if (vercelEnv === 'production' && appUrl.includes('localhost')) {
    checks.push({
      key: 'NEXT_PUBLIC_APP_URL_PRODUCTION',
      label: 'Production APP URL',
      group: 'vercel',
      status: 'fail',
      message: 'Production에서는 localhost가 아닌 실제 배포 도메인을 사용해야 합니다.'
    })
  } else if (appUrl.includes('localhost')) {
    checks.push({
      key: 'NEXT_PUBLIC_APP_URL_LOCAL',
      label: 'Local APP URL',
      group: 'vercel',
      status: 'warning',
      message: '로컬 개발용 URL입니다. Vercel Production에는 실제 도메인을 넣으세요.'
    })
  } else if (!isMissing(appUrl)) {
    checks.push({
      key: 'NEXT_PUBLIC_APP_URL_DOMAIN',
      label: 'APP URL',
      group: 'vercel',
      status: 'pass',
      message: 'APP URL이 배포 도메인 형식입니다.'
    })
  }

  if (env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SERVICE_ROLE_KEY) {
    checks.push({
      key: 'SERVICE_ROLE_PUBLIC_EXPOSURE',
      label: 'Service Role 공개 노출',
      group: 'security',
      status: 'fail',
      message: 'Service Role Key에 NEXT_PUBLIC_ 접두사가 붙어 있습니다. 즉시 제거하세요.'
    })
  } else {
    checks.push({
      key: 'SERVICE_ROLE_PUBLIC_EXPOSURE',
      label: 'Service Role 공개 노출',
      group: 'security',
      status: 'pass',
      message: 'Service Role Key가 공개 환경변수 이름으로 노출되지 않았습니다.'
    })
  }

  checks.push({
    key: 'VERCEL_ENV',
    label: 'Vercel Environment',
    group: 'vercel',
    status: 'pass',
    message: `현재 환경: ${vercelEnv}`
  })

  return checks
}

export function buildDeploySummary(checks: DeployCheck[]): DeployReadinessSummary {
  const fail = checks.filter((item) => item.status === 'fail').length
  const warning = checks.filter((item) => item.status === 'warning').length
  const pass = checks.filter((item) => item.status === 'pass').length
  const optional = checks.filter((item) => item.status === 'optional').length

  const readinessState =
    fail > 0
      ? '배포 전 수정'
      : warning > 0
        ? '확인 필요'
        : '배포 가능'

  const nextActions: string[] = []

  if (checks.some((item) => item.status === 'fail' && item.group === 'server_secret')) {
    nextActions.push('Vercel Environment Variables에 서버 전용 시크릿을 추가하세요.')
  }

  if (checks.some((item) => item.key === 'SERVICE_ROLE_PUBLIC_EXPOSURE' && item.status === 'fail')) {
    nextActions.push('NEXT_PUBLIC_ 접두사가 붙은 Service Role Key를 즉시 제거하세요.')
  }

  if (checks.some((item) => item.key === 'NEXT_PUBLIC_SUPABASE_URL_FORMAT' && item.status === 'warning')) {
    nextActions.push('NEXT_PUBLIC_SUPABASE_URL을 Supabase 프로젝트 기본 URL로 바꾸세요.')
  }

  if (checks.some((item) => item.key === 'NEXT_PUBLIC_APP_URL_PRODUCTION' && item.status === 'fail')) {
    nextActions.push('Production APP URL을 실제 Vercel 도메인으로 바꾸세요.')
  }

  if (checks.some((item) => item.status === 'warning' && item.key === 'CRON_SECRET')) {
    nextActions.push('CRON_SECRET을 강한 랜덤 문자열로 변경하세요.')
  }

  if (nextActions.length === 0) {
    nextActions.push('typecheck와 build를 통과한 뒤 Vercel 환경변수를 등록하세요.')
  }

  return {
    readinessState,
    total: checks.length,
    pass,
    warning,
    fail,
    optional,
    nextActions: nextActions.slice(0, 5)
  }
}
