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

type QueueResult = {
  ok: boolean
  skipped?: boolean
  reason?: string
  sourceKey?: string
  outbox?: Row
  detail?: unknown
}

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'OPS_SESSION_TOKEN',
  'ops_session_token',
  'ops_session'
]

const templateDefaults = [
  {
    template_code: 'private_pilot_guardian_intro',
    title: '보호자 사전 안내',
    audience: 'guardian',
    situation: 'private_pilot_intro',
    severity: 'normal',
    body: `[안부웍스 예비실증 안내]
{보호자명}님, {부모님명}님의 안부 확인을 위해 {실증기간} 동안 안부웍스 자체 예비실증을 진행합니다.

부모님은 앱에서
괜찮아요 / 밥을 못 먹었어요 / 약을 못 먹었어요 / 몸이 아파요 / 지금 도움이 필요해요
중 하나를 누르게 됩니다.

안부웍스는 119를 대체하지 않습니다.
응급상황은 즉시 119 또는 의료기관에 연락해주세요.

부모님 앱 링크:
{앱링크}`
  },
  {
    template_code: 'parent_app_link',
    title: '부모님 앱 링크',
    audience: 'parent_or_guardian',
    situation: 'app_link',
    severity: 'normal',
    body: `[안부웍스]
{부모님명}님, 아래 링크를 눌러 오늘 안부를 알려주세요.

괜찮으면 “괜찮아요”
불편하면 “밥/약/몸/도움” 버튼을 눌러주세요.

앱 링크:
{앱링크}`
  },
  {
    template_code: 'daily_check_request',
    title: '매일 안부 요청',
    audience: 'parent_or_guardian',
    situation: 'daily_prompt',
    severity: 'normal',
    body: `[안부웍스 안부확인]
{부모님명}님, 오늘 상태를 확인해주세요.

괜찮으면 “괜찮아요”를 눌러주세요.
도움이 필요하면 해당 버튼을 눌러주세요.

{앱링크}`
  },
  {
    template_code: 'guardian_daily_ok',
    title: '괜찮아요 보호자 알림',
    audience: 'guardian',
    situation: 'daily_ok',
    severity: 'safe',
    body: `[안부웍스]
{부모님명}님이 “괜찮아요”를 눌렀습니다.

오늘 안부가 정상으로 기록되었습니다.`
  },
  {
    template_code: 'guardian_meal_missed',
    title: '식사 미확인 보호자 알림',
    audience: 'guardian',
    situation: 'meal_missed',
    severity: 'warning',
    body: `[안부웍스 주의 알림]
{부모님명}님이 “밥을 못 먹었어요”를 눌렀습니다.

가능하면 전화로 식사 가능 여부를 확인해주세요.
필요 시 운영실에서 지역 도움망 연결을 검토합니다.

확인:
{보호자링크}`
  },
  {
    template_code: 'guardian_medication_missed',
    title: '복약 미확인 보호자 알림',
    audience: 'guardian',
    situation: 'medication_missed',
    severity: 'warning',
    body: `[안부웍스 주의 알림]
{부모님명}님이 “약을 못 먹었어요”를 눌렀습니다.

복약 여부를 전화로 확인해주세요.
필요하면 약국 상담 또는 돌봄파트너 확인을 연결할 수 있습니다.

확인:
{보호자링크}`
  },
  {
    template_code: 'guardian_sick',
    title: '몸이 아파요 보호자 알림',
    audience: 'guardian',
    situation: 'feeling_sick',
    severity: 'urgent',
    body: `[안부웍스 긴급 확인]
{부모님명}님이 “몸이 아파요”를 눌렀습니다.

즉시 전화로 상태를 확인해주세요.
낙상, 호흡곤란, 의식저하, 심한 통증 등 응급상황이 의심되면 119에 연락해주세요.

확인:
{보호자링크}`
  },
  {
    template_code: 'guardian_urgent_help',
    title: '지금 도움이 필요해요 보호자 알림',
    audience: 'guardian',
    situation: 'urgent_neighbor_help',
    severity: 'urgent',
    body: `[긴급][안부웍스]
{부모님명}님이 “지금 도움이 필요해요”를 눌렀습니다.

즉시 전화 확인이 필요합니다.
운영실도 확인 중이며, 필요 시 가까운 생활확인 파트너 연결을 검토합니다.

응급상황이면 바로 119에 연락해주세요.

확인:
{보호자링크}`
  },
  {
    template_code: 'urgent_test_notice',
    title: '긴급 버튼 테스트 사전고지',
    audience: 'guardian',
    situation: 'urgent_test_notice',
    severity: 'warning',
    body: `[안부웍스 테스트 안내]
{보호자명}님, 지금부터 “지금 도움이 필요해요” 버튼 테스트를 1회 진행합니다.

실제 응급상황은 아니며,
운영실에서 긴급 요청 생성, 문자 대기열, 후속조치 기록이 정상 작동하는지 확인하는 테스트입니다.

응급상황 발생 시에는 앱이 아니라 즉시 119에 연락해주세요.`
  },
  {
    template_code: 'soft_run_completed',
    title: '1가구 소프트런 완료 안내',
    audience: 'guardian',
    situation: 'soft_run_completed',
    severity: 'normal',
    body: `[안부웍스 테스트 완료]
{보호자명}님, 오늘 {부모님명}님의 안부확인 앱 1차 테스트가 완료되었습니다.

확인한 항목:
- 부모님 앱 링크 접속
- 안부 버튼 신호 접수
- 보호자 문자 알림
- 운영실 사건 기록
- 긴급 도움 요청 기록

오늘 기록은 운영실 미니 리포트에 반영됩니다.
참여해주셔서 감사합니다.`
  },
  {
    template_code: 'provider_urgent_request',
    title: '생활확인 파트너 긴급 요청',
    audience: 'provider',
    situation: 'provider_urgent_request',
    severity: 'urgent',
    body: `[안부웍스 긴급 확인 요청]
{지역}의 {부모님명}님께 도움이 필요합니다.

가능하시면 아래 링크에서 수락 후 전화 확인을 진행해주세요.

수락 링크:
{요청함링크}

응급상황이 의심되면 119 또는 의료기관 연락을 안내해주세요.`
  },
  {
    template_code: 'guardian_provider_accepted',
    title: '생활확인 파트너 수락 보호자 알림',
    audience: 'guardian',
    situation: 'provider_accepted',
    severity: 'normal',
    body: `[안부웍스]
{파트너명}님이 {부모님명}님의 긴급 확인 요청을 수락했습니다.

운영실이 처리 상황을 기록 중입니다.
응급상황이면 보호자님도 119 또는 의료기관에 연락해주세요.`
  },
  {
    template_code: 'guardian_request_completed',
    title: '후속조치 완료 보호자 알림',
    audience: 'guardian',
    situation: 'request_completed',
    severity: 'normal',
    body: `[안부웍스 처리 완료]
{부모님명}님의 확인 요청이 완료 처리되었습니다.

처리 메모:
{처리메모}

자세한 내용은 보호자 화면에서 확인해주세요.
{보호자링크}`
  },
  {
    template_code: 'ops_stale_urgent',
    title: '운영실 10분 이상 미수락 알림',
    audience: 'ops',
    situation: 'stale_urgent',
    severity: 'urgent',
    body: `[운영실 알림]
{부모님명}님 긴급 요청이 {경과분}분째 수락되지 않았습니다.

수동 전화 확인 또는 다른 도움망 연결이 필요합니다.

사건 확인:
{운영실링크}`
  },
  {
    template_code: 'ops_sms_failed',
    title: '운영실 문자 실패 알림',
    audience: 'ops',
    situation: 'sms_failed',
    severity: 'warning',
    body: `[운영실 문자 실패]
{수신자명}님에게 보낸 문자가 실패했습니다.

사유: {실패사유}
대상: {부모님명}

확인:
{운영실링크}`
  },
  {
    template_code: 'private_pilot_mid_report',
    title: '실증 중간 리포트 안내',
    audience: 'guardian',
    situation: 'pilot_mid_report',
    severity: 'normal',
    body: `[안부웍스 예비실증 중간 안내]
{보호자명}님, {부모님명}님의 예비실증이 진행 중입니다.

현재까지 안부 신호 {신호수}건, 주의 신호 {주의수}건, 완료 처리 {완료수}건이 기록되었습니다.

응급상황은 항상 119 또는 의료기관에 연락해주세요.`
  },
  {
    template_code: 'private_pilot_end_report',
    title: '실증 종료 안내',
    audience: 'guardian',
    situation: 'pilot_end_report',
    severity: 'normal',
    body: `[안부웍스 예비실증 종료 안내]
{보호자명}님, {실증기간} 동안 자체 예비실증에 참여해주셔서 감사합니다.

총 안부 신호 {신호수}건, 긴급 요청 {긴급수}건, 완료 처리 {완료수}건이 기록되었습니다.

간단한 의견을 남겨주시면 서비스 개선에 반영하겠습니다.
의견 남기기: {피드백링크}`
  },
  {
    template_code: 'private_pilot_consent',
    title: '실증 동의 안내',
    audience: 'guardian',
    situation: 'consent',
    severity: 'normal',
    body: `[안부웍스 예비실증 동의 안내]
본 예비실증은 안부 신호, 보호자 연락처, 후속조치 기록을 실증 운영 목적으로만 사용합니다.

참여는 언제든 중단할 수 있습니다.
응급상황은 안부웍스가 아닌 119 또는 의료기관에 연락해야 합니다.

동의 후 참여 링크:
{동의링크}`
  }
]

