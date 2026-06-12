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

type QaStatus = 'pending' | 'done' | 'blocked'

type QaItem = {
  itemKey: string
  category: string
  title: string
  description: string
  critical: boolean
  route?: string
  autoCheck?: string
}

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'OPS_SESSION_TOKEN',
  'ops_session_token',
  'ops_session'
]

const qaItems: QaItem[] = [
  {
    itemKey: 'env-service-role',
    category: '환경',
    title: 'SUPABASE_SERVICE_ROLE_KEY 설정',
    description: 'RLS 하드닝 이후 운영실 API가 DB에 접근하려면 service role key가 반드시 필요합니다.',
    critical: true,
    route: '/admin/ops/security-center',
    autoCheck: 'SUPABASE_SERVICE_ROLE_KEY'
  },
  {
    itemKey: 'env-ops-auth',
    category: '환경',
    title: '운영실 인증 비밀번호 설정',
    description: '운영실·지자체·개인정보 화면은 운영실 인증 후 접근되어야 합니다.',
    critical: true,
    route: '/admin/ops/login',
    autoCheck: 'ANBU_OPS_PASSWORD'
  },
  {
    itemKey: 'env-cron-secrets',
    category: '환경',
    title: '자동운영 Secret 설정',
    description: 'CRON_SECRET, OPS_AUTOPILOT_SECRET, RESPONSE_ESCALATION_SECRET 누락 여부를 확인합니다.',
    critical: true,
    route: '/admin/ops/control-center',
    autoCheck: 'CRON_SECRET_BUNDLE'
  },
  {
    itemKey: 'sms-solapi',
    category: '문자',
    title: 'SOLAPI 문자 발송 설정',
    description: 'SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER와 IP 허용 상태를 확인합니다.',
    critical: true,
    route: '/admin/ops/notification-dispatch',
    autoCheck: 'SOLAPI_BUNDLE'
  },
  {
    itemKey: 'sms-test',
    category: '문자',
    title: '운영실 테스트 문자 발송',
    description: '테스트 문자 1건을 내 번호로 보내고 성공/실패 기록을 확인합니다.',
    critical: true,
    route: '/admin/ops/notification-dispatch'
  },
  {
    itemKey: 'rls-security',
    category: '보안',
    title: 'RLS·권한 점검 완료',
    description: '공개 anon key로 사건·문자·개인정보 테이블이 직접 조회되지 않는지 확인합니다.',
    critical: true,
    route: '/admin/ops/security-center'
  },
  {
    itemKey: 'privacy-consent',
    category: '보안',
    title: '개인정보 동의·열람 감사 확인',
    description: '동의 상태와 열람 감사 로그가 운영실·지자체 보고서에 남는지 확인합니다.',
    critical: true,
    route: '/admin/ops/privacy-audit'
  },
  {
    itemKey: 'control-center',
    category: '운영',
    title: '운영실 자동운영 상태판 확인',
    description: 'Heartbeat, 오토파일럿, 긴급 사건, 문자 대기, 가용 요양보호사 수가 한 화면에 표시되는지 확인합니다.',
    critical: true,
    route: '/admin/ops/control-center'
  },
  {
    itemKey: 'urgent-dispatch',
    category: '운영',
    title: '요양보호사 즉시 배치 흐름 점검',
    description: '긴급 요청 생성 → 가용 요양보호사 배치 → 문자 대기열 생성까지 확인합니다.',
    critical: true,
    route: '/admin/ops/urgent-dispatch'
  },
  {
    itemKey: 'urgent-token',
    category: '운영',
    title: '1회용 토큰 수락 링크 점검',
    description: '문자 링크로 접속했을 때 수락 전 상세 위치가 숨겨지고, 수락 후 표시되는지 확인합니다.',
    critical: true,
    route: '/provider/urgent-requests'
  },
  {
    itemKey: 'state-machine',
    category: '운영',
    title: '긴급 사건 상태 머신 점검',
    description: '중복 수락, 만료 링크, 오래된 미수락 사건, 완료 상태 동기화가 정리되는지 확인합니다.',
    critical: true,
    route: '/admin/ops/state-machine'
  },
  {
    itemKey: 'demo-runner',
    category: '시연',
    title: '실증 시연 모드 준비',
    description: '버튼 하나로 대상자·사건·도움망·문자 대기열·보고서 반영 흐름을 생성할 수 있는지 확인합니다.',
    critical: false,
    route: '/gov/demo-runner'
  },
  {
    itemKey: 'reports',
    category: '보고',
    title: '운영보고서 생성 확인',
    description: '대상자, 사건, 문자, 도움망, 개인정보 감사 지표가 주간·월간 보고서에 반영되는지 확인합니다.',
    critical: true,
    route: '/gov/reports'
  },
  {
    itemKey: 'submission-package',
    category: '보고',
    title: '지자체 제출 패키지 다운로드',
    description: '대상자 현황, 사건 이력, 문자 기록, 개인정보 감사, 동의 기록 CSV/JSON 파일을 다운로드합니다.',
    critical: true,
    route: '/gov/submission-package'
  },
  {
    itemKey: 'proposal-page',
    category: '제안',
    title: '외부 제안 페이지 확인',
    description: '지자체 담당자가 보는 /proposal 페이지와 문의 접수 흐름을 확인합니다.',
    critical: false,
    route: '/proposal'
  },
  {
    itemKey: 'rehearsal',
    category: '시연',
    title: '15분 발표 리허설 완료',
    description: '운영실 담당자가 실제 발표 순서대로 한 번 이상 전체 시연을 수행합니다.',
    critical: true,
    route: '/admin/ops/pilot-qa'
  }
]

