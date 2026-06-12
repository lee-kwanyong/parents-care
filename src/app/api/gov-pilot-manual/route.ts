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

const phases = [
  {
    key: 'phase1',
    title: 'PHASE 1 · 인프라 구축기',
    period: '1–2개월',
    objective: '지자체 연계 대상자와 운영 인력을 준비하고, 대상자·도움망·동의·관제 화면을 세팅합니다.',
    steps: [
      '실증 대상자 A그룹/B그룹 기준 확정',
      '대상자 개인정보 동의 절차 안내',
      '운영실 계정과 접근 권한 점검',
      '생활지원사·요양보호사 교육 일정 확정',
      '도움망 네트워크 기본 등록',
      '테스트 대상자와 테스트 사건 생성'
    ]
  },
  {
    key: 'phase2',
    title: 'PHASE 2 · AI 관제 최적화기',
    period: '3–5개월',
    objective: '안부 신호, 후속조치, 알림, 도움망 요청, 운영실 수동 확인을 매일 점검합니다.',
    steps: [
      '매일 운영실 Heartbeat 정상 실행 확인',
      '긴급 사건과 수동 연결 사건 우선 처리',
      '문자 발송 성공·실패 기록 점검',
      '도움망 수락률과 평균 처리 시간을 주간 확인',
      '사건별 타임라인에 통화·배정·완료 기록 남기기',
      '개인정보 열람 로그와 동의 기록 점검'
    ]
  },
  {
    key: 'phase3',
    title: 'PHASE 3 · 성과 도출·조달 연계기',
    period: '6개월차',
    objective: '주간·월간 운영보고서와 제출 패키지를 생성해 지자체 공식 성과 자료로 정리합니다.',
    steps: [
      '주간·월간 운영보고서 저장',
      '위험 가구 목록과 반복 신호 대상자 검토',
      '개인정보 감사 로그 CSV 다운로드',
      '지자체 제출 패키지 생성',
      '인쇄/PDF 제출본 확인',
      '조달청 혁신제품 지정용 성과 지표 정리'
    ]
  }
]

const roles = [
  {
    key: 'gov',
    title: '지자체 담당자',
    mission: '실증 대상자 기준, 개인정보 동의, 성과보고서, 예산·조달 연계를 관리합니다.',
    tasks: [
      'A/B그룹 대상자 선정 기준 승인',
      '개인정보 동의·감사 로그 확인',
      '주간·월간 운영보고서 검토',
      '실증 종료 후 성과 자료 확인'
    ]
  },
  {
    key: 'ops',
    title: '운영실',
    mission: '오토파일럿, Heartbeat, 알림, 도움망, 사건 타임라인, 제출 패키지를 운영합니다.',
    tasks: [
      '매일 열린 사건과 긴급 사건 확인',
      '도움망 요청과 문자 발송 상태 점검',
      '통화·배정·완료 기록 남기기',
      '보고서와 제출 패키지 생성'
    ]
  },
  {
    key: 'careWorker',
    title: '생활지원사·요양보호사',
    mission: '지역 도움망 요청을 수락하고 전화·방문·식사·복약 확인 결과를 남깁니다.',
    tasks: [
      '요청함 확인',
      '수락 가능 여부 판단',
      '전화 또는 방문 확인',
      '처리 완료 결과 입력'
    ]
  },
  {
    key: 'guardian',
    title: '보호자·가족',
    mission: '부모님 신호를 확인하고 가족 후속조치 또는 운영실 연결 결과를 확인합니다.',
    tasks: [
      '부모님 연결코드 등록',
      '안부 리포트 확인',
      '후속조치 요청 확인',
      '가족 실행 보드 처리'
    ]
  }
]

