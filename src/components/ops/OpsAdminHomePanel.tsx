'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type FetchState = {
  ok: boolean
  status?: number
  data?: any
  error?: string
}

type ActionItem = {
  order: number
  title: string
  desc: string
  href: string
  cta: string
  tone?: 'normal' | 'warning' | 'danger' | 'done'
}

const quickLinks = [
  {
    group: '실증 시작',
    links: [
      ['/ops/preflight-test', '전체 기능 테스트', '실증 전 PASS 확인'],
      ['/ops/private-pilot', '자체 예비 실증', '가구·링크·미니 리포트'],
      ['/ops/pilot-report', '실증 리포트', '외부 미팅용 결과 요약'],
      ['/ops/proposal-reality-check', '제안 표현 점검', '현재/실증/비전 분리'],
      ['/ops/consent-risk-center', '동의·책임범위', '비의료/개인정보/119 고지'],
      ['/ops/users', '가입자·실증 참여자', '가입→연결→안부→문자 전환'],
      ['/ops/report-tracking', '리포트 조회 추적', '보호자 리포트 성공/실패'],
      ['/ops/no-response', '미응답 자동 처리', '오늘 안부 신호 없는 가구'],
      ['/mobile', '모바일 앱', '부모님·보호자·파트너 앱'],
      ['/mobile/parent', '부모님 신호 앱', '괜찮아요/도움 요청']
    ]
  },
  {
    group: '문자·자동화',
    links: [
      ['/ops/message-automation', '상황별 문자 자동화', '문구·규칙·자동 대기열'],
      ['/ops/notification-dispatch', '알림 발송센터', '대기/성공/실패 문자'],
      ['/ops/notification-safety', '문자 안전정리', '테스트/실패 문자 재시도 방지'],
      ['/ops/control-center', '운영실 상태판', '전체 사건·문자·긴급 현황']
    ]
  },
  {
    group: '긴급·후속조치',
    links: [
      ['/ops/urgent-dispatch', '즉시 배치센터', '생활확인 파트너 배치'],
      ['/provider/urgent-requests', '파트너 요청함', '1회용 수락 링크'],
      ['/ops/state-machine', '상태 머신', '중복 수락·완료·만료 정리']
    ]
  },
  {
    group: '보안·검증',
    links: [
      ['/ops/security-center', '권한 점검센터', 'RLS·공개 접근 점검'],
      ['/ops/pilot-qa', '실증 QA', '시연 전 체크리스트'],
      ['/ops/privacy-audit', '개인정보 감사', '동의·열람 기록']
    ]
  },
  {
    group: '제안·영업',
    links: [
      ['/ops/one-page-proposal', '1페이지 제안서', '지자체 PDF/메일 본문'],
      ['/ops/outreach-crm', '지자체 CRM', '전화·메일·회신·미팅'],
      ['/gov/one-page-proposal', '지자체 제안서 보기', '외부 시연용']
    ]
  },
  {
    group: '역할별 페이지',
    links: [
      ['/portal/parent', '부모님 페이지', '부모님 전용 메뉴'],
      ['/portal/child', '자녀·보호자 페이지', '보호자 전용 메뉴'],
      ['/portal/care-worker', '요양보호사 페이지', '도움망 전용 메뉴'],
      ['/portal/ops', '운영실 홈', '현재 화면']
    ]
  }
] as const

function statusClass(tone?: string) {
  if (tone === 'done') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={'inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(tone)}>
      {children}
    </span>
  )
}

