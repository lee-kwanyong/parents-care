'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Audience = 'all' | 'guardian' | 'parent' | 'provider' | 'center' | 'ops'

type Guide = {
  audience: Audience
  badge: string
  title: string
  subtitle: string
  intro: string
  steps: Array<{ title: string; desc: string; href?: string; cta?: string }>
  cautions: string[]
  copyText: string
  primaryHref: string
  primaryCta: string
}

const guides: Record<Audience, Guide> = {
  all: {
    audience: 'all',
    badge: '전체 안내',
    title: '안부웍스는 이렇게 씁니다.',
    subtitle: '보호자, 부모님, 생활확인 파트너가 각자 딱 3단계만 기억하면 됩니다.',
    intro: '부모님은 오늘 상태를 보내고, 보호자는 리포트와 문자로 확인하며, 필요하면 사람 확인과 대리입력으로 이어집니다.',
    primaryHref: '/onboarding',
    primaryCta: '역할별 시작하기',
    steps: [
      { title: '보호자', desc: '동의서 확인 → 부모님 앱 링크 전달 → 오늘 리포트 확인', href: '/guide/guardian', cta: '보호자 가이드' },
      { title: '부모님', desc: '링크 열기 → 큰 버튼 하나 누르기 → 완료 화면 확인', href: '/guide/parent', cta: '부모님 가이드' },
      { title: '파트너', desc: '요청함 열기 → 가능한 요청만 수락 → 결과 기록', href: '/guide/provider', cta: '파트너 가이드' }
    ],
    cautions: [
      '안부웍스는 의료 진단, 치료, 응급 구조를 대체하지 않습니다.',
      '응급상황이 의심되면 앱보다 먼저 119 또는 의료기관에 연락해야 합니다.',
      '가족코드와 휴대폰 뒤 4자리는 신뢰할 수 있는 가족 외에는 공유하지 마세요.'
    ],
    copyText:
`안부웍스는 부모님 안부 신호를 보호자 알림, 미응답 확인, 대리입력, 생활확인 파트너 연결, 안심 리포트로 이어주는 비의료 생활확인 서비스입니다.

보호자: 동의서 확인 → 부모님 앱 링크 전달 → 오늘 리포트 확인
부모님: 링크 열기 → 큰 버튼 하나 누르기 → 완료 확인
파트너: 요청함 열기 → 가능한 요청 수락 → 결과 기록

응급상황은 앱보다 먼저 119 또는 의료기관에 연락해야 합니다.`
  },
  guardian: {
    audience: 'guardian',
    badge: '보호자 1분 사용법',
    title: '보호자는 3가지만 하면 됩니다.',
    subtitle: '동의서 확인, 부모님 앱 링크 전달, 오늘 리포트 확인.',
    intro: '부모님이 직접 버튼을 누르지 못하면 보호자가 전화 확인 후 대신 기록할 수 있습니다.',
    primaryHref: '/guardian/today',
    primaryCta: '보호자 리포트 열기',
    steps: [
      { title: '실증 참여 동의', desc: '먼저 /consent에서 개인정보·비의료 고지·응급상황 안내를 확인합니다.', href: '/consent?role=guardian', cta: '동의서 열기' },
      { title: '부모님 앱 링크 전달', desc: '부모님에게 /mobile/parent 링크를 문자나 카톡으로 전달합니다.', href: '/mobile/parent', cta: '부모님 앱' },
      { title: '오늘 리포트 확인', desc: '가족코드와 휴대폰 뒤 4자리로 부모님 안부 신호와 문자 기록을 확인합니다.', href: '/guardian/today', cta: '리포트 보기' },
      { title: '부모님이 못 누르면 대신 기록', desc: '전화 확인 후 괜찮아요/밥/약/몸/도움 상태를 대신 기록합니다.', href: '/guardian/proxy-checkin', cta: '대리입력' }
    ],
    cautions: [
      '리포트가 비어 있으면 부모님이 아직 버튼을 누르지 않았을 수 있습니다.',
      '응급상황은 앱보다 119 또는 의료기관 연락이 먼저입니다.',
      '가족코드와 휴대폰 뒤 4자리는 리포트 접근 정보이므로 공유에 주의하세요.'
    ],
    copyText:
`[안부웍스 보호자 사용법]

1. 실증 참여 동의서를 확인합니다.
2. 부모님에게 부모님 앱 링크를 전달합니다.
3. 보호자 리포트에서 오늘 안부를 확인합니다.
4. 부모님이 앱을 못 누르면 전화 확인 후 대신 기록합니다.

응급상황은 앱보다 먼저 119 또는 의료기관에 연락해주세요.`
  },
  parent: {
    audience: 'parent',
    badge: '부모님 1분 사용법',
    title: '부모님은 버튼 하나만 누르면 됩니다.',
    subtitle: '괜찮아요, 밥, 약, 몸 상태, 도움 요청 중 하나.',
    intro: '오늘 상태와 가장 가까운 버튼을 누르면 보호자가 확인할 수 있습니다.',
    primaryHref: '/mobile/parent',
    primaryCta: '부모님 앱 열기',
    steps: [
      { title: '보호자가 보낸 링크 열기', desc: '문자나 카톡으로 받은 안부웍스 링크를 엽니다.', href: '/mobile/parent', cta: '앱 열기' },
      { title: '큰 버튼 하나 누르기', desc: '괜찮아요, 밥을 못 먹었어요, 약을 못 먹었어요, 몸이 아파요, 지금 도움이 필요해요 중 하나만 누릅니다.' },
      { title: '완료 화면 확인', desc: '전송 완료 화면이 보이면 보호자가 확인할 수 있습니다.' }
    ],
    cautions: [
      '응급상황이면 앱 버튼보다 먼저 119 또는 의료기관에 연락하세요.',
      '잘못 눌렀다면 보호자에게 전화해서 알려주세요.',
      '앱이 어려우면 보호자가 전화로 확인하고 대신 기록할 수 있습니다.'
    ],
    copyText:
`[안부웍스 부모님 사용법]

1. 보호자가 보내준 링크를 엽니다.
2. 오늘 상태와 가장 가까운 큰 버튼 하나를 누릅니다.
3. 완료 화면이 보이면 끝입니다.

버튼:
괜찮아요 / 밥을 못 먹었어요 / 약을 못 먹었어요 / 몸이 아파요 / 지금 도움이 필요해요

응급상황이면 앱보다 먼저 119 또는 의료기관에 연락하세요.`
  },
  provider: {
    audience: 'provider',
    badge: '생활확인 파트너 1분 사용법',
    title: '파트너는 가능한 요청만 수락합니다.',
    subtitle: '요청함 확인, 수락/거절, 결과 기록.',
    intro: '생활확인 파트너는 의료 판단이나 응급구조가 아니라 전화확인·생활확인·동행 가능 여부 응답을 맡습니다.',
    primaryHref: '/provider/urgent-requests',
    primaryCta: '요청함 열기',
    steps: [
      { title: '요청함 열기', desc: '운영실이나 보호자가 보낸 요청을 확인합니다.', href: '/provider/urgent-requests', cta: '요청함' },
      { title: '가능한 요청만 수락', desc: '거리, 시간, 역할 범위상 가능한 요청만 수락합니다.' },
      { title: '전화 또는 생활확인', desc: '정해진 범위 안에서 확인하고 결과를 메모로 남깁니다.' },
      { title: '응급 의심 시 안내', desc: '응급상황이 의심되면 119 또는 의료기관 연락을 안내합니다.' }
    ],
    cautions: [
      '의료 판단, 의료행위, 응급구조는 하지 않습니다.',
      '수락할 수 없는 요청은 거절해도 됩니다.',
      '확인 결과는 간단하게라도 반드시 기록합니다.'
    ],
    copyText:
`[안부웍스 생활확인 파트너 사용법]

1. 요청함을 엽니다.
2. 가능한 요청만 수락합니다.
3. 전화 확인 또는 생활확인 결과를 기록합니다.
4. 의료 판단, 의료행위, 응급구조는 하지 않습니다.
5. 응급상황이 의심되면 119 또는 의료기관 연락을 안내합니다.`
  },
  center: {
    audience: 'center',
    badge: '기관 안내',
    title: '방문요양센터·기관에는 이렇게 설명합니다.',
    subtitle: '의료행위가 아니라 보호자 안심 리포트와 생활확인 흐름 검증입니다.',
    intro: '처음부터 큰 제휴가 아니라 1~5가구의 작은 실증으로 현장 의견을 받는 것이 목적입니다.',
    primaryHref: '/response/about',
    primaryCta: '서비스 소개 보기',
    steps: [
      { title: '서비스 성격 설명', desc: '비의료 생활확인 서비스이며 의료 판단이나 응급출동을 대체하지 않는다고 설명합니다.' },
      { title: '작은 실증 제안', desc: '1~5가구 정도로 부모님 앱, 보호자 리포트, 미응답, 대리입력 흐름을 확인합니다.' },
      { title: '현장 의견 수집', desc: '요양보호사/사회복지사/센터장이 보기 쉬운 리포트인지 의견을 받습니다.' },
      { title: '파트너 역할 구분', desc: '전화확인, 생활확인, 병원동행 가능성은 검토하되 의료행위는 제외합니다.' }
    ],
    cautions: [
      '센터에 전화할 때 “환자 관리”나 “의료 서비스”처럼 말하지 마세요.',
      '방문요양센터에는 보호자 안심 리포트와 생활확인 기록 보조 도구로 설명하세요.',
      '초기에는 무료 실증 또는 의견 청취로 접근하는 편이 거부감이 낮습니다.'
    ],
    copyText:
`안부웍스는 의료행위나 응급출동 서비스가 아니라, 어르신 안부 신호와 보호자 안심 리포트 흐름을 확인하는 비의료 생활확인 서비스입니다.

처음에는 1~5가구 정도의 작은 실증으로 부모님 앱, 보호자 리포트, 미응답 확인, 대리입력 흐름이 현장에서 이해되는지 의견을 듣고 싶습니다.`
  },
  ops: {
    audience: 'ops',
    badge: '운영실 가이드',
    title: '운영실은 오늘 실증 운영센터에서 시작합니다.',
    subtitle: '주의 항목만 처리하고, 마지막에 실증 리포트를 저장합니다.',
    intro: '운영실은 여러 메뉴를 돌아다니는 것이 아니라 오늘 실증 운영센터에서 순서대로 처리하면 됩니다.',
    primaryHref: '/ops/today-runbook',
    primaryCta: '오늘 운영센터 열기',
    steps: [
      { title: '오늘 실증 운영센터 열기', desc: '주의 항목만 먼저 봅니다.', href: '/ops/today-runbook', cta: '오늘 운영센터' },
      { title: '동의·가입·가구 확인', desc: '동의 기록, 역할 미분류, 실증 가구 수를 확인합니다.' },
      { title: '부모님 앱 1건 테스트', desc: '괜찮아요 1건을 만들어 리포트 반영 여부를 봅니다.' },
      { title: '문자 비용 보호 확인', desc: '테스트 번호 모드, 자동발송 OFF/ON, 위험 대기열을 확인합니다.', href: '/ops/sms-budget-guard', cta: '문자 보호' },
      { title: '실증 리포트 저장', desc: '오늘의 숫자와 개선 우선순위를 스냅샷으로 저장합니다.', href: '/ops/pilot-report', cta: '실증 리포트' }
    ],
    cautions: [
      '실증 첫날에는 자동발송을 바로 켜지 마세요.',
      '문자는 반드시 수신번호와 문구를 확인한 뒤 보내세요.',
      '외부 미팅 전에는 제안 표현 점검과 동의·책임범위 센터를 확인하세요.'
    ],
    copyText:
`[안부웍스 운영실 실증 순서]

1. 오늘 실증 운영센터에서 주의 항목 확인
2. 동의 기록, 가입자 역할, 실증 가구 확인
3. 부모님 앱 괜찮아요 1건 테스트
4. 보호자 리포트 조회 확인
5. 문자 비용 보호센터에서 위험 대기열 확인
6. 미응답 가구 처리
7. 실증 리포트 저장`
  }
}