function buildChecklist() {
  const items: Array<{
    step_key: string
    phase_key: string
    role_key: string
    title: string
    description: string
  }> = []

  for (const phase of phases) {
    phase.steps.forEach((step, index) => {
      items.push({
        step_key: `${phase.key}-${index + 1}`,
        phase_key: phase.key,
        role_key: index < 2 ? 'gov' : index < 4 ? 'ops' : 'careWorker',
        title: step,
        description: `${phase.title} · ${step}`
      })
    })
  }

  return items
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
      error: 'Supabase 환경변수가 없습니다.'
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

function statusOf(progress: Row | undefined) {
  return text(progress?.status) || 'pending'
}

async function loadData() {
  const [progressResult, trainingResult] = await Promise.all([
    rest('gov_pilot_manual_progress?select=*&order=phase_key.asc,step_key.asc&limit=300'),
    rest('gov_pilot_training_logs?select=*&order=created_at.desc&limit=200')
  ])

  if (!progressResult.ok) {
    return {
      ok: false,
      status: 500,
      message: '실증 매뉴얼 진행상태를 불러오지 못했습니다.',
      detail: progressResult.error
    }
  }

  const progressRows = rows(progressResult)
  const progressMap: Record<string, Row> = {}

  for (const row of progressRows) {
    progressMap[text(row.step_key)] = row
  }

  const checklist = buildChecklist().map((item) => {
    const progress = progressMap[item.step_key]

    return {
      ...item,
      status: statusOf(progress),
      note: text(progress?.note),
      completed_by: text(progress?.completed_by),
      completed_at: text(progress?.completed_at),
      updated_at: text(progress?.updated_at)
    }
  })

  const completed = checklist.filter((item) => item.status === 'done').length
  const total = checklist.length

  return {
    ok: true,
    phases,
    roles,
    checklist,
    trainings: rows(trainingResult),
    metrics: {
      total,
      completed,
      pending: total - completed,
      progressRate: total ? Math.round((completed / total) * 100) : 0,
      trainings: rows(trainingResult).length,
      attendees: rows(trainingResult).reduce((sum, row) => sum + (Number(row.attendee_count) || 0), 0)
    }
  }
}

async function seedProgress() {
  const items = buildChecklist().map((item) => ({
    step_key: item.step_key,
    phase_key: item.phase_key,
    role_key: item.role_key,
    title: item.title,
    status: 'pending',
    note: item.description,
    payload: item,
    updated_at: new Date().toISOString()
  }))

  const result = await rest('gov_pilot_manual_progress?on_conflict=step_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(items)
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '실증 체크리스트를 초기화했습니다.' : '체크리스트 초기화에 실패했습니다.',
    items: rows(result),
    detail: result.error
  }
}

async function markStep(body: Row) {
  const stepKey = text(body.stepKey)
  const checklist = buildChecklist()
  const step = checklist.find((item) => item.step_key === stepKey)

  if (!step) {
    return {
      ok: false,
      status: 404,
      message: '체크리스트 항목을 찾지 못했습니다.'
    }
  }

  const status = text(body.status) || 'done'
  const now = new Date().toISOString()

  const result = await rest('gov_pilot_manual_progress?on_conflict=step_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([
      {
        step_key: step.step_key,
        phase_key: step.phase_key,
        role_key: step.role_key,
        title: step.title,
        status,
        note: text(body.note) || step.description,
        completed_by: text(body.completedBy) || '운영실',
        completed_at: status === 'done' ? now : null,
        payload: step,
        updated_at: now
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: status === 'done' ? '체크리스트를 완료 처리했습니다.' : '체크리스트를 대기 상태로 변경했습니다.',
    item: rows(result)[0],
    detail: result.error
  }
}

async function addTrainingLog(body: Row) {
  const result = await rest('gov_pilot_training_logs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        training_type: text(body.trainingType) || 'orientation',
        audience: text(body.audience) || 'ops',
        trainer_name: text(body.trainerName) || '운영실',
        attendee_count: Number(body.attendeeCount) || 0,
        session_date: text(body.sessionDate) || new Date().toISOString().slice(0, 10),
        note: text(body.note) || '실증 운영 교육 기록',
        payload: {
          original: body
        }
      }
    ])
  })

  return {
    ok: result.ok,
    status: result.ok ? 200 : 500,
    message: result.ok ? '교육 기록을 저장했습니다.' : '교육 기록 저장에 실패했습니다.',
    training: rows(result)[0],
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

  if (action === 'seedProgress') result = await seedProgress()
  else if (action === 'markStep') result = await markStep(body)
  else if (action === 'addTrainingLog') result = await addTrainingLog(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
