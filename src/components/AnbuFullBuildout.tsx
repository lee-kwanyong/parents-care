'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { buildDailyCareSummary } from '@/lib/daily-care-engine'
import type { DailyCareCheckin } from '@/lib/daily-care-engine'
import {
  careScheduleTypes,
  collaborationBenefits,
  legalDocuments,
  metrics,
  onboardingSteps,
  opsCaseStatuses,
  outreachStatuses,
  partnerStatuses,
  partnerTrainingModules,
  playStoreChecklist,
  safetyProtocolSteps
} from '@/lib/anbu-buildout-data'

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeStore<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

async function saveRecord(table: string, payload: Record<string, unknown>) {
  await fetch('/api/anbu-records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, payload })
  }).catch(() => null)
}

function PageShell({
  eyebrow,
  title,
  desc,
  children
}: {
  eyebrow: string
  title: string
  desc: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-5 py-8 text-[#17443F]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            {eyebrow}
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            {desc}
          </p>
        </section>

        {children}
      </section>
    </main>
  )
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={'rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6 ' + className}>
      {children}
    </section>
  )
}

function Field({
  label,
  name,
  type = 'text',
  placeholder = '',
  required = false
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

function TextArea({
  label,
  name,
  placeholder = ''
}: {
  label: string
  name: string
  placeholder?: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <textarea
        name={name}
        rows={4}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold leading-6 outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

export function CustomerLandingPage() {
  return (
    <PageShell
      eyebrow="안부웍스 · 부모님 안심케어"
      title="매일 부모님께 안부를 묻고, 이상 신호가 보이면 자녀에게 알려드립니다."
      desc="안부온은 식사, 복약, 몸 상태, 기분, 응답 없음 신호를 확인하고 필요한 순간 운영실과 케어파트너 연결까지 이어주는 부모님 안심관리 플랫폼입니다."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {[
          ['1', 'AI 안부확인', '부모님의 식사, 약, 몸 상태, 기분을 매일 확인합니다.'],
          ['2', '보호자 알림', '정상, 주의, 확인 필요 상태를 한눈에 보여줍니다.'],
          ['3', '사람 돌봄 연결', '필요한 순간 운영실과 케어파트너가 개입합니다.']
        ].map(([num, title, desc]) => (
          <Card key={title}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFFFFA] text-sm font-black text-[#2AA897]">
              {num}
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-[-0.05em]">{title}</h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
          </Card>
        ))}
      </div>

      <Card className="bg-[#247A71] text-white">
        <p className="text-sm font-black text-[#9DF4DD]">핵심 흐름</p>
        <p className="mt-3 text-2xl font-black leading-snug tracking-[-0.04em]">
          부모님 연결 → 안부 루틴 → 위험신호 분류 → 보호자 알림 → 운영실 확인 → 케어파트너 연결 → 주간 리포트
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/onboarding" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F]">
            보호자 시작하기
          </Link>
          <Link href="/partners" className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white ring-1 ring-white/25">
            협업기관 안내
          </Link>
        </div>
      </Card>
    </PageShell>
  )
}

export function GuardianOnboardingPage() {
  const [done, setDone] = useState<string[]>([])

  function toggle(title: string) {
    setDone((prev) => {
      const next = prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
      writeStore('anbu_onboarding_done', next)
      return next
    })
  }

  useEffect(() => {
    setDone(readStore<string[]>('anbu_onboarding_done', []))
  }, [])

  return (
    <PageShell
      eyebrow="보호자 온보딩"
      title="처음 설정을 7단계로 끝냅니다."
      desc="보호자가 부모님을 등록하고, 안부 루틴과 알림을 설정하고, 부모님에게 연결코드를 전달하는 흐름입니다."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {onboardingSteps.map((step, index) => {
          const checked = done.includes(step.title)

          return (
            <button
              key={step.title}
              onClick={() => toggle(step.title)}
              className={
                'rounded-[2rem] p-5 text-left shadow-sm ring-1 transition ' +
                (checked
                  ? 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
                  : 'bg-white text-[#17443F] ring-[#D6EDE7]')
              }
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black ring-1 ring-[#D6EDE7]">
                  {checked ? '✓' : index + 1}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-[-0.05em]">{step.title}</h2>
                  <p className="mt-2 text-sm font-bold leading-7 opacity-75">{step.desc}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/family-link" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
          부모님 연결
        </Link>
        <Link href="/care-schedule" className="rounded-2xl bg-[#EFFFFA] px-5 py-4 text-center text-sm font-black text-[#2AA897] ring-1 ring-[#CDEFE7]">
          일정 등록
        </Link>
        <Link href="/settings/permissions" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
          앱 권한 설정
        </Link>
      </div>
    </PageShell>
  )
}

export function CareSchedulePage() {
  const [items, setItems] = useState<Array<Record<string, string>>>([])

  useEffect(() => {
    setItems(readStore<Array<Record<string, string>>>('anbu_care_schedules', []))
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form.entries()) as Record<string, string>
    const next = [{ ...payload, id: String(Date.now()) }, ...items]
    setItems(next)
    writeStore('anbu_care_schedules', next)
    await saveRecord('anbu_schedules', payload)
    event.currentTarget.reset()
  }

  return (
    <PageShell
      eyebrow="복약·병원 일정"
      title="안부온이 매일 물어볼 일정을 등록합니다."
      desc="아침 약, 병원 예약, 검진일, 약국 방문 등 보호자가 등록하면 부모님 안부 루틴과 보호자 알림으로 이어집니다."
    >
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-2xl font-black tracking-[-0.05em]">일정 추가</h2>
          <form onSubmit={submit} className="mt-5 grid gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#637B76]">일정 종류</span>
              <select
                name="schedule_type"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              >
                {careScheduleTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <Field label="일정 이름" name="title" placeholder="예: 혈압약, 정형외과 예약" required />
            <Field label="날짜" name="date" type="date" required />
            <Field label="시간" name="time" type="time" />
            <TextArea label="메모" name="memo" placeholder="약 이름, 병원명, 준비물 등" />
            <button className="rounded-2xl bg-[#247A71] px-5 py-4 text-base font-black text-white">
              일정 저장
            </button>
          </form>
        </Card>

        <Card>
          <h2 className="text-2xl font-black tracking-[-0.05em]">등록된 일정</h2>
          <div className="mt-5 space-y-3">
            {items.length === 0 ? (
              <p className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 등록된 일정이 없습니다.
              </p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#2AA897]">{item.schedule_type}</div>
                  <div className="mt-1 text-lg font-black">{item.title}</div>
                  <div className="mt-2 text-sm font-bold text-[#637B76]">
                    {item.date} {item.time}
                  </div>
                  {item.memo ? <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{item.memo}</p> : null}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  )
}

export function ChildDashboardPage() {
  const [items, setItems] = useState<DailyCareCheckin[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/daily-care/status', { cache: 'no-store' })
      const data = await response.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildDailyCareSummary(items), [items])

  return (
    <PageShell
      eyebrow="보호자 대시보드"
      title="오늘 부모님 상태를 한 화면에서 확인합니다."
      desc="식사, 약, 몸 상태, 응답 여부, 병원 일정, 다음 행동을 보호자가 한눈에 볼 수 있게 정리합니다."
    >
      <Card className={summary.signalState === '확인 필요' ? 'bg-[#FFF4F4]' : summary.signalState === '주의' ? 'bg-[#FFF9EE]' : 'bg-[#EFFFFA]'}>
        <div className="grid gap-5 lg:grid-cols-[1fr_0.7fr]">
          <div>
            <p className="text-sm font-black opacity-70">오늘 부모님 상태</p>
            <h2 className="mt-2 text-5xl font-black tracking-[-0.08em]">{summary.signalState}</h2>
            <p className="mt-4 text-lg font-bold leading-8">{summary.guardianSummary}</p>
          </div>
          <div className="rounded-[1.75rem] bg-white/75 p-5">
            <p className="text-sm font-black opacity-70">안부온 점수</p>
            <div className="mt-2 text-6xl font-black tracking-[-0.08em]">{summary.signalScore}</div>
            <p className="mt-2 text-sm font-bold leading-6 opacity-75">의료 진단이 아닌 안부 확인 참고 신호입니다.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-black tracking-[-0.05em]">확인된 이유</h2>
          <div className="mt-4 space-y-3">
            {summary.signalReasons.map((reason) => (
              <div key={reason} className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black leading-7 ring-1 ring-[#D6EDE7]">
                {reason}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black tracking-[-0.05em]">다음 행동</h2>
          <div className="mt-4 space-y-3">
            {summary.familyNextActions.map((action, index) => (
              <div key={action} className="rounded-2xl bg-[#F7FBFF] p-4 text-sm font-black leading-7 ring-1 ring-[#D6EDE7]">
                {index + 1}. {action}
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="tel:01012345678" className="rounded-2xl bg-[#247A71] px-4 py-4 text-center text-sm font-black text-white">
              부모님께 전화
            </Link>
            <Link href="/care-request" className="rounded-2xl bg-[#20C5A8] px-4 py-4 text-center text-sm font-black text-white">
              운영실 확인 요청
            </Link>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.05em]">최근 안부 기록</h2>
            <p className="mt-2 text-sm font-bold text-[#637B76]">
              {loading ? '불러오는 중...' : `${items.length}개 기록`}
            </p>
          </div>
          <button onClick={load} className="rounded-2xl bg-[#FAFFFD] px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            새로고침
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {items.slice(0, 8).map((item) => (
            <div key={item.id || `${item.check_type}-${item.occurred_at}`} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
              <div className="text-xs font-black text-[#2AA897]">{item.check_type} · {item.status}</div>
              <div className="mt-1 text-lg font-black">{item.care_label}</div>
              {item.memo ? <p className="mt-2 text-sm font-bold text-[#637B76]">{item.memo}</p> : null}
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  )
}

export function PartnerCollaborationPage() {
  return (
    <PageShell
      eyebrow="협업기관 안내"
      title="요양보호사 교육원, 여성인력개발센터, 50플러스, 시니어클럽과 함께 케어파트너를 모집합니다."
      desc="안부웍스는 의료행위가 아닌 생활확인, 병원동행, 복약확인, 보호자 리포트를 수행할 수 있는 돌봄 파트너 네트워크를 만들고 있습니다."
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {collaborationBenefits.map((item) => (
          <Card key={item.title}>
            <h2 className="text-xl font-black tracking-[-0.05em]">{item.title}</h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{item.desc}</p>
          </Card>
        ))}
      </div>

      <Card className="bg-[#247A71] text-white">
        <p className="text-sm font-black text-[#9DF4DD]">협업 방식</p>
        <p className="mt-3 text-2xl font-black leading-snug tracking-[-0.04em]">
          설명회 → 희망자 사전등록 → 운영실 검증 → 지역 기반 배정 → 보호자 리포트
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/care-partner/apply" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F]">
            케어파트너 신청
          </Link>
          <Link href="/contact" className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white ring-1 ring-white/25">
            협업 문의
          </Link>
        </div>
      </Card>
    </PageShell>
  )
}

export function CarePartnerGuidePage() {
  return (
    <PageShell
      eyebrow="케어파트너 교육"
      title="케어파트너는 의료진이 아니라 보호자에게 정확한 생활정보를 전달하는 사람입니다."
      desc="요양보호사, 병원동행매니저, 생활확인 파트너가 같은 기준으로 활동할 수 있도록 교육 가이드를 제공합니다."
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {partnerTrainingModules.map((module, index) => (
          <Card key={module.title}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFFFFA] text-sm font-black text-[#2AA897]">
              {index + 1}
            </div>
            <h2 className="mt-5 text-xl font-black tracking-[-0.05em]">{module.title}</h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{module.desc}</p>
          </Card>
        ))}
      </div>

      <Card className="bg-[#FFF9EE]">
        <h2 className="text-2xl font-black tracking-[-0.05em] text-[#795C22]">중요 고지</h2>
        <p className="mt-3 text-sm font-bold leading-7 text-[#795C22]">
          케어파트너는 진료 판단, 처방 변경, 복약 결정 등 의료행위를 하지 않습니다.
          응급 가능성이 있으면 보호자와 119 또는 의료기관 안내가 우선입니다.
        </p>
      </Card>
    </PageShell>
  )
}

export function CarePartnerApplyPage() {
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form.entries())
    await saveRecord('anbu_care_partner_applications', payload)
    const current = readStore<Record<string, unknown>[]>('anbu_partner_applications', [])
    writeStore('anbu_partner_applications', [{ ...payload, created_at: new Date().toISOString() }, ...current])
    setSaved(true)
    event.currentTarget.reset()
  }

  return (
    <PageShell
      eyebrow="케어파트너 신청"
      title="요양보호사·병원동행·생활확인 파트너를 모집합니다."
      desc="활동 지역, 가능 업무, 자격 여부, 가능 시간을 등록하면 운영실이 검토 후 연락합니다."
    >
      {saved ? (
        <div className="rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black text-[#2AA897] ring-1 ring-[#CDEFE7]">
          신청이 접수되었습니다. 운영실에서 검토 후 연락드립니다.
        </div>
      ) : null}

      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Field label="이름" name="applicant_name" required />
          <Field label="연락처" name="phone" required />
          <Field label="활동 가능 지역" name="region" placeholder="예: 청주, 강남, 송파" required />
          <Field label="가능 요일/시간" name="available_time" placeholder="예: 평일 오전, 주말 가능" />
          <Field label="요양보호사 자격 여부" name="caregiver_license" placeholder="예: 있음 / 없음" />
          <Field label="병원동행 가능 여부" name="hospital_accompany" placeholder="예: 가능" />
          <Field label="복약 확인 가능 여부" name="medication_check" placeholder="예: 가능" />
          <Field label="식사 확인 가능 여부" name="meal_check" placeholder="예: 가능" />
          <Field label="차량 이동 가능 여부" name="drive_available" placeholder="예: 가능 / 불가" />
          <Field label="희망 활동비" name="expected_fee" placeholder="예: 시간당 15,000원" />
          <div className="md:col-span-2">
            <TextArea label="자기소개 / 활동 경험" name="intro" placeholder="요양보호, 병원동행, 돌봄 경험을 적어주세요." />
          </div>
          <label className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7] md:col-span-2">
            <input type="checkbox" name="privacy_agreed" value="yes" required className="mr-2" />
            개인정보 수집 및 케어파트너 검증 목적의 이용에 동의합니다.
          </label>
          <button className="rounded-2xl bg-[#247A71] px-5 py-4 text-base font-black text-white md:col-span-2">
            케어파트너 신청하기
          </button>
        </form>
      </Card>
    </PageShell>
  )
}

export function SafetyProtocolPage() {
  return (
    <PageShell
      eyebrow="안전 프로토콜"
      title="도움 필요 신호가 생기면 알림에서 사람 확인까지 이어집니다."
      desc="부모님이 도움을 요청하거나 응답이 없을 때 보호자, 운영실, 케어파트너가 어떤 순서로 움직일지 정리합니다."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {safetyProtocolSteps.map((step, index) => (
          <Card key={step.title}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFFFFA] text-sm font-black text-[#2AA897]">
              {index + 1}
            </div>
            <h2 className="mt-5 text-lg font-black tracking-[-0.05em]">{step.title}</h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{step.desc}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}

export function OpsCrmPage() {
  const [items, setItems] = useState<Array<Record<string, string>>>([])

  useEffect(() => {
    setItems(readStore<Array<Record<string, string>>>('anbu_ops_cases', []))
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>
    const next = [{ ...payload, id: String(Date.now()) }, ...items]
    setItems(next)
    writeStore('anbu_ops_cases', next)
    await saveRecord('anbu_ops_cases', payload)
    event.currentTarget.reset()
  }

  return (
    <PageShell
      eyebrow="운영실 CRM"
      title="접수, 안부 관제, 파트너 승인, 처리 로그를 한 곳에서 관리합니다."
      desc="실제 운영에서는 누가 언제 어떤 조치를 했는지 남기는 운영실 로그가 핵심입니다."
    >
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h2 className="text-2xl font-black tracking-[-0.05em]">운영 케이스 추가</h2>
          <form onSubmit={submit} className="mt-5 grid gap-3">
            <Field label="부모님/보호자명" name="customer_name" required />
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#637B76]">상태</span>
              <select name="status" className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold">
                {opsCaseStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <Field label="담당자" name="owner" />
            <TextArea label="메모" name="memo" />
            <button className="rounded-2xl bg-[#247A71] px-5 py-4 text-base font-black text-white">저장</button>
          </form>
        </Card>

        <Card>
          <h2 className="text-2xl font-black tracking-[-0.05em]">운영 케이스</h2>
          <div className="mt-5 space-y-3">
            {items.length === 0 ? (
              <p className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 등록된 케이스가 없습니다.
              </p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#2AA897]">{item.status}</div>
                  <div className="mt-1 text-lg font-black">{item.customer_name}</div>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{item.memo}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['접수 관리', '신규 접수, 확인 중, 매칭 필요, 완료'],
          ['안부 관제', '응답 없음, 약 미확인, 도움 요청'],
          ['파트너 관리', '신규 신청, 승인, 활동 중, 정지']
        ].map(([title, desc]) => (
          <Card key={title}>
            <h2 className="text-xl font-black tracking-[-0.05em]">{title}</h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}

export function OutreachCrmPage() {
  const [items, setItems] = useState<Array<Record<string, string>>>([])

  useEffect(() => {
    setItems(readStore<Array<Record<string, string>>>('anbu_outreach_orgs', []))
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>
    const next = [{ ...payload, id: String(Date.now()) }, ...items]
    setItems(next)
    writeStore('anbu_outreach_orgs', next)
    await saveRecord('anbu_outreach_organizations', payload)
    event.currentTarget.reset()
  }

  return (
    <PageShell
      eyebrow="협업기관 모집 CRM"
      title="메일 보낸 곳, 회신 온 곳, 미팅 예정 기관을 관리합니다."
      desc="요양보호사 교육원, 여성인력개발센터, 50플러스, 시니어클럽, 병원동행 기관을 체계적으로 추적합니다."
    >
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h2 className="text-2xl font-black tracking-[-0.05em]">기관 추가</h2>
          <form onSubmit={submit} className="mt-5 grid gap-3">
            <Field label="기관명" name="org_name" required />
            <Field label="유형" name="org_type" placeholder="교육원 / 여성인력개발센터 / 50플러스 / 시니어클럽" />
            <Field label="이메일" name="email" type="email" />
            <Field label="전화번호" name="phone" />
            <Field label="지역" name="region" />
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#637B76]">상태</span>
              <select name="status" className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold">
                {outreachStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <TextArea label="메모 / 다음 액션" name="memo" />
            <button className="rounded-2xl bg-[#247A71] px-5 py-4 text-base font-black text-white">저장</button>
          </form>
        </Card>

        <Card>
          <h2 className="text-2xl font-black tracking-[-0.05em]">협업기관 현황</h2>
          <div className="mt-5 space-y-3">
            {items.length === 0 ? (
              <p className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 등록된 기관이 없습니다.
              </p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#2AA897]">{item.status}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#637B76] ring-1 ring-[#D6EDE7]">{item.org_type}</span>
                  </div>
                  <div className="mt-3 text-lg font-black">{item.org_name}</div>
                  <p className="mt-1 text-sm font-bold text-[#637B76]">{item.email} · {item.region}</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{item.memo}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  )
}

export function MetricsDashboardPage() {
  return (
    <PageShell
      eyebrow="핵심 지표"
      title="투자자와 운영자가 볼 수 있는 성장 지표를 만듭니다."
      desc="가입 보호자 수, 연결된 부모님 수, 안부 응답률, 확인 필요 신호, 케어파트너 신청 수를 추적합니다."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <div className="text-sm font-black text-[#7A9692]">{metric.label}</div>
            <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#2AA897]">{metric.value}</div>
            <p className="mt-2 text-sm font-bold text-[#637B76]">{metric.desc}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}

export function LegalPage({ type }: { type: 'privacy' | 'terms' | 'location' | 'health' }) {
  const doc = legalDocuments[type]

  return (
    <PageShell
      eyebrow="법적 고지"
      title={doc.title}
      desc="안부웍스 서비스 운영에 필요한 기본 문서입니다. 실제 출시 전에는 법무 검토를 권장합니다."
    >
      <Card>
        <div className="space-y-4">
          {doc.body.map((paragraph, index) => (
            <p key={paragraph} className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#4E6D69] ring-1 ring-[#D6EDE7]">
              {index + 1}. {paragraph}
            </p>
          ))}
        </div>
      </Card>
    </PageShell>
  )
}

export function DataDeletionPage() {
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries())
    await saveRecord('anbu_data_deletion_requests', payload)
    setSaved(true)
    event.currentTarget.reset()
  }

  return (
    <PageShell
      eyebrow="데이터 삭제 요청"
      title="계정, 부모님 연결, 안부 기록 삭제를 요청할 수 있습니다."
      desc="Play Store와 개인정보 보호 기준에 맞춰 이용자가 데이터 삭제 요청을 할 수 있는 창구를 제공합니다."
    >
      {saved ? (
        <div className="rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black text-[#2AA897] ring-1 ring-[#CDEFE7]">
          삭제 요청이 접수되었습니다.
        </div>
      ) : null}

      <Card>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="이름" name="name" required />
          <Field label="이메일" name="email" type="email" required />
          <Field label="연락처" name="phone" />
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#637B76]">요청 유형</span>
            <select name="request_type" className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold">
              <option>계정 삭제</option>
              <option>부모님 연결 해제</option>
              <option>안부 기록 삭제</option>
              <option>위치 기록 삭제</option>
              <option>케어파트너 신청 철회</option>
              <option>알림 중단</option>
            </select>
          </label>
          <TextArea label="요청 내용" name="memo" />
          <button className="rounded-2xl bg-[#247A71] px-5 py-4 text-base font-black text-white">삭제 요청 접수</button>
        </form>
      </Card>
    </PageShell>
  )
}

export function ContactPage() {
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries())
    await saveRecord('anbu_contacts', payload)
    setSaved(true)
    event.currentTarget.reset()
  }

  return (
    <PageShell
      eyebrow="문의하기"
      title="보호자, 케어파트너, 협업기관 문의를 받습니다."
      desc="서비스 이용, 협업 제안, 케어파트너 신청, 개인정보 요청을 한 곳에서 접수합니다."
    >
      {saved ? (
        <div className="rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black text-[#2AA897] ring-1 ring-[#CDEFE7]">
          문의가 접수되었습니다.
        </div>
      ) : null}

      <Card>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="이름 / 기관명" name="name" required />
          <Field label="이메일" name="email" type="email" required />
          <Field label="연락처" name="phone" />
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#637B76]">문의 유형</span>
            <select name="contact_type" className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold">
              <option>보호자 이용 문의</option>
              <option>케어파트너 신청 문의</option>
              <option>협업기관 제휴 문의</option>
              <option>개인정보 문의</option>
              <option>기타</option>
            </select>
          </label>
          <TextArea label="문의 내용" name="memo" />
          <button className="rounded-2xl bg-[#247A71] px-5 py-4 text-base font-black text-white">문의 보내기</button>
        </form>
      </Card>
    </PageShell>
  )
}

export function PlayStoreReadyPage() {
  const [done, setDone] = useState<string[]>([])

  useEffect(() => {
    setDone(readStore<string[]>('anbu_play_store_checklist', []))
  }, [])

  function toggle(item: string) {
    setDone((prev) => {
      const next = prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
      writeStore('anbu_play_store_checklist', next)
      return next
    })
  }

  return (
    <PageShell
      eyebrow="Play Store 준비"
      title="구글 플레이스토어 심사용 항목을 하나씩 준비합니다."
      desc="개인정보처리방침, 이용약관, 데이터 삭제 요청, 건강정보 고지, Data Safety, Health Apps declaration을 체크합니다."
    >
      <div className="grid gap-3 md:grid-cols-2">
        {playStoreChecklist.map((item) => {
          const checked = done.includes(item)

          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className={
                'rounded-2xl p-4 text-left text-sm font-black ring-1 transition ' +
                (checked
                  ? 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
                  : 'bg-white text-[#17443F] ring-[#D6EDE7]')
              }
            >
              {checked ? '✓ ' : ''}
              {item}
            </button>
          )
        })}
      </div>
    </PageShell>
  )
}
