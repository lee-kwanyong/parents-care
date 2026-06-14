import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

const ADMIN_SESSION_VALUE = 'anbu-admin-ok-v1'
const ADMIN_CODE = '530868'
const STAGES = ['발굴', '문의/자료요청', '샘플/견적', '실증협의', '제안서', '보류/완료']

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'ops_session_token',
  'OPS_SESSION_TOKEN',
  'ops_session'
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function bool(value: unknown) {
  return Boolean(value)
}

function authSecret() {
  return process.env.ANBU_OPS_AUTH_SECRET || process.env.OPS_AUTH_SECRET || 'anbuworks-ops-auth-secret'
}

function canonicalOpsCode() {
  return (
    text(process.env.ANBU_OPS_PASSWORD) ||
    text(process.env.OPS_PASSWORD) ||
    text(process.env.ADMIN_CODE) ||
    ADMIN_CODE
  )
}

function tokenFor(code: string) {
  return createHash('sha256').update(code + ':' + authSecret()).digest('hex')
}

function isAdminAuthed(request: NextRequest) {
  const adminCookie = request.cookies.get('anbu_admin_code_ok')?.value || ''
  const opsCookies = OPS_COOKIE_NAMES.map((name) => request.cookies.get(name)?.value || '').filter(Boolean)
  const auth = text(request.headers.get('authorization')).replace(/^Bearer\s+/i, '')
  const secrets = [
    process.env.CRON_SECRET || '',
    process.env.OPS_AUTOPILOT_SECRET || '',
    process.env.RESPONSE_ESCALATION_SECRET || ''
  ].filter(Boolean)

  return (
    adminCookie === ADMIN_SESSION_VALUE ||
    adminCookie === tokenFor(ADMIN_CODE) ||
    opsCookies.includes(tokenFor(canonicalOpsCode())) ||
    secrets.includes(auth)
  )
}

function supabaseBaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function restBaseUrl() {
  const base = supabaseBaseUrl()
  return base ? `${base}/rest/v1` : ''
}

function normalizeStage(value: unknown) {
  const stage = text(value)
  return STAGES.includes(stage) ? stage : '발굴'
}

function normalizeLead(row: Row) {
  return {
    id: text(row.id),
    leadType: text(row.lead_type) || 'municipality',
    organizationName: text(row.organization_name) || '이름 없음',
    department: text(row.department),
    contactName: text(row.contact_name),
    email: text(row.email),
    phone: text(row.phone),
    channel: text(row.channel),
    stage: normalizeStage(row.stage),
    priority: text(row.priority) || 'medium',
    focusArea: text(row.focus_area),
    region: text(row.region),
    expectedUnits: num(row.expected_units),
    monthlyFee: num(row.monthly_fee),
    hardwareModel: text(row.hardware_model),
    sampleCount: num(row.sample_count),
    nextAction: text(row.next_action),
    nextActionDate: text(row.next_action_date),
    memo: text(row.memo),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at)
  }
}

