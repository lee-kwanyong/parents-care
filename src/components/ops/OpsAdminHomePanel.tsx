'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type ChecklistItem = {
  key: string
  title: string
  desc: string
  href: string
  finalStatus?: string
  reason?: string
}

type RunbookData = {
  ok?: boolean
  message?: string
  metrics?: Record<string, unknown>
  summary?: Record<string, unknown>
  checklist?: ChecklistItem[]
}

const primaryCards = [
  {
    href: '/ops/today-runbook',
    badge: '오늘',
    title: '오늘 실증 운영센터',
    desc: '가입, 동의, 실증 가구, 안부 신호, 리포트, 미응답, 문자 비용을 순서대로 점검합니다.',
    cta: '오늘 할 일 보기',
    tone: 'safe'
  },
  {
    href: '/ops/users',
    badge: '가입자',
    title: '가입자·실증 참여자',
    desc: '가입자, 역할 미분류, 가족 연결, 안부 신호, 문자 전환을 한 화면에서 봅니다.',
    cta: '가입자 확인',
    tone: 'normal'
  },
  {
    href: '/ops/sms-budget-guard',
    badge: '문자',
    title: '문자 비용 보호',
    desc: '하루 한도, 가구별 한도, 테스트 번호 모드, 위험 대기열을 확인합니다.',
    cta: '문자 위험 확인',
    tone: 'warning'
  },
  {
    href: '/ops/pilot-report',
    badge: '리포트',
    title: '실증 리포트',
    desc: '가입자, 가구, 안부, 문자, 리포트 조회, 유저스푼 결과를 외부 미팅용으로 정리합니다.',
    cta: '실증 리포트 보기',
    tone: 'safe'
  },
  {
    href: '/ops/consent-risk-center',
    badge: '동의',
    title: '동의·책임범위',
    desc: '비의료 고지, 119 대체 아님 고지, 개인정보 수집, 생활확인 파트너 책임범위를 확인합니다.',
    cta: '동의 기록 확인',
    tone: 'normal'
  }
]

const operationFlow = [
  {
    step: '1',
    title: '오늘 상태 확인',
    desc: '/ops/today-runbook에서 주의 항목만 먼저 처리합니다.',
    href: '/ops/today-runbook'
  },
  {
    step: '2',
    title: '1가구 안부 테스트',
    desc: '부모님 5버튼 앱에서 괜찮아요 1건을 먼저 확인합니다.',
    href: '/mobile/parent'
  },
  {
    step: '3',
    title: '보호자 리포트 확인',
    desc: '가족코드와 휴대폰 뒤 4자리로 리포트가 열리는지 봅니다.',
    href: '/guardian/today'
  },
  {
    step: '4',
    title: '미응답 처리',
    desc: '오늘 안부가 없는 가구는 보호자 문자 또는 대리입력으로 처리합니다.',
    href: '/ops/no-response'
  },
  {
    step: '5',
    title: '문자 위험 확인',
    desc: '자동발송 전 문자 비용·위험 대기열을 확인합니다.',
    href: '/ops/sms-budget-guard'
  },
  {
    step: '6',
    title: '증거 저장',
    desc: '실증 리포트와 오늘 운영 요약을 저장합니다.',
    href: '/ops/pilot-report'
  }
]

