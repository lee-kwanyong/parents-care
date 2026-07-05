import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Audience = 'customer' | 'b2g' | 'ir' | 'internal'
type Severity = 'danger' | 'watch' | 'info'

type Rule = {
  id: string
  title: string
  category: string
  severity: Severity
  terms: string[]
  problem: string
  suggestion: string
  safeExpression: string
}

type Finding = {
  id: string
  title: string
  category: string
  severity: Severity
  term: string
  snippet: string
  suggestion: string
  safeExpression: string
  index: number
}

const ADMIN_SESSION_VALUE = 'anbu-admin-ok-v1'
const ADMIN_CODE = '530868'

const OPS_COOKIE_NAMES = [
  'anbu_ops_token',
  'ops_session_token',
  'OPS_SESSION_TOKEN',
  'ops_session'
]

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
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

function normalizeAudience(value: unknown): Audience {
  const audience = text(value)

  if (audience === 'customer') return 'customer'
  if (audience === 'b2g') return 'b2g'
  if (audience === 'ir') return 'ir'
  if (audience === 'internal') return 'internal'

  return 'customer'
}

function rules(): Rule[] {
  return [
    {
      id: 'medical-diagnosis',
      title: '의료 진단·치료 표현',
      category: '의료표현',
      severity: 'danger',
      terms: ['진단', '치료', '처방', '의료 진단', '의료 데이터', '질환', '환자', '의료진', '헬스케어 표준'],
      problem: '고객 화면이나 일반 제안서에서 의료행위처럼 보일 수 있습니다.',
      suggestion: '비의료 안부 참고, 보호자 확인, 생활 리듬 참고 표현으로 바꾸세요.',
      safeExpression: '비의료 안부 참고 정보 / 보호자 확인 권장 / 생활 리듬 참고 신호'
    },
    {
      id: 'biometric-claim',
      title: '생체 데이터·생체 신호 표현',
      category: '데이터표현',
      severity: 'watch',
      terms: ['생체 데이터', '생체 신호', '실시간 생체', '생체 움직임', '비접촉 생체', '민감한 시니어 의료·생체 데이터'],
      problem: '의료·민감정보 수집으로 해석될 수 있습니다.',
      suggestion: '고객 화면에서는 생활 리듬, 안부 참고 신호, 착용 데이터 등으로 낮춰 표현하세요.',
      safeExpression: '생활 리듬 참고 데이터 / 안부 참고 신호 / 착용 기반 참고 데이터'
    },
    {
      id: 'emergency-119',
      title: '119·응급 자동연계 표현',
      category: '응급표현',
      severity: 'danger',
      terms: ['119', '긴급 출동', '응급 전파', '응급 상황 긴급 연계', '자동 신고', '원클릭 119', '원클릭 긴급', 'SOS', '즉각 응급'],
      problem: '응급 판단·구조 지시를 서비스가 대신하는 것처럼 보일 수 있습니다.',
      suggestion: '응급상황 의심 시 보호자·담당자가 119 또는 의료기관 연락을 검토한다는 표현으로 바꾸세요.',
      safeExpression: '응급상황이 의심되면 보호자 또는 담당자가 119·의료기관 연락을 검토'
    },
    {
      id: 'accuracy-guarantee',
      title: '정확도·보장 표현',
      category: '성과보장',
      severity: 'danger',
      terms: ['오탐률 2% 미만', '오탐율 2% 미만', '0%', '100%', '완벽', '제로화', '무력화', '완전', '보장', '확보', '무경쟁 수의계약'],
      problem: '검증 전 수치나 보장 표현은 과장 주장으로 보일 수 있습니다.',
      suggestion: '목표, 가정, 실증을 통해 검증 예정, 최소화 목표처럼 조건을 붙이세요.',
      safeExpression: '실증을 통해 검증할 목표 / 최소화 목표 / 기관 협의 후 확정'
    },
    {
      id: 'ai-prediction',
      title: 'AI 예측·판단 표현',
      category: 'AI표현',
      severity: 'watch',
      terms: ['AI 이상 징후', 'AI 관제', '머신러닝', '선제적 예찰', '선제적으로 포착', '위험 전환', '예측', '판단 기준', '안부지문'],
      problem: 'AI가 위험이나 건강 상태를 확정 판단하는 것처럼 보일 수 있습니다.',
      suggestion: '운영자 확인 보조, 안부 패턴 참고, 우선순위 정렬 표현으로 조정하세요.',
      safeExpression: '운영실 확인 보조 / 안부 패턴 참고 / 확인 우선순위 정렬'
    },
    {
      id: 'privacy-security',
      title: '보안·개인정보 절대 표현',
      category: '보안표현',
      severity: 'watch',
      terms: ['AES-256', 'E2E', '종단간', '데이터 로그 유실 가능성 0%', '원본 IP 은닉', '완벽하게 관통', '개인정보보호법 가이드라인을 완벽하게'],
      problem: '보안은 객관적 인증·정책·구현 범위를 함께 제시해야 합니다.',
      suggestion: '적용 예정, 설계, 강화, 인증/정책 기준에 맞춰 운영 같은 표현으로 바꾸세요.',
      safeExpression: '보안 설계 강화 / 암호화 적용 예정 / 운영 정책에 따라 관리'
    },
    {
      id: 'financial-certain',
      title: '재무·조달 확정 표현',
      category: '사업성과',
      severity: 'watch',
      terms: ['45억 원 달성', '손익분기점 돌파', '수의계약 진입', '매출 확보', '고마진', '캐시카우', '자격권을 확보'],
      problem: '투자·조달 문서에서는 목표와 가정을 분리해야 합니다.',
      suggestion: '목표, 추정, 가정 기반 시나리오, 실증 후 확정으로 표현하세요.',
      safeExpression: '목표 매출 / 가정 기반 추정 / 실증 성과 기반 조달 추진'
    },
    {
      id: 'customer-action',
      title: '고객 행동 유도 과강도 표현',
      category: '고객UX',
      severity: 'info',
      terms: ['즉시 전파', '즉각 개입', '최종 연계', '직접 개입', '골든타임', '사람을 살릴 수 있는'],
      problem: '고객 화면에서는 불안감을 과도하게 만들 수 있습니다.',
      suggestion: '안부 확인 요청, 보호자 확인 권장, 필요 시 도움 요청 표현으로 낮추세요.',
      safeExpression: '보호자 확인 요청 / 필요 시 도움 연결 / 안부 확인 권장'
    }
  ]
}

