'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type EventRow = {
  id: string
  eventType: string
  audience: string
  guideKey: string
  source: string
  path: string
  copiedText: string
  createdBy: string
  createdKst: string
}

const guideCards = [
  {
    audience: 'all',
    href: '/guide',
    title: '전체 안내',
    desc: '보호자, 부모님, 파트너가 각각 무엇을 해야 하는지 한 화면에서 안내합니다.'
  },
  {
    audience: 'guardian',
    href: '/guide/guardian',
    title: '보호자 가이드',
    desc: '동의서, 부모님 앱 링크 전달, 리포트 확인, 대리입력 사용법을 안내합니다.'
  },
  {
    audience: 'parent',
    href: '/guide/parent',
    title: '부모님 가이드',
    desc: '큰 버튼 하나만 누르는 방식으로 부모님 사용법을 안내합니다.'
  },
  {
    audience: 'provider',
    href: '/guide/provider',
    title: '생활확인 파트너 가이드',
    desc: '요청 수락, 결과 기록, 비의료 책임범위를 안내합니다.'
  },
  {
    audience: 'center',
    href: '/guide/center',
    title: '기관·방문요양센터 가이드',
    desc: '방문요양센터와 기관에 설명할 실증 범위와 협력 방식을 안내합니다.'
  },
  {
    audience: 'ops',
    href: '/guide/ops',
    title: '운영실 가이드',
    desc: '오늘 실증 운영센터에서 시작하는 운영 순서를 안내합니다.'
  }
]

function toneClass(tone?: string) {
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function MetricCard({ title, value, desc, tone }: { title: string; value: string; desc: string; tone?: string }) {
  return (
    <article className={'rounded-[1.6rem] p-5 shadow-sm ring-1 ' + toneClass(tone)}>
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

export function TrainingCenterPanel() {
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [templates, setTemplates] = useState<Record<string, string>>({})
  const [events, setEvents] = useState<EventRow[]>([])
  const [activeTab, setActiveTab] = useState<'guides' | 'templates' | 'events'>('guides')
  const [createdBy, setCreatedBy] = useState('운영실')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/training-center', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '교육자료 정보를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMetrics(data.metrics || {})
      setTemplates(data.templates || {})
      setEvents(Array.isArray(data.events) ? data.events : [])
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '교육자료 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function logCopy(audience: string, guideKey: string, copiedText: string) {
    try {
      await fetch('/api/training-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'copy',
          audience,
          guideKey,
          copiedText,
          source: 'ops-training-center',
          path: typeof window !== 'undefined' ? window.location.pathname : '/admin/ops/training-center',
          createdBy
        })
      })
    } catch {
      // 복사 기록 실패는 운영 흐름을 막지 않습니다.
    }
  }

  async function copyTemplate(audience: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      await logCopy(audience, 'template_copy', value)
      setMessage('교육 문구를 복사했습니다.')
      await load()
    } catch {
      setMessage('복사에 실패했습니다. 직접 선택해서 복사해주세요.')
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
            실증 참여자 교육/가이드 센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                보호자·부모님·파트너가
                <br />
                뭘 눌러야 하는지 알려줍니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                실증 참여자에게 보낼 1분 사용법, 복사용 안내문, 교육 링크, 조회·복사 기록을 관리합니다.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#EFFFFA] px-6 py-5 text-center text-[#247A71] ring-1 ring-[#CDEFE7]">
              <div className="text-sm font-black opacity-70">가이드 활동</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{Number(metrics.totalEvents || 0)}건</div>
              <div className="mt-2 text-xs font-bold">오늘 {Number(metrics.todayEvents || 0)}건</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            이 센터까지 만들면 “가입은 했는데 뭘 해야 하는지 모르는 문제”를 크게 줄일 수 있습니다. 다만 실제 사용성은 실증 참여자가 직접 써봐야 최종 확인됩니다.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              placeholder="처리자"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              새로고침
            </button>

            <Link href="/admin/ops/invite-center" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              초대 링크 센터
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/guide" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">전체 안내</Link>
            <Link href="/guide/guardian" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">보호자</Link>
            <Link href="/guide/parent" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">부모님</Link>
            <Link href="/guide/provider" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">파트너</Link>
            <Link href="/admin/ops" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">운영실 홈</Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white">
              <summary className="cursor-pointer text-sm font-black">상세 결과 보기</summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="전체 이벤트" value={`${Number(metrics.totalEvents || 0)}건`} desc="조회+복사" />
          <MetricCard title="오늘 이벤트" value={`${Number(metrics.todayEvents || 0)}건`} desc="오늘 활동" tone="safe" />
          <MetricCard title="조회" value={`${Number(metrics.viewEvents || 0)}건`} desc="가이드 열람" tone="safe" />
          <MetricCard title="복사" value={`${Number(metrics.copyEvents || 0)}건`} desc="안내문 복사" tone="safe" />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ['guides', '가이드 링크'],
              ['templates', '복사용 문구'],
              ['events', '조회·복사 기록']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={
                  'rounded-2xl px-4 py-4 text-sm font-black ring-1 ' +
                  (activeTab === key
                    ? 'bg-[#247A71] text-white ring-[#247A71]'
                    : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                }
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'guides' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">교육 가이드 링크</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {guideCards.map((card) => (
                <Link key={card.href} href={card.href} className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-wrap gap-2">
                    <Pill tone="safe">{card.audience}</Pill>
                  </div>
                  <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{card.title}</h3>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{card.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'templates' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">복사용 교육 문구</h2>

            <div className="mt-5 grid gap-4">
              {Object.entries(templates).map(([key, value]) => (
                <article key={key} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Pill tone="safe">{key}</Pill>
                      </div>
                      <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{key} 안내문</h3>
                    </div>

                    <button onClick={() => copyTemplate(key, value)} className="rounded-xl bg-[#247A71] px-4 py-3 text-xs font-black text-white">
                      복사
                    </button>
                  </div>

                  <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-[#17443F] ring-1 ring-[#D6EDE7]">
                    {value}
                  </pre>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'events' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">조회·복사 기록</h2>

            <div className="mt-5 space-y-3">
              {events.length ? (
                events.map((event) => (
                  <article key={event.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={event.eventType === 'copy' ? 'safe' : 'normal'}>{event.eventType}</Pill>
                      <Pill>{event.audience || '-'}</Pill>
                      <Pill>{event.guideKey || '-'}</Pill>
                    </div>

                    <h3 className="mt-3 text-lg font-black">{event.createdBy || '-'} · {event.createdKst || '-'}</h3>

                    <p className="mt-2 line-clamp-3 text-sm font-bold leading-7 text-[#637B76]">
                      {event.copiedText || event.path || '-'}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 조회·복사 기록이 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default TrainingCenterPanel
