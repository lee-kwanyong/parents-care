'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Incident = {
  id: string
  status: string
  riskLevel: string
  signalLabel: string
  requestType: string
  requestTypeLabel: string
  parentName: string
  familyCode: string
  serviceArea: string
  ageMinutes: number
  priorityScore: number
  severityLabel: string
  nextActionCode: string
  nextActionLabel: string
  nextActionDetail: string
  slaLabel: string
  request: {
    id: string
    guardian_phone?: string
    parent_phone?: string
    address_hint?: string
    completed_note?: string
  }
  acceptedProvider?: {
    provider_name?: string
    provider_type?: string
    phone?: string
  }
  matches: Array<{
    id: string
    match_status?: string
    provider_id?: string
  }>
}

type Metrics = {
  open: number
  urgent: number
  manualNeeded: number
  waitingProvider: number
  providers: number
  queued: number
  sent: number
  logs: number
}

type AutopilotLog = {
  id: string
  request_id?: string
  action_type?: string
  message?: string
  created_at?: string
}

function severityClass(label: string) {
  if (label === 'Red') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (label === 'Orange') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-[#F8FCFB] text-[#173B36] ring-[#D8EEE8]'
}

function statusLabel(status: string) {
  if (status === 'open') return '새 사건'
  if (status === 'dispatched') return '도움망 전파'
  if (status === 'manual_needed') return '수동 연결 필요'
  if (status === 'accepted') return '수락됨'
  if (status === 'in_progress') return '확인 중'
  if (status === 'completed') return '완료'
  if (status === 'cancelled') return '취소'
  return status || '대기'
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

export function OpsAutopilotPanel() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [logs, setLogs] = useState<AutopilotLog[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ open: 0, urgent: 0, manualNeeded: 0, waitingProvider: 0, providers: 0, queued: 0, sent: 0, logs: 0 })
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoSend, setAutoSend] = useState(false)
  const [noteById, setNoteById] = useState<Record<string, string>>({})

  const urgentIncidents = useMemo(
    () => incidents.filter((incident) => incident.severityLabel === 'Red' || incident.status === 'manual_needed'),
    [incidents]
  )

  const normalIncidents = useMemo(
    () => incidents.filter((incident) => !(incident.severityLabel === 'Red' || incident.status === 'manual_needed')),
    [incidents]
  )

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/ops-autopilot', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '오토파일럿 데이터를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        setIncidents([])
        return
      }

      setIncidents(Array.isArray(data.incidents) ? data.incidents : [])
      setLogs(Array.isArray(data.logs) ? data.logs : [])
      setMetrics(data.metrics || { open: 0, urgent: 0, manualNeeded: 0, waitingProvider: 0, providers: 0, queued: 0, sent: 0, logs: 0 })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '오토파일럿 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/ops-autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data.result || data.results || data, null, 2))
        await load()
        return
      }

      setMessage(data.message || '처리되었습니다.')
      setDebug(data.result || data.results || data.dispatchResult ? JSON.stringify(data.result || data.results || data.dispatchResult, null, 2) : '')
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            운영실 오토파일럿
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            신호가 생기면
            <br />
            다음 행동을 자동으로 만듭니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            부모님 안부 신호를 위험도, 경과 시간, 도움망 수락 여부에 따라 정렬하고 운영실이 바로 실행할 다음 조치를 추천합니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <GuideCard number="1" title="사건 자동 정렬" desc="긴급·수동연결·미수락 요청을 최상단으로 올립니다." />
            <GuideCard number="2" title="다음 할 일 추천" desc="보호자 알림, 도움망 요청, 운영실 확인중, 완료 처리를 추천합니다." />
            <GuideCard number="3" title="자동 실행" desc="오토파일럿 실행 시 보호자 알림과 도움망 요청을 자동으로 대기열에 넣습니다." />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => post('runAutopilot', { autoSend })}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              {autoSend ? '오토파일럿 실행 + 문자 발송' : '오토파일럿 실행'}
            </button>

            <label className="flex items-center gap-2 rounded-2xl bg-[#F8FCFB] px-4 py-3 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
              <input
                type="checkbox"
                checked={autoSend}
                onChange={(event) => setAutoSend(event.target.checked)}
              />
              문자까지 자동 발송
            </label>

            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-50"
            >
              새로고침
            </button>

            <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
              알림 발송센터
            </Link>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
            응급상황을 앱이 직접 판단하지 않습니다. 현장에서 응급 가능성이 있으면 119 또는 의료기관 연락을 안내하고, 운영실은 확인·연결·기록을 수행합니다.
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]" open>
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="열린 사건" value={`${metrics.open}개`} desc="처리 중인 요청" danger={metrics.open > 0} />
          <MetricCard title="긴급" value={`${metrics.urgent}개`} desc="즉시 확인 우선" danger={metrics.urgent > 0} />
          <MetricCard title="수동 연결" value={`${metrics.manualNeeded}개`} desc="운영실 전화 필요" danger={metrics.manualNeeded > 0} />
          <MetricCard title="미수락" value={`${metrics.waitingProvider}개`} desc="도움망 대기" danger={metrics.waitingProvider > 0} />
          <MetricCard title="도움망" value={`${metrics.providers}명`} desc="등록된 제공자" />
          <MetricCard title="발송 대기" value={`${metrics.queued}개`} desc="문자 대기열" danger={metrics.queued > 0} />
          <MetricCard title="발송 완료" value={`${metrics.sent}개`} desc="문자 발송 기록" />
          <MetricCard title="로그" value={`${metrics.logs}개`} desc="자동 조치 기록" />
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">긴급·수동 연결 사건</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
            이 영역의 사건부터 처리하세요. 도움 요청, 수동 연결 필요, 도움망 미수락 사건이 우선입니다.
          </p>

          <div className="mt-5 space-y-3">
            {urgentIncidents.length === 0 ? (
              <div className="rounded-2xl bg-[#EFFFF9] p-5 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
                현재 긴급 사건이 없습니다.
              </div>
            ) : (
              urgentIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  loading={loading}
                  note={noteById[incident.id] || ''}
                  onNote={(value) => setNoteById({ ...noteById, [incident.id]: value })}
                  onAction={post}
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">주의·관찰 사건</h2>

          <div className="mt-5 space-y-3">
            {normalIncidents.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                현재 주의 사건이 없습니다.
              </div>
            ) : (
              normalIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  loading={loading}
                  note={noteById[incident.id] || ''}
                  onNote={(value) => setNoteById({ ...noteById, [incident.id]: value })}
                  onAction={post}
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">최근 오토파일럿 로그</h2>

          <div className="mt-5 space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                아직 오토파일럿 로그가 없습니다.
              </div>
            ) : (
              logs.slice(0, 20).map((log) => (
                <article key={log.id} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                  <div className="text-xs font-black text-[#11977F]">{log.action_type || 'log'}</div>
                  <div className="mt-2 text-sm font-black leading-7">{log.message || '-'}</div>
                  <div className="mt-1 text-xs font-bold text-[#637B76]">{log.created_at || ''}</div>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-4">
          <Link href="/response?scope=ops" className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white">
            후속조치 관제
          </Link>
          <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            알림 발송센터
          </Link>
          <Link href="/provider/requests" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            도움망 요청함
          </Link>
          <button
            onClick={load}
            className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
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
    <article className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#193B38] text-xs font-black text-white">
        {number}
      </div>
      <h3 className="mt-3 text-base font-black tracking-[-0.04em]">{title}</h3>
      <p className="mt-1 text-xs font-bold leading-6 text-[#637B76]">{desc}</p>
    </article>
  )
}

function IncidentCard({
  incident,
  loading,
  note,
  onNote,
  onAction
}: {
  incident: Incident
  loading: boolean
  note: string
  onNote: (value: string) => void
  onAction: (action: string, payload: Record<string, unknown>) => void
}) {
  return (
    <article className={'rounded-[2rem] p-5 ring-1 ' + severityClass(incident.severityLabel)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
              {incident.severityLabel === 'Red' ? '긴급' : incident.severityLabel === 'Orange' ? '확인 필요' : '주의'}
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
              {statusLabel(incident.status)}
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
              {incident.requestTypeLabel}
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
              {incident.ageMinutes}분 경과
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black tracking-[-0.05em]">{incident.signalLabel}</h3>

          <p className="mt-3 text-sm font-bold leading-7">
            {incident.parentName} · {incident.serviceArea} · 가족코드 {incident.familyCode || '-'}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white/70 p-4 text-sm font-black leading-7 ring-1 ring-current">
              다음 할 일: {incident.nextActionLabel}
              <br />
              {incident.nextActionDetail}
            </div>

            <div className="rounded-2xl bg-white/70 p-4 text-sm font-black leading-7 ring-1 ring-current">
              SLA: {incident.slaLabel}
              <br />
              점수: {incident.priorityScore}
            </div>
          </div>

          {incident.acceptedProvider ? (
            <div className="mt-3 rounded-2xl bg-white/70 p-4 text-sm font-black leading-7 ring-1 ring-current">
              수락한 도움망: {incident.acceptedProvider.provider_name || '지역 도움망'}
            </div>
          ) : null}

          <textarea
            value={note}
            onChange={(event) => onNote(event.target.value)}
            placeholder="처리 메모 예: 보호자 통화 완료, 방문 확인 예정, 수동 연결 필요"
            className="mt-3 min-h-24 w-full rounded-2xl border border-current bg-white/70 px-4 py-3 text-sm font-bold outline-none placeholder:text-current/50"
          />
        </div>

        <div className="grid min-w-56 gap-2">
          {incident.request.guardian_phone ? (
            <a
              href={`tel:${incident.request.guardian_phone}`}
              className="rounded-xl bg-white/80 px-4 py-3 text-center text-sm font-black ring-1 ring-current"
            >
              보호자 전화
            </a>
          ) : null}

          {incident.request.parent_phone ? (
            <a
              href={`tel:${incident.request.parent_phone}`}
              className="rounded-xl bg-white/80 px-4 py-3 text-center text-sm font-black ring-1 ring-current"
            >
              부모님 전화
            </a>
          ) : null}

          <button
            onClick={() => onAction('notifyGuardian', { requestId: incident.id })}
            disabled={loading}
            className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
          >
            보호자 알림
          </button>

          <button
            onClick={() => onAction('dispatchProviders', { requestId: incident.id })}
            disabled={loading}
            className="rounded-xl bg-[#193B38] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            도움망 요청
          </button>

          <button
            onClick={() => onAction('markInProgress', { requestId: incident.id })}
            disabled={loading}
            className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
          >
            운영실 확인중
          </button>

          <button
            onClick={() => onAction('markCompleted', { requestId: incident.id, note: note || '운영실 처리 완료' })}
            disabled={loading}
            className="rounded-xl bg-[#123F38] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            처리 완료
          </button>

          <button
            onClick={() => onAction('cancelRequest', { requestId: incident.id, note: note || '운영실 취소' })}
            disabled={loading}
            className="rounded-xl bg-white/60 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </article>
  )
}

export default OpsAutopilotPanel
