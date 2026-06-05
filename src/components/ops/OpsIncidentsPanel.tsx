'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type TimelineEvent = {
  id: string
  kind: string
  title: string
  message: string
  actor: string
  status: string
  createdAt: string
}

type Incident = {
  id: string
  parentName: string
  familyCode?: string
  guardianName?: string
  guardianPhone?: string
  parentPhone?: string
  serviceArea?: string
  addressHint?: string
  riskGroup?: string
  riskLevel?: string
  severity: string
  requestType: string
  requestTypeLabel: string
  signalLabel: string
  status: string
  statusLabel: string
  ageMinutes: number
  timeline: TimelineEvent[]
  timelineCount: number
  smsCount: number
  contactCount: number
  providerCount: number
  priorityScore: number
  lastEvent?: TimelineEvent
}

type Metrics = {
  total: number
  open: number
  urgent: number
  manualNeeded: number
  completed: number
  sms: number
  contacts: number
  providers: number
  timelineEvents: number
}

function severityClass(severity: string) {
  if (severity === 'Red') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (severity === 'Orange') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
}

function kindLabel(kind: string) {
  if (kind === 'signal') return '신호'
  if (kind === 'sms') return '문자'
  if (kind === 'provider') return '도움망'
  if (kind === 'provider_accept') return '수락'
  if (kind === 'provider_complete') return '도움망 완료'
  if (kind === 'contact') return '통화'
  if (kind === 'assignment') return '배정'
  if (kind === 'autopilot') return '자동운영'
  if (kind === 'update') return '업데이트'
  if (kind === 'complete') return '완료'
  return kind || '기록'
}

