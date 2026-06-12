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

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'OPS_SESSION_TOKEN',
  'ops_session_token',
  'ops_session'
]

const highRiskTables = [
  'care_response_requests',
  'care_response_matches',
  'notification_outbox',
  'privacy_access_logs',
  'gov_proposal_leads'
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
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

function anonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

async function restWithKey(path: string, key: string, init?: RequestInit): Promise<RestResult> {
  const base = supabaseBaseUrl()

  if (!base || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: 'Supabase URL 또는 Key가 없습니다.'
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

async function rest(path: string, init?: RequestInit) {
  return restWithKey(path, serviceKey(), init)
}

function rows(result: RestResult): Row[] {
  return result.ok && Array.isArray(result.data) ? result.data as Row[] : []
}

function isUnsafe(row: Row) {
  return Boolean(
    row.anon_select ||
    row.anon_insert ||
    row.anon_update ||
    row.anon_delete ||
    row.authenticated_select ||
    row.authenticated_insert ||
    row.authenticated_update ||
    row.authenticated_delete ||
    Number(row.permissive_policy_count || 0) > 0 ||
    !row.rls_enabled
  )
}

async function probeAnonAccess() {
  const key = anonKey()

  if (!key) {
    return {
      ok: false,
      skipped: true,
      message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY가 없어 공개 접근 테스트를 건너뜁니다.',
      items: []
    }
  }

  const items = []

  for (const table of highRiskTables) {
    const result = await restWithKey(`${table}?select=id&limit=1`, key)

    items.push({
      table,
      ok: result.ok,
      status: result.status,
      exposed: result.ok,
      message: result.ok
        ? '주의: anon key로 조회가 허용됩니다.'
        : '차단됨',
      error: result.error
    })
  }

  return {
    ok: true,
    items
  }
}

async function loadSecurityCenter() {
  const [policyResult, runResult, probeResult] = await Promise.all([
    rest('ops_rls_policy_status?select=*&order=table_name.asc'),
    rest('ops_security_hardening_runs?select=*&order=created_at.desc&limit=50'),
    probeAnonAccess()
  ])

  if (!policyResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '권한 상태 뷰를 불러오지 못했습니다. 20260607_rls_security_hardening.sql 실행 여부를 확인해주세요.',
      detail: policyResult.error
    }
  }

  const policyRows = rows(policyResult)
  const unsafeRows = policyRows.filter(isUnsafe)
  const probeItems = Array.isArray((probeResult as { items?: unknown }).items)
    ? (probeResult as { items: Row[] }).items
    : []

  const exposedProbeItems = probeItems.filter((item) => item.exposed)

  const metrics = {
    tables: policyRows.length,
    hardened: policyRows.length - unsafeRows.length,
    unsafe: unsafeRows.length,
    rlsDisabled: policyRows.filter((row) => !row.rls_enabled).length,
    anonGranted: policyRows.filter((row) => row.anon_select || row.anon_insert || row.anon_update || row.anon_delete).length,
    authenticatedGranted: policyRows.filter((row) => row.authenticated_select || row.authenticated_insert || row.authenticated_update || row.authenticated_delete).length,
    permissivePolicies: policyRows.reduce((sum, row) => sum + Number(row.permissive_policy_count || 0), 0),
    exposedProbe: exposedProbeItems.length,
    runs: rows(runResult).length
  }

  const overall =
    metrics.exposedProbe > 0 || metrics.anonGranted > 0 || metrics.permissivePolicies > 0
      ? 'critical'
      : metrics.unsafe > 0
        ? 'warning'
        : 'ok'

  return {
    ok: true,
    status: overall,
    generatedAt: new Date().toISOString(),
    metrics,
    policyRows,
    unsafeRows,
    probe: probeResult,
    runs: rows(runResult),
    config: {
      hasSupabaseUrl: Boolean(supabaseBaseUrl()),
      hasServiceRoleKey: Boolean(serviceKey()),
      hasAnonKey: Boolean(anonKey())
    }
  }
}

async function saveAuditSnapshot() {
  const data = await loadSecurityCenter()

  if (!data.ok) return data

  const result = await rest('ops_security_hardening_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        action_type: 'security_audit_snapshot',
        status: data.status,
        summary:
          data.status === 'ok'
            ? 'RLS/권한 상태가 안전하게 정리되어 있습니다.'
            : 'RLS/권한 상태에 점검이 필요한 항목이 있습니다.',
        metrics: data.metrics,
        probe_results: data.probe,
        policy_rows: data.policyRows,
        payload: {
          generatedAt: data.generatedAt,
          config: data.config
        },
        created_by: '운영실'
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '권한 점검 스냅샷을 저장했습니다.' : '권한 점검 스냅샷 저장에 실패했습니다.',
    snapshot: rows(result)[0],
    detail: result.error
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

  const data = await loadSecurityCenter()
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

  if (action === 'saveAuditSnapshot') result = await saveAuditSnapshot()
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
