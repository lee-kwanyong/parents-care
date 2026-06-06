'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type ProviderCandidate = {
  id: string
  provider_name?: string
  provider_type?: string
  provider_type_label?: string
  phone?: string
  service_area?: string
  response_time_min?: number
  candidate_score?: number
}

type PlaybookStep = {
  step_order: number
  delay_minutes: number
  action_code: string
  action_label: string
  action_detail: string
  escalation_level: string
  auto_execute: boolean
  requires_human_confirm: boolean
}

type TimelineItem = {
  id?: string
  action_type?: string
  update_type?: string
  contact_type?: string
  result_status?: string
  message?: string
  memo?: string
  created_at?: string
}

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
  playbookSteps: PlaybookStep[]
  candidates: ProviderCandidate[]
  callScript: string[]
  assignment?: {
    assigned_to_name?: string
    assigned_role?: string
    note?: string
  } | null
  contactAttempts: TimelineItem[]
  timeline: TimelineItem[]
  request: {
    id: string
    guardian_phone?: string
    parent_phone?: string
    address_hint?: string
    completed_note?: string
  }
  acceptedProvider?: ProviderCandidate | null
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
  contacts: number
  assignments: number
}

type AutopilotLog = {
  id: string
  request_id?: string
  action_type?: string
  message?: string
  created_at?: string
}