const demoScript = [
  {
    step: 1,
    time: '0:00–1:00',
    title: '문제 정의',
    screen: '/proposal',
    talk: '초고령사회에서 보호자 불안, 돌봄 인력 부족, 지자체 행정 과부하가 동시에 커지고 있습니다. 안부웍스는 안부 확인에서 끝나는 앱이 아니라 후속조치와 보고까지 연결하는 관제 플랫폼입니다.'
  },
  {
    step: 2,
    time: '1:00–2:30',
    title: '제품 한 문장 소개',
    screen: '/response/about',
    talk: '부모님의 식사·복약·몸 상태·도움 요청 신호를 가족, 운영실, 지역 도움망, 지자체가 처리 가능한 행동으로 연결합니다.'
  },
  {
    step: 3,
    time: '2:30–4:00',
    title: '역할별 화면 소개',
    screen: '/portal/child',
    talk: '부모님, 자녀·보호자, 요양보호사, 운영실, 지자체가 각자 필요한 화면만 봅니다. 보호자는 상태와 다음 행동을 보고, 운영실은 관제와 배정을 봅니다.'
  },
  {
    step: 4,
    time: '4:00–5:30',
    title: '운영실 상태판',
    screen: '/admin/ops/control-center',
    talk: '운영자는 자동운영 정상 여부, 긴급 사건, 문자 대기, 가용 요양보호사, 개인정보 동의 상태를 한 화면에서 확인합니다.'
  },
  {
    step: 5,
    time: '5:30–7:30',
    title: '긴급 도움 요청 시연',
    screen: '/admin/ops/urgent-dispatch',
    talk: '갑자기 도움이 필요한 경우 운영실이 같은 권역의 가용 요양보호사·돌봄파트너를 즉시 배치합니다. 안부웍스는 119를 대체하지 않고 응급 전 단계의 생활 확인과 연결을 담당합니다.'
  },
  {
    step: 6,
    time: '7:30–9:00',
    title: '1회용 수락 링크',
    screen: '/provider/urgent-requests',
    talk: '요양보호사는 문자로 받은 1회용 링크에서 요청을 수락합니다. 수락 전에는 상세 위치가 숨겨지고, 수락 후에만 상세 정보가 열립니다.'
  },
  {
    step: 7,
    time: '9:00–10:30',
    title: '상태 머신과 보안',
    screen: '/admin/ops/state-machine',
    talk: '중복 수락, 만료 링크, 완료 후 재배치 같은 운영 사고를 상태 머신이 감지하고 정리합니다. RLS 점검센터에서 공개 접근도 확인합니다.'
  },
  {
    step: 8,
    time: '10:30–12:00',
    title: '문자 발송과 사건 타임라인',
    screen: '/admin/ops/notification-dispatch',
    talk: '보호자와 도움망에게 보낼 문자는 대기열로 관리하고, 신호·문자·수락·통화·완료 기록은 사건 타임라인에 남습니다.'
  },
  {
    step: 9,
    time: '12:00–13:30',
    title: '운영보고서',
    screen: '/gov/reports',
    talk: '지자체는 대상자 수, 긴급 신호, 완료 사건, 도움망 수락률, 문자 성공률, 개인정보 감사 로그를 보고서로 확인합니다.'
  },
  {
    step: 10,
    time: '13:30–15:00',
    title: '제출 패키지와 마무리',
    screen: '/gov/submission-package',
    talk: '마지막으로 대상자 현황, 사건 이력, 문자 기록, 개인정보 감사, 동의 기록을 제출 패키지로 다운로드합니다. 실증 후 조달·확산에 필요한 증빙 구조까지 제공합니다.'
  }
]

