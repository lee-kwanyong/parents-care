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

function toKst(value: unknown) {
  const raw = text(value)
  if (!raw) return ''

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function claims() {
  const safeClaims = [
    {
      title: '부모님 5버튼 안부 앱',
      say: '부모님은 괜찮아요, 밥을 못 먹었어요, 약을 못 먹었어요, 몸이 아파요, 지금 도움이 필요해요 중 하나를 눌러 안부 신호를 보낼 수 있습니다.',
      proof: '/mobile/parent'
    },
    {
      title: '보호자 오늘 리포트',
      say: '보호자는 가족코드와 휴대폰 뒤 4자리로 부모님 안부 신호, 문자 기록, 다음 할 일을 확인할 수 있습니다.',
      proof: '/guardian/today'
    },
    {
      title: '미응답 처리와 대리입력',
      say: '부모님이 앱을 누르지 못한 경우 보호자 또는 운영실이 전화 확인 후 대신 기록할 수 있습니다.',
      proof: '/ops/no-response, /guardian/proxy-checkin'
    },
    {
      title: '운영실 관제',
      say: '운영실은 가입자, 실증 가구, 안부 신호, 문자, 리포트 조회, 미응답 가구를 한 화면에서 확인할 수 있습니다.',
      proof: '/portal/ops, /ops/users, /ops/pilot-report'
    },
    {
      title: '비의료 생활확인 설계',
      say: '안부웍스는 의료 진단, 치료, 응급 구조를 대체하지 않고 보호자 확인과 생활확인 연결을 돕는 비의료 서비스입니다.',
      proof: '서비스 고지 및 화면 내 안내문'
    }
  ]

  const pilotClaims = [
    {
      title: '5~10가구 자체 예비실증',
      say: '현재는 5~10가구 규모의 자체 예비실증으로 가입, 부모님 연결, 안부 신호, 문자, 리포트 조회 전환을 검증하는 단계입니다.',
      condition: '자체 실증 리포트 지표 확보 후 외부 공유'
    },
    {
      title: '10~30가구 기관 실증',
      say: '자체 예비실증 후 방문요양센터, 복지관, 요양보호사교육원 등과 10~30가구 규모 기관 실증을 검토할 계획입니다.',
      condition: '협력기관 확보 후'
    },
    {
      title: '생활확인 파트너 연결',
      say: '요양보호사, 생활지원사, 병원동행 경험자 등 생활확인 파트너 연결은 실증 단계에서 수락률과 책임 범위를 검증합니다.',
      condition: '파트너 모집/동의/책임범위 문서화 후'
    },
    {
      title: '병원동행·방문확인',
      say: '유저스푼 조사에서 수요가 확인된 병원동행과 방문안부 기능은 실증 후 제휴형 서비스로 확장합니다.',
      condition: '파트너 제휴와 운영 매뉴얼 확보 후'
    }
  ]

  const visionClaims = [
    {
      title: '500가구 B2G 실증',
      say: '500가구 B2G 관제는 장기 표준 실증 모델로 제시하되, 현재는 자체 예비실증과 기관 실증으로 근거를 쌓고 있습니다.',
      replace: '현재 500가구 운영 중 → 장기 B2G 표준 실증 모델'
    },
    {
      title: 'UWB 레이더·스마트 약통',
      say: 'UWB 레이더와 스마트 약통은 현재 앱 기반 실증 이후 연동을 검토하는 장기 IoT 고도화 방향입니다.',
      replace: '이미 연동 완료 → 장기 연동 검토'
    },
    {
      title: '지자체 통합 대시보드',
      say: '지자체 관제 대시보드는 예비실증 데이터를 기반으로 공공 실증에서 제안할 장기 B2G SaaS 방향입니다.',
      replace: '지자체 관제 제공 중 → 공공 실증 제안용 로드맵'
    },
    {
      title: '바이오헬스 데이터 연계',
      say: '현재는 안부·생활확인 데이터 중심이고, 바이오헬스 데이터 인프라와의 연계 가능성을 자문받고 있습니다.',
      replace: '바이오헬스 데이터 플랫폼 완성 → 연계 가능성 검토'
    }
  ]

  const riskyClaims = [
    {
      risky: '원클릭 119 소방망 연계',
      why: '현재 실제 119 시스템과 직접 연계된 것이 아니면 책임·규제 리스크가 큽니다.',
      safer: '응급 의심 시 119 또는 의료기관 연락을 안내합니다.'
    },
    {
      risky: '오탐률 2% 미만',
      why: '실제 센서 실증과 통계 검증 전에는 정량 성능을 확정하면 안 됩니다.',
      safer: '오탐을 줄이는 방향으로 단계적 검증을 진행합니다.'
    },
    {
      risky: '500가구 실시간 생체 신호 모니터링',
      why: '현재 앱 기반 예비실증 단계와 혼동될 수 있습니다.',
      safer: '장기적으로 500가구 B2G 표준 실증 모델을 목표로 합니다.'
    },
    {
      risky: '전국 243개 지자체 무경쟁 수의계약 진입',
      why: '조달 지정 전에는 확정 표현이 위험합니다.',
      safer: '조달청 혁신제품 등 공공 조달 연계 가능성을 검토합니다.'
    },
    {
      risky: '3차년도 45억 원 달성',
      why: '현 단계에서는 재무 목표일 뿐 확정 매출이 아닙니다.',
      safer: '3차년도 45억 원 매출 목표 시나리오를 제시합니다.'
    },
    {
      risky: 'AES-256 종단간 암호화 완벽 구축',
      why: '보안 감사 전에는 완벽 표현이 위험합니다.',
      safer: '개인정보 보호와 보안 강화를 위한 암호화·권한관리 구조를 단계적으로 고도화합니다.'
    },
    {
      risky: '의료·생체 데이터 서비스',
      why: '민감정보/의료기기/진단 서비스로 오해될 수 있습니다.',
      safer: '현재는 비의료 안부·생활확인 데이터 중심으로 운영합니다.'
    }
  ]

  const checklist = [
    '현재 가능한 기능과 장기 비전을 분리했는가?',
    '119, 응급출동, 의료진단, 치료라는 표현을 현재 기능처럼 쓰지 않았는가?',
    'UWB, 스마트 약통, AI 생체 관제를 장기 고도화로 표현했는가?',
    '500가구, 45억 매출, 오탐률 2% 등 수치를 목표/가정/로드맵으로 표현했는가?',
    '실증 규모를 5~10가구 자체 예비실증 → 10~30가구 기관 실증 → 500가구 B2G 표준 실증으로 구분했는가?',
    '비의료 생활확인 서비스라는 고지를 넣었는가?',
    '개인정보·동의·책임 범위 문구를 넣었는가?',
    '유저스푼 결과를 제품 방향 수정 근거로 반영했는가?'
  ]

  const copyBlocks = {
    biohealthMeeting:
`안부웍스는 고령 부모님의 안부 신호를 보호자 알림, 미응답 확인, 대리입력, 생활확인 파트너 연결, 리포트로 전환하는 비의료 생활확인 기반의 고령자 안심관리 플랫폼입니다.

현재는 parents-care.net 기반으로 부모님 5버튼 앱, 보호자 오늘 리포트, 상황별 문자, 미응답 처리, 운영실 관제 기능을 구축했고, 5~10가구 자체 예비실증을 통해 가입→부모님 연결→안부 신호→리포트 조회 전환을 검증하고 있습니다.

이번 미팅에서는 저희가 바이오헬스 데이터, 디지털헬스, 에이지테크, AIP 돌봄 지원 트랙 중 어디에 적합한지, 그리고 Plug and Play 또는 해외진출 연계를 위해 어떤 실증 지표와 문서를 준비해야 하는지 자문을 받고 싶습니다.`,

    municipality:
`안부웍스는 의료 진단이나 응급 출동을 대체하는 서비스가 아니라, 고령자의 안부 신호와 미응답 상황을 보호자와 운영실이 놓치지 않도록 돕는 비의료 생활확인 플랫폼입니다.

현재 단계에서는 5~10가구 자체 예비실증으로 부모님 안부 버튼, 보호자 문자 알림, 오늘 리포트, 미응답 확인, 대리입력 흐름을 검증하고 있습니다. 이후 10~30가구 기관 실증을 통해 지자체형 AIP 돌봄 관제 모델로 확장 가능성을 확인하고자 합니다.`,

    careCenter:
`안부웍스는 방문요양센터의 보호자 안심 리포트와 어르신 안부 확인 기록을 돕는 서비스입니다.

어르신이 앱에서 안부 신호를 보내거나, 보호자가 전화 확인 후 대신 기록하면 보호자는 오늘 상태와 다음 할 일을 한 화면에서 확인할 수 있습니다. 의료행위나 응급출동 요청이 아니며, 응급상황은 119 또는 의료기관 연락을 원칙으로 합니다.

처음에는 1~5가구 정도의 작은 예비실증으로 현장 의견을 듣고 싶습니다.`,

    investor:
`현재 안부웍스는 완성형 IoT 관제 서비스가 아니라, 앱 기반 안부 신호·보호자 리포트·미응답 처리·대리입력·운영실 관제 기능을 통해 시장 반응과 실증 전환율을 확인하는 단계입니다.

장기적으로는 UWB 레이더, 스마트 약통, 지자체 관제 대시보드, B2G SaaS 조달 모델로 확장하되, 현재는 유저스푼 조사와 자체 예비실증 데이터를 기반으로 제품 방향과 실증 지표를 현실화하고 있습니다.`
  }

  return {
    safeClaims,
    pilotClaims,
    visionClaims,
    riskyClaims,
    checklist,
    copyBlocks
  }
}

async function loadDashboard() {
  const data = claims()
  const snapshotResult = await rest('ops_proposal_reality_snapshots?select=*&order=created_at.desc&limit=50')

  return {
    ok: true,
    ...data,
    snapshots: rows(snapshotResult).map((item) => ({
      id: text(item.id),
      title: text(item.title),
      status: text(item.status),
      createdBy: text(item.created_by),
      createdAt: text(item.created_at),
      createdKst: toKst(item.created_at)
    })),
    sourceErrors: {
      snapshots: snapshotResult.ok ? null : snapshotResult.error
    }
  }
}

async function saveSnapshot(body: Row) {
  const createdBy = text(body.createdBy) || '운영실'
  const data = claims()

  const result = await insertRows('ops_proposal_reality_snapshots', [
    {
      title: text(body.title) || '제안서 표현 현실화 점검',
      status: 'saved',
      safe_claims: data.safeClaims,
      pilot_claims: data.pilotClaims,
      vision_claims: data.visionClaims,
      risky_claims: data.riskyClaims,
      copy_blocks: data.copyBlocks,
      checklist: data.checklist,
      payload: {
        source: 'ops-proposal-reality-check',
        savedAt: new Date().toISOString()
      },
      created_by: createdBy
    }
  ])

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '표현 점검 스냅샷 저장에 실패했습니다.',
      detail: result.error
    }
  }

  return {
    ok: true,
    message: '표현 점검 스냅샷을 저장했습니다.',
    snapshot: rows(result)[0]
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

  const data = await loadDashboard()
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

  if (action === 'saveSnapshot') result = await saveSnapshot(body)
  else result = { ok: false, status: 400, message: '알 수 없는 action입니다.' }

  return NextResponse.json(result, { status: responseStatus(result) })
}