function templates() {
  return [
    {
      id: 'customer-ring',
      title: '고객 화면 · 안부완료 리포트',
      audience: 'customer',
      text: '스마트링은 심박, HRV, SpO2, 체온 등 생체 신호를 분석해 위험을 예측하고 응급 상황을 즉시 전파합니다.'
    },
    {
      id: 'b2g-dashboard',
      title: '지자체 제안 · 관제 대시보드',
      audience: 'b2g',
      text: '관할 구역 500가구 실시간 생체 신호 모니터링 및 응급 상황 긴급 연계 웹 화면입니다. 오탐률 2% 미만 알고리즘으로 원클릭 119 소방망 연계가 가능합니다.'
    },
    {
      id: 'ir-security',
      title: 'IR · 보안/인프라',
      audience: 'ir',
      text: 'AES-256 종단간 암호화와 Synology NAS 분산 이중화 백업으로 지자체 시니어 데이터 로그 유실 가능성을 0%로 실현합니다.'
    },
    {
      id: 'b2g-revenue',
      title: 'B2G · 매출/조달',
      audience: 'b2g',
      text: '실증 데이터를 바탕으로 조달청 혁신제품 지정을 유도해 제한경쟁 면제 수의계약 자격권을 확보하고 3차년도 정기 구독 매출 45억 원을 달성합니다.'
    },
    {
      id: 'safe-base',
      title: '권장 기본 문장',
      audience: 'customer',
      text: '안부웍스는 부모님의 식사, 복약, 몸 상태, 수면, 활동, 착용 상태 등 생활 리듬 참고 신호를 보호자가 쉽게 확인하도록 돕는 비의료 안부 참고 서비스입니다. 응급상황이 의심되면 119 또는 의료기관에 연락해야 합니다.'
    }
  ]
}

