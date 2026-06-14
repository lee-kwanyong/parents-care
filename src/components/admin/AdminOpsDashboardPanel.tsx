'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Tone = 'safe' | 'watch' | 'danger' | 'neutral'

type Metric = {
  key: string
  label: string
  value: number | string
  caption: string
  tone: Tone
  href?: string
}

type FocusItem = {
  tone: Tone
  title: string
  desc: string
  href: string
  cta: string
}

type RecentMessage = {
  id: string
  title: string
  status: string
  provider: string
  reason: string
  toName: string
  toPhone: string
}

type RecentCareSignal = {
  id: string
  familyCode: string
  parentName: string
  guardianName: string
  signalType: string
  signalLabel: string
  riskLevel: string
  status: string
}

type RecentRingReport = {
  id: string
  familyCode: string
  parentName: string
  guardianName: string
  overallStatus: string
  anbuScore: number
  dataQualityScore: number
}

type DashboardData = {
  ok: boolean
  message?: string
  generatedKst?: string
  metrics?: Metric[]
  focusItems?: FocusItem[]
  recent?: {
    messages?: RecentMessage[]
    careSignals?: RecentCareSignal[]
    ringReports?: RecentRingReport[]
  }
  sourceErrors?: string[]
}

function toneClass(tone: Tone) {
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'watch') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function statusLabel(status: string) {
  if (status === 'sent') return '발송완료'
  if (status === 'failed') return '실패'
  if (status === 'queued') return '대기'
  if (status === 'cancelled') return '취소'
  if (status === 'normal') return '정상'
  if (status === 'watch') return '주의'
  if (status === 'check_needed') return '확인필요'
  if (status === 'manual_needed') return '수동확인'
  if (status === 'completed') return '완료'
  return status || '확인'
}

function statusTone(status: string): Tone {
  if (['failed', 'check_needed', 'manual_needed', 'high'].includes(status)) return 'danger'
  if (['queued', 'watch', 'medium'].includes(status)) return 'watch'
  if (['sent', 'normal', 'completed', 'low'].includes(status)) return 'safe'
  return 'neutral'
}

function MetricCard({ metric }: { metric: Metric }) {
  const body = (
    <article className={`rounded-[2rem] p-5 ring-1 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(49,151,136,0.08)] ${toneClass(metric.tone)}`}>
      <div className="text-sm font-black opacity-70">{metric.label}</div>
      <div className="mt-3 text-4xl font-black tracking-[-0.08em]">{metric.value}</div>
      <p className="mt-3 min-h-[3rem] text-sm font-bold leading-6 opacity-75">{metric.caption}</p>
    </article>
  )

  if (!metric.href) return body

  return (
    <Link href={metric.href}>
      {body}
    </Link>
  )
}

function FocusCard({ item }: { item: FocusItem }) {
  return (
    <Link href={item.href} className={`block rounded-[2rem] p-5 ring-1 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(49,151,136,0.08)] ${toneClass(item.tone)}`}>
      <div className="text-xs font-black opacity-70">오늘 먼저</div>
      <h3 className="mt-2 text-xl font-black tracking-[-0.05em]">{item.title}</h3>
      <p className="mt-2 text-sm font-bold leading-7 opacity-75">{item.desc}</p>
      <div className="mt-4 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current/10">
        {item.cta}
      </div>
    </Link>
  )
}