const ruleDefaults = [
  {
    rule_key: 'request-daily-ok-guardian',
    title: '괜찮아요 → 보호자 자동 알림',
    trigger_type: 'request_signal',
    signal_type: 'daily_ok',
    template_code: 'guardian_daily_ok',
    audience: 'guardian',
    auto_queue: true,
    auto_dispatch: true,
    enabled: true,
    priority: 10
  },
  {
    rule_key: 'request-meal-guardian',
    title: '밥을 못 먹었어요 → 보호자 자동 알림',
    trigger_type: 'request_signal',
    signal_type: 'meal_missed',
    template_code: 'guardian_meal_missed',
    audience: 'guardian',
    auto_queue: true,
    auto_dispatch: true,
    enabled: true,
    priority: 11
  },
  {
    rule_key: 'request-medication-guardian',
    title: '약을 못 먹었어요 → 보호자 자동 알림',
    trigger_type: 'request_signal',
    signal_type: 'medication_missed',
    template_code: 'guardian_medication_missed',
    audience: 'guardian',
    auto_queue: true,
    auto_dispatch: true,
    enabled: true,
    priority: 12
  },
  {
    rule_key: 'request-sick-guardian',
    title: '몸이 아파요 → 보호자 자동 알림',
    trigger_type: 'request_signal',
    signal_type: 'feeling_sick',
    template_code: 'guardian_sick',
    audience: 'guardian',
    auto_queue: true,
    auto_dispatch: true,
    enabled: true,
    priority: 13
  },
  {
    rule_key: 'request-urgent-guardian',
    title: '지금 도움이 필요해요 → 보호자 자동 알림',
    trigger_type: 'request_signal',
    signal_type: 'urgent_neighbor_help',
    template_code: 'guardian_urgent_help',
    audience: 'guardian',
    auto_queue: true,
    auto_dispatch: true,
    enabled: true,
    priority: 14
  },
  {
    rule_key: 'request-provider-accepted-guardian',
    title: '생활확인 파트너 수락 → 보호자 알림',
    trigger_type: 'provider_accepted',
    template_code: 'guardian_provider_accepted',
    audience: 'guardian',
    auto_queue: true,
    auto_dispatch: true,
    enabled: true,
    priority: 20
  },
  {
    rule_key: 'request-completed-guardian',
    title: '요청 완료 → 보호자 알림',
    trigger_type: 'request_completed',
    request_status: 'completed',
    template_code: 'guardian_request_completed',
    audience: 'guardian',
    auto_queue: true,
    auto_dispatch: true,
    enabled: true,
    priority: 21
  },
  {
    rule_key: 'stale-urgent-ops',
    title: '긴급 요청 10분 이상 미수락 → 운영실 알림',
    trigger_type: 'stale_urgent',
    signal_type: 'urgent_neighbor_help',
    template_code: 'ops_stale_urgent',
    audience: 'ops',
    min_age_minutes: 10,
    auto_queue: true,
    auto_dispatch: true,
    enabled: true,
    priority: 30
  },
  {
    rule_key: 'sms-failed-ops',
    title: '문자 실패 → 운영실 알림',
    trigger_type: 'sms_failed',
    template_code: 'ops_sms_failed',
    audience: 'ops',
    auto_queue: true,
    auto_dispatch: true,
    enabled: true,
    priority: 31
  },
  {
    rule_key: 'daily-private-pilot-prompt',
    title: '예비실증 매일 안부요청',
    trigger_type: 'daily_prompt',
    template_code: 'daily_check_request',
    audience: 'parent_or_guardian',
    auto_queue: true,
    auto_dispatch: false,
    enabled: true,
    priority: 40,
    notes: '첫날은 수동 발송 권장. 안정화 후 auto_dispatch를 켜세요.'
  }
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function phone(value: unknown) {
  return text(value).replace(/[^\d]/g, '')
}

function numberValue(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function bool(value: unknown) {
  return value === true || value === 'true'
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

function render(template: string, context: Record<string, unknown>) {
  return template.replace(/\{([^}]+)\}/g, (_, key) => {
    const value = context[key]
    if (value === null || value === undefined || value === '') return '-'
    return String(value)
  })
}

function ageMinutes(value: unknown) {
  const raw = text(value)
  if (!raw) return null

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null

  return Math.floor((Date.now() - d.getTime()) / 60000)
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function isOpenUrgent(row: Row) {
  const status = text(row.status)
  return (
    ['open', 'dispatched', 'accepted', 'in_progress', 'manual_needed'].includes(status) &&
    (
      text(row.request_type) === 'urgent_neighbor_help' ||
      text(row.signal_type) === 'urgent_neighbor_help' ||
      text(row.risk_level) === 'high'
    )
  )
}

function baseContext(request: NextRequest, source?: Row) {
  const origin = request.nextUrl.origin
  const payload = source?.payload && typeof source.payload === 'object' ? source.payload as Row : {}

  return {
    부모님명: text(source?.parent_name) || text(payload.parentName) || '부모님',
    보호자명: text(source?.guardian_name) || text(payload.guardianName) || '보호자',
    보호자전화: text(source?.guardian_phone),
    지역: text(source?.service_area) || '우리동네',
    가족코드: text(source?.family_code),
    앱링크: origin + '/mobile/parent',
    보호자링크: origin + '/mobile/guardian',
    운영실링크: origin + '/ops/control-center',
    요청함링크: origin + '/provider/urgent-requests',
    동의링크: origin + '/mobile/guardian',
    피드백링크: origin + '/response/feedback',
    실증기간: '14일',
    처리메모: text(source?.completed_note) || '운영실에서 완료 처리했습니다.',
    경과분: ageMinutes(source?.created_at) || 0,
    수신자명: text(source?.to_name) || '수신자',
    실패사유: text(source?.status) === 'failed' ? '발송 실패' : '-',
    파트너명: text(source?.accepted_by_name) || '생활확인 파트너',
    신호수: 0,
    주의수: 0,
    긴급수: 0,
    완료수: 0
  }
}

function fullUrl(request: NextRequest, path: string) {
  if (!path) return request.nextUrl.origin + '/mobile'
  if (path.startsWith('http')) return path
  return new URL(path, request.nextUrl.origin).toString()
}

async function existingOutbox(sourceKey: string) {
  const result = await rest('notification_outbox?select=*&source_key=eq.' + encodeURIComponent(sourceKey) + '&limit=1')
  return rows(result)[0]
}

async function queueMessage(input: {
  familyCode?: string
  toName: string
  toPhone: string
  title: string
  body: string
  templateCode: string
  reason: string
  targetUrl: string
  sourceKey: string
  provider?: string
  payload?: Row
}): Promise<QueueResult> {
  const cleanPhone = phone(input.toPhone)

  if (!cleanPhone) {
    return {
      ok: true,
      skipped: true,
      reason: 'no-phone',
      sourceKey: input.sourceKey
    }
  }

  const existing = await existingOutbox(input.sourceKey)

  if (existing) {
    return {
      ok: true,
      skipped: true,
      reason: 'already-exists',
      sourceKey: input.sourceKey,
      outbox: existing
    }
  }

  const result = await insertRows('notification_outbox', [
    {
      family_code: input.familyCode || null,
      channel: 'sms',
      to_name: input.toName,
      to_phone: cleanPhone,
      title: input.title,
      body: input.body,
      template_code: input.templateCode,
      reason: input.reason,
      target_url: input.targetUrl,
      status: 'queued',
      provider: input.provider || 'message-automation',
      source_key: input.sourceKey,
      payload: {
        source: 'message-automation',
        templateCode: input.templateCode,
        reason: input.reason,
        ...(input.payload || {})
      }
    }
  ])

  return {
    ok: result.ok,
    skipped: false,
    sourceKey: input.sourceKey,
    outbox: rows(result)[0],
    detail: result.error
  }
}

async function seedDefaults() {
  const now = new Date().toISOString()

  const templateResult = await rest('ops_message_templates?on_conflict=template_code', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(
      templateDefaults.map((item) => ({
        ...item,
        variables: [],
        enabled: true,
        payload: {
          seededAt: now
        },
        updated_at: now
      }))
    )
  })

  const ruleResult = await rest('ops_message_rules?on_conflict=rule_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(
      ruleDefaults.map((item) => ({
        ...item,
        cooldown_minutes: item.trigger_type === 'daily_prompt' ? 1440 : 1440,
        payload: {
          seededAt: now
        },
        updated_at: now
      }))
    )
  })

  return {
    ok: templateResult.ok && ruleResult.ok,
    status: templateResult.ok && ruleResult.ok ? 200 : 500,
    message: templateResult.ok && ruleResult.ok ? '상황별 문자 템플릿과 자동화 규칙을 초기화했습니다.' : '템플릿 또는 규칙 초기화에 실패했습니다.',
    templates: rows(templateResult),
    rules: rows(ruleResult),
    detail: templateResult.error || ruleResult.error
  }
}