function toneClass(tone?: string) {
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

export function TrainingGuidePanel({ audience = 'all' }: { audience?: Audience }) {
  const guide = guides[audience] || guides.all
  const [message, setMessage] = useState('')

  async function logEvent(eventType: string, guideKey: string, copiedText = '') {
    try {
      await fetch('/api/training-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          audience: guide.audience,
          guideKey,
          source: 'public-guide',
          path: typeof window !== 'undefined' ? window.location.pathname : '/guide',
          copiedText,
          createdBy: 'public'
        })
      })
    } catch {
      // 가이드 기록 실패는 사용자 흐름을 막지 않습니다.
    }
  }

  async function copyGuide() {
    try {
      await navigator.clipboard.writeText(guide.copyText)
      await logEvent('copy', 'guide_text', guide.copyText)
      setMessage('가이드 문구를 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 문구를 직접 선택해서 복사해주세요.')
    }
  }

  useEffect(() => {
    logEvent('view', 'page_view')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            {guide.badge}
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                {guide.title}
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                {guide.subtitle}
              </p>
            </div>

            <Link href={guide.primaryHref} className="rounded-2xl bg-[#247A71] px-6 py-5 text-center text-sm font-black text-white">
              {guide.primaryCta}
            </Link>
          </div>

          <p className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black leading-7 text-[#17443F] ring-1 ring-[#D6EDE7]">
            {guide.intro}
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            안부웍스는 의료 진단, 치료, 처방, 응급 구조를 대체하지 않습니다. 응급상황은 즉시 119 또는 의료기관에 연락해야 합니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={copyGuide} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              가이드 문구 복사
            </button>
            <Link href="/guide/guardian" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">보호자</Link>
            <Link href="/guide/parent" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">부모님</Link>
            <Link href="/guide/provider" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">파트너</Link>
            <Link href="/guide/center" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">기관</Link>
            <Link href="/guide/ops" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">운영실</Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">사용 순서</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {guide.steps.map((step, index) => (
              <article key={step.title} className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#247A71] text-lg font-black text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-xl font-black tracking-[-0.05em]">{step.title}</h3>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{step.desc}</p>

                {step.href ? (
                  <Link href={step.href} className="mt-4 block rounded-xl bg-white px-4 py-3 text-center text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                    {step.cta || '열기'}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">주의할 점</h2>

            <div className="mt-5 space-y-3">
              {guide.cautions.map((item) => (
                <div key={item} className="rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">복사용 안내문</h2>

            <pre className="mt-5 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#17443F] ring-1 ring-[#D6EDE7]">
              {guide.copyText}
            </pre>
          </section>
        </section>
      </section>
    </main>
  )
}

export default TrainingGuidePanel