function envSet(name: string) {
  return Boolean(process.env[name])
}

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

function autoStatus(autoCheck?: string): { status?: QaStatus; autoMessage?: string } {
  if (!autoCheck) return {}

  if (autoCheck === 'SUPABASE_SERVICE_ROLE_KEY') {
    return envSet('SUPABASE_SERVICE_ROLE_KEY')
      ? { status: 'done', autoMessage: 'Service Role Key 설정됨' }
      : { status: 'blocked', autoMessage: 'Service Role Key 미설정' }
  }

  if (autoCheck === 'ANBU_OPS_PASSWORD') {
    return opsPassword()
      ? { status: 'done', autoMessage: '운영실 비밀번호 설정됨' }
      : { status: 'blocked', autoMessage: 'ANBU_OPS_PASSWORD 또는 OPS_PASSWORD 미설정' }
  }

  if (autoCheck === 'CRON_SECRET_BUNDLE') {
    const ok = envSet('CRON_SECRET') && envSet('OPS_AUTOPILOT_SECRET') && envSet('RESPONSE_ESCALATION_SECRET')
    return ok
      ? { status: 'done', autoMessage: '자동운영 Secret 모두 설정됨' }
      : { status: 'blocked', autoMessage: 'CRON_SECRET / OPS_AUTOPILOT_SECRET / RESPONSE_ESCALATION_SECRET 중 누락' }
  }

  if (autoCheck === 'SOLAPI_BUNDLE') {
    const ok = envSet('SOLAPI_API_KEY') && envSet('SOLAPI_API_SECRET') && envSet('SOLAPI_SENDER')
    return ok
      ? { status: 'done', autoMessage: 'SOLAPI 환경변수 설정됨' }
      : { status: 'blocked', autoMessage: 'SOLAPI_API_KEY / SOLAPI_API_SECRET / SOLAPI_SENDER 중 누락' }
  }

  return {}
}

function calculateMetrics(items: Array<QaItem & Row>) {
  const total = items.length
  const done = items.filter((item) => text(item.status) === 'done').length
  const blocked = items.filter((item) => text(item.status) === 'blocked').length
  const criticalTotal = items.filter((item) => item.critical).length
  const criticalPending = items.filter((item) => item.critical && text(item.status) !== 'done').length
  const score = total ? Math.round((done / total) * 100) : 0

  return {
    total,
    done,
    pending: total - done - blocked,
    blocked,
    criticalTotal,
    criticalPending,
    score,
    ready: criticalPending === 0 && score >= 80
  }
}

