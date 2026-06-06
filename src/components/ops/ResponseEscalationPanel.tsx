'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type EscalationItem = {
  request: {
    id?: string
    family_code?: string
    parent_name?: string
    signal_label?: string
    request_type?: string
    risk_level?: string
    status?: string
    service_area?: string
    created_at?: string
  }
  kind: string
  level: 'warning' | 'urgent'
  ageMinutes: number
  message: string
  suggestedAction: string
  acceptedProvider?: {
    provider_name?: string
    provider_type?: string
    phone?: string
  }
}

type Metrics = {
  totalOpen: number
  escalationNeeded: number
  urgent: number
  warning: number
  logs: number
}

function typeLabel(kind: string) {
  if (kind === 'family_no_action') return '가족 미확인'
  if (kind === 'provider_no_accept') return '도움망 미수락'
  if (kind === 'accepted_not_completed') return '수락 후 미완료'
  return kind
}

function requestTypeLabel(type?: string) {
  if (type === 'meal_delivery') return '식사 연결'
  if (type === 'medication_reminder') return '복약 확인'
  if (type === 'urgent_neighbor_help') return '긴급 도움'
  if (type === 'care_partner_check') return '돌봄 확인'
  if (type === 'pharmacy_call') return '약국 상담'
  return '안부 확인'
}

function levelClass(level: string) {
  if (level === 'urgent') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
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

export function ResponseEscalationPanel() {
  const [items, setItems] = useState<EscalationItem[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ totalOpen: 0, escalationNeeded: 0, urgent: 0, warning: 0, logs: 0 })
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const urgentItems = useMemo(() => items.filter((item) => item.level === 'urgent'), [items])
  const warningItems = useMemo(() => items.filter((item) => item.level !== 'urgent'), [items])

  async function load() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/response-escalation', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '에스컬레이션 점검 목록을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        setItems([])
        return
      }

      setItems(Array.isArray(data.escalationItems) ? data.escalationItems : [])
      setMetrics(data.metrics || { totalOpen: 0, escalationNeeded: 0, urgent: 0, warning: 0, logs: 0 })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '에스컬레이션 점검 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function run() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/response-escalation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'runEscalation' })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '에스컬레이션 실행에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data.results || data, null, 2))
        return
      }

      setMessage(data.message || '에스컬레이션을 실행했습니다.')
      setDebug(JSON.stringify(data.results || [], null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '에스컬레이션 실행 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            자동 에스컬레이션
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            아무도 수락하지 않으면
            <br />
            운영실이 놓치지 않게 합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            긴급 요청이 일정 시간 동안 처리되지 않으면 보호자와 운영실에 재알림을 만들고, 상태를 수동 연결 필요로 전환합니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <GuideCard number="1" title="5분 이상 긴급 미처리" desc="도움 요청·몸 상태·복약 위험이 방치되면 운영실 경고로 전환합니다." />
            <GuideCard number="2" title="도움망 미수락" desc="문자를 받은 제공자가 수락하지 않으면 다른 도움망 또는 운영실 전화 확인으로 넘깁니다." />
            <GuideCard number="3" title="수락 후 미완료" desc="요청을 맡았지만 완료가 늦어지면 제공자와 운영실에 재확인 알림을 만듭니다." />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={run}
              disabled={loading}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              {loading ? '실행 중' : '에스컬레이션 실행'}
            </button>

            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              새로고침
            </button>

            <Link href="/ops/notification-dispatch" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              알림 발송센터
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]" open>
              <summary className="cursor-pointer text-sm font-black">실행 결과 보기</summary>
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <MetricCard title="열린 요청" value={`${metrics.totalOpen}개`} desc="아직 완료되지 않은 요청" />
          <MetricCard title="에스컬레이션 필요" value={`${metrics.escalationNeeded}개`} desc="자동 조치가 필요한 요청" danger={metrics.escalationNeeded > 0} />
          <MetricCard title="긴급" value={`${metrics.urgent}개`} desc="즉시 확인 우선순위" danger={metrics.urgent > 0} />
          <MetricCard title="주의" value={`${metrics.warning}개`} desc="당일 확인 필요" />
          <MetricCard title="누적 기록" value={`${metrics.logs}개`} desc="이미 생성된 에스컬레이션 기록" />
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">긴급 에스컬레이션</h2>

          <div className="mt-5 space-y-3">
            {urgentItems.length === 0 ? (
              <div className="rounded-2xl bg-[#EFFFFA] p-5 text-sm font-black text-[#2AA897] ring-1 ring-[#CDEFE7]">
                현재 긴급 에스컬레이션이 없습니다.
              </div>
            ) : (
              urgentItems.map((item) => <EscalationCard key={`${item.kind}-${item.request.id}`} item={item} />)
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">주의 에스컬레이션</h2>

          <div className="mt-5 space-y-3">
            {warningItems.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                현재 주의 에스컬레이션이 없습니다.
              </div>
            ) : (
              warningItems.map((item) => <EscalationCard key={`${item.kind}-${item.request.id}`} item={item} />)
            )}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-4">
          <Link href="/response?scope=ops" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
            후속조치 관제
          </Link>
          <Link href="/provider/requests" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            지역 도움망 요청함
          </Link>
          <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            알림 발송센터
          </Link>
          <button
            onClick={load}
            className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
          >
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

function GuideCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <article className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#247A71] text-xs font-black text-white">
        {number}
      </div>
      <h3 className="mt-3 text-base font-black tracking-[-0.04em]">{title}</h3>
      <p className="mt-1 text-xs font-bold leading-6 text-[#637B76]">{desc}</p>
    </article>
  )
}

function EscalationCard({ item }: { item: EscalationItem }) {
  return (
    <article className={'rounded-[2rem] p-5 ring-1 ' + levelClass(item.level)}>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
          {item.level === 'urgent' ? '긴급' : '주의'}
        </span>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
          {typeLabel(item.kind)}
        </span>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
          {item.ageMinutes}분 지연
        </span>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
          {requestTypeLabel(item.request.request_type)}
        </span>
      </div>

      <h3 className="mt-4 text-2xl font-black tracking-[-0.05em]">
        {item.request.signal_label || requestTypeLabel(item.request.request_type)}
      </h3>

      <p className="mt-3 text-sm font-bold leading-7">
        {item.request.parent_name || '부모님'} · {item.request.service_area || '권역 미지정'} · 상태 {item.request.status || '-'}
      </p>

      <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm font-black leading-7 ring-1 ring-current">
        {item.message}
      </div>

      <div className="mt-3 rounded-2xl bg-white/70 p-4 text-sm font-black leading-7 ring-1 ring-current">
        권장 조치: {item.suggestedAction}
      </div>

      {item.acceptedProvider ? (
        <p className="mt-3 text-xs font-black opacity-70">
          수락한 도움망: {item.acceptedProvider.provider_name || '지역 도움망'}
        </p>
      ) : null}
    </article>
  )
}

export default ResponseEscalationPanel