async function restRows(table: string, params: Record<string, string>): Promise<{ ok: boolean; rows: Row[]; error?: string }> {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [],
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
    }
  }

  const search = new URLSearchParams(params)

  try {
    const response = await fetch(`${base}/${table}?${search.toString()}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = []

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      parsed = []
    }

    if (!response.ok) {
      return {
        ok: false,
        rows: [],
        error: `${table}: ${response.status} ${raw.slice(0, 220)}`
      }
    }

    return {
      ok: true,
      rows: Array.isArray(parsed) ? parsed as Row[] : []
    }
  } catch (error) {
    return {
      ok: false,
      rows: [],
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

async function insertAdaptive(table: string, attempts: Row[]) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [] as Row[],
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
    }
  }

  let lastError = ''

  for (const body of attempts) {
    try {
      const response = await fetch(`${base}/${table}`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      })

      const raw = await response.text()
      let parsed: unknown = []

      try {
        parsed = raw ? JSON.parse(raw) : []
      } catch {
        parsed = []
      }

      if (response.ok) {
        return {
          ok: true,
          rows: Array.isArray(parsed) ? parsed as Row[] : []
        }
      }

      lastError = raw.slice(0, 240)
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'insert failed'
    }
  }

  return {
    ok: false,
    rows: [] as Row[],
    error: lastError || 'insert failed'
  }
}

async function patchLead(id: string, body: Row) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key || !id) {
    return {
      ok: false,
      rows: [] as Row[],
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/ops_gov_rnd_leads?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        ...body,
        updated_at: new Date().toISOString()
      }),
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = []

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      parsed = []
    }

    if (!response.ok) {
      return {
        ok: false,
        rows: [],
        error: raw.slice(0, 240)
      }
    }

    return {
      ok: true,
      rows: Array.isArray(parsed) ? parsed as Row[] : []
    }
  } catch (error) {
    return {
      ok: false,
      rows: [],
      error: error instanceof Error ? error.message : 'patch failed'
    }
  }
}

function metrics(leads: ReturnType<typeof normalizeLead>[]) {
  const dueToday = leads.filter((lead) => {
    if (!lead.nextActionDate) return false
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date())
    return lead.nextActionDate <= today && lead.stage !== '보류/완료'
  })

  return {
    total: leads.length,
    municipality: leads.filter((lead) => lead.leadType === 'municipality').length,
    supplier: leads.filter((lead) => lead.leadType === 'smart-ring-supplier').length,
    rnd: leads.filter((lead) => lead.leadType === 'rnd').length,
    proposal: leads.filter((lead) => lead.stage === '제안서').length,
    sample: leads.filter((lead) => lead.stage === '샘플/견적').length,
    dueToday: dueToday.length,
    expectedUnits: leads.reduce((sum, lead) => sum + lead.expectedUnits, 0),
    sampleCount: leads.reduce((sum, lead) => sum + lead.sampleCount, 0)
  }
}

function templates() {
  return [
    {
      key: 'eiot',
      title: 'eIoT 스마트링 공급사',
      desc: 'TM22/TM21 샘플, SDK/API, 500~1000개 단가, KC/인증 검토',
      defaults: {
        leadType: 'smart-ring-supplier',
        organizationName: 'Shenzhen eIoT Technology',
        contactName: 'Arena Li',
        email: 'liqing@eiot.com',
        channel: 'email/whatsapp',
        stage: '샘플/견적',
        priority: 'high',
        focusArea: '스마트링 공급·SDK·CSV/API',
        region: '중국 Shenzhen',
        expectedUnits: '5',
        monthlyFee: '0',
        hardwareModel: 'TM22 / TM21',
        sampleCount: '2',
        nextAction: '샘플 2~5개, SDK/API 문서, KC 인증 가능성 확인',
        memo: '심박, HRV, SpO2, 체온, 수면, 활동, 착용, 배터리, BLE 5.4, 5ATM 등 실증 후보.'
      }
    },
    {
      key: 'goodway',
      title: 'Goodway 스마트링 공급사',
      desc: 'BCL603M1 후보, 서버 직접 연결, SDK 2차 개발 지원 확인',
      defaults: {
        leadType: 'smart-ring-supplier',
        organizationName: 'Goodway Techs',
        contactName: 'Vivienne',
        email: 'vivienne@goodwaytechs.com',
        channel: 'email/whatsapp',
        stage: '문의/자료요청',
        priority: 'high',
        focusArea: '스마트링 SDK·서버 연동',
        region: '중국',
        expectedUnits: '5',
        monthlyFee: '0',
        hardwareModel: 'BCL603M1',
        sampleCount: '2',
        nextAction: 'SDK 범위, 서버 직접 연동, 샘플 조건, 투자/협업 가능성 회신',
        memo: '5ATM, 5~9일 배터리, 심박/HRV/SpO2/체온/수면/활동/착용/배터리 지원 후보.'
      }
    },
    {
      key: 'bring',
      title: 'b.ring 국내 유통 후보',
      desc: '국내 PoC, 소비자 반응, 비의료 안부 참고 신호 활용 검증',
      defaults: {
        leadType: 'smart-ring-supplier',
        organizationName: 'b.ring / bring',
        contactName: '',
        email: '',
        channel: 'smartstore/contact',
        stage: '발굴',
        priority: 'medium',
        focusArea: '국내 스마트링 PoC',
        region: '한국',
        expectedUnits: '3',
        monthlyFee: '0',
        hardwareModel: 'b.ring',
        sampleCount: '2',
        nextAction: '데이터 접근, CSV/API 가능성, B2B 샘플 조건 문의',
        memo: '국내 실증용 빠른 샘플 후보.'
      }
    },
    {
      key: 'chungbuk-biohealth',
      title: '충북 바이오헬스 데이터/R&D',
      desc: '바이오헬스 소재·데이터 산업화 인프라, 데이터 기반 실증/기업지원 연결',
      defaults: {
        leadType: 'rnd',
        organizationName: '충북 바이오헬스 소재·데이터 산업화 인프라',
        department: '첨단바이오과 / 바이오산업팀',
        contactName: '',
        email: '',
        phone: '',
        channel: '공모/R&D',
        stage: '발굴',
        priority: 'medium',
        focusArea: '바이오헬스 데이터·스마트 돌봄 실증',
        region: '충북 오송/오창',
        expectedUnits: '50',
        monthlyFee: '4500',
        hardwareModel: '스마트링 + 안부 리포트',
        sampleCount: '5',
        nextAction: '사업 담당 부서 확인, 제안서 초안 작성, 비의료 표현 점검',
        memo: '바이오헬스 데이터 인프라와 시니어 안부 리듬 데이터 실증 연결 가능성 검토.'
      }
    },
    {
      key: 'municipality-pilot',
      title: '기초지자체 3~5가구 예비 실증',
      desc: '실증 레퍼런스 확보용 소규모 PoC',
      defaults: {
        leadType: 'municipality',
        organizationName: '기초지자체 예비 실증 후보',
        department: '복지과 / 노인복지팀',
        contactName: '',
        email: '',
        phone: '',
        channel: '직접제안',
        stage: '제안서',
        priority: 'high',
        focusArea: '3~5가구 예비 실증',
        region: '전남/경북/충북',
        expectedUnits: '5',
        monthlyFee: '4500',
        hardwareModel: '스마트링 안부리듬 + 보호자 리포트',
        sampleCount: '5',
        nextAction: '1페이지 제안서, 비의료 고지, 실증 성공 기준 정리',
        memo: '성공 기준: 보호자 유용성, 노인 착용 지속성, 데이터 수집률, 확인필요 후속처리율.'
      }
    }
  ]
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Admin 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const result = await restRows('ops_gov_rnd_leads', {
    select: '*',
    order: 'updated_at.desc',
    limit: '300'
  })

  const leads = result.ok ? result.rows.map(normalizeLead) : []

  return NextResponse.json({
    ok: true,
    stages: STAGES,
    leads,
    metrics: metrics(leads),
    templates: templates(),
    sourceErrors: result.ok ? [] : [result.error].filter(Boolean)
  })
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthed(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Admin 인증이 필요합니다.'
      },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create') {
    const organizationName = text(body.organizationName)

    if (!organizationName) {
      return NextResponse.json(
        {
          ok: false,
          message: '기관/업체명을 입력해주세요.'
        },
        { status: 400 }
      )
    }

    const row = {
      lead_type: text(body.leadType) || 'municipality',
      organization_name: organizationName,
      department: text(body.department),
      contact_name: text(body.contactName),
      email: text(body.email),
      phone: text(body.phone),
      channel: text(body.channel),
      stage: normalizeStage(body.stage),
      priority: text(body.priority) || 'medium',
      focus_area: text(body.focusArea),
      region: text(body.region),
      expected_units: num(body.expectedUnits),
      monthly_fee: num(body.monthlyFee),
      hardware_model: text(body.hardwareModel),
      sample_count: num(body.sampleCount),
      next_action: text(body.nextAction),
      next_action_date: text(body.nextActionDate) || null,
      memo: text(body.memo),
      payload: {
        createdFrom: 'admin-gov-rnd-pipeline',
        pinned: bool(body.pinned)
      }
    }

    const result = await insertAdaptive('ops_gov_rnd_leads', [
      row,
      {
        ...row,
        payload: undefined
      },
      {
        lead_type: row.lead_type,
        organization_name: row.organization_name,
        stage: row.stage,
        priority: row.priority,
        focus_area: row.focus_area,
        next_action: row.next_action,
        memo: row.memo
      },
      {
        organization_name: row.organization_name,
        stage: row.stage
      }
    ])

    const record = result.rows[0] || {
      id: `local-${Date.now()}`,
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      ok: true,
      persisted: result.ok,
      warning: result.ok ? null : result.error || '서버 저장에 실패했지만 화면에는 임시로 표시됩니다.',
      lead: normalizeLead(record)
    })
  }

  if (action === 'update') {
    const id = text(body.id)

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message: '리드 ID가 필요합니다.'
        },
        { status: 400 }
      )
    }

    const patch: Row = {}

    if (body.stage !== undefined) patch.stage = normalizeStage(body.stage)
    if (body.priority !== undefined) patch.priority = text(body.priority)
    if (body.nextAction !== undefined) patch.next_action = text(body.nextAction)
    if (body.nextActionDate !== undefined) patch.next_action_date = text(body.nextActionDate) || null
    if (body.memo !== undefined) patch.memo = text(body.memo)
    if (body.expectedUnits !== undefined) patch.expected_units = num(body.expectedUnits)
    if (body.sampleCount !== undefined) patch.sample_count = num(body.sampleCount)

    const result = await patchLead(id, patch)

    return NextResponse.json({
      ok: true,
      persisted: result.ok,
      warning: result.ok ? null : result.error || '서버 업데이트에 실패했습니다.',
      lead: result.rows[0] ? normalizeLead(result.rows[0]) : null
    })
  }

  return NextResponse.json(
    {
      ok: false,
      message: '알 수 없는 action입니다.'
    },
    { status: 400 }
  )
}