function severityClass(label: string) {
  if (label === 'Red') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (label === 'Orange') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  return 'bg-[#FAFFFD] text-[#17443F] ring-[#D6EDE7]'
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
    <article className={'rounded-[2rem] p-5 shadow-sm ring-1 ' + (danger ? 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]' : 'bg-white text-[#17443F] ring-[#D6EDE7]')}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

export function OpsAutopilotPanel() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [logs, setLogs] = useState<AutopilotLog[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ open: 0, urgent: 0, manualNeeded: 0, waitingProvider: 0, providers: 0, queued: 0, sent: 0, logs: 0, contacts: 0, assignments: 0 })
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoSend, setAutoSend] = useState(false)
  const [noteById, setNoteById] = useState<Record<string, string>>({})
  const [operatorById, setOperatorById] = useState<Record<string, string>>({})
  const [contactTypeById, setContactTypeById] = useState<Record<string, string>>({})
  const [contactStatusById, setContactStatusById] = useState<Record<string, string>>({})

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
      setMetrics(data.metrics || { open: 0, urgent: 0, manualNeeded: 0, waitingProvider: 0, providers: 0, queued: 0, sent: 0, logs: 0, contacts: 0, assignments: 0 })
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            운영실 오토파일럿 v2
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            신호별 플레이북으로
            <br />
            운영실이 자동 대응합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            위험도, 경과 시간, 도움망 수락 여부를 기준으로 다음 행동을 추천하고, 보호자 알림·도움망 요청·통화 기록·완료 처리를 한 화면에서 실행합니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <GuideCard number="1" title="플레이북" desc="신호별 SLA와 행동 순서를 데이터화했습니다." />
            <GuideCard number="2" title="후보 추천" desc="요청 유형과 권역에 맞는 도움망 후보를 점수화합니다." />
            <GuideCard number="3" title="전화 스크립트" desc="운영실 직원이 바로 읽을 수 있는 확인 문구를 제공합니다." />
            <GuideCard number="4" title="타임라인" desc="문자, 통화, 배정, 완료 기록을 사건별로 모읍니다." />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => post('runAutopilot', { autoSend })}
              disabled={loading}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              {autoSend ? '오토파일럿 실행 + 문자 발송' : '오토파일럿 실행'}
            </button>

            <label className="flex items-center gap-2 rounded-2xl bg-[#FAFFFD] px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
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
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              새로고침
            </button>

            <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              알림 발송센터
            </Link>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            응급상황을 앱이 직접 판단하지 않습니다. 운영실은 확인·연결·기록을 수행하고, 응급 가능성이 있으면 119 또는 의료기관 연락을 안내합니다.
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#2AA897] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]" open>
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-10">
          <MetricCard title="열린 사건" value={`${metrics.open}개`} desc="처리 중" danger={metrics.open > 0} />
          <MetricCard title="긴급" value={`${metrics.urgent}개`} desc="즉시 확인" danger={metrics.urgent > 0} />
          <MetricCard title="수동 연결" value={`${metrics.manualNeeded}개`} desc="전화 필요" danger={metrics.manualNeeded > 0} />
          <MetricCard title="미수락" value={`${metrics.waitingProvider}개`} desc="도움망 대기" danger={metrics.waitingProvider > 0} />
          <MetricCard title="도움망" value={`${metrics.providers}명`} desc="등록 제공자" />
          <MetricCard title="배정" value={`${metrics.assignments}건`} desc="담당자 배정" />
          <MetricCard title="통화" value={`${metrics.contacts}건`} desc="연락 기록" />
          <MetricCard title="문자 대기" value={`${metrics.queued}개`} desc="발송 대기" danger={metrics.queued > 0} />
          <MetricCard title="발송 완료" value={`${metrics.sent}개`} desc="문자 기록" />
          <MetricCard title="로그" value={`${metrics.logs}개`} desc="자동 기록" />
        </section>

        <IncidentSection
          title="긴급·수동 연결 사건"
          desc="이 영역의 사건부터 처리하세요. 도움 요청, 수동 연결 필요, 도움망 미수락 사건이 우선입니다."
          empty="현재 긴급 사건이 없습니다."
          incidents={urgentIncidents}
          loading={loading}
          noteById={noteById}
          operatorById={operatorById}
          contactTypeById={contactTypeById}
          contactStatusById={contactStatusById}
          setNoteById={setNoteById}
          setOperatorById={setOperatorById}
          setContactTypeById={setContactTypeById}
          setContactStatusById={setContactStatusById}
          onAction={post}
        />

        <IncidentSection
          title="주의·관찰 사건"
          desc="식사·복약·몸 상태 확인 등 시간 경과에 따라 승격될 수 있는 사건입니다."
          empty="현재 주의 사건이 없습니다."
          incidents={normalIncidents}
          loading={loading}
          noteById={noteById}
          operatorById={operatorById}
          contactTypeById={contactTypeById}
          contactStatusById={contactStatusById}
          setNoteById={setNoteById}
          setOperatorById={setOperatorById}
          setContactTypeById={setContactTypeById}
          setContactStatusById={setContactStatusById}
          onAction={post}
        />

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">최근 오토파일럿 로그</h2>

          <div className="mt-5 space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 오토파일럿 로그가 없습니다.
              </div>
            ) : (
              logs.slice(0, 20).map((log) => (
                <article key={log.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#2AA897]">{log.action_type || 'log'}</div>
                  <div className="mt-2 text-sm font-black leading-7">{log.message || '-'}</div>
                  <div className="mt-1 text-xs font-bold text-[#637B76]">{log.created_at || ''}</div>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-4">
          <Link href="/response?scope=ops" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
            후속조치 관제
          </Link>
          <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            알림 발송센터
          </Link>
          <Link href="/provider/requests" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            도움망 요청함
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

function IncidentSection(props: {
  title: string
  desc: string
  empty: string
  incidents: Incident[]
  loading: boolean
  noteById: Record<string, string>
  operatorById: Record<string, string>
  contactTypeById: Record<string, string>
  contactStatusById: Record<string, string>
  setNoteById: (value: Record<string, string>) => void
  setOperatorById: (value: Record<string, string>) => void
  setContactTypeById: (value: Record<string, string>) => void
  setContactStatusById: (value: Record<string, string>) => void
  onAction: (action: string, payload: Record<string, unknown>) => void
}) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
      <h2 className="text-3xl font-black tracking-[-0.06em]">{props.title}</h2>
      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{props.desc}</p>

      <div className="mt-5 space-y-3">
        {props.incidents.length === 0 ? (
          <div className="rounded-2xl bg-[#EFFFFA] p-5 text-sm font-black text-[#2AA897] ring-1 ring-[#CDEFE7]">
            {props.empty}
          </div>
        ) : (
          props.incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              loading={props.loading}
              note={props.noteById[incident.id] || ''}
              operator={props.operatorById[incident.id] || ''}
              contactType={props.contactTypeById[incident.id] || 'guardian'}
              contactStatus={props.contactStatusById[incident.id] || 'connected'}
              onNote={(value) => props.setNoteById({ ...props.noteById, [incident.id]: value })}
              onOperator={(value) => props.setOperatorById({ ...props.operatorById, [incident.id]: value })}
              onContactType={(value) => props.setContactTypeById({ ...props.contactTypeById, [incident.id]: value })}
              onContactStatus={(value) => props.setContactStatusById({ ...props.contactStatusById, [incident.id]: value })}
              onAction={props.onAction}
            />
          ))
        )}
      </div>
    </section>
  )
}