async function loadConfig() {
  const [templateResult, ruleResult, runResult] = await Promise.all([
    rest('ops_message_templates?select=*&order=situation.asc,title.asc&limit=500'),
    rest('ops_message_rules?select=*&order=priority.asc,title.asc&limit=500'),
    rest('ops_message_automation_runs?select=*&order=created_at.desc&limit=50')
  ])

  if (!templateResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '문자 템플릿 테이블을 불러오지 못했습니다. SQL 실행 여부를 확인해주세요.',
      detail: templateResult.error
    }
  }

  return {
    ok: true,
    templates: rows(templateResult),
    rules: rows(ruleResult),
    runs: rows(runResult),
    config: {
      autoDispatchGlobal: process.env.MESSAGE_AUTOMATION_AUTO_DISPATCH === 'true',
      opsAlertPhone: process.env.OPS_ALERT_PHONE || '',
      opsAlertName: process.env.OPS_ALERT_NAME || '운영실'
    },
    generatedAt: new Date().toISOString()
  }
}

async function callDispatch(request: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.OPS_AUTOPILOT_SECRET || process.env.RESPONSE_ESCALATION_SECRET || ''

  const candidates = [
    '/api/notifications/dispatch',
    '/api/notification-dispatch',
    '/api/ops-notifications/dispatch'
  ]

  const attempts = []

  for (const path of candidates) {
    try {
      const url = new URL(path, request.nextUrl.origin)

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: secret ? 'Bearer ' + secret : ''
        },
        body: JSON.stringify({ action: 'dispatchQueued', limit: 50 }),
        cache: 'no-store'
      })

      const raw = await response.text()
      let data: unknown = raw

      try {
        data = raw ? JSON.parse(raw) : null
      } catch {
        data = raw
      }

      attempts.push({
        path,
        ok: response.ok,
        status: response.status,
        data
      })

      if (response.ok || response.status !== 404) {
        return {
          ok: response.ok,
          attempts
        }
      }
    } catch (error) {
      attempts.push({
        path,
        ok: false,
        error: error instanceof Error ? error.message : 'dispatch call failed'
      })
    }
  }

  return {
    ok: false,
    attempts
  }
}