function BigMetric({ title, value, desc, tone }: { title: string; value: string; desc: string; tone?: string }) {
  return (
    <article className={'rounded-[1.6rem] p-5 shadow-sm ring-1 ' + statusClass(tone)}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

function getNumber(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function latestRun(data?: any) {
  return Array.isArray(data?.runs) ? data.runs[0] : null
}

function latestPreflightPass(preflight?: FetchState) {
  const run = latestRun(preflight?.data)
  return run?.status === 'pass' || run?.status === 'ok' || getNumber(run?.score) >= 80
}

function safeCount(value: unknown) {
  if (Array.isArray(value)) return value.length
  return 0
}

export function OpsAdminHomePanel() {
  const [loading, setLoading] = useState(false)
  const [preflight, setPreflight] = useState<FetchState>({ ok: false })
  const [pilot, setPilot] = useState<FetchState>({ ok: false })
  const [automation, setAutomation] = useState<FetchState>({ ok: false })
  const [notifications, setNotifications] = useState<FetchState>({ ok: false })
  const [control, setControl] = useState<FetchState>({ ok: false })
  const [openMenu, setOpenMenu] = useState<string>('실증 시작')

  async function safeFetch(path: string): Promise<FetchState> {
    try {
      const response = await fetch(path, { cache: 'no-store' })
      const data = await response.json().catch(() => null)

      return {
        ok: response.ok && data?.ok !== false,
        status: response.status,
        data,
        error: !response.ok ? data?.message || `HTTP ${response.status}` : undefined
      }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : '불러오지 못했습니다.'
      }
    }
  }

  async function load() {
    setLoading(true)

    const [nextPreflight, nextPilot, nextAutomation, nextNotifications, nextControl] = await Promise.all([
      safeFetch('/api/preflight-test'),
      safeFetch('/api/private-pilot'),
      safeFetch('/api/message-automation'),
      safeFetch('/api/notification-dispatch'),
      safeFetch('/api/ops-control-center')
    ])

    setPreflight(nextPreflight)
    setPilot(nextPilot)
    setAutomation(nextAutomation)
    setNotifications(nextNotifications)
    setControl(nextControl)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const metrics = pilot.data?.metrics || {}
  const pilotExists = Boolean(pilot.data?.selectedPilot)
  const households = getNumber(metrics.households)
  const requests = getNumber(metrics.requests)
  const urgentRequests = getNumber(metrics.urgentRequests)
  const openRequests = getNumber(metrics.openRequests)

  const templateCount = safeCount(automation.data?.templates)
  const ruleCount = safeCount(automation.data?.rules)
  const activeRuleCount = safeCount((automation.data?.rules || []).filter?.((item: any) => item.enabled))
  const autoDispatch = Boolean(automation.data?.config?.autoDispatchGlobal)

  const latestAutomationRun = latestRun(automation.data)
  const latestQueued = getNumber(latestAutomationRun?.metrics?.queued)

  const notificationStats = notifications.data?.stats || notifications.data?.metrics || {}
  const queuedNotifications = getNumber(notificationStats.queued || notificationStats.pending || notifications.data?.pendingCount)
  const sentNotifications = getNumber(notificationStats.sent || notifications.data?.sentCount)
  const failedNotifications = getNumber(notificationStats.failed || notifications.data?.failedCount)

  const actions = useMemo<ActionItem[]>(() => {
    const list: ActionItem[] = []

    if (!latestPreflightPass(preflight)) {
      list.push({
        order: 1,
        title: '실증 전 전체 기능 테스트를 먼저 통과시켜야 합니다',
        desc: '현재 운영실·모바일·문자·긴급 배치 흐름을 한 번에 점검하세요.',
        href: '/ops/preflight-test',
        cta: '전체 테스트 실행',
        tone: 'danger'
      })
    } else {
      list.push({
        order: 1,
        title: '전체 기능 테스트는 통과 상태입니다',
        desc: '이제 실제 1가구 소프트런으로 넘어갈 수 있습니다.',
        href: '/ops/preflight-test',
        cta: '테스트 기록 보기',
        tone: 'done'
      })
    }

    if (!pilotExists) {
      list.push({
        order: 2,
        title: '14일 자체 예비 실증을 생성하세요',
        desc: '실증이 없으면 가구·문자·리포트가 묶이지 않습니다.',
        href: '/ops/private-pilot',
        cta: '실증 생성',
        tone: 'danger'
      })
    } else if (households === 0) {
      list.push({
        order: 2,
        title: '실증 가구 1개를 먼저 만드세요',
        desc: '처음은 1가구만 만들고 부모님 앱 링크를 테스트하세요.',
        href: '/ops/private-pilot',
        cta: '가구 만들기',
        tone: 'warning'
      })
    } else {
      list.push({
        order: 2,
        title: `${households}가구가 실증에 등록되어 있습니다`,
        desc: '가구 링크를 열고 괜찮아요 신호 1건부터 확인하세요.',
        href: '/ops/private-pilot',
        cta: '가구·링크 보기',
        tone: 'done'
      })
    }

    if (templateCount === 0 || ruleCount === 0) {
      list.push({
        order: 3,
        title: '상황별 문자 문구와 규칙을 초기화하세요',
        desc: '문구만 있고 규칙이 없으면 자동문자가 생성되지 않습니다.',
        href: '/ops/message-automation',
        cta: '문자 자동화 설정',
        tone: 'danger'
      })
    } else {
      list.push({
        order: 3,
        title: '상황별 문자 자동화 규칙이 준비되었습니다',
        desc: `템플릿 ${templateCount}개 · 규칙 ${ruleCount}개 · 활성 ${activeRuleCount}개`,
        href: '/ops/message-automation',
        cta: '상황 문자 실행',
        tone: autoDispatch ? 'done' : 'warning'
      })
    }

    if (queuedNotifications > 0) {
      list.push({
        order: 4,
        title: `발송 대기 문자가 ${queuedNotifications}건 있습니다`,
        desc: '자동발송을 켜기 전에는 대기열을 반드시 확인하세요.',
        href: '/ops/notification-dispatch',
        cta: '대기열 확인',
        tone: 'warning'
      })
    } else {
      list.push({
        order: 4,
        title: '발송 대기열은 비어 있거나 확인이 필요합니다',
        desc: '문자를 만들려면 부모님 신호 또는 오늘 안부요청 생성을 실행하세요.',
        href: '/ops/notification-dispatch',
        cta: '알림 발송센터',
        tone: 'normal'
      })
    }

    if (urgentRequests > 0 || openRequests > 0) {
      list.push({
        order: 5,
        title: '열린 사건이나 긴급 요청을 확인하세요',
        desc: `긴급 ${urgentRequests}건 · 열린 사건 ${openRequests}건`,
        href: '/ops/urgent-dispatch',
        cta: '긴급 요청 확인',
        tone: 'danger'
      })
    } else {
      list.push({
        order: 5,
        title: '현재 열린 긴급 요청은 없습니다',
        desc: '긴급 버튼 테스트는 보호자에게 사전고지 후 1건만 진행하세요.',
        href: '/ops/urgent-dispatch',
        cta: '즉시 배치센터',
        tone: 'done'
      })
    }

    list.push({
      order: 6,
      title: '오늘 작업이 끝나면 미니 리포트를 저장하세요',
      desc: '지자체·센터에 보여줄 실증 증거는 리포트로 남겨야 합니다.',
      href: '/ops/private-pilot',
      cta: '미니 리포트 저장',
      tone: 'normal'
    })

    return list.sort((a, b) => a.order - b.order)
  }, [
    preflight,
    pilotExists,
    households,
    templateCount,
    ruleCount,
    activeRuleCount,
    autoDispatch,
    queuedNotifications,
    urgentRequests,
    openRequests
  ])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            운영실 한눈 홈
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                지금 운영실에서
                <br />
                무엇을 만져야 하는지 먼저 보여줍니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                메뉴를 찾는 화면이 아니라, 실증 시작 순서대로 눌러야 할 버튼만 먼저 보여주는 운영실 첫 화면입니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + statusClass(latestPreflightPass(preflight) ? 'done' : 'warning')}>
              <div className="text-sm font-black opacity-70">실증 준비</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">
                {latestPreflightPass(preflight) ? '가능' : '확인'}
              </div>
              <div className="mt-2 text-xs font-bold">
                {loading ? '불러오는 중' : '운영실 상태 기준'}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            오늘은 1가구 소프트런 기준입니다. 자동발송을 켜기 전에는 발송 대기열과 수신번호를 반드시 확인하세요.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              {loading ? '새로고침 중' : '상태 새로고침'}
            </button>

            <Link href="/ops/private-pilot" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              자체 예비 실증
            </Link>

            <Link href="/ops/message-automation" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              자동문자
            </Link>

            <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              알림 발송센터
            </Link>

            <Link href="/mobile" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              모바일 앱
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <BigMetric title="실증 가구" value={`${households}가구`} desc="참여 대상" tone={households > 0 ? 'done' : 'danger'} />
          <BigMetric title="안부 신호" value={`${requests}건`} desc="누적 신호" tone={requests > 0 ? 'done' : 'normal'} />
          <BigMetric title="긴급 요청" value={`${urgentRequests}건`} desc="도움 필요" tone={urgentRequests > 0 ? 'danger' : 'done'} />
          <BigMetric title="문자 대기" value={`${queuedNotifications}건`} desc="발송 전 확인" tone={queuedNotifications > 0 ? 'warning' : 'normal'} />
          <BigMetric title="문자 성공" value={`${sentNotifications}건`} desc="발송 완료" tone="done" />
          <BigMetric title="문자 실패" value={`${failedNotifications}건`} desc="재시도 주의" tone={failedNotifications > 0 ? 'danger' : 'normal'} />
          <BigMetric title="자동문자" value={autoDispatch ? 'ON' : 'OFF'} desc="전체 발송" tone={autoDispatch ? 'done' : 'warning'} />
          <BigMetric title="규칙" value={`${activeRuleCount}/${ruleCount}`} desc="활성/전체" tone={activeRuleCount > 0 ? 'done' : 'danger'} />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.06em]">지금 만질 것</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                위에서 아래 순서대로만 처리하면 됩니다.
              </p>
            </div>
            <Pill tone={actions.some((item) => item.tone === 'danger') ? 'danger' : actions.some((item) => item.tone === 'warning') ? 'warning' : 'done'}>
              {actions.some((item) => item.tone === 'danger') ? '수정 필요' : actions.some((item) => item.tone === 'warning') ? '확인 필요' : '진행 가능'}
            </Pill>
          </div>

          <div className="mt-5 space-y-3">
            {actions.map((item) => (
              <article key={item.order} className={'rounded-2xl p-4 ring-1 ' + statusClass(item.tone)}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black shadow-sm ring-1 ring-current/10">
                      {item.order}
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-[-0.05em]">{item.title}</h3>
                      <p className="mt-1 text-sm font-bold leading-7 opacity-75">{item.desc}</p>
                    </div>
                  </div>

                  <Link href={item.href} className="rounded-xl bg-[#247A71] px-4 py-3 text-center text-sm font-black text-white">
                    {item.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">오늘 절대 누르지 말 것</h2>

            <div className="mt-5 space-y-3">
              {[
                ['실패 문자 재시도', '과거 실패 문자까지 다시 발송될 수 있습니다.'],
                ['대기열 전체 발송', '수신번호와 문구를 확인하기 전에는 전체 발송하지 마세요.'],
                ['생활확인 파트너 실제 방문 요청', '첫날은 전화 확인 흐름까지만 테스트하세요.'],
                ['지자체 대량 메일 발송', '자체 실증 리포트가 나온 뒤 보내는 게 좋습니다.']
              ].map(([title, desc]) => (
                <div key={title} className="rounded-2xl bg-[#FFF4F4] p-4 text-[#8A3030] ring-1 ring-[#F3C8C8]">
                  <div className="text-lg font-black">{title}</div>
                  <p className="mt-1 text-sm font-bold leading-7 opacity-80">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">1가구 소프트런 순서</h2>

            <div className="mt-5 space-y-3">
              {[
                ['1', '실증 가구 1개 생성', '/ops/private-pilot'],
                ['2', '부모님 앱 링크 열기', '/mobile/parent'],
                ['3', '괜찮아요 1번 누르기', '/mobile/parent'],
                ['4', '상황 문자 실행', '/ops/message-automation'],
                ['5', '알림 발송센터에서 대기열 확인', '/ops/notification-dispatch'],
                ['6', '문자 수신 확인 후 미니 리포트 저장', '/ops/private-pilot']
              ].map(([num, title, href]) => (
                <Link key={num} href={href} className="flex items-center gap-4 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EFFFFA] text-sm font-black text-[#247A71]">
                    {num}
                  </div>
                  <div className="text-base font-black">{title}</div>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">전체 메뉴</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
            평소에는 위의 “지금 만질 것”만 쓰고, 필요한 경우에만 아래 메뉴를 펼치세요.
          </p>

          <div className="mt-5 grid gap-3">
            {quickLinks.map((group) => (
              <section key={group.group} className="overflow-hidden rounded-2xl bg-[#FAFFFD] ring-1 ring-[#D6EDE7]">
                <button
                  onClick={() => setOpenMenu(openMenu === group.group ? '' : group.group)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-xl font-black tracking-[-0.05em]">{group.group}</span>
                  <span className="text-sm font-black text-[#247A71]">{openMenu === group.group ? '닫기' : '열기'}</span>
                </button>

                {openMenu === group.group ? (
                  <div className="divide-y divide-[#D6EDE7] border-t border-[#D6EDE7]">
                    {group.links.map(([href, title, desc]) => (
                      <Link key={href} href={href} className="grid gap-1 px-5 py-4 transition hover:bg-white sm:grid-cols-[0.35fr_1fr_auto] sm:items-center">
                        <span className="text-base font-black text-[#17443F]">{title}</span>
                        <span className="text-sm font-bold leading-6 text-[#637B76]">{desc}</span>
                        <span className="text-sm font-black text-[#247A71]">이동 →</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default OpsAdminHomePanel