function IncidentCard({
  incident,
  loading,
  note,
  operator,
  contactType,
  contactStatus,
  onNote,
  onOperator,
  onContactType,
  onContactStatus,
  onAction
}: {
  incident: Incident
  loading: boolean
  note: string
  operator: string
  contactType: string
  contactStatus: string
  onNote: (value: string) => void
  onOperator: (value: string) => void
  onContactType: (value: string) => void
  onContactStatus: (value: string) => void
  onAction: (action: string, payload: Record<string, unknown>) => void
}) {
  return (
    <article className={'rounded-[2rem] p-5 ring-1 ' + severityClass(incident.severityLabel)}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
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

          {incident.assignment ? (
            <div className="mt-3 rounded-2xl bg-white/70 p-4 text-sm font-black leading-7 ring-1 ring-current">
              담당자: {incident.assignment.assigned_to_name || '운영실'} · {incident.assignment.note || '배정됨'}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
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

          <details className="mt-3 rounded-2xl bg-white/70 p-4 ring-1 ring-current">
            <summary className="cursor-pointer text-sm font-black">플레이북 보기</summary>
            <div className="mt-3 space-y-2">
              {incident.playbookSteps.map((step) => (
                <div key={`${step.step_order}-${step.action_code}`} className="rounded-xl bg-white/60 p-3 text-xs font-bold leading-6 ring-1 ring-current">
                  {step.step_order}. {step.action_label} · {step.delay_minutes}분 기준 · {step.escalation_level}
                  <br />
                  {step.action_detail}
                </div>
              ))}
            </div>
          </details>

          <details className="mt-3 rounded-2xl bg-white/70 p-4 ring-1 ring-current">
            <summary className="cursor-pointer text-sm font-black">운영실 전화 스크립트</summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-bold leading-7">
              {incident.callScript.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ol>
          </details>

          <details className="mt-3 rounded-2xl bg-white/70 p-4 ring-1 ring-current">
            <summary className="cursor-pointer text-sm font-black">추천 도움망 후보</summary>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {incident.candidates.length === 0 ? (
                <div className="rounded-xl bg-white/60 p-3 text-xs font-bold leading-6 ring-1 ring-current">
                  추천 가능한 도움망이 없습니다.
                </div>
              ) : (
                incident.candidates.map((provider) => (
                  <div key={provider.id} className="rounded-xl bg-white/60 p-3 text-xs font-bold leading-6 ring-1 ring-current">
                    {provider.provider_name || '지역 도움망'} · {provider.provider_type_label || provider.provider_type}
                    <br />
                    권역 {provider.service_area || '-'} · 점수 {provider.candidate_score || 0} · {provider.response_time_min || 30}분 목표
                  </div>
                ))
              )}
            </div>
          </details>

          <details className="mt-3 rounded-2xl bg-white/70 p-4 ring-1 ring-current">
            <summary className="cursor-pointer text-sm font-black">사건 타임라인</summary>
            <div className="mt-3 space-y-2">
              {incident.timeline.length === 0 ? (
                <div className="rounded-xl bg-white/60 p-3 text-xs font-bold leading-6 ring-1 ring-current">
                  아직 타임라인 기록이 없습니다.
                </div>
              ) : (
                incident.timeline.slice(0, 8).map((item, index) => (
                  <div key={item.id || index} className="rounded-xl bg-white/60 p-3 text-xs font-bold leading-6 ring-1 ring-current">
                    {item.action_type || item.update_type || item.contact_type || '기록'} · {item.result_status || ''}
                    <br />
                    {item.message || item.memo || '-'}
                    <br />
                    <span className="opacity-70">{item.created_at || ''}</span>
                  </div>
                ))
              )}
            </div>
          </details>

          <textarea
            value={note}
            onChange={(event) => onNote(event.target.value)}
            placeholder="처리 메모 예: 보호자 통화 완료, 방문 확인 예정, 수동 연결 필요"
            className="mt-3 min-h-24 w-full rounded-2xl border border-current bg-white/70 px-4 py-3 text-sm font-bold outline-none placeholder:text-current/50"
          />
        </div>

        <div className="grid min-w-64 gap-2">
          {incident.request.guardian_phone ? (
            <a href={`tel:${incident.request.guardian_phone}`} className="rounded-xl bg-white/80 px-4 py-3 text-center text-sm font-black ring-1 ring-current">
              보호자 전화
            </a>
          ) : null}

          {incident.request.parent_phone ? (
            <a href={`tel:${incident.request.parent_phone}`} className="rounded-xl bg-white/80 px-4 py-3 text-center text-sm font-black ring-1 ring-current">
              부모님 전화
            </a>
          ) : null}

          <button
            onClick={() => onAction('executeRecommended', { requestId: incident.id, note })}
            disabled={loading}
            className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            추천 조치 실행
          </button>

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
            className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
          >
            도움망 요청
          </button>

          <input
            value={operator}
            onChange={(event) => onOperator(event.target.value)}
            placeholder="담당자명"
            className="rounded-xl border border-current bg-white/70 px-4 py-3 text-sm font-bold outline-none placeholder:text-current/50"
          />

          <button
            onClick={() => onAction('assignOperator', { requestId: incident.id, assignedToName: operator || '운영실', note })}
            disabled={loading}
            className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
          >
            담당자 배정
          </button>

          <select
            value={contactType}
            onChange={(event) => onContactType(event.target.value)}
            className="rounded-xl border border-current bg-white/70 px-4 py-3 text-sm font-bold outline-none"
          >
            <option value="guardian">보호자 통화</option>
            <option value="parent">부모님 통화</option>
          </select>

          <select
            value={contactStatus}
            onChange={(event) => onContactStatus(event.target.value)}
            className="rounded-xl border border-current bg-white/70 px-4 py-3 text-sm font-bold outline-none"
          >
            <option value="connected">통화 연결</option>
            <option value="no_answer">부재중</option>
            <option value="callback_needed">재통화 필요</option>
            <option value="emergency_advised">119/의료기관 안내</option>
          </select>

          <button
            onClick={() => onAction('recordContact', { requestId: incident.id, contactType, resultStatus: contactStatus, note })}
            disabled={loading}
            className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
          >
            통화기록 저장
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
            className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
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