async function loadAutomationData() {
  const [templatesResult, rulesResult, requestResult, outboxResult, householdResult] = await Promise.all([
    rest('ops_message_templates?select=*&enabled=eq.true&limit=500'),
    rest('ops_message_rules?select=*&enabled=eq.true&order=priority.asc&limit=500'),
    rest('care_response_requests?select=*&order=created_at.desc&limit=3000'),
    rest('notification_outbox?select=*&order=created_at.desc&limit=3000'),
    rest('ops_private_pilot_households?select=*&order=created_at.desc&limit=1000')
  ])

  return {
    templates: rows(templatesResult),
    rules: rows(rulesResult),
    requests: rows(requestResult),
    outbox: rows(outboxResult),
    households: rows(householdResult)
  }
}

function templateByCode(templates: Row[], code: string) {
  return templates.find((item) => text(item.template_code) === code)
}

async function runSituations(request: NextRequest, body: Row) {
  const runType = text(body.runType) || 'manual'
  const includeDaily = bool(body.includeDaily)
  const autoDispatchGlobal = process.env.MESSAGE_AUTOMATION_AUTO_DISPATCH === 'true' || bool(body.forceDispatch)
  const data = await loadAutomationData()
  const results: QueueResult[] = []
  const now = new Date().toISOString()

  for (const rule of data.rules) {
    const trigger = text(rule.trigger_type)
    const template = templateByCode(data.templates, text(rule.template_code))

    if (!template || template.enabled === false || rule.auto_queue === false) {
      continue
    }

    const templateBody = text(template.body)
    const templateCode = text(template.template_code)
    const title = text(template.title)
    const ruleKey = text(rule.rule_key)

    if (trigger === 'request_signal') {
      const signalType = text(rule.signal_type)

      for (const item of data.requests) {
        if (text(item.signal_type) !== signalType) continue

        const context = baseContext(request, item)
        const sourceKey = `ma-${ruleKey}-${text(item.id)}`

        results.push(await queueMessage({
          familyCode: text(item.family_code),
          toName: text(item.guardian_name) || '보호자',
          toPhone: text(item.guardian_phone),
          title,
          body: render(templateBody, context),
          templateCode,
          reason: ruleKey,
          targetUrl: '/mobile/guardian',
          sourceKey,
          payload: {
            requestId: text(item.id),
            ruleKey
          }
        }))
      }
    }

    if (trigger === 'provider_accepted') {
      for (const item of data.requests) {
        if (!text(item.accepted_by_provider_id)) continue
        if (!['accepted', 'in_progress', 'completed'].includes(text(item.status))) continue

        const context = {
          ...baseContext(request, item),
          파트너명: text(item.accepted_by_name) || '생활확인 파트너'
        }

        const sourceKey = `ma-${ruleKey}-${text(item.id)}`

        results.push(await queueMessage({
          familyCode: text(item.family_code),
          toName: text(item.guardian_name) || '보호자',
          toPhone: text(item.guardian_phone),
          title,
          body: render(templateBody, context),
          templateCode,
          reason: ruleKey,
          targetUrl: '/mobile/guardian',
          sourceKey,
          payload: {
            requestId: text(item.id),
            ruleKey
          }
        }))
      }
    }

    if (trigger === 'request_completed') {
      for (const item of data.requests) {
        if (text(item.status) !== 'completed') continue

        const context = baseContext(request, item)
        const sourceKey = `ma-${ruleKey}-${text(item.id)}`

        results.push(await queueMessage({
          familyCode: text(item.family_code),
          toName: text(item.guardian_name) || '보호자',
          toPhone: text(item.guardian_phone),
          title,
          body: render(templateBody, context),
          templateCode,
          reason: ruleKey,
          targetUrl: '/mobile/guardian',
          sourceKey,
          payload: {
            requestId: text(item.id),
            ruleKey
          }
        }))
      }
    }

    if (trigger === 'stale_urgent') {
      const minAge = Number(rule.min_age_minutes || 10)

      for (const item of data.requests) {
        if (!isOpenUrgent(item)) continue

        const age = ageMinutes(item.created_at)
        if (age === null || age < minAge) continue
        if (text(item.accepted_by_provider_id)) continue

        const context = {
          ...baseContext(request, item),
          경과분: age
        }

        const sourceKey = `ma-${ruleKey}-${text(item.id)}`

        results.push(await queueMessage({
          familyCode: text(item.family_code),
          toName: process.env.OPS_ALERT_NAME || '운영실',
          toPhone: process.env.OPS_ALERT_PHONE || '',
          title,
          body: render(templateBody, context),
          templateCode,
          reason: ruleKey,
          targetUrl: '/ops/urgent-dispatch',
          sourceKey,
          payload: {
            requestId: text(item.id),
            ruleKey
          }
        }))
      }
    }

    if (trigger === 'sms_failed') {
      for (const item of data.outbox) {
        if (text(item.status) !== 'failed') continue

        const context = {
          ...baseContext(request, item),
          수신자명: text(item.to_name) || text(item.to_phone) || '수신자',
          실패사유: text((item.payload as Row)?.error) || '문자 발송 실패',
          부모님명: text(item.title) || '알림'
        }

        const sourceKey = `ma-${ruleKey}-${text(item.id)}`

        results.push(await queueMessage({
          familyCode: text(item.family_code),
          toName: process.env.OPS_ALERT_NAME || '운영실',
          toPhone: process.env.OPS_ALERT_PHONE || '',
          title,
          body: render(templateBody, context),
          templateCode,
          reason: ruleKey,
          targetUrl: '/ops/notification-dispatch',
          sourceKey,
          payload: {
            outboxId: text(item.id),
            ruleKey
          }
        }))
      }
    }

    if (trigger === 'daily_prompt' && includeDaily) {
      for (const item of data.households) {
        if (!['active', 'onboarding', 'mini'].includes(text(item.status))) continue

        const appPath = text(item.onboarding_url) || '/mobile/parent'
        const context = {
          ...baseContext(request, item),
          부모님명: text(item.parent_name) || '부모님',
          보호자명: text(item.guardian_name) || '보호자',
          지역: text(item.service_area) || '우리동네',
          앱링크: fullUrl(request, appPath),
          실증기간: '14일'
        }

        const sourceKey = `ma-${ruleKey}-${text(item.pilot_key)}-${text(item.family_code)}-${todayKey()}`

        results.push(await queueMessage({
          familyCode: text(item.family_code),
          toName: text(item.parent_name) || text(item.guardian_name) || '실증 참여자',
          toPhone: phone(item.parent_phone) || phone(item.guardian_phone),
          title,
          body: render(templateBody, context),
          templateCode,
          reason: ruleKey,
          targetUrl: appPath,
          sourceKey,
          payload: {
            householdId: text(item.id),
            pilotKey: text(item.pilot_key),
            ruleKey
          }
        }))
      }
    }
  }

  const queued = results.filter((item) => !item.skipped && item.ok).length
  const skipped = results.filter((item) => item.skipped).length
  const failed = results.filter((item) => !item.ok).length

  let dispatchResult: unknown = {
    ok: false,
    skipped: true,
    reason: 'MESSAGE_AUTOMATION_AUTO_DISPATCH is not true or no queued messages'
  }

  const autoDispatchRequested = autoDispatchGlobal && queued > 0

  if (autoDispatchRequested) {
    dispatchResult = await callDispatch(request)
  }

  const status = failed > 0 ? 'warning' : 'ok'
  const summary = `상황별 문자 자동화 실행: 생성 ${queued}건, 중복/번호없음 ${skipped}건, 실패 ${failed}건`

  const runResult = await insertRows('ops_message_automation_runs', [
    {
      run_type: runType,
      status,
      summary,
      metrics: {
        queued,
        skipped,
        failed,
        total: results.length,
        autoDispatchRequested
      },
      results,
      dispatch_result: dispatchResult as Row,
      payload: {
        includeDaily,
        generatedAt: now
      },
      created_by: text(body.createdBy) || '운영실'
    }
  ])

  return {
    ok: failed === 0,
    status: failed === 0 ? 200 : 207,
    message: summary,
    metrics: {
      queued,
      skipped,
      failed,
      total: results.length,
      autoDispatchRequested
    },
    results,
    dispatchResult,
    run: rows(runResult)[0]
  }
}