const secondaryLinks = [
  ['/ops/ring-report-lab', '스마트링 리포트 실험실', '수동 입력으로 안부리듬 리포트 생성'],
  ['/ops/private-pilot', '자체 예비 실증', '가구·링크·미니 리포트'],
  ['/ops/invite-center', '초대 링크 관리', '보호자·부모님·파트너 링크 복사'],
  ['/ops/training-center', '교육·가이드', '보호자·부모님·파트너 1분 사용법'],
  ['/ops/report-tracking', '리포트 조회 추적', '보호자 리포트 성공/실패'],
  ['/ops/no-response', '미응답 자동 처리', '오늘 안부 신호 없는 가구'],
  ['/ops/proxy-checkin', '운영실 대리입력', '전화 확인 후 대신 기록'],
  ['/guardian/proxy-checkin', '보호자 대리입력', '보호자가 전화 후 대신 기록'],
  ['/ops/message-automation', '상황별 자동문자', '조건별 문자 대기열 생성'],
  ['/ops/notification-dispatch', '알림 발송센터', '대기/성공/실패 문자'],
  ['/ops/notification-safety', '문자 안전정리', '테스트/실패 문자 재시도 방지'],
  ['/ops/proposal-reality-check', '제안 표현 점검', '현재/실증/비전 분리'],
  ['/consent', '실증 참여 동의서', '참여자 동의 기록'],
  ['/auth/role', '회원가입 역할 선택', 'unknown 역할 방지'],
  ['/onboarding', '가입 후 시작하기', '역할별 3단계 안내']
]

