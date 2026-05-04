const fs = require('fs')
const path = require('path')

const root = process.cwd()
const required = ['package.json', 'src/app']

for (const item of required) {
  if (!fs.existsSync(path.join(root, item))) {
    console.error('[step7] Missing ' + item + '. Run this script from the project root.')
    process.exit(1)
  }
}

const stamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
const backupDir = path.join(root, '.backup-before-step7-guest-intake-' + stamp)
fs.mkdirSync(backupDir, { recursive: true })

function backup(rel) {
  const src = path.join(root, rel)
  if (!fs.existsSync(src)) return
  const dst = path.join(backupDir, rel)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  fs.cpSync(src, dst, { recursive: true })
}

function write(rel, content) {
  const full = path.join(root, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
  console.log('[step7] wrote ' + rel)
}

backup('src/app/login/page.tsx')
backup('src/app/care-request/page.tsx')
backup('src/app/care-request/thanks/page.tsx')
backup('src/app/ops/worry-center/page.tsx')
backup('src/app/api/intake/guest/route.ts')
backup('src/app/api/ops/intakes/route.ts')
backup('src/lib/worry-care-engine.ts')

write('src/lib/worry-care-engine.ts', String.raw`
export type WorryType =
  | 'hospital'
  | 'meal'
  | 'medication'
  | 'discharge'
  | 'documents'
  | 'recurring'
  | 'wellbeing'
  | 'emergency'
  | 'not_sure'

export type IntakeChannel = 'phone' | 'kakao' | 'photo' | 'simple_form'

export type CarePackRecommendation = {
  worry: WorryType
  packCode: string
  title: string
  oneLine: string
  steps: string[]
  familyNextActions: string[]
  opsChecklist: string[]
  socialCareHint?: string
}

export const worryOptions: Array<{
  code: WorryType
  label: string
  description: string
  emoji: string
}> = [
  {
    code: 'hospital',
    label: '병원에 혼자 못 가세요',
    description: '병원 예약, 동행, 접수, 진료 내용 정리까지 필요해요.',
    emoji: '🏥'
  },
  {
    code: 'meal',
    label: '밥을 잘 못 챙겨 드세요',
    description: '식사 확인, 도시락·죽·저염식·회복식 연결이 필요해요.',
    emoji: '🍱'
  },
  {
    code: 'medication',
    label: '약을 잘 드시는지 모르겠어요',
    description: '처방약 수령, 복용 시간, 먹었어요 확인이 필요해요.',
    emoji: '💊'
  },
  {
    code: 'discharge',
    label: '퇴원 후 집에서 걱정돼요',
    description: '귀가, 약 정리, 식사, 통증, 다음 외래 확인이 필요해요.',
    emoji: '🏠'
  },
  {
    code: 'documents',
    label: '보험서류가 필요해요',
    description: '영수증, 세부내역서, 처방전, 통원확인서를 챙겨야 해요.',
    emoji: '📄'
  },
  {
    code: 'recurring',
    label: '정기진료를 계속 챙겨야 해요',
    description: '혈압, 당뇨, 재활, 안과, 치과 같은 반복 진료를 관리해요.',
    emoji: '📅'
  },
  {
    code: 'wellbeing',
    label: '혼자 계신 게 걱정돼요',
    description: '정기 안부, 식사, 약, 생활 위험을 가볍게 확인해요.',
    emoji: '☎️'
  },
  {
    code: 'emergency',
    label: '긴급하게 도움이 필요해요',
    description: '운영실이 먼저 확인해야 하는 긴급 요청이에요.',
    emoji: '🚨'
  },
  {
    code: 'not_sure',
    label: '뭘 해야 할지 모르겠어요',
    description: '상황만 알려주시면 필요한 도움을 정리해드려요.',
    emoji: '🤝'
  }
]

export function recommendCarePack(worry: WorryType, memo?: string): CarePackRecommendation {
  const text = (memo || '').toLowerCase()

  if (worry === 'not_sure') {
    if (text.includes('밥') || text.includes('식사') || text.includes('도시락') || text.includes('죽')) {
      return recommendCarePack('meal', memo)
    }
    if (text.includes('약') || text.includes('복용') || text.includes('처방')) {
      return recommendCarePack('medication', memo)
    }
    if (text.includes('퇴원') || text.includes('수술') || text.includes('회복')) {
      return recommendCarePack('discharge', memo)
    }
    if (text.includes('서류') || text.includes('보험') || text.includes('영수증')) {
      return recommendCarePack('documents', memo)
    }
    if (text.includes('병원') || text.includes('진료') || text.includes('예약')) {
      return recommendCarePack('hospital', memo)
    }
  }

  const map: Record<WorryType, CarePackRecommendation> = {
    hospital: {
      worry,
      packCode: 'hospital_day',
      title: '병원 가는 날 안심팩',
      oneLine: '병원 전 준비, 당일 동행, 진료 후 약·서류·다음 예약까지 정리합니다.',
      steps: ['예약 정보 확인', '준비물 체크', '동행 방식 확인', '진료 내용 요약', '약·서류·다음 예약 정리'],
      familyNextActions: ['예약 문자나 사진 준비', '부모님 주의사항 메모', '필요 서류 선택'],
      opsChecklist: ['병원/진료과 확인', '이동 방식 정책 확인', '매니저 배정 가능 여부 확인', '만남 암호 생성'],
      socialCareHint: '비용 부담이 있으면 지역 공공 병원동행 또는 후원 쿠폰 연결을 검토합니다.'
    },
    meal: {
      worry,
      packCode: 'meal_delivery',
      title: '안심밥상 케어',
      oneLine: '식사 확인부터 정기 도시락·죽·저염식·회복식 연결까지 돕습니다.',
      steps: ['식사 상태 확인', '씹기/삼키기 어려움 확인', '질환별 식단 메모', '정기배송 후보 정리', '가족에게 식사 리포트 공유'],
      familyNextActions: ['선호 음식 확인', '피해야 할 음식 메모', '배송 가능 요일 선택'],
      opsChecklist: ['식사 위험도 확인', '연화식/저염식/당뇨식 필요 여부 확인', '제휴 배송 후보 확인', '공공 식사 지원 가능성 확인'],
      socialCareHint: '결식 우려가 있으면 공공 급식, 밑반찬, 후원 도시락 연결을 우선 검토합니다.'
    },
    medication: {
      worry,
      packCode: 'medication_check',
      title: '약 챙김 안심팩',
      oneLine: '처방약 수령, 복용법 정리, 먹었어요 확인을 가족에게 알려줍니다.',
      steps: ['처방약 사진 기록', '복용 시간 정리', '복용 확인 알림', '미확인 시 가족 알림'],
      familyNextActions: ['기존 복용약 사진 준비', '약 봉투 보관 위치 확인'],
      opsChecklist: ['처방약 수령 여부 확인', '복용 주기 확인', '중복 약 확인 필요 여부 표시']
    },
    discharge: {
      worry,
      packCode: 'discharge_7days',
      title: '퇴원 후 7일 안심팩',
      oneLine: '퇴원 직후 7일 동안 약, 식사, 통증, 다음 외래, 낙상 위험을 확인합니다.',
      steps: ['퇴원 당일 귀가 확인', '처방약 정리', '식사 가능 여부 확인', '통증/컨디션 체크', '다음 외래 확인', '7일 요약 리포트'],
      familyNextActions: ['퇴원일 확인', '집에 필요한 물품 확인', '다음 외래 일정 확인'],
      opsChecklist: ['퇴원 병원 확인', '회복식 필요 여부 확인', '방문/전화 체크 방식 선택', '낙상 위험 체크']
    },
    documents: {
      worry,
      packCode: 'documents_insurance',
      title: '보험서류 챙김팩',
      oneLine: '실손보험과 가족 확인에 필요한 영수증·세부내역서·처방전 등을 챙깁니다.',
      steps: ['필요 서류 추천', '병원 발급 가능 여부 확인', '수령 확인', '가족에게 정리'],
      familyNextActions: ['보험 청구 여부 선택', '필요 서류를 모르면 잘 모르겠어요로 접수'],
      opsChecklist: ['영수증', '세부내역서', '통원확인서', '처방전', '검사결과지 필요 여부 확인']
    },
    recurring: {
      worry,
      packCode: 'regular_care',
      title: '정기진료·정기케어 자동관리',
      oneLine: '반복되는 진료와 약·식사·안부 확인을 놓치지 않게 관리합니다.',
      steps: ['반복 주기 확인', '다음 예약 후보 생성', '가족 할 일 생성', '알림 예약'],
      familyNextActions: ['주요 병원/진료과 입력', '반복 주기 선택'],
      opsChecklist: ['정기성 판단', '진료 주기 확인', '가족 담당자 배정']
    },
    wellbeing: {
      worry,
      packCode: 'wellbeing_check',
      title: '정기 안부 확인',
      oneLine: '혼자 계신 부모님의 식사, 약, 컨디션, 생활 위험을 가볍게 확인합니다.',
      steps: ['안부 주기 선택', '식사/약/컨디션 질문 설정', '이상 신호 시 가족 알림'],
      familyNextActions: ['안부 확인 요일 선택', '긴급 연락처 확인'],
      opsChecklist: ['응답 누락 기준 설정', '긴급 연락 흐름 확인']
    },
    emergency: {
      worry,
      packCode: 'urgent_help',
      title: '긴급 확인 요청',
      oneLine: '운영실이 즉시 확인해야 하는 요청으로 분류합니다.',
      steps: ['긴급 내용 확인', '보호자 연락', '필요 시 119/지역기관 안내', '운영 로그 기록'],
      familyNextActions: ['현재 위치와 연락 가능 번호 입력', '생명·신체 위험이면 즉시 119'],
      opsChecklist: ['긴급도 판단', '보호자 즉시 연락', '공공 긴급지원 안내', '운영 로그 기록']
    },
    not_sure: {
      worry,
      packCode: 'not_sure_consult',
      title: '뭘 해야 할지 모르겠어요 상담',
      oneLine: '상황만 듣고 병원, 식사, 약, 서류, 퇴원 케어 중 필요한 조합으로 정리합니다.',
      steps: ['상황 듣기', '걱정 분류', '필요 케어팩 추천', '가족에게 쉬운 선택지 제안'],
      familyNextActions: ['걱정되는 상황을 짧게 적기', '사진이나 카톡 내용이 있으면 나중에 추가'],
      opsChecklist: ['걱정 유형 분류', '필수 질문 3개 이하로 정리', '케어팩 후보 제안']
    }
  }

  return map[worry] || map.not_sure
}

export function normalizeWorry(input: unknown): WorryType {
  const value = typeof input === 'string' ? input : 'not_sure'
  return worryOptions.some((option) => option.code === value) ? (value as WorryType) : 'not_sure'
}

export function normalizeChannel(input: unknown): IntakeChannel {
  const value = typeof input === 'string' ? input : 'phone'
  if (value === 'phone' || value === 'kakao' || value === 'photo' || value === 'simple_form') return value
  return 'phone'
}
`)

write('src/app/api/intake/guest/route.ts', String.raw`
import { NextRequest, NextResponse } from 'next/server'
import { normalizeChannel, normalizeWorry, recommendCarePack } from '@/lib/worry-care-engine'

export const dynamic = 'force-dynamic'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function supabaseInsert(table: string, rows: unknown[]) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, demo: true, rows: [] as any[], error: 'Supabase env is missing' }
  }

  const response = await fetch(base + '/rest/v1/' + table, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(rows)
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return { ok: false, demo: false, rows: [] as any[], error: parsed || bodyText }
  }

  return { ok: true, demo: false, rows: Array.isArray(parsed) ? parsed : [] as any[], error: null }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const worry = normalizeWorry(body.worry)
    const channel = normalizeChannel(body.channel)
    const memo = text(body.memo)
    const contactName = text(body.contactName)
    const contactPhone = text(body.contactPhone)
    const socialCareRequested = Boolean(body.socialCareRequested)

    if (memo.length < 2) {
      return NextResponse.json(
        { ok: false, message: '걱정 내용을 조금만 더 입력해주세요.' },
        { status: 400 }
      )
    }

    const recommendation = recommendCarePack(worry, memo)
    const summary =
      '비로그인 걱정 접수: ' +
      recommendation.title +
      ' / 연락: ' +
      (contactName || '이름 미입력') +
      ' ' +
      (contactPhone || '연락처 미입력')

    const insert = await supabaseInsert('care_intake_entries', [
      {
        intake_channel: channel,
        raw_text: memo,
        resolved_worry: recommendation.worry,
        recommended_pack_code: recommendation.packCode,
        ai_summary: summary,
        ops_status: 'new',
        social_care_requested: socialCareRequested,
        contact_name: contactName || null,
        contact_phone: contactPhone || null,
        preferred_response_channel: channel === 'kakao' ? 'kakao' : 'phone',
        easy_mode_used: true
      }
    ])

    if (!insert.ok && !insert.demo) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Supabase 저장 중 오류가 발생했습니다.',
          detail: insert.error
        },
        { status: 500 }
      )
    }

    const saved = insert.rows[0] || {
      id: 'demo-' + crypto.randomUUID(),
      created_at: new Date().toISOString()
    }

    if (!insert.demo && saved.id) {
      await supabaseInsert('care_orchestration_events', [
        {
          care_intake_entry_id: saved.id,
          event_type: 'guest_worry_request_created',
          title: '비로그인 보호자 걱정 접수',
          description: recommendation.title,
          actor_role: 'family',
          severity: worry === 'emergency' ? 'urgent' : 'info'
        }
      ])

      await supabaseInsert('notification_outbox', [
        {
          channel: 'app',
          template_code: 'guest_worry_request_received',
          title: '부모님 걱정 접수 완료',
          body: '운영실이 확인 후 해결 플랜으로 정리합니다.',
          payload: {
            intake_id: saved.id,
            worry,
            pack_code: recommendation.packCode,
            login_deferred: true
          },
          status: 'queued'
        }
      ])
    }

    return NextResponse.json({
      ok: true,
      demo: insert.demo,
      intakeId: saved.id,
      recommendedPackCode: recommendation.packCode,
      recommendation
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: '걱정 접수 처리 중 오류가 발생했습니다.',
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
`)

write('src/app/api/ops/intakes/route.ts', String.raw`
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function canUseOpsRoute(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return true
  const secret = process.env.CRON_SECRET || ''
  const given = request.headers.get('x-ops-dev-secret') || ''
  return Boolean(secret && given && secret === given)
}

async function supabaseFetch(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase service env is missing' }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return { ok: false, data: parsed, error: parsed || bodyText }
  }

  return { ok: true, data: parsed, error: null }
}

export async function GET(request: NextRequest) {
  if (!canUseOpsRoute(request)) {
    return NextResponse.json({ ok: false, message: 'ops route locked in production' }, { status: 403 })
  }

  const select = [
    'id',
    'resolved_worry',
    'recommended_pack_code',
    'intake_channel',
    'ops_status',
    'contact_name',
    'contact_phone',
    'raw_text',
    'ai_summary',
    'social_care_requested',
    'created_at'
  ].join(',')

  const result = await supabaseFetch(
    'care_intake_entries?select=' +
      encodeURIComponent(select) +
      '&order=created_at.desc&limit=50'
  )

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: '접수 목록을 불러오지 못했습니다.', detail: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, items: Array.isArray(result.data) ? result.data : [] })
}

export async function PATCH(request: NextRequest) {
  if (!canUseOpsRoute(request)) {
    return NextResponse.json({ ok: false, message: 'ops route locked in production' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const id = typeof body.id === 'string' ? body.id : ''
  const status = typeof body.status === 'string' ? body.status : ''

  const allowed = ['new', 'triaged', 'plan_created', 'waiting_family', 'in_progress', 'resolved', 'cancelled']

  if (!id || !allowed.includes(status)) {
    return NextResponse.json({ ok: false, message: '상태 변경 값이 올바르지 않습니다.' }, { status: 400 })
  }

  const result = await supabaseFetch(
    'care_intake_entries?id=eq.' + encodeURIComponent(id),
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ ops_status: status, updated_at: new Date().toISOString() })
    }
  )

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: '상태 변경 실패', detail: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, item: Array.isArray(result.data) ? result.data[0] : result.data })
}
`)

write('src/app/login/page.tsx', String.raw`
import Link from 'next/link'

const loginOptions = [
  {
    title: '휴대폰 번호 인증',
    desc: '배포 직전에 SMS 인증을 연결합니다. 40대 이상 보호자에게 가장 쉬운 방식입니다.',
    badge: '1순위'
  },
  {
    title: '카카오 로그인',
    desc: '배포 직전에 카카오 OAuth를 연결합니다. 카톡에 익숙한 보호자에게 적합합니다.',
    badge: '2순위'
  },
  {
    title: '이메일 로그인',
    desc: '운영실, 관리자, 이메일이 편한 보호자를 위한 보조 수단입니다.',
    badge: '보조'
  }
]

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-5xl">
        <p className="mb-3 text-sm font-black text-care-700">로그인 연동 보류</p>
        <h1 className="text-3xl font-black tracking-tight md:text-5xl">
          지금은 로그인보다 부모님 걱정 접수 흐름을 먼저 완성합니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          휴대폰 인증, 카카오 로그인, 이메일 로그인은 배포 직전에 연결합니다.
          현재 개발 단계에서는 로그인 없이 걱정을 접수하고 운영실에서 확인하는 흐름을 우선 만듭니다.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {loginOptions.map((option) => (
            <article key={option.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="rounded-full bg-care-50 px-3 py-1 text-xs font-black text-care-800">
                {option.badge}
              </span>
              <h2 className="mt-4 text-xl font-black">{option.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{option.desc}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">지금 가능한 흐름</h2>
          <p className="mt-3 text-slate-600">
            앱 사용이 어려운 보호자도 바로 부모님 걱정을 맡길 수 있도록 비로그인 접수를 먼저 사용합니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/care-request" className="rounded-2xl bg-care-600 px-5 py-4 text-lg font-black text-white">
              부모님 걱정 접수하기
            </Link>
            <Link href="/ops/worry-center" className="rounded-2xl bg-slate-900 px-5 py-4 text-lg font-black text-white">
              운영실 접수 보기
            </Link>
            <Link href="/" className="rounded-2xl bg-slate-100 px-5 py-4 text-lg font-black">
              홈으로
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
`)

write('src/app/care-request/page.tsx', String.raw`
'use client'

import { FormEvent, useMemo, useState } from 'react'
import { normalizeWorry, recommendCarePack, worryOptions, type WorryType, type IntakeChannel } from '@/lib/worry-care-engine'

const channelOptions: Array<{ code: IntakeChannel; label: string; desc: string }> = [
  { code: 'phone', label: '전화로 답변', desc: '가장 쉬운 방식' },
  { code: 'kakao', label: '카톡으로 답변', desc: '카톡이 편한 보호자' },
  { code: 'photo', label: '사진으로 맡김', desc: '예약 문자·서류 사진' },
  { code: 'simple_form', label: '앱에서 확인', desc: '앱 화면으로 확인' }
]

export default function CareRequestPage() {
  const [worry, setWorry] = useState<WorryType>('not_sure')
  const [memo, setMemo] = useState('')
  const [channel, setChannel] = useState<IntakeChannel>('phone')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [socialCareRequested, setSocialCareRequested] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const recommendation = useMemo(() => {
    return recommendCarePack(normalizeWorry(worry), memo)
  }, [worry, memo])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/intake/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worry, memo, channel, contactName, contactPhone, socialCareRequested })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '접수 중 오류가 발생했습니다.')
      }

      const params = new URLSearchParams()
      params.set('pack', data.recommendedPackCode || recommendation.packCode)
      params.set('intake', data.intakeId || '')
      if (data.demo) params.set('demo', '1')

      window.location.href = '/care-request/thanks?' + params.toString()
    } catch (err) {
      setError(err instanceof Error ? err.message : '접수 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-3 text-sm font-black text-care-700">부모님 걱정 접수센터</p>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            무엇이 걱정되세요?
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            기능을 찾지 않아도 됩니다. 걱정을 누르면 운영실이 필요한 케어팩으로 정리합니다.
            로그인은 배포 직전에 연결하고, 지금은 간편 접수를 먼저 완성합니다.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black">1. 걱정 선택</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {worryOptions.map((option) => (
                  <button
                    type="button"
                    key={option.code}
                    onClick={() => setWorry(option.code)}
                    className={
                      'rounded-3xl border p-4 text-left transition ' +
                      (worry === option.code
                        ? 'border-care-500 bg-care-50 ring-2 ring-care-100'
                        : 'border-slate-200 bg-white hover:bg-slate-50')
                    }
                  >
                    <div className="text-2xl">{option.emoji}</div>
                    <div className="mt-2 text-lg font-black">{option.label}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{option.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black">2. 상황을 짧게 알려주세요</h2>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                required
                rows={6}
                className="mt-4 w-full rounded-3xl border border-slate-200 p-5 text-lg leading-8 outline-none focus:border-care-500"
                placeholder="예: 어머니가 다음 주 정형외과 진료가 있는데 저는 못 갑니다. 무릎이 안 좋고, 약이랑 보험서류도 챙겨야 해요."
              />
              <p className="mt-2 text-sm text-slate-500">
                길게 쓰지 않아도 됩니다. 사진·카톡·전화 접수는 다음 단계에서 붙입니다.
              </p>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black">3. 답변 받을 방법</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {channelOptions.map((option) => (
                  <button
                    type="button"
                    key={option.code}
                    onClick={() => setChannel(option.code)}
                    className={
                      'rounded-2xl border p-4 text-left ' +
                      (channel === option.code ? 'border-care-500 bg-care-50' : 'border-slate-200 bg-white')
                    }
                  >
                    <div className="font-black">{option.label}</div>
                    <div className="mt-1 text-sm text-slate-500">{option.desc}</div>
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black text-slate-700">보호자 이름</span>
                  <input
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-care-500"
                    placeholder="예: 이관용"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black text-slate-700">연락처</span>
                  <input
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-care-500"
                    placeholder="예: 010-1234-5678"
                  />
                </label>
              </div>

              <label className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={socialCareRequested}
                  onChange={(event) => setSocialCareRequested(event.target.checked)}
                  className="mt-1 h-5 w-5"
                />
                <span className="text-sm leading-6 text-slate-700">
                  비용 부담이 있으면 공공지원·후원 쿠폰·지역 복지 연결도 함께 안내받고 싶습니다.
                </span>
              </label>
            </section>

            {error ? (
              <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</p>
            ) : null}

            <button
              disabled={submitting}
              className="w-full rounded-3xl bg-care-600 px-6 py-5 text-xl font-black text-white disabled:opacity-50"
            >
              {submitting ? '접수 중...' : '부모님 걱정 맡기기'}
            </button>
          </form>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
            <p className="text-sm font-black text-care-200">추천 케어팩</p>
            <h2 className="mt-3 text-3xl font-black">{recommendation.title}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-200">{recommendation.oneLine}</p>

            <div className="mt-6 rounded-2xl bg-white/10 p-4">
              <div className="text-sm font-black text-care-100">진행 흐름</div>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-100">
                {recommendation.steps.map((step, index) => (
                  <li key={step}>
                    {index + 1}. {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 rounded-2xl bg-white/10 p-4">
              <div className="text-sm font-black text-care-100">가족이 준비하면 좋은 것</div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-100">
                {recommendation.familyNextActions.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            {recommendation.socialCareHint ? (
              <p className="mt-4 rounded-2xl bg-care-200 p-4 text-sm font-bold leading-6 text-slate-950">
                {recommendation.socialCareHint}
              </p>
            ) : null}
          </div>
        </aside>
      </section>
    </main>
  )
}
`)

write('src/app/care-request/thanks/page.tsx', String.raw`
import Link from 'next/link'
import { recommendCarePack, normalizeWorry } from '@/lib/worry-care-engine'

const packTitleByCode: Record<string, string> = {
  hospital_day: '병원 가는 날 안심팩',
  meal_delivery: '안심밥상 케어',
  medication_check: '약 챙김 안심팩',
  discharge_7days: '퇴원 후 7일 안심팩',
  documents_insurance: '보험서류 챙김팩',
  regular_care: '정기진료·정기케어 자동관리',
  wellbeing_check: '정기 안부 확인',
  urgent_help: '긴급 확인 요청',
  not_sure_consult: '뭘 해야 할지 모르겠어요 상담'
}

export default async function CareRequestThanksPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = searchParams ? await searchParams : {}
  const packValue = typeof params.pack === 'string' ? params.pack : 'not_sure_consult'
  const intakeId = typeof params.intake === 'string' ? params.intake : ''
  const isDemo = params.demo === '1'

  const title = packTitleByCode[packValue] || recommendCarePack(normalizeWorry('not_sure')).title

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-black text-care-700">접수 완료</p>
        <h1 className="mt-3 text-3xl font-black md:text-5xl">
          부모님 걱정이 접수됐습니다.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          추천 케어팩은 <b>{title}</b> 입니다. 운영실이 확인 후 필요한 질문을 3개 이하로 정리해 연락하는 흐름으로 만들고 있습니다.
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="text-sm font-black text-slate-500">접수번호</div>
          <div className="mt-2 break-all text-lg font-black">{intakeId || '임시 접수'}</div>
          {isDemo ? (
            <p className="mt-3 text-sm font-bold text-amber-700">
              현재 Supabase 환경변수가 없어 데모 접수로 처리됐습니다.
            </p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link href="/care-request" className="rounded-2xl bg-care-600 px-5 py-4 text-center font-black text-white">
            또 다른 걱정 접수
          </Link>
          <Link href="/ops/worry-center" className="rounded-2xl bg-slate-900 px-5 py-4 text-center font-black text-white">
            운영실에서 보기
          </Link>
          <Link href="/" className="rounded-2xl bg-slate-100 px-5 py-4 text-center font-black">
            홈으로
          </Link>
        </div>
      </section>
    </main>
  )
}
`)

write('src/app/ops/worry-center/page.tsx', String.raw`
'use client'

import { useEffect, useMemo, useState } from 'react'

type IntakeItem = {
  id: string
  resolved_worry: string
  recommended_pack_code: string | null
  intake_channel: string
  ops_status: string
  contact_name: string | null
  contact_phone: string | null
  raw_text: string | null
  ai_summary: string | null
  social_care_requested: boolean
  created_at: string
}

const statusLabels: Record<string, string> = {
  new: '신규',
  triaged: '확인 완료',
  plan_created: '플랜 작성',
  waiting_family: '가족 확인 대기',
  in_progress: '진행 중',
  resolved: '해결 완료',
  cancelled: '취소'
}

const packLabels: Record<string, string> = {
  hospital_day: '병원 가는 날 안심팩',
  meal_delivery: '안심밥상 케어',
  medication_check: '약 챙김 안심팩',
  discharge_7days: '퇴원 후 7일 안심팩',
  documents_insurance: '보험서류 챙김팩',
  regular_care: '정기진료 자동관리',
  wellbeing_check: '정기 안부 확인',
  urgent_help: '긴급 확인 요청',
  not_sure_consult: '뭘 해야 할지 모르겠어요 상담'
}

export default function OpsWorryCenterPage() {
  const [items, setItems] = useState<IntakeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops/intakes', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '목록을 불러오지 못했습니다.')
      }

      setItems(data.items || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    setMessage('')

    try {
      const response = await fetch('/api/ops/intakes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1
        if (item.ops_status === 'new') acc.newCount += 1
        if (item.social_care_requested) acc.socialCare += 1
        if (item.recommended_pack_code === 'meal_delivery') acc.meal += 1
        if (item.recommended_pack_code === 'urgent_help') acc.urgent += 1
        return acc
      },
      { total: 0, newCount: 0, socialCare: 0, meal: 0, urgent: 0 }
    )
  }, [items])

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-care-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">부모님 걱정 해결 센터</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              로그인 연동 전까지는 비로그인 접수를 운영실에서 확인합니다. 배포 전에는 이 화면을 운영실 권한으로 잠급니다.
            </p>
          </div>
          <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
            새로고침
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <Stat label="전체 접수" value={counts.total} />
          <Stat label="신규" value={counts.newCount} />
          <Stat label="식사 케어" value={counts.meal} />
          <Stat label="사회공헌 요청" value={counts.socialCare} />
          <Stat label="긴급" value={counts.urgent} />
        </div>

        {message ? (
          <p className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{message}</p>
        ) : null}

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="text-xl font-black">아직 접수된 걱정이 없습니다.</div>
              <p className="mt-2 text-slate-500">/care-request 에서 테스트 접수를 만들어보세요.</p>
            </div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={statusLabels[item.ops_status] || item.ops_status} />
                      <Badge text={packLabels[item.recommended_pack_code || ''] || item.recommended_pack_code || '케어팩 미정'} />
                      <Badge text={item.intake_channel} />
                      {item.social_care_requested ? <Badge text="사회공헌 요청" /> : null}
                    </div>
                    <h2 className="mt-4 text-2xl font-black">
                      {item.contact_name || '보호자 이름 미입력'} · {item.contact_phone || '연락처 미입력'}
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap text-lg leading-8 text-slate-700">
                      {item.raw_text || item.ai_summary || '내용 없음'}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      접수일: {new Date(item.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>

                  <div className="grid min-w-[180px] gap-2">
                    <button onClick={() => updateStatus(item.id, 'triaged')} className="rounded-2xl bg-care-50 px-4 py-3 font-black text-care-800">
                      확인 완료
                    </button>
                    <button onClick={() => updateStatus(item.id, 'plan_created')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                      플랜 작성
                    </button>
                    <button onClick={() => updateStatus(item.id, 'waiting_family')} className="rounded-2xl bg-amber-50 px-4 py-3 font-black text-amber-800">
                      가족 확인 대기
                    </button>
                    <button onClick={() => updateStatus(item.id, 'resolved')} className="rounded-2xl bg-emerald-50 px-4 py-3 font-black text-emerald-800">
                      해결 완료
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
      {text}
    </span>
  )
}
`)

write('docs/step7-auth-deferred-guest-intake.md', String.raw`
# STEP7 인증 연동 보류 + 비로그인 걱정 접수

## 결정

휴대폰 인증, 카카오 로그인, 이메일 로그인은 배포 직전에 연결한다.

현재 개발 단계에서는 로그인 없이 다음 흐름을 먼저 완성한다.

1. 보호자가 걱정 선택
2. 간단한 상황 입력
3. 앱이 케어팩 추천
4. Supabase care_intake_entries 저장
5. 운영실이 접수 확인
6. 운영실이 상태 변경

## 이유

핵심 사용자는 40대 이상 보호자다. 인증 연동을 먼저 복잡하게 만들면 핵심 기능 검증 속도가 느려진다.

## 배포 직전 연결 우선순위

1. 휴대폰 번호 인증
2. 카카오 로그인
3. 이메일 로그인
4. 운영실 관리자 권한
5. 매니저 휴대폰 인증 + 승인
`)

console.log('')
console.log('[step7] Done.')
console.log('[step7] Run:')
console.log('npm run typecheck')
console.log('npm run build')
console.log('npm run dev')
