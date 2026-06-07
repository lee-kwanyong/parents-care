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

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function numberValue(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function opsPassword() {
  return process.env.ANBU_OPS_PASSWORD || process.env.OPS_PASSWORD || ''
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

async function safeTable(tableName: string, query: string) {
  const result = await rest(`${tableName}?${query}`)
  return rows(result)
}

async function currentMetrics() {
  const [
    households,
    requests,
    providers,
    outbox,
    leads
  ] = await Promise.all([
    safeTable('care_households', 'select=*&limit=1000'),
    safeTable('care_response_requests', 'select=*&limit=1000'),
    safeTable('care_providers', 'select=*&limit=1000'),
    safeTable('notification_outbox', 'select=*&limit=1000'),
    safeTable('gov_proposal_leads', 'select=*&limit=500')
  ])

  const urgent = requests.filter((row) => text(row.request_type) === 'urgent_neighbor_help' || text(row.risk_level) === 'high')
  const completed = requests.filter((row) => text(row.status) === 'completed')
  const availableProviders = providers.filter((row) => text(row.available_status) === 'available' && text(row.verified_status) === 'verified')
  const sent = outbox.filter((row) => text(row.status) === 'sent')

  return {
    households: households.length,
    urgentRequests: urgent.length,
    completedRequests: completed.length,
    availableProviders: availableProviders.length,
    sentMessages: sent.length,
    proposalLeads: leads.length,
    completionRate: requests.length ? Math.round((completed.length / requests.length) * 100) : 0,
    smsSuccessRate: outbox.length ? Math.round((sent.length / outbox.length) * 100) : 0
  }
}

function defaultProposal(metrics: Row) {
  return {
    municipalityName: '예비 지자체',
    title: '안부웍스 고령자 AIP 돌봄 관제 실증 협업 제안',
    subtitle: '바이오헬스 데이터 기반 고령자 AIP 돌봄 관제 플랫폼',
    oneLine:
      '부모님의 식사·복약·몸 상태·도움 요청 신호를 가족, 운영실, 지역 도움망, 지자체가 처리 가능한 행동으로 연결합니다.',
    problem:
      '고령자 돌봄 현장은 보호자 불안, 생활지원사·요양보호사 인력 부족, 지자체 수작업 행정 과부하가 동시에 발생하고 있습니다.',
    solution:
      '안부웍스는 안부 신호를 사건으로 전환하고, 보호자 알림·요양보호사 즉시 배치·사건 타임라인·운영보고서·제출 패키지까지 연결합니다.',
    pilotScale: '10~30가구 예비 실증 후 500가구 표준 실증 확장',
    pilotPeriod: '4~8주 예비 실증',
    target:
      '독거노인, 노인맞춤돌봄 대상자, 고위험 A그룹 어르신, 보호자 확인이 필요한 일반관리 B그룹 어르신',
    workflow: [
      '안부 신호 수집',
      '위험도 분류',
      '보호자 알림',
      '요양보호사 즉시 배치',
      '사건 타임라인 기록',
      '지자체 보고서 생성'
    ],
    keyFeatures: [
      '부모님 식사·복약·몸 상태·도움 요청 신호 수집',
      '운영실 자동운영 상태판과 Heartbeat 점검',
      '검증 요양보호사·돌봄파트너 1회용 링크 기반 즉시 배치',
      '문자 발송센터와 실패·대기열 관리',
      'RLS·권한 점검센터와 개인정보 동의·열람 감사',
      '주간·월간 운영보고서와 지자체 제출 패키지'
    ],
    safety:
      '안부웍스는 119 또는 의료기관을 대체하지 않습니다. 생명 위협·낙상·의식저하 등 응급상황은 즉시 119 연락을 안내하며, 안부웍스는 응급 전 단계 생활위험 확인과 지역 도움망 연결을 담당합니다.',
    expectedEffects: [
      '고령자 생활위험 신호 조기 확인',
      '보호자·요양보호사·운영실 간 후속조치 흐름 표준화',
      '수작업 전화·일지·보고서 작성 부담 완화',
      '개인정보 동의·열람 감사 로그 확보',
      '지자체 실증 성과 자료와 조달 연계 제출자료 확보'
    ],
    proofMetrics: [
      `현재 관리 대상자 ${numberValue(metrics.households)}명`,
      `긴급 요청 ${numberValue(metrics.urgentRequests)}건`,
      `완료 사건 ${numberValue(metrics.completedRequests)}건`,
      `가용 도움망 ${numberValue(metrics.availableProviders)}명`,
      `문자 발송 성공률 ${numberValue(metrics.smsSuccessRate)}%`
    ],
    ask:
      '10~30가구 규모의 예비 실증을 통해 긴급 신호 확인, 지역 도움망 수락, 사건 처리 기록, 보고서 자동화 가능성을 함께 검증하고자 합니다.',
    contactName: '이관용',
    contactEmail: 'contact@parents-care.net',
    serviceUrl: 'https://parents-care.net/proposal',
    generatedAt: new Date().toISOString()
  }
}

async function loadData() {
  const [historyResult, metrics] = await Promise.all([
    rest('ops_one_page_proposals?select=*&order=created_at.desc&limit=30'),
    currentMetrics()
  ])

  if (!historyResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '1페이지 제안서 저장 테이블을 불러오지 못했습니다. SQL 실행 여부를 확인해주세요.',
      detail: historyResult.error
    }
  }

  return {
    ok: true,
    metrics,
    defaultProposal: defaultProposal(metrics),
    history: rows(historyResult),
    generatedAt: new Date().toISOString()
  }
}

async function saveProposal(body: Row) {
  const proposal = body.proposal && typeof body.proposal === 'object' ? body.proposal as Row : {}
  const metrics = await currentMetrics()

  const municipalityName = text(proposal.municipalityName) || '예비 지자체'
  const title = text(proposal.title) || '안부웍스 고령자 AIP 돌봄 관제 실증 협업 제안'

  const result = await rest('ops_one_page_proposals', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        proposal_type: 'gov_pilot',
        municipality_name: municipalityName,
        title,
        status: text(body.status) || 'saved',
        version_label: text(body.versionLabel) || new Date().toISOString().slice(0, 10),
        content: proposal,
        metrics,
        payload: {
          savedAt: new Date().toISOString()
        },
        created_by: text(body.createdBy) || '운영실',
        updated_at: new Date().toISOString()
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '1페이지 제안서를 저장했습니다.' : '1페이지 제안서 저장에 실패했습니다.',
    proposal: rows(result)[0],
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

  const data = await loadData()
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

  if (action === 'saveProposal') result = await saveProposal(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