function toneClass(tone?: string) {
  if (['safe', 'pass', 'completed', 'ok'].includes(tone || '')) return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (['warning', 'manual'].includes(tone || '')) return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (['danger', 'failed', 'blocked'].includes(tone || '')) return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function statusLabel(status?: string) {
  if (status === 'pass') return '통과'
  if (status === 'completed') return '완료'
  if (status === 'ok') return '정상'
  if (status === 'warning') return '주의'
  if (status === 'manual') return '수동'
  if (status === 'blocked') return '보류'
  return '확인'
}

function numberText(value: unknown) {
  const numberValue = Number(value || 0)

  if (!Number.isFinite(numberValue)) return '0'

  return numberValue.toLocaleString('ko-KR')
}

function MetricCard({ title, value, desc, tone }: { title: string; value: string; desc: string; tone?: string }) {
  return (
    <article className={'rounded-[1.5rem] p-5 shadow-sm ring-1 ' + toneClass(tone)}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={'inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ' + toneClass(tone)}>
      {children}
    </span>
  )
}

export function OpsAdminHomePanel() {
  const [data, setData] = useState<RunbookData | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const metrics = data?.metrics || {}
  const summary = data?.summary || {}
  const checklist = data?.checklist || []

  const topWarnings = useMemo(() => {
    return checklist
      .filter((item) => ['warning', 'manual', 'blocked'].includes(item.finalStatus || ''))
      .slice(0, 5)
  }, [checklist])

  const overallTone = useMemo(() => {
    if (Number(summary.warning || 0) > 0) return 'warning'
    if (Number(summary.pass || 0) >= Number(summary.total || 1)) return 'safe'
    return 'manual'
  }, [summary])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/today-runbook', { cache: 'no-store' })
      const next = await response.json().catch(() => ({}))

      if (!response.ok || !next.ok) {
        setMessage(next.message || '오늘 실증 운영 상태를 불러오지 못했습니다. 운영실 인증을 확인해주세요.')
        setData(null)
        return
      }

      setData(next)
      setMessage('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '오늘 실증 운영 상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

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
                오늘은 이 순서대로만
                <br />
                확인하면 됩니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                메뉴를 찾는 화면이 아니라, 실증 시작 순서대로 눌러야 할 화면만 먼저 보여주는 운영실 첫 화면입니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + toneClass(overallTone)}>
              <div className="text-sm font-black opacity-70">오늘 상태</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">
                {overallTone === 'safe' ? '좋음' : overallTone === 'warning' ? '주의' : '확인'}
              </div>
              <div className="mt-2 text-xs font-bold">
                {numberText(summary.pass)} / {numberText(summary.total)} 완료
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            실증일에는 이 화면에서 시작하세요. 오늘 실증 운영센터 → 부모님 앱 1건 → 보호자 리포트 → 문자 보호 → 실증 리포트 순서가 기본입니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              {loading ? '확인 중' : '상태 새로고침'}
            </button>

            <Link href="/ops/today-runbook" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              오늘 실증 운영센터
            </Link>

            <Link href="/ops/pilot-report" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              실증 리포트
            </Link>

            <Link href="/ops/sms-budget-guard" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              문자 비용 보호
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF4F4] p-4 text-sm font-black leading-7 text-[#8A3030] ring-1 ring-[#F3C8C8]">
              {message}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="가입자" value={`${numberText(metrics.totalUsers)}명`} desc="전체" tone="safe" />
          <MetricCard title="최근 24시간" value={`${numberText(metrics.users24h)}명`} desc="신규 가입" tone="safe" />
          <MetricCard title="동의 기록" value={`${numberText(metrics.consentRecords)}건`} desc="실증 동의" tone={Number(metrics.consentRecords || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="실증 가구" value={`${numberText(metrics.totalFamilies)}가구`} desc="운영 대상" tone={Number(metrics.totalFamilies || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="오늘 안부" value={`${numberText(metrics.todayCareSignals)}건`} desc="신호" tone={Number(metrics.todayCareSignals || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="미응답" value={`${numberText(metrics.todayNoResponseFamilies)}가구`} desc="확인 필요" tone={Number(metrics.todayNoResponseFamilies || 0) > 0 ? 'warning' : 'safe'} />
          <MetricCard title="리포트 성공" value={`${numberText(metrics.todayReportSuccess)}건`} desc="오늘 조회" tone={Number(metrics.todayReportSuccess || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="문자 실패" value={`${numberText(metrics.failedMessages)}건`} desc="정리 필요" tone={Number(metrics.failedMessages || 0) > 0 ? 'danger' : 'safe'} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-[-0.06em]">가장 먼저 누를 5개</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  운영실 첫 화면에서는 이 5개만 우선 처리하면 됩니다.
                </p>
              </div>

              <Link href="/ops/today-runbook" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
                오늘 할 일 시작
              </Link>
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-2">
              {primaryCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className={'block rounded-2xl p-5 shadow-sm ring-1 transition active:scale-[0.99] ' + toneClass(card.tone)}
                >
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={card.tone}>{card.badge}</Pill>
                  </div>

                  <h3 className="mt-3 text-2xl font-black tracking-[-0.06em]">{card.title}</h3>
                  <p className="mt-2 min-h-16 text-sm font-bold leading-7 opacity-75">{card.desc}</p>

                  <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-center text-sm font-black text-[#17443F] ring-1 ring-current/10">
                    {card.cta}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">주의 항목</h2>

            <div className="mt-5 space-y-3">
              {topWarnings.length ? (
                topWarnings.map((item) => (
                  <Link key={item.key} href={item.href} className={'block rounded-2xl p-4 ring-1 ' + toneClass(item.finalStatus)}>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={item.finalStatus}>{statusLabel(item.finalStatus)}</Pill>
                    </div>
                    <div className="mt-3 text-lg font-black">{item.title}</div>
                    <p className="mt-1 text-sm font-bold leading-7 opacity-75">{item.reason || item.desc}</p>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl bg-[#EFFFFA] p-5 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
                  현재 자동 집계상 큰 주의 항목이 없습니다. 오늘 실증 운영센터에서 수동 확인 항목만 완료 표시하세요.
                </div>
              )}
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">오늘 운영 순서</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {operationFlow.map((item) => (
              <Link key={item.step} href={item.href} className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7] transition active:scale-[0.99]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#247A71] text-lg font-black text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 text-xl font-black tracking-[-0.05em]">{item.title}</h3>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <details>
            <summary className="cursor-pointer text-3xl font-black tracking-[-0.06em]">
              다른 관리 메뉴 전체보기
            </summary>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {secondaryLinks.map(([href, title, desc]) => (
                <Link key={href} href={href} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-lg font-black">{title}</div>
                  <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
                </Link>
              ))}
            </div>
          </details>
        </section>
      </section>
    </main>
  )
}

export default OpsAdminHomePanel
