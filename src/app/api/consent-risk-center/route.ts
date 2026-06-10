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

function consentData() {
  const consentVersion = '2026-06-11-v1'

  const consentBlocks = {
    participantConsent:
`안부웍스 실증 참여 동의서

본인은 안부웍스 자체 예비실증에 참여하며, 부모님 안부 신호, 보호자 연락처, 문자 알림, 리포트 조회, 미응답 확인, 대리입력 기록이 실증 운영 목적으로 처리될 수 있음을 확인합니다.

본 실증은 의료 진단, 치료, 처방, 응급 구조를 제공하지 않습니다. 응급상황이 의심되는 경우 즉시 119 또는 의료기관에 연락해야 합니다.`,

    privacyNotice:
`개인정보 수집·이용 안내

수집 항목:
- 부모님 이름, 가족코드, 선택 입력된 연락처
- 보호자 이름, 연락처, 이메일
- 안부 신호, 미응답 여부, 보호자 리포트 조회 기록
- 문자 발송 상태, 대리입력 기록, 운영실 후속조치 기록

이용 목적:
- 안부 신호 확인
- 보호자 알림 및 리포트 제공
- 미응답 후속 확인
- 실증 결과 분석 및 서비스 개선

보관 기간:
- 자체 예비실증 종료 후 결과 분석에 필요한 기간 동안 보관하며, 삭제 요청 시 확인 후 처리합니다.`,

    nonMedicalNotice:
`비의료 서비스 고지

안부웍스는 의료기관, 의료기기, 응급구조 서비스가 아닙니다.
안부웍스는 부모님 안부 신호를 보호자와 운영실이 확인하고 기록할 수 있도록 돕는 비의료 생활확인 서비스입니다.

다음 상황에서는 앱 사용보다 먼저 119 또는 의료기관에 연락해야 합니다.
- 낙상
- 의식저하
- 호흡곤란
- 심한 통증
- 출혈
- 갑작스러운 마비·언어장애
- 기타 응급이 의심되는 상황`,

    guardianResponsibility:
`보호자 책임 범위

보호자는 부모님의 안부 신호, 미응답 알림, 리포트를 확인한 뒤 실제 전화 확인 또는 필요한 조치를 직접 판단해야 합니다.
안부웍스의 알림은 보호자 확인을 돕는 보조 수단이며, 보호자의 직접 확인 의무를 대체하지 않습니다.`,

    providerResponsibility:
`생활확인 파트너 책임 범위

생활확인 파트너는 의료 판단, 의료행위, 응급구조를 수행하지 않습니다.
파트너는 가능한 범위에서 전화 확인, 생활확인, 동행 가능 여부 응답, 결과 기록을 수행합니다.
응급상황이 의심되는 경우 119 또는 의료기관 연락을 안내해야 합니다.`,

    reportAccess:
`리포트 열람 권한 안내

보호자 리포트는 가족코드와 휴대폰 뒤 4자리로 조회할 수 있습니다.
가족코드와 휴대폰 뒤 4자리를 알고 있는 사람은 리포트에 접근할 수 있으므로, 보호자는 해당 정보를 신뢰할 수 있는 가족 외에는 공유하지 않아야 합니다.`
  }

  const riskItems = [
    {
      title: '의료 서비스 오인',
      risk: '몸 상태, 복약, 응급 표현 때문에 의료 진단 서비스로 오해될 수 있음',
      control: '모든 주요 화면에 “의료 진단·응급구조 대체 아님” 고지 표시'
    },
    {
      title: '119 대체 오인',
      risk: '도움 요청 버튼이 실제 응급 출동으로 오해될 수 있음',
      control: '응급상황은 즉시 119 또는 의료기관 연락 안내'
    },
    {
      title: '민감정보 수집 오인',
      risk: '복약·몸 상태 정보가 민감정보로 해석될 수 있음',
      control: '실증에서는 최소한의 안부·생활확인 신호만 수집하고, 의료 판단을 하지 않음'
    },
    {
      title: '리포트 접근 권한',
      risk: '가족코드와 휴대폰 뒤 4자리 공유 시 리포트 열람 가능',
      control: '가족코드 공유 주의 고지 및 운영실에서 열람 기록 추적'
    },
    {
      title: '생활확인 파트너 책임',
      risk: '파트너가 응급처치나 의료 판단을 해야 한다고 오해할 수 있음',
      control: '전화확인·생활확인·동행 가능 여부 응답으로 책임 범위 제한'
    },
    {
      title: '문자 자동발송 비용·오발송',
      risk: '테스트 문자나 과거 실패 문자가 재발송될 수 있음',
      control: '문자 안전정리센터, 자동발송 OFF/ON 관리, 대기열 확인 후 발송'
    }
  ]

  const checklist = [
    '실증 참여자에게 비의료 서비스임을 고지했는가?',
    '응급상황은 119 또는 의료기관에 연락해야 한다는 문구가 보이는가?',
    '수집하는 개인정보 항목과 이용 목적을 설명했는가?',
    '가족코드와 휴대폰 뒤 4자리로 리포트가 열리는 구조를 고지했는가?',
    '보호자 대리입력과 운영실 대리입력 기록이 남는다고 고지했는가?',
    '생활확인 파트너가 의료 판단을 하지 않는다고 고지했는가?',
    '실증 종료 후 데이터 보관·삭제 요청 가능성을 안내했는가?',
    '문자 발송 비용과 자동발송 상태를 운영실에서 관리하고 있는가?'
  ]

  const copyBlocks = {
    shortNotice:
`안부웍스는 의료 진단, 치료, 응급 구조를 대체하지 않는 비의료 생활확인 서비스입니다. 응급상황이 의심되는 경우 즉시 119 또는 의료기관에 연락해야 합니다.`,

    consentMessage:
`안녕하세요. 안부웍스 자체 예비실증 참여 전 동의 안내드립니다.

본 실증은 부모님 안부 신호, 보호자 알림, 미응답 확인, 대리입력, 오늘 리포트 기능이 실제로 작동하는지 확인하기 위한 것입니다.

수집 정보는 부모님 이름/가족코드, 보호자 연락처, 안부 신호, 문자 발송 기록, 리포트 조회 기록, 대리입력 기록 등 실증 운영에 필요한 최소 정보입니다.

안부웍스는 의료 진단·치료·응급구조 서비스가 아니며, 응급상황은 즉시 119 또는 의료기관에 연락해야 합니다.

동의 페이지:
https://parents-care.net/consent`,

    careCenterNotice:
`본 실증은 의료행위나 응급출동 요청이 아니라, 어르신 안부 신호와 보호자 안심 리포트 흐름을 확인하는 비의료 생활확인 테스트입니다.

센터 또는 파트너에게 요청드리는 역할은 전화 확인, 생활확인 가능 여부 응답, 결과 기록이며 의료 판단이나 응급처치는 포함하지 않습니다.`,

    partnerNotice:
`생활확인 파트너는 의료 판단, 의료행위, 응급구조를 수행하지 않습니다. 가능한 경우 전화 확인 또는 생활확인 결과를 기록하고, 응급상황이 의심되면 119 또는 의료기관 연락을 안내합니다.`
  }

  return {
    consentVersion,
    consentBlocks,
    riskItems,
    checklist,
    copyBlocks
  }
}