function severityWeight(severity: Severity, audience: Audience) {
  const base = severity === 'danger' ? 18 : severity === 'watch' ? 10 : 4

  if (audience === 'customer') return base + 5
  if (audience === 'b2g') return base
  if (audience === 'ir') return Math.max(3, base - 2)

  return Math.max(2, base - 4)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function snippetAround(value: string, index: number, term: string) {
  const start = Math.max(0, index - 34)
  const end = Math.min(value.length, index + term.length + 44)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < value.length ? '…' : ''

  return `${prefix}${value.slice(start, end)}${suffix}`
}

function analyze(input: string, audience: Audience): Finding[] {
  const findings: Finding[] = []
  const seen = new Set<string>()

  for (const rule of rules()) {
    for (const term of rule.terms) {
      const regex = new RegExp(escapeRegExp(term), 'gi')
      let match: RegExpExecArray | null

      while ((match = regex.exec(input)) !== null) {
        const key = `${rule.id}:${term}:${match.index}`

        if (seen.has(key)) continue

        seen.add(key)
        findings.push({
          id: rule.id,
          title: rule.title,
          category: rule.category,
          severity: rule.severity,
          term,
          snippet: snippetAround(input, match.index, term),
          suggestion: audience === 'customer'
            ? `${rule.suggestion} 고객 화면에서는 특히 보수적으로 바꾸세요.`
            : rule.suggestion,
          safeExpression: rule.safeExpression,
          index: match.index
        })

        if (findings.length >= 80) return findings
      }
    }
  }

  return findings.sort((a, b) => {
    const order = { danger: 0, watch: 1, info: 2 }
    return order[a.severity] - order[b.severity] || a.index - b.index
  })
}

function replaceTerms(input: string, pairs: Array<[string, string]>) {
  let output = input

  for (const [from, to] of pairs) {
    output = output.replace(new RegExp(escapeRegExp(from), 'g'), to)
  }

  return output
}

function rewrite(input: string, audience: Audience) {
  const common: Array<[string, string]> = [
    ['의료·생체 데이터', '생활 리듬 참고 데이터'],
    ['민감한 시니어 의료·생체 데이터', '시니어 생활 안부 참고 데이터'],
    ['생체 데이터', '생활 리듬 참고 데이터'],
    ['생체 신호', '생활 리듬 참고 신호'],
    ['실시간 생체 신호 모니터링', '생활 리듬 참고 신호 확인'],
    ['의료 진단', '비의료 안부 참고'],
    ['진단·치료', '안부 확인과 후속 조치'],
    ['진단', '안부 확인'],
    ['치료', '후속 확인'],
    ['처방', '복약 일정'],
    ['환자', '어르신'],
    ['AI 관제', '운영실 확인 보조'],
    ['AI 이상 징후', '확인 필요 신호'],
    ['선제적 예찰', '사전 안부 확인'],
    ['선제적으로 포착', '미리 참고할 수 있도록 표시'],
    ['위험 전환', '확인필요 상태로 표시'],
    ['예측', '참고 신호 확인'],
    ['응급 상황 긴급 연계', '응급상황 의심 시 보호자·담당자 확인 요청'],
    ['응급 전파', '응급상황 의심 시 보호자·담당자 확인 요청'],
    ['즉각 응급 전파', '응급상황 의심 시 보호자·담당자 확인 요청'],
    ['원클릭 119 소방망 연계', '응급상황 의심 시 담당자가 119 또는 의료기관 연락을 검토'],
    ['원클릭 119', '응급상황 의심 시 119 또는 의료기관 연락 검토'],
    ['긴급 출동 지시', '담당자 확인 후 필요한 도움 요청'],
    ['오탐률 2% 미만', '오경보를 줄이는 것을 실증으로 검증할 목표'],
    ['오탐율 2% 미만', '오경보를 줄이는 것을 실증으로 검증할 목표'],
    ['데이터 로그 유실 가능성을 0%로 실현', '데이터 유실 가능성을 낮추기 위한 백업 체계를 운영'],
    ['0%로 실현', '최소화하는 것을 목표'],
    ['제로화', '줄이는 것을 목표'],
    ['100% 유지', '익숙한 사용 경험을 최대한 유지'],
    ['완벽하게', '체계적으로'],
    ['완벽한', '강화된'],
    ['무경쟁 수의계약 진입', '공공 조달 진입 가능성 검토'],
    ['수의계약 자격권을 확보', '공공 조달 자격 확보를 목표로 추진'],
    ['45억 원 달성', '45억 원을 목표로 하는 가정 기반 시나리오'],
    ['손익분기점 돌파', '손익분기점 달성을 목표로 추진']
  ]

  const customerOnly: Array<[string, string]> = [
    ['헬스케어 표준', '비의료 안부 참고 서비스'],
    ['생체 직결', '생활 리듬 참고'],
    ['실시간 분석', '운영실 확인 보조'],
    ['즉시 전파', '보호자에게 확인 요청'],
    ['즉각 개입', '필요 시 후속 확인'],
    ['골든타임', '빠른 확인이 필요한 시간']
  ]

  const b2gIrOnly: Array<[string, string]> = [
    ['헬스케어 표준', '스마트 돌봄 운영 모델'],
    ['실시간 분석', '운영자 확인을 보조하는 분석'],
    ['즉시 전파', '담당자에게 확인 요청'],
    ['자동화', '운영 자동화 가능성']
  ]

  let output = replaceTerms(input, common)

  if (audience === 'customer') {
    output = replaceTerms(output, customerOnly)
  } else {
    output = replaceTerms(output, b2gIrOnly)
  }

  const customerNotice = '본 내용은 비의료 안부 참고 정보이며 진단·치료·응급 판단을 대체하지 않습니다. 응급상황이 의심되면 119 또는 의료기관에 연락해야 합니다.'
  const proposalNotice = '본 제안의 수치와 자동화 범위는 실증 설계, 기관 협의, 데이터 확보 범위에 따라 검증·확정됩니다.'

  if (audience === 'customer' && !output.includes('비의료')) {
    output = `${output}\n\n${customerNotice}`
  }

  if ((audience === 'b2g' || audience === 'ir') && !output.includes('실증') && !output.includes('가정')) {
    output = `${output}\n\n${proposalNotice}`
  }

  return output
}

function scoreFromFindings(findings: Finding[], audience: Audience) {
  const penalty = findings.reduce((sum, finding) => sum + severityWeight(finding.severity, audience), 0)
  return Math.max(0, Math.min(100, 100 - penalty))
}

function summary(score: number, findings: Finding[]) {
  const danger = findings.filter((item) => item.severity === 'danger').length
  const watch = findings.filter((item) => item.severity === 'watch').length
  const info = findings.filter((item) => item.severity === 'info').length

  if (danger > 0) {
    return `수정 필요: 위험 표현 ${danger}개, 주의 표현 ${watch}개가 있습니다. 고객 화면이나 외부 제안서에는 바로 쓰지 않는 것이 좋습니다.`
  }

  if (watch > 0) {
    return `주의: 위험 표현은 적지만 주의 표현 ${watch}개가 있습니다. 목표·가정·실증 검증 조건을 붙이면 더 안전합니다.`
  }

  if (info > 0) {
    return `대체로 안전합니다. 다만 고객 불안감을 줄이기 위해 표현 강도를 조금 낮추면 좋습니다.`
  }

  return score >= 90 ? '안전한 편입니다. 비의료 안부 참고 표현으로 잘 정리되어 있습니다.' : '검토가 필요합니다.'
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

  return NextResponse.json({
    ok: true,
    rules: rules().map((rule) => ({
      id: rule.id,
      title: rule.title,
      category: rule.category,
      severity: rule.severity,
      terms: rule.terms,
      suggestion: rule.suggestion,
      safeExpression: rule.safeExpression
    })),
    templates: templates()
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
  const input = text(body.text).slice(0, 12000)
  const audience = normalizeAudience(body.audience)

  if (!input) {
    return NextResponse.json(
      {
        ok: false,
        message: '점검할 문장을 입력해주세요.'
      },
      { status: 400 }
    )
  }

  const findings = analyze(input, audience)
  const rewritten = rewrite(input, audience)
  const score = scoreFromFindings(findings, audience)

  return NextResponse.json({
    ok: true,
    audience,
    score,
    summary: summary(score, findings),
    counts: {
      danger: findings.filter((item) => item.severity === 'danger').length,
      watch: findings.filter((item) => item.severity === 'watch').length,
      info: findings.filter((item) => item.severity === 'info').length
    },
    findings,
    rewritten,
    recommendedDisclaimer: audience === 'customer'
      ? '본 리포트는 비의료 안부 참고 정보입니다. 진단·치료·응급 판단을 대체하지 않으며, 응급상황이 의심되면 119 또는 의료기관에 연락하세요.'
      : '본 제안의 수치, 자동화 범위, 조달 성과는 실증 설계와 기관 협의 결과에 따라 검증·확정됩니다.'
  })
}