async function updateRule(body: Row) {
  const ruleKey = text(body.ruleKey)
  const patchInput = body.patch && typeof body.patch === 'object' ? body.patch as Row : {}

  if (!ruleKey) {
    return {
      ok: false,
      status: 400,
      message: 'ruleKey가 필요합니다.'
    }
  }

  const patch: Row = {
    updated_at: new Date().toISOString()
  }

  for (const key of ['enabled', 'auto_queue', 'auto_dispatch', 'min_age_minutes', 'cooldown_minutes', 'notes']) {
    if (Object.prototype.hasOwnProperty.call(patchInput, key)) patch[key] = patchInput[key]
  }

  const result = await rest('ops_message_rules?rule_key=eq.' + encodeURIComponent(ruleKey), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '자동문자 규칙을 수정했습니다.' : '규칙 수정에 실패했습니다.',
    rule: rows(result)[0],
    detail: result.error
  }
}

async function updateTemplate(body: Row) {
  const templateCode = text(body.templateCode)
  const patchInput = body.patch && typeof body.patch === 'object' ? body.patch as Row : {}

  if (!templateCode) {
    return {
      ok: false,
      status: 400,
      message: 'templateCode가 필요합니다.'
    }
  }

  const patch: Row = {
    updated_at: new Date().toISOString()
  }

  for (const key of ['title', 'body', 'enabled', 'severity']) {
    if (Object.prototype.hasOwnProperty.call(patchInput, key)) patch[key] = patchInput[key]
  }

  const result = await rest('ops_message_templates?template_code=eq.' + encodeURIComponent(templateCode), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '문자 템플릿을 수정했습니다.' : '템플릿 수정에 실패했습니다.',
    template: rows(result)[0],
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

  const data = await loadConfig()
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

  if (action === 'seedDefaults') result = await seedDefaults()
  else if (action === 'runSituations') result = await runSituations(request, { ...body, runType: 'manual' })
  else if (action === 'runDaily') result = await runSituations(request, { ...body, includeDaily: true, runType: 'daily_manual' })
  else if (action === 'updateRule') result = await updateRule(body)
  else if (action === 'updateTemplate') result = await updateTemplate(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
