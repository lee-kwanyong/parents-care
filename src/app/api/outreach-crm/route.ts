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

const defaultTargets = [
  {
    target_key: 'cheongyang',
    municipality_name: '청양군',
    priority: 1,
    region: '충남',
    department_name: '노인복지·통합돌봄 담당',
    status: 'phone_confirm_needed',
    call_status: 'not_called',
    email_status: 'needs_confirm',
    next_action: '담당자 이메일 전화 확인',
    notes: '고령친화도시형 AIP 돌봄 관제 실증 1순위 제안 대상. 담당자 이메일 확인 후 1페이지 제안서 발송.'
  },
  {
    target_key: 'uiryeong',
    municipality_name: '의령군',
    priority: 2,
    region: '경남',
    department_name: '주민생활지원과 노인복지팀',
    status: 'phone_confirm_needed',
    call_status: 'not_called',
    email_status: 'needs_confirm',
    next_action: '노인복지팀 담당자 이메일 확인',
    notes: '고령인구 비중이 높은 군 단위 실증 후보. 비의료 생활확인·요양보호사 즉시 배치 중심으로 제안.'
  },
  {
    target_key: 'seocheon',
    municipality_name: '서천군',
    priority: 3,
    region: '충남',
    department_name: '인구정책과 노인복지팀',
    status: 'phone_confirm_needed',
    call_status: 'not_called',
    email_status: 'needs_confirm',
    next_action: '담당자 이메일 확인 후 제안 발송',
    notes: '독거노인 안부·복약·도움요청 관제 실증 후보. 전화 확인 후 이메일 확정.'
  },
  {
    target_key: 'gurye',
    municipality_name: '구례군',
    priority: 4,
    region: '전남',
    department_name: '주민복지과 노인복지·통합돌봄 담당',
    status: 'phone_confirm_needed',
    call_status: 'not_called',
    email_status: 'needs_confirm',
    next_action: '담당자 이메일 전화 확인',
    notes: '지방소멸대응 고령자 생활안전 관제 제안 후보.'
  },
  {
    target_key: 'hoengseong',
    municipality_name: '횡성군',
    priority: 5,
    region: '강원',
    department_name: '가족복지과 노인정책·통합돌봄 담당',
    status: 'phone_confirm_needed',
    call_status: 'not_called',
    email_status: 'needs_confirm',
    next_action: '노인정책 담당자 이메일 확인',
    notes: '고령친화도시 통합돌봄 관제 시스템 시연 제안 후보.'
  },
  {
    target_key: 'namhae',
    municipality_name: '남해군',
    priority: 6,
    region: '경남',
    department_name: '주민행복과 노인복지팀',
    status: 'phone_confirm_needed',
    call_status: 'not_called',
    email_status: 'needs_confirm',
    next_action: '담당자 이메일 확인 후 제안 발송',
    notes: '지역 도움망 기반 고령자 AIP 돌봄 관제 실증 제안 후보.'
  },
  {
    target_key: 'yesan',
    municipality_name: '예산군',
    priority: 7,
    region: '충남',
    department_name: '가족지원과 경로복지팀',
    status: 'phone_confirm_needed',
    call_status: 'not_called',
    email_status: 'needs_confirm',
    next_action: '경로복지팀 담당자 이메일 확인',
    notes: '노인맞춤돌봄·독거노인 생활안전 데이터 관제 협업 제안 후보.'
  },
  {
    target_key: 'buyeo',
    municipality_name: '부여군',
    priority: 8,
    region: '충남',
    department_name: '가족행복과 노인복지팀',
    status: 'phone_confirm_needed',
    call_status: 'not_called',
    email_status: 'needs_confirm',
    next_action: '담당자 이메일 확인 후 제안 발송',
    notes: '고령친화도시 스마트 돌봄 관제·보고 자동화 제안 후보.'
  },
  {
    target_key: 'goseong',
    municipality_name: '고성군',
    priority: 9,
    region: '강원/경남 확인 필요',
    department_name: '노인복지·통합돌봄 담당',
    status: 'phone_confirm_needed',
    call_status: 'not_called',
    email_status: 'needs_confirm',
    next_action: '강원 고성군/경남 고성군 대상 확정',
    notes: '동명이 지자체가 있어 먼저 대상 지역을 확정해야 함.'
  },
  {
    target_key: 'taebaek',
    municipality_name: '태백시',
    priority: 10,
    region: '강원',
    department_name: '사회복지과 노인정책돌봄팀',
    status: 'phone_confirm_needed',
    call_status: 'not_called',
    email_status: 'needs_confirm',
    next_action: '노인정책돌봄팀 담당자 이메일 확인',
    notes: '고령친화도시·통합돌봄 기반 안부웍스 시연 제안 후보.'
  }
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
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

function metricsFor(targets: Row[], logs: Row[]) {
  return {
    total: targets.length,
    phoneConfirmNeeded: targets.filter((row) => text(row.status) === 'phone_confirm_needed').length,
    emailReady: targets.filter((row) => text(row.status) === 'email_ready').length,
    emailSent: targets.filter((row) => text(row.status) === 'email_sent').length,
    replied: targets.filter((row) => text(row.status) === 'replied').length,
    meetingScheduled: targets.filter((row) => text(row.status) === 'meeting_scheduled').length,
    hold: targets.filter((row) => text(row.status) === 'hold').length,
    rejected: targets.filter((row) => text(row.status) === 'rejected').length,
    logs: logs.length,
    calls: logs.filter((row) => text(row.channel) === 'phone').length,
    emails: logs.filter((row) => text(row.channel) === 'email').length
  }
}

async function loadData() {
  const [targetResult, logResult, runResult] = await Promise.all([
    rest('ops_outreach_targets?select=*&order=priority.asc,created_at.asc&limit=500'),
    rest('ops_outreach_logs?select=*&order=created_at.desc&limit=1000'),
    rest('ops_outreach_runs?select=*&order=created_at.desc&limit=50')
  ])

  if (!targetResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '지자체 제안 CRM 테이블을 불러오지 못했습니다. SQL 실행 여부를 확인해주세요.',
      detail: targetResult.error
    }
  }

  const targets = rows(targetResult)
  const logs = rows(logResult)

  return {
    ok: true,
    targets,
    logs,
    runs: rows(runResult),
    metrics: metricsFor(targets, logs),
    defaultTargets,
    generatedAt: new Date().toISOString()
  }
}

