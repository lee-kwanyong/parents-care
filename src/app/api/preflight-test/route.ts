import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

type RestResult = {
  ok: boolean
  status: number
  data: unknown
  error: unknown
}

type TestStatus = 'pass' | 'warn' | 'fail' | 'skip'

type TestResult = {
  key: string
  group: string
  title: string
  status: TestStatus
  message: string
  durationMs: number
  detail?: unknown
  critical?: boolean
}

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'OPS_SESSION_TOKEN',
  'ops_session_token',
  'ops_session'
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function opsPassword() {
  return process.env.ANBU_OPS_PASSWORD || process.env.OPS_PASSWORD || process.env.ADMIN_CODE || '530868'
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || process.env.OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
}

function tokenFor(password: string) {
  return createHash('sha256').update(password + ':' + authSecret()).digest('hex')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function isOpsAuthed(request: NextRequest) {
  const password = opsPassword()
  if (!password) return false

  const expected = tokenFor(password)

  for (const name of OPS_COOKIE_NAMES) {
    const token = request.cookies.get(name)?.value || ''
    if (!token) continue

    try {
      if (safeEqual(token, expected)) return true
    } catch {
      continue
    }
  }

  return false
}

function hasSecret(request: NextRequest) {
  const secrets = [
    process.env.CRON_SECRET || '',
    process.env.OPS_AUTOPILOT_SECRET || '',
    process.env.RESPONSE_ESCALATION_SECRET || ''
  ].filter(Boolean)

  if (secrets.length === 0) return false

  const queryToken = text(request.nextUrl.searchParams.get('token'))
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')

  return secrets.includes(queryToken) || secrets.includes(auth)
}

function authorized(request: NextRequest) {
  return isOpsAuthed(request) || hasSecret(request)
}

function responseStatus(result: unknown) {
  const maybe = result as { ok?: boolean; status?: number }
  return maybe.ok ? 200 : maybe.status || 500
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function hasEnv(name: string) {
  return Boolean(process.env[name])
}

async function rest(path: string, init?: RequestInit): Promise<RestResult> {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: 'SUPABASE_SERVICE_ROLE_KEY가 필요합니다.'
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

function rows(result: RestResult): Row[] {
  return result.ok && Array.isArray(result.data) ? result.data as Row[] : []
}

async function insertRows(table: string, values: Row[]) {
  if (values.length === 0) {
    return {
      ok: true,
      status: 200,
      data: [],
      error: null
    } as RestResult
  }

  return rest(table, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(values)
  })
}

async function deleteWhere(table: string, query: string) {
  return rest(`${table}?${query}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' }
  })
}

async function internalFetchJson(request: NextRequest, path: string, init?: RequestInit) {
  const url = new URL(path, request.nextUrl.origin)
  const secret = process.env.CRON_SECRET || process.env.OPS_AUTOPILOT_SECRET || process.env.RESPONSE_ESCALATION_SECRET || ''

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: secret ? 'Bearer ' + secret : '',
      ...(init?.headers || {})
    },
    cache: 'no-store'
  })

  const raw = await response.text()
  let data: unknown = raw

  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    data = raw
  }

  return {
    ok: response.ok,
    status: response.status,
    data
  }
}

async function publicFetch(request: NextRequest, path: string) {
  const url = new URL(path, request.nextUrl.origin)
  const response = await fetch(url.toString(), { cache: 'no-store' })

  return {
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get('content-type') || ''
  }
}

async function runTest(
  results: TestResult[],
  input: {
    key: string
    group: string
    title: string
    critical?: boolean
    test: () => Promise<{ status: TestStatus; message: string; detail?: unknown }>
  }
) {
  const start = Date.now()

  try {
    const output = await input.test()

    results.push({
      key: input.key,
      group: input.group,
      title: input.title,
      status: output.status,
      message: output.message,
      detail: output.detail,
      durationMs: Date.now() - start,
      critical: input.critical
    })
  } catch (error) {
    results.push({
      key: input.key,
      group: input.group,
      title: input.title,
      status: 'fail',
      message: error instanceof Error ? error.message : '테스트 중 오류가 발생했습니다.',
      durationMs: Date.now() - start,
      critical: input.critical,
      detail: error
    })
  }
}

function extractTokenFromTargetUrl(value: unknown) {
  const raw = text(value)
  if (!raw) return ''

  try {
    const url = raw.startsWith('http') ? new URL(raw) : new URL(raw, 'https://parents-care.net')
    return url.searchParams.get('token') || ''
  } catch {
    return ''
  }
}

function computeMetrics(results: TestResult[]) {
  const total = results.length
  const pass = results.filter((item) => item.status === 'pass').length
  const warn = results.filter((item) => item.status === 'warn').length
  const fail = results.filter((item) => item.status === 'fail').length
  const skip = results.filter((item) => item.status === 'skip').length
  const criticalFail = results.filter((item) => item.critical && item.status === 'fail').length
  const criticalWarn = results.filter((item) => item.critical && item.status === 'warn').length
  const score = total ? Math.round((pass / total) * 100) : 0

  return {
    total,
    pass,
    warn,
    fail,
    skip,
    criticalFail,
    criticalWarn,
    score,
    ready: fail === 0 && criticalFail === 0 && score >= 80
  }
}

async function cleanup(created: Row[]) {
  const cleanupResults = []

  const requestIds = created.filter((item) => item.kind === 'request').map((item) => text(item.id)).filter(Boolean)
  const providerIds = created.filter((item) => item.kind === 'provider').map((item) => text(item.id)).filter(Boolean)

  for (const requestId of requestIds) {
    cleanupResults.push({
      table: 'care_response_matches',
      requestId,
      result: await deleteWhere('care_response_matches', 'request_id=eq.' + encodeURIComponent(requestId))
    })

    cleanupResults.push({
      table: 'notification_outbox',
      requestId,
      result: await deleteWhere('notification_outbox', 'source_key=like.' + encodeURIComponent('*' + requestId + '*'))
    })

    cleanupResults.push({
      table: 'care_response_updates',
      requestId,
      result: await deleteWhere('care_response_updates', 'request_id=eq.' + encodeURIComponent(requestId))
    })

    cleanupResults.push({
      table: 'ops_autopilot_logs',
      requestId,
      result: await deleteWhere('ops_autopilot_logs', 'request_id=eq.' + encodeURIComponent(requestId))
    })

    cleanupResults.push({
      table: 'care_state_transition_logs',
      requestId,
      result: await deleteWhere('care_state_transition_logs', 'request_id=eq.' + encodeURIComponent(requestId))
    })

    cleanupResults.push({
      table: 'care_response_requests',
      requestId,
      result: await deleteWhere('care_response_requests', 'id=eq.' + encodeURIComponent(requestId))
    })
  }

  for (const providerId of providerIds) {
    cleanupResults.push({
      table: 'care_providers',
      providerId,
      result: await deleteWhere('care_providers', 'id=eq.' + encodeURIComponent(providerId))
    })
  }

  return cleanupResults.map((item) => ({
    ...item,
    result: {
      ok: item.result.ok,
      status: item.result.status,
      error: item.result.error,
      count: rows(item.result).length
    }
  }))
}

async function runFullPreflight(request: NextRequest, body: Row) {
  const cleanupEnabled = body.cleanup !== false
  const created: Row[] = []
  const results: TestResult[] = []
  const runId = 'QA' + Date.now().toString().slice(-8)
  const qaFamilyCode = 'QA' + String(Math.floor(100000 + Math.random() * 900000))
  const qaArea = 'QA실증권역'
  let urgentRequestId = ''
  let providerId = ''
  let token = ''

  await runTest(results, {
    key: 'env-supabase',
    group: '환경',
    title: 'Supabase service role',
    critical: true,
    test: async () => {
      const ok = Boolean(supabaseBaseUrl() && serviceKey())
      return {
        status: ok ? 'pass' : 'fail',
        message: ok ? 'Supabase URL과 service role key가 설정되어 있습니다.' : 'NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.'
      }
    }
  })

  await runTest(results, {
    key: 'env-ops',
    group: '환경',
    title: '운영실 인증·자동운영 secret',
    critical: true,
    test: async () => {
      const missing = [
        opsPassword() ? '' : 'ANBU_OPS_PASSWORD/OPS_PASSWORD',
        hasEnv('CRON_SECRET') ? '' : 'CRON_SECRET',
        hasEnv('OPS_AUTOPILOT_SECRET') ? '' : 'OPS_AUTOPILOT_SECRET',
        hasEnv('RESPONSE_ESCALATION_SECRET') ? '' : 'RESPONSE_ESCALATION_SECRET'
      ].filter(Boolean)

      return {
        status: missing.length === 0 ? 'pass' : 'warn',
        message: missing.length === 0 ? '운영실 인증과 자동운영 secret이 준비되었습니다.' : '누락: ' + missing.join(', ')
      }
    }
  })

  await runTest(results, {
    key: 'env-solapi',
    group: '환경',
    title: 'SOLAPI 문자 환경변수',
    critical: true,
    test: async () => {
      const missing = [
        hasEnv('SOLAPI_API_KEY') ? '' : 'SOLAPI_API_KEY',
        hasEnv('SOLAPI_API_SECRET') ? '' : 'SOLAPI_API_SECRET',
        hasEnv('SOLAPI_SENDER') ? '' : 'SOLAPI_SENDER'
      ].filter(Boolean)

      return {
        status: missing.length === 0 ? 'pass' : 'warn',
        message: missing.length === 0 ? 'SOLAPI 환경변수가 있습니다. 실제 발송은 별도 수동 테스트가 필요합니다.' : '누락: ' + missing.join(', ')
      }
    }
  })

  const publicPaths = [
    '/mobile',
    '/mobile/parent',
    '/mobile/guardian',
    '/mobile/provider',
    '/proposal',
    '/response/about',
    '/manifest.webmanifest',
    '/anbu-sw.js',
    '/anbu-icon.svg'
  ]

  for (const path of publicPaths) {
    await runTest(results, {
      key: 'public-' + path.replace(/[^a-z0-9]+/gi, '-'),
      group: '공개/PWA',
      title: path,
      critical: path.startsWith('/mobile') || path.includes('manifest'),
      test: async () => {
        const result = await publicFetch(request, path)

        return {
          status: result.ok ? 'pass' : 'fail',
          message: result.ok ? `HTTP ${result.status} 정상` : `HTTP ${result.status} 오류`,
          detail: result
        }
      }
    })
  }

  const dbTables = [
    'care_response_requests',
    'care_response_matches',
    'care_providers',
    'notification_outbox',
    'ops_preflight_test_runs',
    'ops_control_center_snapshots',
    'ops_security_hardening_runs',
    'ops_state_machine_runs',
    'ops_pilot_qa_runs',
    'ops_one_page_proposals',
    'ops_outreach_targets'
  ]

  for (const table of dbTables) {
    await runTest(results, {
      key: 'db-' + table,
      group: 'DB',
      title: table,
      critical: ['care_response_requests', 'notification_outbox', 'care_providers'].includes(table),
      test: async () => {
        const result = await rest(`${table}?select=*&limit=1`)

        return {
          status: result.ok ? 'pass' : 'fail',
          message: result.ok ? 'service role 조회 성공' : '조회 실패',
          detail: result.error || { status: result.status }
        }
      }
    })
  }

  const opsApiPaths = [
    '/api/ops-control-center',
    '/api/ops-security-center',
    '/api/ops-state-machine',
    '/api/pilot-qa',
    '/api/one-page-proposal',
    '/api/outreach-crm'
  ]

  for (const path of opsApiPaths) {
    await runTest(results, {
      key: 'api-' + path.replace(/[^a-z0-9]+/gi, '-'),
      group: '운영실 API',
      title: path,
      critical: true,
      test: async () => {
        const result = await internalFetchJson(request, path)

        const data = result.data as { ok?: boolean; message?: string }

        return {
          status: result.ok && data?.ok !== false ? 'pass' : 'fail',
          message: result.ok ? 'API 응답 성공' : `HTTP ${result.status}`,
          detail: result.data
        }
      }
    })
  }

  await runTest(results, {
    key: 'mobile-signal-ok',
    group: '부모님 앱',
    title: '부모님 모바일 신호 접수',
    critical: true,
    test: async () => {
      const result = await internalFetchJson(request, '/api/mobile-signal', {
        method: 'POST',
        body: JSON.stringify({
          signalType: 'ok',
          familyCode: qaFamilyCode,
          parentName: 'QA부모님',
          guardianName: 'QA보호자',
          guardianPhone: '',
          serviceArea: qaArea,
          addressHint: 'QA 테스트'
        })
      })

      const data = result.data as { ok?: boolean; request?: Row; message?: string }

      if (data?.request?.id) {
        created.push({ kind: 'request', id: text(data.request.id) })
      }

      return {
        status: result.ok && data?.ok ? 'pass' : 'fail',
        message: data?.message || (result.ok ? '접수 성공' : '접수 실패'),
        detail: data
      }
    }
  })

  await runTest(results, {
    key: 'urgent-register-provider',
    group: '요양보호사 배치',
    title: '검증 요양보호사 테스트 등록',
    critical: true,
    test: async () => {
      const result = await internalFetchJson(request, '/api/urgent-caregiver-dispatch', {
        method: 'POST',
        body: JSON.stringify({
          action: 'registerCaregiver',
          providerName: 'QA테스트요양보호사',
          phone: '0100000' + runId.slice(-4),
          serviceArea: qaArea,
          providerType: 'caregiver',
          qualification: 'QA 테스트',
          responseTimeMin: 5
        })
      })

      const data = result.data as { ok?: boolean; provider?: Row; message?: string }

      providerId = text(data?.provider?.id)

      if (providerId) {
        created.push({ kind: 'provider', id: providerId })
      }

      return {
        status: result.ok && data?.ok && providerId ? 'pass' : 'fail',
        message: data?.message || '요양보호사 등록 테스트',
        detail: data
      }
    }
  })

  await runTest(results, {
    key: 'urgent-create-request',
    group: '요양보호사 배치',
    title: '긴급 요청 생성',
    critical: true,
    test: async () => {
      const result = await internalFetchJson(request, '/api/urgent-caregiver-dispatch', {
        method: 'POST',
        body: JSON.stringify({
          action: 'createUrgentRequest',
          familyCode: qaFamilyCode,
          parentName: 'QA긴급어르신',
          guardianName: 'QA보호자',
          guardianPhone: '',
          serviceArea: qaArea,
          addressHint: 'QA 테스트 상세 위치'
        })
      })

      const data = result.data as { ok?: boolean; request?: Row; message?: string }

      urgentRequestId = text(data?.request?.id)

      if (urgentRequestId) {
        created.push({ kind: 'request', id: urgentRequestId })
      }

      return {
        status: result.ok && data?.ok && urgentRequestId ? 'pass' : 'fail',
        message: data?.message || '긴급 요청 생성',
        detail: data
      }
    }
  })

  await runTest(results, {
    key: 'urgent-dispatch-nearest',
    group: '요양보호사 배치',
    title: '가용 요양보호사 즉시 배치',
    critical: true,
    test: async () => {
      if (!urgentRequestId) {
        return {
          status: 'skip',
          message: '긴급 요청 생성 실패로 건너뜁니다.'
        }
      }

      const result = await internalFetchJson(request, '/api/urgent-caregiver-dispatch', {
        method: 'POST',
        body: JSON.stringify({
          action: 'dispatchNearest',
          requestId: urgentRequestId,
          limit: 1
        })
      })

      const data = result.data as { ok?: boolean; smsResults?: Array<{ outbox?: Row }>; matches?: Row[]; message?: string }

      const targetUrl =
        data?.smsResults?.[0]?.outbox?.target_url ||
        data?.smsResults?.[0]?.outbox?.payload && (data.smsResults[0].outbox.payload as Row).targetUrl ||
        ''

      token = extractTokenFromTargetUrl(targetUrl)

      return {
        status: result.ok && data?.ok && token ? 'pass' : 'fail',
        message: token ? '1회용 토큰 링크가 생성되었습니다.' : '1회용 토큰 링크를 찾지 못했습니다.',
        detail: {
          data,
          tokenFound: Boolean(token)
        }
      }
    }
  })

  await runTest(results, {
    key: 'urgent-token-load',
    group: '1회용 토큰',
    title: '토큰 링크 조회',
    critical: true,
    test: async () => {
      if (!token) {
        return {
          status: 'skip',
          message: '토큰 생성 실패로 건너뜁니다.'
        }
      }

      const result = await internalFetchJson(request, '/api/urgent-caregiver-dispatch?mode=token&token=' + encodeURIComponent(token))
      const data = result.data as { ok?: boolean; canAccept?: boolean; request?: Row; message?: string }

      const addressHidden = text(data?.request?.address_hint).includes('수락 후')

      return {
        status: result.ok && data?.ok && data?.canAccept && addressHidden ? 'pass' : 'fail',
        message: addressHidden ? '수락 전 상세 위치가 숨겨져 있습니다.' : '수락 전 위치 숨김이 확인되지 않았습니다.',
        detail: data
      }
    }
  })

  await runTest(results, {
    key: 'urgent-token-accept',
    group: '1회용 토큰',
    title: '토큰 수락 후 상세 열림',
    critical: true,
    test: async () => {
      if (!token) {
        return {
          status: 'skip',
          message: '토큰 생성 실패로 건너뜁니다.'
        }
      }

      const result = await internalFetchJson(request, '/api/urgent-caregiver-dispatch', {
        method: 'POST',
        body: JSON.stringify({
          action: 'acceptDispatchByToken',
          token,
          note: 'QA 테스트 수락'
        })
      })

      const data = result.data as { ok?: boolean; request?: Row; message?: string }

      const unlocked = text(data?.request?.address_hint) && !text(data?.request?.address_hint).includes('수락 후')

      return {
        status: result.ok && data?.ok && unlocked ? 'pass' : 'fail',
        message: unlocked ? '수락 후 상세 위치가 열렸습니다.' : '수락 후 상세 위치가 열리지 않았습니다.',
        detail: data
      }
    }
  })

  await runTest(results, {
    key: 'urgent-token-complete',
    group: '1회용 토큰',
    title: '긴급 확인 완료 처리',
    critical: true,
    test: async () => {
      if (!token) {
        return {
          status: 'skip',
          message: '토큰 생성 실패로 건너뜁니다.'
        }
      }

      const result = await internalFetchJson(request, '/api/urgent-caregiver-dispatch', {
        method: 'POST',
        body: JSON.stringify({
          action: 'completeDispatchByToken',
          token,
          note: 'QA 테스트 완료'
        })
      })

      const data = result.data as { ok?: boolean; request?: Row; message?: string }

      return {
        status: result.ok && data?.ok && text(data?.request?.status) === 'completed' ? 'pass' : 'fail',
        message: data?.message || '완료 처리 테스트',
        detail: data
      }
    }
  })

  await runTest(results, {
    key: 'state-machine-after-flow',
    group: '상태 머신',
    title: '상태 머신 조회',
    critical: true,
    test: async () => {
      const result = await internalFetchJson(request, '/api/ops-state-machine')
      const data = result.data as { ok?: boolean; status?: string; metrics?: Row; message?: string }

      return {
        status: result.ok && data?.ok ? 'pass' : 'fail',
        message: result.ok ? `상태 머신 응답: ${data?.status || 'unknown'}` : '상태 머신 조회 실패',
        detail: data
      }
    }
  })

  let cleanupResults: unknown[] = []

  if (cleanupEnabled) {
    await runTest(results, {
      key: 'cleanup-test-data',
      group: '정리',
      title: '테스트 데이터 정리',
      critical: false,
      test: async () => {
        cleanupResults = await cleanup(created)

        const failed = cleanupResults.filter((item) => {
          const result = (item as { result?: { ok?: boolean } }).result
          return result && result.ok === false
        })

        return {
          status: failed.length === 0 ? 'pass' : 'warn',
          message: failed.length === 0 ? '테스트 데이터를 정리했습니다.' : `${failed.length}개 정리 작업이 실패했습니다.`,
          detail: cleanupResults
        }
      }
    })
  }

  const metrics = computeMetrics(results)

  const status =
    metrics.criticalFail > 0 || metrics.fail > 0
      ? 'fail'
      : metrics.warn > 0 || metrics.criticalWarn > 0
        ? 'warn'
        : 'pass'

  const summary =
    status === 'pass'
      ? '실증 전 전체 기능 테스트가 통과되었습니다.'
      : status === 'warn'
        ? '실증 가능하지만 주의 항목이 있습니다.'
        : '실증 전 반드시 수정해야 할 실패 항목이 있습니다.'

  const runResult = await insertRows('ops_preflight_test_runs', [
    {
      run_type: 'full_preflight',
      status,
      score: metrics.score,
      summary,
      metrics,
      results,
      cleanup_results: cleanupResults,
      payload: {
        generatedAt: new Date().toISOString(),
        cleanupEnabled,
        qaFamilyCode,
        qaArea
      },
      created_by: text(body.createdBy) || '운영실'
    }
  ])

  return {
    ok: true,
    status,
    summary,
    score: metrics.score,
    metrics,
    results,
    cleanupResults,
    run: rows(runResult)[0],
    generatedAt: new Date().toISOString()
  }
}

async function loadRuns() {
  const result = await rest('ops_preflight_test_runs?select=*&order=created_at.desc&limit=50')

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '전체 기능 테스트 기록을 불러오지 못했습니다. SQL 실행 여부를 확인해주세요.',
      detail: result.error
    }
  }

  return {
    ok: true,
    runs: rows(result),
    config: {
      hasSupabaseUrl: Boolean(supabaseBaseUrl()),
      hasServiceRoleKey: Boolean(serviceKey()),
      hasOpsPassword: Boolean(opsPassword()),
      hasCronSecret: hasEnv('CRON_SECRET'),
      hasOpsAutopilotSecret: hasEnv('OPS_AUTOPILOT_SECRET'),
      hasResponseEscalationSecret: hasEnv('RESPONSE_ESCALATION_SECRET'),
      hasSolapiApiKey: hasEnv('SOLAPI_API_KEY'),
      hasSolapiApiSecret: hasEnv('SOLAPI_API_SECRET'),
      hasSolapiSender: hasEnv('SOLAPI_SENDER')
    },
    generatedAt: new Date().toISOString()
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const data = await loadRuns()
  return NextResponse.json(data, { status: responseStatus(data) })
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: '운영실 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  let result

  if (action === 'runFullPreflight') result = await runFullPreflight(request, body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
