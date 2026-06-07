'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type HealthLevel = 'ok' | 'warning' | 'critical'

type HealthItem = {
  key: string
  title: string
  level: HealthLevel
  message: string
  detail?: string
}

type EventItem = {
  id: string
  kind: string
  title: string
  message: string
  createdAt: string
}

type Row = Record<string, unknown>

type ControlData = {
  ok: boolean
  status: HealthLevel | 'unknown'
  generatedAt: string
  metrics: Record<string, number | null>
  health: HealthItem[]
  warnings: string[]
  config: Record<string, unknown>
  urgentRequests: Row[]
  manualNeeded: Row[]
  failedOutbox: Row[]
  queuedOutbox: Row[]
  eligibleProviders: Row[]
  recentEvents: EventItem[]
  recentSnapshots: Row[]
}

function levelClass(level: HealthLevel | 'unknown') {
  if (level === 'ok') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (level === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (level === 'critical') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-[#FAFFFD] text-[#637B76] ring-[#D6EDE7]'
}

function levelText(level: HealthLevel | 'unknown') {
  if (level === 'ok') return '정상'
  if (level === 'warning') return '주의'
  if (level === 'critical') return '긴급'
  return '확인'
}

function MetricCard({ title, value, desc, danger }: { title: string; value: string; desc: string; danger?: boolean }) {
  return (
    <article className={'rounded-[2rem] p-5 shadow-sm ring-1 ' + (danger ? 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]' : 'bg-white text-[#17443F] ring-[#D6EDE7]')}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

function boolText(value: unknown) {
  return value ? '설정됨' : '미설정'
}

function formatMetric(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return Number(value).toLocaleString('ko-KR')
}

export function OpsControlCenterPanel() {
  const [data, setData] = useState<ControlData | null>(null)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const metrics = data?.metrics || {}

  const statusSummary = useMemo(() => {
    if (!data) return { ok: 0, warning: 0, critical: 0 }

    return {
      ok: data.health.filter((item) => item.level === 'ok').length,
      warning: data.health.filter((item) => item.level === 'warning').length,
      critical: data.health.filter((item) => item.level === 'critical').length
    }
  }, [data])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/ops-control-center', { cache: 'no-store' })
      const next = await response.json().catch(() => ({}))

      if (!response.ok || !next.ok) {
        setMessage(next.message || '운영실 상태를 불러오지 못했습니다.')
        setDebug(JSON.stringify(next.detail || next, null, 2))
        return
      }

      setData(next)
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '운영실 상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/ops-control-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.ok) {
        setMessage(result.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result.attempts || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '처리되었습니다.')
      setDebug(JSON.stringify(result, null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
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
            운영실 자동운영 상태판
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                지금 운영실이
                <br />
                정상으로 돌아가는지 확인합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                Heartbeat, 오토파일럿, 긴급 사건, 문자 대기열, 요양보호사 가용 상태, 개인정보 동의 상태를 한 화면에서 확인합니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + levelClass(data?.status || 'unknown')}>
              <div className="text-sm font-black opacity-70">전체 상태</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{levelText(data?.status || 'unknown')}</div>
              <div className="mt-2 text-xs font-bold">
                정상 {statusSummary.ok} · 주의 {statusSummary.warning} · 긴급 {statusSummary.critical}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            이 화면은 자동 판단이 아니라 운영자가 빠르게 확인하기 위한 상태판입니다. 응급상황은 119 또는 의료기관 연락을 안내해야 합니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              새로고침
            </button>

            <button onClick={() => post('runHeartbeat')} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              Heartbeat 수동 실행
            </button>

            <button onClick={() => post('runAutopilot')} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              오토파일럿 수동 실행
            </button>

            <button onClick={() => post('dispatchQueued')} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              문자 대기열 발송
            </button>

            <button onClick={() => post('saveSnapshot')} disabled={loading || !data} className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              상태 스냅샷 저장
            </button>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white" open>
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="긴급 사건" value={`${formatMetric(metrics.urgentOpen)}건`} desc="열린 긴급" danger={Number(metrics.urgentOpen || 0) > 0} />
          <MetricCard title="10분 초과" value={`${formatMetric(metrics.staleUrgent)}건`} desc="미수락 긴급" danger={Number(metrics.staleUrgent || 0) > 0} />
          <MetricCard title="수동 연결" value={`${formatMetric(metrics.manualNeeded)}건`} desc="운영실 확인" danger={Number(metrics.manualNeeded || 0) > 0} />
          <MetricCard title="문자 대기" value={`${formatMetric(metrics.queuedOutbox)}건`} desc="발송 대기" danger={Number(metrics.queuedOutbox || 0) > 0} />
          <MetricCard title="문자 실패" value={`${formatMetric(metrics.failedOutbox)}건`} desc="재시도 필요" danger={Number(metrics.failedOutbox || 0) > 0} />
          <MetricCard title="가용 도움망" value={`${formatMetric(metrics.eligibleProviders)}명`} desc="즉시 배치" danger={Number(metrics.eligibleProviders || 0) === 0} />
          <MetricCard title="동의 대기" value={`${formatMetric(metrics.consentPending)}명`} desc="개인정보" danger={Number(metrics.consentPending || 0) > 0} />
          <MetricCard title="오늘 완료" value={`${formatMetric(metrics.completedToday)}건`} desc="완료 사건" />
        </section>

        {data ? (
          <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">상태 체크</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {data.health.map((item) => (
                  <article key={item.key} className={'rounded-2xl p-4 ring-1 ' + levelClass(item.level)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                        {levelText(item.level)}
                      </span>
                      <h3 className="text-lg font-black tracking-[-0.04em]">{item.title}</h3>
                    </div>
                    <p className="mt-3 text-sm font-bold leading-7 opacity-80">{item.message}</p>
                    {item.detail ? (
                      <p className="mt-2 text-xs font-bold leading-6 opacity-70">{item.detail}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">환경 설정</h2>

              <div className="mt-5 space-y-3">
                {[
                  ['Supabase URL', boolText(data.config.hasSupabaseUrl)],
                  ['Service Role Key', boolText(data.config.hasServiceRoleKey)],
                  ['CRON_SECRET', boolText(data.config.hasCronSecret)],
                  ['OPS_AUTOPILOT_SECRET', boolText(data.config.hasOpsAutopilotSecret)],
                  ['RESPONSE_ESCALATION_SECRET', boolText(data.config.hasResponseEscalationSecret)],
                  ['SOLAPI API Key', boolText(data.config.hasSolapiApiKey)],
                  ['SOLAPI Sender', boolText(data.config.hasSolapiSender)],
                  ['Heartbeat 자동발송', data.config.opsHeartbeatAutoSend ? 'ON' : 'OFF'],
                  ['문의 알림 자동발송', data.config.opsLeadAlertAutoSend ? 'ON' : 'OFF'],
                  ['문의 알림 번호', String(data.config.opsLeadAlertPhoneMasked || '미설정')]
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-[#FAFFFD] px-4 py-3 text-sm font-black ring-1 ring-[#D6EDE7]">
                    <span className="text-[#637B76]">{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {data ? (
          <section className="grid gap-5 xl:grid-cols-3">
            <StatusList title="긴급 사건" rows={data.urgentRequests} empty="열린 긴급 사건이 없습니다." fields={['signal_label', 'parent_name', 'service_area', 'created_at']} />
            <StatusList title="수동 연결 필요" rows={data.manualNeeded} empty="수동 연결 필요 사건이 없습니다." fields={['signal_label', 'parent_name', 'service_area', 'created_at']} />
            <StatusList title="문자 실패" rows={data.failedOutbox} empty="실패 문자가 없습니다." fields={['title', 'to_name', 'to_phone', 'created_at']} />
          </section>
        ) : null}

        {data ? (
          <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">최근 운영 로그</h2>

              <div className="mt-5 space-y-3">
                {data.recentEvents.length === 0 ? (
                  <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                    최근 로그가 없습니다.
                  </div>
                ) : (
                  data.recentEvents.slice(0, 20).map((event) => (
                    <article key={`${event.kind}-${event.id}-${event.createdAt}`} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                      <div className="text-xs font-black text-[#2AA897]">{event.kind}</div>
                      <h3 className="mt-2 text-lg font-black tracking-[-0.04em]">{event.title || '기록'}</h3>
                      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{event.message || '-'}</p>
                      <p className="mt-1 text-xs font-bold text-[#637B76]">{event.createdAt || ''}</p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">바로가기</h2>

              <div className="mt-5 grid gap-3">
                <Link href="/ops/urgent-dispatch" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
                  요양보호사 즉시 배치센터
                </Link>
                <Link href="/ops/incidents" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  사건 타임라인
                </Link>
                <Link href="/ops/autopilot" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  오토파일럿
                </Link>
                <Link href="/ops/heartbeat" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  Heartbeat
                </Link>
                <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  알림 발송센터
                </Link>
                <Link href="/gov/reports" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  운영보고서
                </Link>
              </div>
            </section>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function StatusList({
  title,
  rows,
  empty,
  fields
}: {
  title: string
  rows: Row[]
  empty: string
  fields: string[]
}) {
  return (
    <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
      <h2 className="text-2xl font-black tracking-[-0.05em]">{title}</h2>

      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
            {empty}
          </div>
        ) : (
          rows.slice(0, 8).map((row, index) => (
            <article key={String(row.id || index)} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
              <div className="text-xs font-black text-[#2AA897]">{String(row.status || row.reason || '확인')}</div>
              <h3 className="mt-2 text-lg font-black tracking-[-0.04em]">
                {String(row[fields[0]] || row.title || row.signal_label || '항목')}
              </h3>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                {fields.slice(1).map((field) => String(row[field] || '-')).join(' · ')}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export default OpsControlCenterPanel