async function seedTargets() {
  const now = new Date().toISOString()

  const result = await rest('ops_outreach_targets?on_conflict=target_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(
      defaultTargets.map((target) => ({
        ...target,
        tags: ['고령친화도시', 'AIP', '실증제안'],
        payload: {
          source: 'default-seed',
          seededAt: now
        },
        updated_at: now
      }))
    )
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '우선 제안 대상 10개 지자체를 초기화했습니다.' : '지자체 대상 초기화에 실패했습니다.',
    targets: rows(result),
    detail: result.error
  }
}

async function updateTarget(body: Row) {
  const id = text(body.id)
  const targetKey = text(body.targetKey)

  if (!id && !targetKey) {
    return {
      ok: false,
      status: 400,
      message: 'id 또는 targetKey가 필요합니다.'
    }
  }

  const patchInput = body.patch && typeof body.patch === 'object' ? body.patch as Row : {}
  const patch: Row = {
    updated_at: new Date().toISOString()
  }

  const allowed = [
    'municipality_name',
    'priority',
    'region',
    'department_name',
    'contact_name',
    'role_title',
    'contact_phone',
    'contact_email',
    'status',
    'call_status',
    'email_status',
    'meeting_status',
    'next_action',
    'next_action_at',
    'last_contacted_at',
    'meeting_at',
    'notes',
    'tags',
    'payload'
  ]

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(patchInput, key)) {
      patch[key] = patchInput[key]
    }
  }

  const path = id
    ? 'ops_outreach_targets?id=eq.' + encodeURIComponent(id)
    : 'ops_outreach_targets?target_key=eq.' + encodeURIComponent(targetKey)

  const result = await rest(path, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '지자체 대상 정보를 수정했습니다.' : '수정에 실패했습니다.',
    target: rows(result)[0],
    detail: result.error
  }
}

async function findTarget(targetKey: string, targetId: string) {
  const result = targetId
    ? await rest('ops_outreach_targets?select=*&id=eq.' + encodeURIComponent(targetId) + '&limit=1')
    : await rest('ops_outreach_targets?select=*&target_key=eq.' + encodeURIComponent(targetKey) + '&limit=1')

  return rows(result)[0]
}

async function addLog(body: Row) {
  const targetId = text(body.targetId)
  const targetKey = text(body.targetKey)
  const target = await findTarget(targetKey, targetId)

  if (!target) {
    return {
      ok: false,
      status: 404,
      message: '지자체 대상을 찾지 못했습니다.'
    }
  }

  const actionType = text(body.actionType) || 'note'
  const channel = text(body.channel) || 'internal'
  const status = text(body.status) || 'recorded'
  const nextStatus = text(body.nextStatus)
  const now = new Date().toISOString()

  const logResult = await rest('ops_outreach_logs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        target_id: text(target.id),
        target_key: text(target.target_key),
        municipality_name: text(target.municipality_name),
        action_type: actionType,
        channel,
        status,
        subject: text(body.subject),
        body: text(body.body),
        note: text(body.note),
        next_status: nextStatus,
        payload: body.payload || {},
        created_by: text(body.createdBy) || '운영실'
      }
    ])
  })

  const patch: Row = {
    updated_at: now
  }

  if (nextStatus) patch.status = nextStatus

  if (channel === 'phone') {
    patch.call_status = status
    patch.last_contacted_at = now
  }

  if (channel === 'email') {
    patch.email_status = status
    patch.last_contacted_at = now
  }

  if (actionType === 'meeting_scheduled') {
    patch.meeting_status = 'scheduled'
    patch.status = 'meeting_scheduled'
    patch.meeting_at = text(body.meetingAt) || null
  }

  if (text(body.nextAction)) patch.next_action = text(body.nextAction)
  if (text(body.nextActionAt)) patch.next_action_at = text(body.nextActionAt)

  await rest('ops_outreach_targets?id=eq.' + encodeURIComponent(text(target.id)), {
    method: 'PATCH',
    body: JSON.stringify(patch)
  })

  return {
    ok: logResult.ok,
    status: logResult.ok ? 200 : 500,
    message: logResult.ok ? '접촉 기록을 저장했습니다.' : '접촉 기록 저장에 실패했습니다.',
    log: rows(logResult)[0],
    detail: logResult.error
  }
}

async function saveSnapshot() {
  const data = await loadData()

  if (!data.ok) return data

  const result = await rest('ops_outreach_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        run_type: 'outreach_snapshot',
        status: 'recorded',
        summary: '지자체 실증 제안 CRM 스냅샷을 저장했습니다.',
        metrics: data.metrics,
        targets: data.targets,
        logs: data.logs,
        payload: {
          generatedAt: data.generatedAt
        },
        created_by: '운영실'
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? 'CRM 스냅샷을 저장했습니다.' : 'CRM 스냅샷 저장에 실패했습니다.',
    run: rows(result)[0],
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

  if (action === 'seedTargets') result = await seedTargets()
  else if (action === 'updateTarget') result = await updateTarget(body)
  else if (action === 'addLog') result = await addLog(body)
  else if (action === 'saveSnapshot') result = await saveSnapshot()
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
