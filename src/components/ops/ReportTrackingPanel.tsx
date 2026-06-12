'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type EventRow = {
  id: string
  eventType: string
  familyCode: string
  source: string
  path: string
  status: string
  parentName: string
  guardianName: string
  message: string
  createdKst: string
  payload: Record<string, unknown>
}

function toneClass(tone?: string) {
  if (['safe', 'ok', 'success', 'report_lookup_success'].includes(tone || '')) return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (['warning', 'report_lookup_failed', 'report_lookup_validation_failed'].includes(tone || '')) return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (['danger', 'failed'].includes(tone || '')) return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
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

function eventLabel(type: string) {
  const map: Record<string, string> = {
    view_report_page: '리포트 화면 진입',
    report_lookup_validation_failed: '입력값 부족',
    report_lookup_failed: '리포트 조회 실패',
    report_lookup_success: '리포트 조회 성공',
    parent_app_link_copied: '부모님 링크 복사',
    schema_applied: '스키마 적용'
  }

  return map[type] || type
}

export function ReportTrackingPanel() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState<'summary' | 'events' | 'failures' | 'families'>('summary')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const failedEvents = useMemo(() => {
    return events.filter((item) => ['report_lookup_failed', 'report_lookup_validation_failed'].includes(item.eventType))
  }, [events])

  const successEvents = useMemo(() => {
    return events.filter((item) => item.eventType === 'report_lookup_success')
  }, [events])

  const familyRows = useMemo(() => {
    const counts = metrics.familyCounts || {}

    return Object.entries(counts)
      .map(([familyCode, count]) => ({ familyCode, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
  }, [metrics.familyCounts])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/report-tracking', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '리포트 조회 기록을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMetrics(data.metrics || {})
      setEvents(Array.isArray(data.events) ? data.events : [])
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '리포트 조회 기록을 불러오지 못했습니다.')
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
            보호자 리포트 조회 추적센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                보호자가 리포트를
                <br />
                실제로 봤는지 확인합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                리포트 화면 진입, 가족코드 조회 성공/실패, 부모님 앱 링크 복사를 추적합니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + toneClass(Number(metrics.successRate || 0) >= 70 ? 'safe' : 'warning')}>
              <div className="text-sm font-black opacity-70">조회 성공률</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{Number(metrics.successRate || 0)}%</div>
              <div className="mt-2 text-xs font-bold">성공/시도</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            리포트 조회 실패가 많으면 가족코드, 휴대폰 뒤 4자리, 부모님 연결 안내가 아직 어렵다는 뜻입니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              {loading ? '새로고침 중' : '상태 새로고침'}
            </button>

            <Link href="/guardian/today" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              보호자 오늘 리포트
            </Link>

            <Link href="/admin/ops/users" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              가입자센터
            </Link>

            <Link href="/admin/ops" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 홈
            </Link>
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

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="전체 이벤트" value={`${Number(metrics.totalEvents || 0)}건`} desc="조회 추적" />
          <MetricCard title="최근 24시간" value={`${Number(metrics.events24h || 0)}건`} desc="최근 활동" tone="safe" />
          <MetricCard title="화면 진입" value={`${Number(metrics.pageViews || 0)}건`} desc="리포트 방문" />
          <MetricCard title="조회 시도" value={`${Number(metrics.lookupAttempts || 0)}건`} desc="코드 입력" />
          <MetricCard title="조회 성공" value={`${Number(metrics.lookupSuccess || 0)}건`} desc="리포트 표시" tone="safe" />
          <MetricCard title="조회 실패" value={`${Number(metrics.lookupFailed || 0)}건`} desc="입력/매칭 실패" tone={Number(metrics.lookupFailed || 0) > 0 ? 'warning' : 'safe'} />
          <MetricCard title="링크 복사" value={`${Number(metrics.parentLinkCopied || 0)}건`} desc="부모님 앱 전달" tone="safe" />
          <MetricCard title="고유 가구" value={`${Number(metrics.uniqueFamiliesViewed || 0)}가구`} desc="리포트 확인" tone="safe" />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              ['summary', '전환 요약'],
              ['events', '전체 이벤트'],
              ['failures', '실패 이벤트'],
              ['families', '가구별 조회']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={
                  'rounded-2xl px-5 py-4 text-sm font-black ring-1 ' +
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

        {activeTab === 'summary' ? (
          <section className="grid gap-5 xl:grid-cols-3">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">리포트 병목 판단</h2>

              <div className="mt-5 space-y-3">
                {[
                  [`조회 성공률 ${Number(metrics.successRate || 0)}%`, '70% 미만이면 가족코드/뒤 4자리 안내를 더 쉽게 만들어야 합니다.', Number(metrics.successRate || 0) >= 70 ? 'safe' : 'warning'],
                  [`조회 실패 ${Number(metrics.lookupFailed || 0)}건`, '실패가 많으면 보호자가 코드를 못 찾거나 뒤 4자리를 잘못 입력한 것입니다.', Number(metrics.lookupFailed || 0) > 0 ? 'warning' : 'safe'],
                  [`부모님 앱 링크 복사 ${Number(metrics.parentLinkCopied || 0)}건`, '복사 수가 낮으면 부모님에게 앱 링크 전달까지 가지 못한 것입니다.', Number(metrics.parentLinkCopied || 0) > 0 ? 'safe' : 'warning']
                ].map(([title, desc, tone]) => (
                  <div key={String(title)} className={'rounded-2xl p-4 ring-1 ' + toneClass(String(tone))}>
                    <div className="text-lg font-black">{title}</div>
                    <p className="mt-1 text-sm font-bold leading-7 opacity-80">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">이벤트 유형</h2>

              <div className="mt-5 space-y-3">
                {Object.entries(metrics.eventTypeCounts || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-sm font-black">{eventLabel(key)}</div>
                    <Pill tone={key}>{String(value)}건</Pill>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">다음 개선 기준</h2>

              <div className="mt-5 space-y-3">
                {[
                  ['리포트 조회 성공률 80% 이상', '보호자가 코드와 뒤 4자리만으로 리포트를 볼 수 있어야 합니다.'],
                  ['부모님 앱 링크 복사율 증가', '보호자가 부모님에게 링크를 전달해야 안부 신호가 생깁니다.'],
                  ['조회 실패 사유 감소', '가족코드 다시 보기와 안내 문구를 더 단순화해야 합니다.']
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-base font-black">{title}</div>
                    <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'events' ? (
          <EventList title="전체 리포트 조회 이벤트" events={events} empty="아직 이벤트가 없습니다." />
        ) : null}

        {activeTab === 'failures' ? (
          <EventList title="조회 실패 이벤트" events={failedEvents} empty="조회 실패 이벤트가 없습니다." />
        ) : null}

        {activeTab === 'families' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">가구별 리포트 조회</h2>

            <div className="mt-5 space-y-3">
              {familyRows.length ? (
                familyRows.map((item) => (
                  <article key={item.familyCode} className="flex items-center justify-between rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div>
                      <div className="text-lg font-black">{item.familyCode}</div>
                      <p className="mt-1 text-sm font-bold text-[#637B76]">리포트 이벤트 {item.count}건</p>
                    </div>

                    <Link href={`/guardian/today?familyCode=${encodeURIComponent(item.familyCode)}`} className="rounded-xl bg-white px-4 py-3 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                      리포트 열기
                    </Link>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  가구별 조회 기록이 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function EventList({ title, events, empty }: { title: string; events: EventRow[]; empty: string }) {
  return (
    <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
      <h2 className="text-3xl font-black tracking-[-0.06em]">{title}</h2>

      <div className="mt-5 space-y-3">
        {events.length ? (
          events.map((event) => (
            <article key={event.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
              <div className="flex flex-wrap gap-2">
                <Pill tone={event.eventType}>{eventLabel(event.eventType)}</Pill>
                <Pill>{event.familyCode || '가족코드 없음'}</Pill>
                <Pill>{event.createdKst || '-'}</Pill>
              </div>

              <h3 className="mt-3 text-lg font-black">
                {event.parentName || '부모님'} · {event.guardianName || '보호자'}
              </h3>

              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                {event.message || '-'}
                <br />
                source: {event.source || '-'} · path: {event.path || '-'} · status: {event.status || '-'}
              </p>
            </article>
          ))
        ) : (
          <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
            {empty}
          </div>
        )}
      </div>
    </section>
  )
}

export default ReportTrackingPanel
