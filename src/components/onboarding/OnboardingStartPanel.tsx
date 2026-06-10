'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type RoleKey = 'guardian' | 'parent' | 'provider' | 'ops'

type Step = {
  title: string
  desc: string
  href: string
  cta: string
  tone?: 'safe' | 'warning' | 'urgent' | 'normal'
}

type RoleConfig = {
  key: RoleKey
  label: string
  badge: string
  title: string
  desc: string
  emoji: string
  firstHref: string
  firstCta: string
  steps: Step[]
}

const roles: Record<RoleKey, RoleConfig> = {
  guardian: {
    key: 'guardian',
    label: '자녀·보호자',
    badge: '추천',
    title: '부모님 상태를 확인하고 싶어요',
    desc: '부모님 연결코드를 만들고, 부모님 앱 링크를 보낸 뒤 오늘 리포트를 확인합니다.',
    emoji: '👨‍👩‍👧',
    firstHref: '/family-link',
    firstCta: '부모님 연결코드 만들기',
    steps: [
      {
        title: '부모님 연결코드 만들기',
        desc: '보호자가 먼저 가족코드를 만들고 부모님과 연결합니다.',
        href: '/family-link',
        cta: '연결코드 만들기',
        tone: 'safe'
      },
      {
        title: '부모님 앱 링크 보내기',
        desc: '부모님은 큰 버튼 5개로 오늘 상태를 보냅니다.',
        href: '/mobile/parent',
        cta: '부모님 앱 열기',
        tone: 'normal'
      },
      {
        title: '오늘 리포트 확인하기',
        desc: '안부 신호, 문자 기록, 다음 할 일을 한 화면에서 확인합니다.',
        href: '/guardian/today',
        cta: '오늘 리포트 보기',
        tone: 'safe'
      }
    ]
  },
  parent: {
    key: 'parent',
    label: '부모님',
    badge: '간단',
    title: '오늘 상태를 보내고 싶어요',
    desc: '가족코드를 확인하고, 괜찮아요/밥/약/몸/도움 버튼 중 하나를 누릅니다.',
    emoji: '💚',
    firstHref: '/mobile/parent',
    firstCta: '안부 버튼 누르기',
    steps: [
      {
        title: '가족코드 확인',
        desc: '보호자가 보내준 링크로 들어오면 가족코드가 자동 입력됩니다.',
        href: '/mobile/parent',
        cta: '부모님 앱 열기',
        tone: 'normal'
      },
      {
        title: '큰 버튼으로 안부 보내기',
        desc: '괜찮아요, 밥, 약, 몸 상태, 도움 요청 중 하나만 누르면 됩니다.',
        href: '/mobile/parent',
        cta: '안부 보내기',
        tone: 'safe'
      },
      {
        title: '전송 완료 확인',
        desc: '전송 완료 화면이 뜨면 보호자가 확인할 수 있습니다.',
        href: '/mobile/parent',
        cta: '다시 열기',
        tone: 'safe'
      }
    ]
  },
  provider: {
    key: 'provider',
    label: '생활확인 파트너',
    badge: '도움망',
    title: '도움 요청을 확인하고 싶어요',
    desc: '문자 링크나 요청함에서 가능한 요청을 수락하고 결과를 기록합니다.',
    emoji: '🤝',
    firstHref: '/provider/urgent-requests',
    firstCta: '요청함 열기',
    steps: [
      {
        title: '요청함 열기',
        desc: '운영실이 보낸 긴급 확인 요청을 확인합니다.',
        href: '/provider/urgent-requests',
        cta: '요청함 보기',
        tone: 'warning'
      },
      {
        title: '수락 또는 거절',
        desc: '가능한 요청만 수락하고, 수락 후 상세 정보를 확인합니다.',
        href: '/provider/urgent-requests',
        cta: '수락 흐름 확인',
        tone: 'normal'
      },
      {
        title: '확인 완료 기록',
        desc: '전화 확인 또는 생활확인 결과를 완료 메모로 남깁니다.',
        href: '/provider/urgent-requests',
        cta: '완료 기록',
        tone: 'safe'
      }
    ]
  },
  ops: {
    key: 'ops',
    label: '운영실',
    badge: '관리',
    title: '실증 운영을 관리하고 싶어요',
    desc: '운영실 한눈 홈에서 실증, 자동문자, 발송센터, 긴급 요청을 순서대로 처리합니다.',
    emoji: '🖥️',
    firstHref: '/portal/ops',
    firstCta: '운영실 한눈 홈',
    steps: [
      {
        title: '운영실 한눈 홈',
        desc: '지금 무엇을 만져야 하는지 순서대로 확인합니다.',
        href: '/portal/ops',
        cta: '운영실 홈',
        tone: 'safe'
      },
      {
        title: '자체 예비 실증',
        desc: '실증 가구, 부모님 앱 링크, 미니 리포트를 관리합니다.',
        href: '/ops/private-pilot',
        cta: '실증 관리',
        tone: 'normal'
      },
      {
        title: '자동문자와 발송센터',
        desc: '상황별 문자 대기열과 실제 발송 상태를 확인합니다.',
        href: '/ops/message-automation',
        cta: '자동문자 확인',
        tone: 'warning'
      }
    ]
  }
}