function RecentTable({ data }: { data: DashboardData }) {
  const messages = data.recent?.messages || []
  const careSignals = data.recent?.careSignals || []
  const ringReports = data.recent?.ringReports || []

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <article className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7]">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black tracking-[-0.05em]">최근 문자/알림</h3>
          <Link href="/admin/ops/notification-dispatch" className="rounded-full bg-[#FAFFFD] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
            발송센터
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {messages.length ? (
            messages.map((item) => (
              <div key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${toneClass(statusTone(item.status))}`}>
                    {statusLabel(item.status)}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                    {item.provider}
                  </span>
                </div>
                <div className="mt-3 text-sm font-black">{item.title}</div>
                <div className="mt-1 text-xs font-bold leading-6 text-[#637B76]">
                  {item.toName || '수신자'} · {item.toPhone || '번호 없음'} · {item.reason || '사유 없음'}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
              최근 문자/알림 기록이 없습니다.
            </div>
          )}
        </div>
      </article>

      <article className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7]">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black tracking-[-0.05em]">최근 안부 신호</h3>
          <Link href="/admin/ops/today-runbook" className="rounded-full bg-[#FAFFFD] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
            운영센터
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {careSignals.length ? (
            careSignals.map((item) => (
              <div key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${toneClass(statusTone(item.riskLevel || item.status))}`}>
                    {statusLabel(item.riskLevel || item.status)}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                    {item.familyCode || '가족코드 없음'}
                  </span>
                </div>
                <div className="mt-3 text-sm font-black">{item.signalLabel || item.signalType || '안부 신호'}</div>
                <div className="mt-1 text-xs font-bold leading-6 text-[#637B76]">
                  부모님 {item.parentName || '-'} · 보호자 {item.guardianName || '-'}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
              최근 안부 신호 기록이 없습니다.
            </div>
          )}
        </div>
      </article>

      <article className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7]">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black tracking-[-0.05em]">최근 스마트링 리포트</h3>
          <Link href="/admin/ops/ring-csv-import" className="rounded-full bg-[#FAFFFD] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
            CSV 업로드
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {ringReports.length ? (
            ringReports.map((item) => (
              <div key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${toneClass(statusTone(item.overallStatus))}`}>
                    {statusLabel(item.overallStatus)}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                    {item.anbuScore}점
                  </span>
                </div>
                <div className="mt-3 text-sm font-black">부모님 {item.parentName || '-'}</div>
                <div className="mt-1 text-xs font-bold leading-6 text-[#637B76]">
                  가족코드 {item.familyCode || '-'} · 데이터 품질 {item.dataQualityScore}점
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
              최근 스마트링 리포트가 없습니다.
            </div>
          )}
        </div>
      </article>
    </section>
  )
}

export function AdminOpsDashboardPanel() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin-ops-dashboard', {
        cache: 'no-store',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '운영실 대시보드를 불러오지 못했습니다.')
        setData(result)
        return
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '운영실 대시보드를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const metrics = useMemo(() => data?.metrics || [], [data])
  const focusItems = useMemo(() => data?.focusItems || [], [data])
  const sourceErrors = data?.sourceErrors || []

  return (
    <section className="space-y-6">
      <section className="overflow-hidden rounded-[2.5rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
        <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="p-6 sm:p-9">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                Admin Live Dashboard
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                {data?.generatedKst ? `${data.generatedKst} 기준` : '실시간 확인'}
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
              오늘 운영상태를
              <br />
              먼저 확인합니다.
            </h1>

            <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
              가입자, 실증 가구, 안부 신호, 문자/알림, 스마트링 리포트 상태를 한 화면에서 확인합니다.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={load}
                disabled={loading}
                className="rounded-2xl bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
              >
                {loading ? '새로고침 중' : '상태 새로고침'}
              </button>

              <Link href="/admin/ops/today-runbook" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                오늘 운영센터
              </Link>

              <Link href="/admin/ops/preflight-test" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                전체 기능 테스트
              </Link>
            </div>
          </div>

          <aside className="bg-[linear-gradient(135deg,#EFFFFA_0%,#F7FFFC_50%,#FFFFFF_100%)] p-6 sm:p-9">
            <div className="rounded-[2rem] bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
              <div className="text-sm font-black text-[#637B76]">오늘 먼저 볼 것</div>
              <div className="mt-4 space-y-3">
                {focusItems.length ? (
                  focusItems.map((item) => <FocusCard key={item.title} item={item} />)
                ) : (
                  <div className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                    {loading ? '운영 데이터를 불러오는 중입니다.' : '우선 확인할 항목이 없습니다.'}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {message ? (
        <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
          {message}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {metrics.length ? (
          metrics.map((item) => <MetricCard key={item.key} metric={item} />)
        ) : (
          Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="rounded-[2rem] bg-white/95 p-5 ring-1 ring-[#D6EDE7]">
              <div className="h-4 w-24 rounded-full bg-[#EFFFFA]" />
              <div className="mt-4 h-9 w-16 rounded-xl bg-[#EFFFFA]" />
              <div className="mt-4 h-4 w-full rounded-full bg-[#F7FFFC]" />
              <div className="mt-2 h-4 w-2/3 rounded-full bg-[#F7FFFC]" />
            </article>
          ))
        )}
      </section>

      {data?.ok ? <RecentTable data={data} /> : null}

      {sourceErrors.length ? (
        <details className="rounded-[2rem] bg-white/95 p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
          <summary className="cursor-pointer text-base font-black text-[#795C22]">
            데이터 연결 확인 필요 {sourceErrors.length}건
          </summary>
          <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#FFF9EE] p-4 text-xs leading-6 text-[#795C22]">
            {sourceErrors.join('\n\n')}
          </pre>
        </details>
      ) : null}
    </section>
  )
}

export default AdminOpsDashboardPanel