async function loadData() {
  const [checksResult, runsResult] = await Promise.all([
    rest('ops_pilot_qa_checks?select=*&order=category.asc,item_key.asc&limit=500'),
    rest('ops_pilot_qa_runs?select=*&order=created_at.desc&limit=50')
  ])

  if (!checksResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '실증 QA 체크리스트를 불러오지 못했습니다. SQL 실행 여부를 확인해주세요.',
      detail: checksResult.error
    }
  }

  const checkRows = rows(checksResult)
  const byKey: Record<string, Row> = {}

  for (const row of checkRows) {
    byKey[text(row.item_key)] = row
  }

  const checklist = qaItems.map((item) => {
    const saved = byKey[item.itemKey]
    const auto = autoStatus(item.autoCheck)
    const status = auto.status || text(saved?.status) || 'pending'

    return {
      ...item,
      status,
      note: text(saved?.note),
      completedBy: text(saved?.completed_by),
      completedAt: text(saved?.completed_at),
      autoMessage: auto.autoMessage || ''
    }
  })

  const metrics = calculateMetrics(checklist)

  return {
    ok: true,
    status: metrics.ready ? 'ready' : metrics.criticalPending > 0 ? 'need_check' : 'almost_ready',
    generatedAt: new Date().toISOString(),
    checklist,
    demoScript,
    metrics,
    runs: rows(runsResult),
    config: {
      hasSupabaseServiceRoleKey: envSet('SUPABASE_SERVICE_ROLE_KEY'),
      hasOpsPassword: Boolean(opsPassword()),
      hasCronSecret: envSet('CRON_SECRET'),
      hasOpsAutopilotSecret: envSet('OPS_AUTOPILOT_SECRET'),
      hasResponseEscalationSecret: envSet('RESPONSE_ESCALATION_SECRET'),
      hasSolapiApiKey: envSet('SOLAPI_API_KEY'),
      hasSolapiApiSecret: envSet('SOLAPI_API_SECRET'),
      hasSolapiSender: envSet('SOLAPI_SENDER')
    }
  }
}

async function seedChecklist() {
  const now = new Date().toISOString()

  const result = await rest('ops_pilot_qa_checks?on_conflict=item_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(
      qaItems.map((item) => ({
        item_key: item.itemKey,
        category: item.category,
        title: item.title,
        status: autoStatus(item.autoCheck).status || 'pending',
        critical: item.critical,
        note: autoStatus(item.autoCheck).autoMessage || item.description,
        payload: item,
        updated_at: now
      }))
    )
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '실증 QA 체크리스트를 초기화했습니다.' : '체크리스트 초기화에 실패했습니다.',
    items: rows(result),
    detail: result.error
  }
}

async function updateItem(body: Row) {
  const itemKey = text(body.itemKey)
  const status = text(body.status) || 'pending'
  const note = text(body.note)
  const completedBy = text(body.completedBy) || '운영실'

  const item = qaItems.find((entry) => entry.itemKey === itemKey)

  if (!item) {
    return {
      ok: false,
      status: 404,
      message: '체크리스트 항목을 찾지 못했습니다.'
    }
  }

  const now = new Date().toISOString()

  const result = await rest('ops_pilot_qa_checks?on_conflict=item_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([
      {
        item_key: item.itemKey,
        category: item.category,
        title: item.title,
        status,
        critical: item.critical,
        note: note || item.description,
        completed_by: status === 'done' ? completedBy : null,
        completed_at: status === 'done' ? now : null,
        payload: item,
        updated_at: now
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: status === 'done' ? '체크리스트를 완료 처리했습니다.' : status === 'blocked' ? '체크리스트를 차단 상태로 표시했습니다.' : '체크리스트를 대기 상태로 변경했습니다.',
    item: rows(result)[0],
    detail: result.error
  }
}

async function resetChecklist() {
  const result = await rest('ops_pilot_qa_checks?item_key=not.is.null', {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' }
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '체크리스트를 초기화 전 상태로 되돌렸습니다.' : '체크리스트 초기화에 실패했습니다.',
    deleted: rows(result),
    detail: result.error
  }
}

async function saveRunSnapshot() {
  const data = await loadData() as Row

  if (data.ok !== true) return data

  const metrics = data.metrics as Row
  const score = Number(metrics.score || 0)
  const status = text(data.status)

  const result = await rest('ops_pilot_qa_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        run_type: 'pilot_qa_snapshot',
        status,
        score,
        summary:
          status === 'ready'
            ? '실증 시연 준비 상태입니다.'
            : '실증 전 점검이 필요한 항목이 남아 있습니다.',
        metrics: data.metrics,
        checklist: data.checklist,
        demo_script: data.demoScript,
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
    message: result.ok ? '실증 QA 스냅샷을 저장했습니다.' : '실증 QA 스냅샷 저장에 실패했습니다.',
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

  if (action === 'seedChecklist') result = await seedChecklist()
  else if (action === 'updateItem') result = await updateItem(body)
  else if (action === 'resetChecklist') result = await resetChecklist()
  else if (action === 'saveRunSnapshot') result = await saveRunSnapshot()
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