function MetricCard({ title, value, desc, danger }: { title: string; value: string; desc: string; danger?: boolean }) {
  return (
    <article className={'rounded-[2rem] p-5 shadow-sm ring-1 ' + (danger ? 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]' : 'bg-white text-[#173B36] ring-[#D8EEE8]')}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

export function OpsIncidentsPanel({
  title = '운영실 사건 타임라인',
  subtitle = '부모님 신호, 문자, 도움망 배정, 수락, 통화, 오토파일럿, 완료 기록을 사건 하나로 통합해서 봅니다.'
}: {
  title?: string
  subtitle?: string
}) {
  const [filter, setFilter] = useState<'open' | 'urgent' | 'manual' | 'completed' | 'all'>('open')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, open: 0, urgent: 0, manualNeeded: 0, completed: 0, sms: 0, contacts: 0, providers: 0, timelineEvents: 0 })
  const [selectedId, setSelectedId] = useState('')
  const [note, setNote] = useState('')
  const [operatorName, setOperatorName] = useState('')
  const [contactType, setContactType] = useState('guardian')
  const [contactStatus, setContactStatus] = useState('connected')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const selected = useMemo(
    () => incidents.find((incident) => incident.id === selectedId) || incidents[0] || null,
    [incidents, selectedId]
  )

  async function load(nextFilter = filter) {
    setLoading(true)

    try {
      const response = await fetch('/api/ops-incidents?status=' + encodeURIComponent(nextFilter), { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '사건 타임라인을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        setIncidents([])
        return
      }

      const list = Array.isArray(data.incidents) ? data.incidents : []
      setIncidents(list)
      setMetrics(data.metrics || { total: 0, open: 0, urgent: 0, manualNeeded: 0, completed: 0, sms: 0, contacts: 0, providers: 0, timelineEvents: 0 })

      if (list.length > 0 && !list.some((item: Incident) => item.id === selectedId)) {
        setSelectedId(list[0].id)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '사건 타임라인을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    if (!selected) return

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/ops-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, requestId: selected.id, note, ...payload })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data.result || data, null, 2))
        await load()
        return
      }

      setMessage(data.message || '처리되었습니다.')
      setDebug(data.result ? JSON.stringify(data.result, null, 2) : '')
      setNote('')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function changeFilter(next: typeof filter) {
    setFilter(next)
    setSelectedId('')
    load(next)
  }

  function downloadTimelineCsv() {
    if (!selected) return

    const rows = [
      ['createdAt', 'kind', 'title', 'actor', 'status', 'message'],
      ...selected.timeline.map((event) => [
        event.createdAt,
        kindLabel(event.kind),
        event.title,
        event.actor,
        event.status,
        event.message
      ])
    ]

    const csv = rows
      .map((row) => row.map((value) => '"' + String(value || '').replace(/"/g, '""') + '"').join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anbu-incident-${selected.familyCode || selected.id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            사건 타임라인
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            {subtitle}
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
            응급상황을 앱이 직접 판단하지 않습니다. 운영실은 확인·연결·기록을 수행하고, 응급 가능성이 있으면 119 또는 의료기관 연락을 안내합니다.
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {[
              ['open', '열린 사건'],
              ['urgent', '긴급'],
              ['manual', '수동 연결'],
              ['completed', '완료'],
              ['all', '전체']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => changeFilter(key as typeof filter)}
                className={
                  'rounded-2xl px-5 py-3 text-sm font-black ring-1 ' +
                  (filter === key
                    ? 'bg-[#193B38] text-white ring-[#193B38]'
                    : 'bg-white text-[#173B36] ring-[#D8EEE8]')
                }
              >
                {label}
              </button>
            ))}

            <button
              onClick={() => load()}
              disabled={loading}
              className="rounded-2xl bg-[#F8FCFB] px-5 py-3 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-50"
            >
              새로고침
            </button>

            <button
              onClick={downloadTimelineCsv}
              disabled={!selected}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-50"
            >
              사건 CSV
            </button>

            <button
              onClick={() => window.print()}
              disabled={!selected}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-50"
            >
              인쇄/PDF
            </button>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]" open>
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="전체 사건" value={`${metrics.total}건`} desc="최근 사건" />
          <MetricCard title="열린 사건" value={`${metrics.open}건`} desc="처리 중" danger={metrics.open > 0} />
          <MetricCard title="긴급" value={`${metrics.urgent}건`} desc="즉시 확인" danger={metrics.urgent > 0} />
          <MetricCard title="수동 연결" value={`${metrics.manualNeeded}건`} desc="운영실 전화 필요" danger={metrics.manualNeeded > 0} />
          <MetricCard title="완료" value={`${metrics.completed}건`} desc="완료 처리" />
          <MetricCard title="문자" value={`${metrics.sms}건`} desc="발송 이력" />
          <MetricCard title="통화" value={`${metrics.contacts}건`} desc="연락 기록" />
          <MetricCard title="타임라인" value={`${metrics.timelineEvents}개`} desc="통합 기록" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">사건 목록</h2>

            <div className="mt-5 space-y-3">
              {incidents.length === 0 ? (
                <div className="rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                  표시할 사건이 없습니다.
                </div>
              ) : (
                incidents.map((incident) => (
                  <button
                    key={incident.id}
                    type="button"
                    onClick={() => setSelectedId(incident.id)}
                    className={
                      'w-full rounded-2xl p-4 text-left ring-1 ' +
                      (selected?.id === incident.id
                        ? 'bg-[#193B38] text-white ring-[#193B38]'
                        : 'bg-[#F8FCFB] text-[#173B36] ring-[#D8EEE8]')
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + (selected?.id === incident.id ? 'bg-white/10 text-white ring-white/20' : severityClass(incident.severity))}>
                        {incident.severity === 'Red' ? '긴급' : incident.severity === 'Orange' ? '확인 필요' : '주의'}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-current">
                        {incident.statusLabel}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-current">
                        {incident.ageMinutes}분
                      </span>
                    </div>

                    <div className="mt-3 text-lg font-black tracking-[-0.05em]">{incident.signalLabel}</div>
                    <div className={'mt-2 text-sm font-bold leading-6 ' + (selected?.id === incident.id ? 'text-white/70' : 'text-[#637B76]')}>
                      {incident.parentName} · {incident.serviceArea} · 타임라인 {incident.timelineCount}개
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            {selected ? (
              <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + severityClass(selected.severity)}>
                        {selected.severity === 'Red' ? '긴급' : selected.severity === 'Orange' ? '확인 필요' : '주의'}
                      </span>
                      <span className="rounded-full bg-[#F8FCFB] px-3 py-1 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                        {selected.statusLabel}
                      </span>
                      <span className="rounded-full bg-[#F8FCFB] px-3 py-1 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                        {selected.requestTypeLabel}
                      </span>
                    </div>

                    <h2 className="mt-4 text-3xl font-black tracking-[-0.06em]">{selected.signalLabel}</h2>

                    <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                      {selected.parentName} · 가족코드 {selected.familyCode || '-'} · {selected.serviceArea || '-'}
                      <br />
                      보호자 {selected.guardianName || '-'} · {selected.guardianPhone || '-'}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:min-w-64 lg:grid-cols-1">
                    {selected.guardianPhone ? (
                      <a href={`tel:${selected.guardianPhone}`} className="rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                        보호자 전화
                      </a>
                    ) : null}

                    {selected.parentPhone ? (
                      <a href={`tel:${selected.parentPhone}`} className="rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                        부모님 전화
                      </a>
                    ) : null}
                  </div>
                </div>

                <section className="mt-5 rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                  <h3 className="text-xl font-black tracking-[-0.05em]">운영실 조치</h3>

                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="처리 메모 예: 보호자 통화 완료, 방문 확인 예정, 119 안내 완료"
                    className="mt-3 min-h-24 w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none"
                  />

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <input
                      value={operatorName}
                      onChange={(event) => setOperatorName(event.target.value)}
                      placeholder="담당자명"
                      className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none"
                    />

                    <select
                      value={contactType}
                      onChange={(event) => setContactType(event.target.value)}
                      className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="guardian">보호자 통화</option>
                      <option value="parent">부모님 통화</option>
                    </select>

                    <select
                      value={contactStatus}
                      onChange={(event) => setContactStatus(event.target.value)}
                      className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="connected">통화 연결</option>
                      <option value="no_answer">부재중</option>
                      <option value="callback_needed">재통화 필요</option>
                      <option value="emergency_advised">119/의료기관 안내</option>
                    </select>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-4">
                    <button onClick={() => post('notifyGuardian')} disabled={loading} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-50">
                      보호자 알림
                    </button>
                    <button onClick={() => post('dispatchProviders')} disabled={loading} className="rounded-xl bg-[#193B38] px-4 py-3 text-sm font-black text-white disabled:opacity-50">
                      도움망 요청
                    </button>
                    <button onClick={() => post('assignOperator', { assignedToName: operatorName || '운영실' })} disabled={loading} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-50">
                      담당자 배정
                    </button>
                    <button onClick={() => post('recordContact', { contactType, resultStatus: contactStatus })} disabled={loading} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-50">
                      통화 기록
                    </button>
                    <button onClick={() => post('addNote')} disabled={loading || !note.trim()} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-50">
                      메모 저장
                    </button>
                    <button onClick={() => post('markInProgress')} disabled={loading} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-50">
                      확인 중
                    </button>
                    <button onClick={() => post('markCompleted')} disabled={loading} className="rounded-xl bg-[#123F38] px-4 py-3 text-sm font-black text-white disabled:opacity-50">
                      완료
                    </button>
                    <button onClick={() => post('cancelRequest')} disabled={loading} className="rounded-xl bg-[#FFF1F1] px-4 py-3 text-sm font-black text-[#8A2525] ring-1 ring-[#F3BBBB] disabled:opacity-50">
                      취소
                    </button>
                  </div>
                </section>

                <section className="mt-5">
                  <h3 className="text-2xl font-black tracking-[-0.05em]">통합 타임라인</h3>

                  <div className="mt-5 space-y-3">
                    {selected.timeline.length === 0 ? (
                      <div className="rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                        타임라인 기록이 없습니다.
                      </div>
                    ) : (
                      selected.timeline.map((event) => (
                        <article key={event.id} className="grid gap-3 rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8] sm:grid-cols-[8rem_1fr]">
                          <div>
                            <div className="rounded-full bg-white px-3 py-1 text-center text-xs font-black text-[#11977F] ring-1 ring-[#D8EEE8]">
                              {kindLabel(event.kind)}
                            </div>
                            <div className="mt-2 text-xs font-bold leading-5 text-[#637B76]">{event.createdAt}</div>
                          </div>

                          <div>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                                {event.status || '-'}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                                {event.actor || '-'}
                              </span>
                            </div>

                            <h4 className="mt-3 text-lg font-black tracking-[-0.04em]">{event.title}</h4>
                            <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-[#637B76]">{event.message}</p>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              </>
            ) : (
              <div className="rounded-2xl bg-[#F8FCFB] p-8 text-center text-sm font-black text-[#637B76] ring-1 ring-[#D8EEE8]">
                사건을 선택해주세요.
              </div>
            )}
          </section>
        </section>

        <div className="grid gap-3 sm:grid-cols-5">
          <Link href="/ops/autopilot" className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white">
            오토파일럿
          </Link>
          <Link href="/ops/heartbeat" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            Heartbeat
          </Link>
          <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            알림 발송센터
          </Link>
          <Link href="/gov/reports" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            운영보고서
          </Link>
          <button onClick={() => load()} className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

export default OpsIncidentsPanel