async function loadDashboard() {
  const data = consentData()
  const [snapshotResult, recordResult] = await Promise.all([
    rest('ops_consent_risk_snapshots?select=*&order=created_at.desc&limit=50'),
    rest('pilot_consent_records?select=*&order=created_at.desc&limit=200')
  ])

  const records = rows(recordResult)

  const metrics = {
    consentRecords: records.length,
    guardianConsents: records.filter((item) => text(item.role) === 'guardian').length,
    parentConsents: records.filter((item) => text(item.role) === 'parent').length,
    providerConsents: records.filter((item) => text(item.role) === 'provider').length,
    latestConsentKst: toKst(records[0]?.created_at)
  }

  return {
    ok: true,
    ...data,
    metrics,
    consentRecords: records.map((item) => ({
      id: text(item.id),
      role: text(item.role),
      familyCode: text(item.family_code),
      name: text(item.name),
      phone: text(item.phone),
      guardianName: text(item.guardian_name),
      guardianPhone: text(item.guardian_phone),
      consentStatus: text(item.consent_status),
      consentVersion: text(item.consent_version),
      createdAt: text(item.created_at),
      createdKst: toKst(item.created_at)
    })),
    snapshots: rows(snapshotResult).map((item) => ({
      id: text(item.id),
      title: text(item.title),
      status: text(item.status),
      consentVersion: text(item.consent_version),
      createdBy: text(item.created_by),
      createdAt: text(item.created_at),
      createdKst: toKst(item.created_at)
    })),
    sourceErrors: {
      snapshots: snapshotResult.ok ? null : snapshotResult.error,
      records: recordResult.ok ? null : recordResult.error
    }
  }
}

async function saveSnapshot(body: Row) {
  const createdBy = text(body.createdBy) || '운영실'
  const data = consentData()

  const result = await insertRows('ops_consent_risk_snapshots', [
    {
      title: text(body.title) || '개인정보·동의·책임범위 점검',
      status: 'saved',
      consent_version: data.consentVersion,
      consent_blocks: data.consentBlocks,
      risk_items: data.riskItems,
      checklist: data.checklist,
      copy_blocks: data.copyBlocks,
      payload: {
        source: 'ops-consent-risk-center',
        savedAt: new Date().toISOString()
      },
      created_by: createdBy
    }
  ])

  if (!result.ok) {
    return {
      ok: false,
      status: 500,
      message: '동의·책임범위 스냅샷 저장에 실패했습니다.',
      detail: result.error
    }
  }

  return {
    ok: true,
    message: '동의·책임범위 스냅샷을 저장했습니다.',
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
