'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  anbuRiskRules,
  anbuRoutineTemplates,
  notificationEscalationRules,
  opsAnbuQueue,
  partnerApplyFields,
  partnerVettingSteps,
  platformRoadmap,
  pricingPlans,
  privacyConsentItems,
  weeklyReportSample
} from '@/lib/anbuworks-buildout'

type FamilyLink = {
  familyCode: string
  guardianName: string
  guardianPhone: string
  parentName: string
  parentPhone: string
  createdAt: string
}

const FAMILY_KEY = 'anbuworks_family_link'
const ROUTINE_KEY = 'anbuworks_routines'
const PARTNER_KEY = 'anbuworks_partner_applications'
const CONSENT_KEY = 'anbuworks_privacy_consents'

function createCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function Card({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={'rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6 ' + className}>
      {children}
    </section>
  )
}

function PageHero({
  eyebrow,
  title,
  desc
}: {
  eyebrow: string
  title: string
  desc: string
}) {
  return (
    <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
      <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
        {eyebrow}
      </div>
      <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] text-[#173B36] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
        {desc}
      </p>
    </section>
  )
}

export function FamilyLinkMvp() {
  const [link, setLink] = useState<FamilyLink | null>(null)
  const [message, setMessage] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FAMILY_KEY)
      if (saved) setLink(JSON.parse(saved))
    } catch {
      setLink(null)
    }
  }, [])

  async function createFamilyLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const next: FamilyLink = {
      familyCode: createCode(),
      guardianName: guardianName || '보호자',
      guardianPhone,
      parentName: parentName || '부모님',
      parentPhone,
      createdAt: new Date().toISOString()
    }

    setLink(next)
    window.localStorage.setItem(FAMILY_KEY, JSON.stringify(next))

    await fetch('/api/anbu-family-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...next })
    }).catch(() => null)

    setMessage('부모님 연결 코드가 생성되었습니다.')
  }

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="1단계 · 부모님-자녀 연결"
        title="자녀가 코드를 만들고, 부모님은 코드만 입력합니다."
        desc="복잡한 회원가입 없이 보호자가 부모님 프로필을 만들고 4자리 연결코드를 전달합니다. 부모님은 코드 입력과 동의 후 안부온 버튼을 사용할 수 있습니다."
      />

      {message ? (
        <div className="rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <h2 className="text-2xl font-black tracking-[-0.05em]">보호자 코드 생성</h2>
          <form onSubmit={createFamilyLink} className="mt-5 grid gap-3">
            <Field label="보호자 이름" value={guardianName} onChange={setGuardianName} placeholder="예: 이가영" />
            <Field label="보호자 연락처" value={guardianPhone} onChange={setGuardianPhone} placeholder="예: 010-0000-0000" />
            <Field label="부모님 이름" value={parentName} onChange={setParentName} placeholder="예: 어머니" />
            <Field label="부모님 연락처" value={parentPhone} onChange={setParentPhone} placeholder="선택 입력" />

            <button className="mt-2 rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white">
              부모님 연결코드 만들기
            </button>
          </form>
        </Card>

        <Card className="bg-[#F8FFFC]">
          <h2 className="text-2xl font-black tracking-[-0.05em]">현재 연결 코드</h2>
          {link ? (
            <>
              <div className="mt-5 rounded-[2rem] bg-[#123F38] p-6 text-white">
                <p className="text-sm font-black text-[#9DF4DD]">부모님께 전달할 코드</p>
                <div className="mt-2 text-6xl font-black tracking-[0.1em]">{link.familyCode}</div>
                <p className="mt-3 text-sm font-bold leading-6 text-[#CDEEE6]">
                  부모님은 /parent/login 에서 이 코드만 입력하면 됩니다.
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link href="/parent/login" className="rounded-2xl bg-[#20C5A8] px-4 py-4 text-center font-black text-white">
                  부모님 로그인 화면
                </Link>
                <Link href="/parent/today" className="rounded-2xl bg-white px-4 py-4 text-center font-black text-[#193B38] ring-1 ring-[#D8EEE8]">
                  안부 버튼 화면
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
              아직 생성된 연결 코드가 없습니다.
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          '자녀가 부모님 프로필 생성',
          '4자리 연결코드 전달',
          '부모님이 코드 입력 및 동의',
          '안부 버튼이 해당 보호자에게 연결'
        ].map((item, index) => (
          <Card key={item}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8FAF5] text-sm font-black text-[#11977F]">
              {index + 1}
            </div>
            <p className="mt-4 text-lg font-black leading-7 text-[#173B36]">{item}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ParentCodeLogin() {
  const [code, setCode] = useState('')
  const [parentName, setParentName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (!/^\d{4,6}$/.test(code.trim())) {
      setMessage('4자리 또는 6자리 연결코드를 입력해주세요.')
      return
    }

    if (!agreed) {
      setMessage('부모님 안부 정보를 보호자에게 전달하는 데 동의해야 합니다.')
      return
    }

    const response = await fetch('/api/anbu-family-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', familyCode: code.trim(), parentName: parentName || '부모님' })
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok || !data.ok) {
      setMessage(data.message || '연결 중 오류가 발생했습니다.')
      return
    }

    window.location.href = '/parent/today'
  }

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="부모님 로그인"
        title="보호자가 알려준 코드만 입력하세요."
        desc="복잡한 회원가입 없이 연결코드와 동의만으로 오늘 안부 체크를 시작할 수 있습니다."
      />

      <Card>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="부모님 이름" value={parentName} onChange={setParentName} placeholder="예: 어머니" />
          <Field label="연결코드" value={code} onChange={setCode} placeholder="예: 2580" inputMode="numeric" />

          <label className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#5F7772] ring-1 ring-[#D8EEE8]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mr-2"
            />
            내 식사, 약, 몸 상태, 기분 응답을 연결된 보호자에게 전달하는 데 동의합니다.
          </label>

          {message ? (
            <div className="rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black text-[#795313] ring-1 ring-[#F4D8A5]">
              {message}
            </div>
          ) : null}

          <button className="rounded-2xl bg-[#193B38] px-5 py-4 text-lg font-black text-white">
            연결하고 안부 체크 시작
          </button>
        </form>
      </Card>
    </div>
  )
}

export function AnbuRoutineMvp() {
  const [routines, setRoutines] = useState(anbuRoutineTemplates)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(ROUTINE_KEY)
      if (saved) setRoutines(JSON.parse(saved))
    } catch {
      setRoutines(anbuRoutineTemplates)
    }
  }, [])

  function save() {
    window.localStorage.setItem(ROUTINE_KEY, JSON.stringify(routines))
  }

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="2단계 · 안부 루틴"
        title="앱이 먼저 묻고, 응답 없으면 단계적으로 알립니다."
        desc="식사, 복약, 몸 상태, 밤 안부를 정해진 시간에 묻고, 미응답 시 보호자와 운영실로 이어지는 루틴을 만듭니다."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <h2 className="text-2xl font-black tracking-[-0.05em]">오늘 안부 루틴</h2>
          <div className="mt-5 space-y-3">
            {routines.map((routine, index) => (
              <div key={routine.id} className="grid gap-3 rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8] md:grid-cols-[8rem_1fr]">
                <input
                  type="time"
                  value={routine.time}
                  onChange={(event) => {
                    const next = [...routines]
                    next[index] = { ...routine, time: event.target.value }
                    setRoutines(next)
                  }}
                  className="rounded-xl border border-[#D8EEE8] bg-white px-3 py-2 text-sm font-black"
                />
                <div>
                  <div className="text-base font-black text-[#173B36]">{routine.label}</div>
                  <div className="mt-1 text-sm font-bold text-[#637B76]">{routine.message}</div>
                  <div className="mt-2 text-xs font-black text-[#11977F]">{routine.channel}</div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={save} className="mt-5 rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white">
            루틴 저장
          </button>
        </Card>

        <Card className="bg-[#F8FFFC]">
          <h2 className="text-2xl font-black tracking-[-0.05em]">응답 없음 알림 단계</h2>
          <div className="mt-5 space-y-3">
            {notificationEscalationRules.map((rule, index) => (
              <div key={rule.title} className="rounded-2xl bg-white p-4 ring-1 ring-[#D8EEE8]">
                <div className="text-sm font-black text-[#11977F]">{index + 1}단계</div>
                <div className="mt-1 text-lg font-black text-[#173B36]">{rule.title}</div>
                <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{rule.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-2xl font-black tracking-[-0.05em]">알림 채널</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ['앱 알림', '기본 안부, 식사, 복약, 몸 상태 확인'],
            ['SMS', '응답 없음, 도움 요청, 확인 필요 신호'],
            ['카카오 알림톡', '주간 리포트, 병원 일정, 케어파트너 배정']
          ].map(([title, desc]) => (
            <div key={title} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
              <div className="text-lg font-black text-[#173B36]">{title}</div>
              <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function WeeklyReportMvp() {
  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="4단계 · 주간 돌봄 리포트"
        title="보호자가 계속 결제할 이유를 리포트로 만듭니다."
        desc="식사, 복약, 몸 상태, 기분, 응답 없음, 병원 일정을 요약하고 다음 행동까지 자동으로 제안합니다."
      />

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#11977F]">{weeklyReportSample.period}</p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.06em] text-[#173B36]">
              {weeklyReportSample.title}
            </h2>
          </div>
          <span className="rounded-full bg-[#EFFFF9] px-4 py-2 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
            자동 생성
          </span>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {weeklyReportSample.stats.map((item) => (
            <div key={item.label} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
              <div className="text-sm font-black text-[#7A9692]">{item.label}</div>
              <div className="mt-2 text-xl font-black text-[#173B36]">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[1.75rem] bg-[#123F38] p-5 text-white">
          <p className="text-sm font-black text-[#9DF4DD]">AI 요약</p>
          <p className="mt-3 text-lg font-black leading-8">{weeklyReportSample.aiSummary}</p>
        </div>

        <div className="mt-5 grid gap-3">
          {weeklyReportSample.nextActions.map((item, index) => (
            <div key={item} className="rounded-2xl bg-[#F7FBFF] p-4 text-sm font-black leading-7 text-[#234B68] ring-1 ring-[#DCEDE7]">
              {index + 1}. {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function OpsControlMvp() {
  const [handled, setHandled] = useState<string[]>([])

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="6단계 · 운영실 관제"
        title="AI가 신호를 잡고, 운영실이 사람 연결을 판단합니다."
        desc="확인 필요 부모님을 우선순위로 보고, 보호자 연락, 부모님 전화, 케어파트너 연결, 처리 완료까지 관리합니다."
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['확인 필요', '1'],
          ['주의', '1'],
          ['정상', '1'],
          ['처리 완료', String(handled.length)]
        ].map(([label, value]) => (
          <Card key={label}>
            <div className="text-sm font-black text-[#7A9692]">{label}</div>
            <div className="mt-2 text-4xl font-black text-[#173B36]">{value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4">
        {opsAnbuQueue.map((item) => {
          const isDone = handled.includes(item.name)

          return (
            <Card key={item.name} className={isDone ? 'opacity-60' : ''}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#EFFFF9] px-3 py-1 text-xs font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
                      {item.state}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#5F7772] ring-1 ring-[#D8EEE8]">
                      {item.name}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-black tracking-[-0.05em]">{item.reason}</h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{item.action}</p>
                </div>

                <button
                  onClick={() => setHandled((prev) => prev.includes(item.name) ? prev : [...prev, item.name])}
                  className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white"
                >
                  처리 완료
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function CarePartnerApplyMvp() {
  const [saved, setSaved] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const data = Object.fromEntries(form.entries())
    const current = JSON.parse(window.localStorage.getItem(PARTNER_KEY) || '[]')
    window.localStorage.setItem(PARTNER_KEY, JSON.stringify([...current, { ...data, createdAt: new Date().toISOString() }]))
    setSaved(true)
  }

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="7단계 · 케어파트너 모집/검증"
        title="요양보호사와 병원동행 파트너가 바로 등록할 수 있게 만듭니다."
        desc="협업처에 메일을 보낼 때 등록 페이지가 있어야 회신률과 전환율이 높아집니다. 활동 지역, 가능 업무, 자격증, 본인 확인을 운영실이 검증합니다."
      />

      {saved ? (
        <div className="rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
          케어파트너 신청이 임시 저장되었습니다. 운영실 승인 플로우로 연결하면 됩니다.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <h2 className="text-2xl font-black tracking-[-0.05em]">케어파트너 등록</h2>
          <form onSubmit={submit} className="mt-5 grid gap-3">
            {partnerApplyFields.map((field) => (
              <label key={field} className="grid gap-2">
                <span className="text-sm font-black text-[#55736E]">{field}</span>
                <input
                  name={field}
                  className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
                  placeholder={field + ' 입력'}
                />
              </label>
            ))}

            <button className="mt-2 rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white">
              케어파트너 신청하기
            </button>
          </form>
        </Card>

        <Card className="bg-[#F8FFFC]">
          <h2 className="text-2xl font-black tracking-[-0.05em]">운영실 검증 기준</h2>
          <div className="mt-5 space-y-3">
            {partnerVettingSteps.map((step, index) => (
              <div key={step} className="rounded-2xl bg-white p-4 ring-1 ring-[#D8EEE8]">
                <div className="text-sm font-black text-[#11977F]">{index + 1}단계</div>
                <div className="mt-1 text-lg font-black text-[#173B36]">{step}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export function PrivacyConsentMvp() {
  const [checked, setChecked] = useState<string[]>([])

  useEffect(() => {
    try {
      setChecked(JSON.parse(window.localStorage.getItem(CONSENT_KEY) || '[]'))
    } catch {
      setChecked([])
    }
  }, [])

  function toggle(item: string) {
    setChecked((prev) => {
      const next = prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="9단계 · 개인정보/동의"
        title="민감한 안부 정보를 다루기 때문에 동의 구조가 먼저 필요합니다."
        desc="부모님 안부, 복약, 기분, 위치, 병원 일정은 보호자에게 전달되기 전에 부모님 동의와 공유 범위 설정이 필요합니다."
      />

      <Card>
        <h2 className="text-2xl font-black tracking-[-0.05em]">동의 항목</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {privacyConsentItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className={
                'rounded-2xl p-4 text-left text-sm font-black leading-7 ring-1 transition ' +
                (checked.includes(item)
                  ? 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
                  : 'bg-[#F8FCFB] text-[#5F7772] ring-[#D8EEE8]')
              }
            >
              {checked.includes(item) ? '✓ ' : ''}
              {item}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-[1.75rem] bg-[#123F38] p-5 text-white">
          <p className="text-sm font-black text-[#9DF4DD]">필수 안내</p>
          <p className="mt-2 text-sm font-bold leading-7 text-[#CDEEE6]">
            안부온은 의료 진단, 처방, 응급 판단을 제공하지 않습니다. 응급상황은 119 또는 의료기관에 연락해야 합니다.
            부모님은 언제든 정보 공유 동의를 철회할 수 있어야 합니다.
          </p>
        </div>
      </Card>
    </div>
  )
}

export function PricingMvp() {
  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="10단계 · 수익모델"
        title="AI 안부온은 구독, 사람 연결은 건별 매출로 설계합니다."
        desc="무료로 시작하고, 주간 리포트와 응답 없음 알림으로 구독 전환을 만들고, 케어파트너 연결로 추가 매출을 만듭니다."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <Card key={plan.name} className={plan.name === '안부온 베이직' ? 'bg-[#F8FFFC] ring-[#BEEFE3]' : ''}>
            <h2 className="text-2xl font-black tracking-[-0.05em]">{plan.name}</h2>
            <div className="mt-3 text-3xl font-black text-[#11977F]">{plan.price}</div>
            <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{plan.desc}</p>

            <div className="mt-5 space-y-2">
              {plan.features.map((feature) => (
                <div key={feature} className="rounded-2xl bg-white p-3 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                  ✓ {feature}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function PlatformRoadmapMvp() {
  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="11단계 · 플랫폼 구조"
        title="안부온에서 케어파트너 연결까지 이어지는 데이터 기반 돌봄 운영 플랫폼"
        desc="투자자에게는 단순 체크앱이 아니라 매일 상태 데이터가 쌓이고, 위험 신호가 사람 돌봄 연결로 이어지는 구조로 설명합니다."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {platformRoadmap.map((step, index) => (
          <Card key={step}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8FAF5] text-sm font-black text-[#11977F]">
              {index + 1}
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.05em] text-[#173B36]">{step}</h2>
          </Card>
        ))}
      </div>

      <Card className="bg-[#123F38] text-white">
        <p className="text-sm font-black text-[#9DF4DD]">투자자 설명 문장</p>
        <p className="mt-3 text-2xl font-black leading-snug tracking-[-0.04em]">
          안부웍스는 AI가 매일 부모님 안부를 확인하고, 이상 신호가 생기면 보호자와 운영실을 거쳐 검증된 케어파트너까지 연결하는 부모님 안심관리 플랫폼입니다.
        </p>
      </Card>
    </div>
  )
}

export function RiskScoreGuideMvp() {
  return (
    <Card>
      <h2 className="text-2xl font-black tracking-[-0.05em]">위험신호 점수 기준</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {anbuRiskRules.map((rule) => (
          <div key={rule.signal} className="flex items-center justify-between rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
            <span className="text-sm font-black text-[#173B36]">{rule.signal}</span>
            <span className="rounded-full bg-[#EFFFF9] px-3 py-1 text-xs font-black text-[#116D5F]">
              +{rule.score}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ['0~29점', '정상'],
          ['30~59점', '주의'],
          ['60점 이상', '확인 필요']
        ].map(([score, state]) => (
          <div key={score} className="rounded-2xl bg-white p-4 ring-1 ring-[#D8EEE8]">
            <div className="text-sm font-black text-[#7A9692]">{score}</div>
            <div className="mt-1 text-xl font-black text-[#173B36]">{state}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  inputMode?: 'text' | 'numeric' | 'tel'
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}