function toneClass(tone?: Step['tone']) {
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'urgent') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
      {children}
    </section>
  )
}

export function OnboardingStartPanel() {
  const params = useSearchParams()
  const [selectedRole, setSelectedRole] = useState<RoleKey | ''>('')
  const [source, setSource] = useState('')
  const [message, setMessage] = useState('')

  const activeRole = selectedRole ? roles[selectedRole] : null

  async function logEvent(eventType: string, role?: string, extra?: Record<string, unknown>) {
    try {
      await fetch('/api/onboarding-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          role: role || selectedRole || '',
          source: source || params.get('source') || 'onboarding',
          path: typeof window !== 'undefined' ? window.location.pathname : '/onboarding',
          payload: extra || {}
        })
      })
    } catch {
      // 온보딩 기록 실패가 사용자 흐름을 막으면 안 됩니다.
    }
  }

  function chooseRole(role: RoleKey) {
    setSelectedRole(role)

    if (typeof window !== 'undefined') {
      localStorage.setItem('anbu_onboarding_role', role)
    }

    setMessage(`${roles[role].label} 흐름으로 안내합니다.`)
    logEvent('select_role', role)
  }

  useEffect(() => {
    const roleParam = params.get('role') as RoleKey | null
    const sourceParam = params.get('source') || ''
    const storedRole = typeof window !== 'undefined' ? localStorage.getItem('anbu_onboarding_role') as RoleKey | null : null

    if (sourceParam) setSource(sourceParam)

    if (roleParam && roles[roleParam]) {
      setSelectedRole(roleParam)
      logEvent('view', roleParam, { sourceParam })
      return
    }

    if (storedRole && roles[storedRole]) {
      setSelectedRole(storedRole)
      logEvent('view', storedRole, { stored: true })
      return
    }

    logEvent('view', '', { sourceParam })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <SectionCard>
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            가입 후 시작하기
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                가입 후에는
                <br />
                딱 3단계만 하면 됩니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                먼저 내 역할을 고르면, 지금 눌러야 할 버튼만 순서대로 보여드립니다.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#EFFFFA] px-6 py-5 text-center text-[#247A71] ring-1 ring-[#CDEFE7]">
              <div className="text-sm font-black opacity-70">현재 선택</div>
              <div className="mt-2 text-3xl font-black tracking-[-0.08em]">
                {activeRole?.label || '역할 선택'}
              </div>
              <div className="mt-2 text-xs font-bold">
                {activeRole ? activeRole.badge : '먼저 선택'}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            실증 중에는 복잡한 회원가입보다 부모님 연결코드, 부모님 앱 링크, 오늘 리포트 확인 흐름이 더 중요합니다.
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}
        </SectionCard>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(Object.values(roles) as RoleConfig[]).map((role) => (
            <button
              key={role.key}
              onClick={() => chooseRole(role.key)}
              className={
                'rounded-[2rem] p-5 text-left shadow-sm ring-1 transition active:scale-[0.99] ' +
                (selectedRole === role.key ? 'bg-[#247A71] text-white ring-[#247A71]' : 'bg-white text-[#17443F] ring-[#D6EDE7]')
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm ring-1 ring-current/10">
                  {role.emoji}
                </div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-current/10">
                  {role.badge}
                </span>
              </div>

              <div className="mt-5 text-sm font-black opacity-70">{role.label}</div>
              <h2 className="mt-2 text-2xl font-black leading-tight tracking-[-0.06em]">{role.title}</h2>
              <p className="mt-3 text-sm font-bold leading-7 opacity-75">{role.desc}</p>
            </button>
          ))}
        </section>

        {activeRole ? (
          <>
            <SectionCard>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-sm font-black text-[#2AA897]">{activeRole.label} 다음 행동</div>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">
                    위에서 아래 순서대로만 누르세요.
                  </h2>
                </div>

                <Link
                  href={activeRole.firstHref}
                  onClick={() => logEvent('click_first_cta', activeRole.key, { href: activeRole.firstHref })}
                  className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white"
                >
                  {activeRole.firstCta}
                </Link>
              </div>

              <div className="mt-6 grid gap-3 lg:grid-cols-3">
                {activeRole.steps.map((step, index) => (
                  <article key={step.title} className={'rounded-2xl p-5 ring-1 ' + toneClass(step.tone)}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black shadow-sm ring-1 ring-current/10">
                      {index + 1}
                    </div>

                    <h3 className="mt-4 text-2xl font-black tracking-[-0.06em]">{step.title}</h3>
                    <p className="mt-2 min-h-16 text-sm font-bold leading-7 opacity-75">{step.desc}</p>

                    <Link
                      href={step.href}
                      onClick={() => logEvent('click_step', activeRole.key, { href: step.href, title: step.title })}
                      className="mt-5 block rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-current/10"
                    >
                      {step.cta}
                    </Link>
                  </article>
                ))}
              </div>
            </SectionCard>

            <section className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">실증 중 추천 순서</h2>

                <div className="mt-5 space-y-3">
                  {[
                    '먼저 1가구만 테스트합니다.',
                    '부모님 앱 링크를 열고 괜찮아요를 1번 누릅니다.',
                    '보호자 오늘 리포트에서 신호가 보이는지 확인합니다.',
                    '문자 대기열과 수신번호를 확인한 뒤 발송합니다.'
                  ].map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EFFFFA] text-sm font-black text-[#247A71]">
                        {index + 1}
                      </div>
                      <div className="text-sm font-black leading-7">{item}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">자주 막히는 부분</h2>

                <div className="mt-5 space-y-3">
                  {[
                    ['가족코드를 못 찾겠어요', '보호자는 부모님 연결코드 만들기에서 코드를 다시 확인할 수 있습니다.'],
                    ['부모님이 앱을 못 찾겠어요', '부모님 앱 링크를 문자로 다시 보내거나 홈 화면에 추가하세요.'],
                    ['리포트가 비어 있어요', '아직 부모님이 버튼을 누르지 않았을 수 있습니다. 괜찮아요 1건부터 테스트하세요.'],
                    ['문자가 안 와요', '알림 발송센터에서 대기/실패/성공 상태를 확인하세요.']
                  ].map(([title, desc]) => (
                    <div key={title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                      <div className="text-base font-black">{title}</div>
                      <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          </>
        ) : (
          <SectionCard>
            <h2 className="text-3xl font-black tracking-[-0.06em]">먼저 역할을 선택하세요</h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
              보호자, 부모님, 생활확인 파트너, 운영실 중 하나를 선택하면 다음에 눌러야 할 3단계가 바로 나타납니다.
            </p>
          </SectionCard>
        )}
      </section>
    </main>
  )
}

export default OnboardingStartPanel
