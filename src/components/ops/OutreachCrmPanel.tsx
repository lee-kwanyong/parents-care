'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Target = {
  id: string
  target_key: string
  municipality_name: string
  priority: number
  region?: string
  department_name?: string
  contact_name?: string
  role_title?: string
  contact_phone?: string
  contact_email?: string
  status?: string
  call_status?: string
  email_status?: string
  meeting_status?: string
  next_action?: string
  next_action_at?: string
  last_contacted_at?: string
  meeting_at?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

type LogRow = {
  id: string
  target_key?: string
  municipality_name?: string
  action_type?: string
  channel?: string
  status?: string
  subject?: string
  body?: string
  note?: string
  next_status?: string
  created_by?: string
  created_at?: string
}

type CrmData = {
  ok: boolean
  targets: Target[]
  logs: LogRow[]
  runs: Array<Record<string, unknown>>
  metrics: Record<string, number>
  generatedAt: string
}

function statusLabel(status?: string) {
  if (status === 'not_started') return '미시작'
  if (status === 'phone_confirm_needed') return '전화 확인'
  if (status === 'email_ready') return '메일 준비'
  if (status === 'email_sent') return '메일 발송'
  if (status === 'replied') return '회신'
  if (status === 'meeting_scheduled') return '미팅 예정'
  if (status === 'hold') return '보류'
  if (status === 'rejected') return '거절'
  return status || '기록'
}

function statusClass(status?: string) {
  if (status === 'meeting_scheduled' || status === 'replied') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (status === 'email_sent' || status === 'email_ready') return 'bg-[#F3F8FF] text-[#255B83] ring-[#D8EAFB]'
  if (status === 'rejected' || status === 'hold') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
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

function emailSubject(target?: Target) {
  return `[${target?.municipality_name || '지자체'} 실증 제안] 고령친화도시형 AIP 돌봄 관제 플랫폼 ‘안부웍스’ 시연 요청드립니다`
}

function emailBody(target?: Target) {
  const name = target?.municipality_name || '귀 지자체'

  return [
    `안녕하세요. ${name} 담당자님.`,
    '',
    '안부웍스(AnbuWorks) 대표 이관용입니다.',
    '',
    `${name}의 고령친화도시, 노인맞춤돌봄, 통합돌봄, 독거노인 생활안전 정책과 연계 가능한 스마트 돌봄 관제 플랫폼 실증 협업을 제안드리고자 연락드립니다.`,
    '',
    '안부웍스는 “바이오헬스 데이터 기반 고령자 AIP 돌봄 관제 플랫폼”으로, 어르신의 식사·복약·몸 상태·도움요청 신호를 보호자, 운영실, 요양보호사·돌봄파트너, 지자체가 함께 확인하고 후속조치할 수 있도록 지원합니다.',
    '',
    '[제안 실증안]',
    '- 대상: 독거노인 또는 노인맞춤돌봄 대상자 10~30가구',
    '- 기간: 4~8주 예비 실증',
    '- 방식: 보호자 알림 + 운영실 관제 + 요양보호사 즉시 배치 + 사건 타임라인 + 운영보고서 자동화',
    '',
    '[핵심 기능]',
    '- 어르신 안부 신호 수집',
    '- 운영실 자동운영 상태판',
    '- 검증 요양보호사·돌봄파트너 1회용 링크 기반 즉시 배치',
    '- 문자 발송센터와 사건 타임라인',
    '- 개인정보 동의·열람 감사',
    '- 지자체 운영보고서와 제출 패키지',
    '',
    '안부웍스는 119 또는 의료기관을 대체하지 않습니다. 생명 위협·낙상·의식저하 등 응급상황은 즉시 119 연락을 안내하며, 안부웍스는 응급 전 단계의 생활위험 확인과 지역 도움망 연결을 담당합니다.',
    '',
    '서비스 소개:',
    'https://parents-care.net/proposal',
    '',
    '1페이지 제안서:',
    'https://parents-care.net/gov/one-page-proposal',
    '',
    '가능하시다면 20분 내외 온라인 시연 또는 실증 협의 미팅을 요청드립니다.',
    '',
    '감사합니다.',
    '',
    '이관용 드림',
    '안부웍스(AnbuWorks) 대표',
    'contact@parents-care.net',
    'https://parents-care.net'
  ].join('\n')
}

export function OutreachCrmPanel({
  title = '지자체 실증 제안 CRM',
  subtitle = '고령친화도시 후보 지자체에 대한 전화 확인, 이메일 발송, 회신, 미팅 상태를 관리합니다.'
}: {
  title?: string
  subtitle?: string
}) {
  const [data, setData] = useState<CrmData | null>(null)
  const [selectedKey, setSelectedKey] = useState('')
  const [activeTab, setActiveTab] = useState<'targets' | 'email' | 'logs' | 'history'>('targets')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const [createdBy, setCreatedBy] = useState('이관용')
  const [edit, setEdit] = useState<Partial<Target>>({})

  const targets = data?.targets || []
  const logs = data?.logs || []
  const metrics = data?.metrics || {}

  const selected = useMemo(() => {
    return targets.find((target) => target.target_key === selectedKey) || targets[0] || null
  }, [targets, selectedKey])

  const selectedLogs = useMemo(() => {
    if (!selected) return []
    return logs.filter((log) => log.target_key === selected.target_key)
  }, [logs, selected])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/outreach-crm', { cache: 'no-store' })
      const next = await response.json().catch(() => ({}))

      if (!response.ok || !next.ok) {
        setMessage(next.message || 'CRM 데이터를 불러오지 못했습니다.')
        setDebug(JSON.stringify(next.detail || next, null, 2))
        return
      }

      setData(next)

      if (next.targets?.length && !selectedKey) {
        setSelectedKey(next.targets[0].target_key)
      }

      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'CRM 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/outreach-crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.ok) {
        setMessage(result.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
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

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(`제목: ${emailSubject(selected || undefined)}\n\n${emailBody(selected || undefined)}`)
      setMessage('메일 제목과 본문을 클립보드에 복사했습니다.')
    } catch {
      setMessage('클립보드 복사에 실패했습니다.')
    }
  }

  function quickLog(actionType: string, channel: string, status: string, nextStatus: string, nextAction: string) {
    if (!selected) return

    post('addLog', {
      targetKey: selected.target_key,
      actionType,
      channel,
      status,
      subject: emailSubject(selected),
      body: channel === 'email' ? emailBody(selected) : '',
      note,
      nextStatus,
      nextAction,
      createdBy
    })
  }

  function saveEdit() {
    if (!selected) return

    post('updateTarget', {
      targetKey: selected.target_key,
      patch: edit
    })

    setEdit({})
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selected) {
      setEdit({
        contact_name: selected.contact_name || '',
        role_title: selected.role_title || '',
        contact_phone: selected.contact_phone || '',
        contact_email: selected.contact_email || '',
        department_name: selected.department_name || '',
        next_action: selected.next_action || '',
        notes: selected.notes || ''
      })
    }
  }, [selected])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            지자체 실증 제안 CRM
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                {title}
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                {subtitle}
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#EFFFFA] px-6 py-5 text-center text-[#247A71] ring-1 ring-[#CDEFE7]">
              <div className="text-sm font-black opacity-70">우선 대상</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{metrics.total || 0}곳</div>
              <div className="mt-2 text-xs font-bold">제안 관리</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              새로고침
            </button>

            <button onClick={() => post('seedTargets')} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              10개 지자체 초기화
            </button>

            <button onClick={() => post('saveSnapshot')} disabled={loading || !data} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              CRM 스냅샷 저장
            </button>

            <Link href="/ops/one-page-proposal" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              1페이지 제안서
            </Link>

            <Link href="/proposal" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              외부 제안 페이지
            </Link>
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
          <MetricCard title="전체" value={`${metrics.total || 0}곳`} desc="대상 지자체" />
          <MetricCard title="전화 확인" value={`${metrics.phoneConfirmNeeded || 0}곳`} desc="이메일 확인 필요" danger={Number(metrics.phoneConfirmNeeded || 0) > 0} />
          <MetricCard title="메일 준비" value={`${metrics.emailReady || 0}곳`} desc="발송 가능" />
          <MetricCard title="메일 발송" value={`${metrics.emailSent || 0}곳`} desc="발송 완료" />
          <MetricCard title="회신" value={`${metrics.replied || 0}곳`} desc="응답 있음" />
          <MetricCard title="미팅 예정" value={`${metrics.meetingScheduled || 0}곳`} desc="시연/협의" />
          <MetricCard title="전화 기록" value={`${metrics.calls || 0}건`} desc="누적 전화" />
          <MetricCard title="메일 기록" value={`${metrics.emails || 0}건`} desc="누적 메일" />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              ['targets', '대상 관리'],
              ['email', '메일 초안'],
              ['logs', '접촉 기록'],
              ['history', '저장 기록']
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

        {activeTab === 'targets' ? (
          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">우선 제안 대상</h2>

              <div className="mt-5 space-y-3">
                {targets.length === 0 ? (
                  <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                    아직 대상 지자체가 없습니다. 10개 지자체 초기화를 눌러주세요.
                  </div>
                ) : (
                  targets.map((target) => (
                    <button
                      key={target.target_key}
                      onClick={() => setSelectedKey(target.target_key)}
                      className={
                        'w-full rounded-2xl p-4 text-left ring-1 ' +
                        (selected?.target_key === target.target_key
                          ? 'bg-[#247A71] text-white ring-[#247A71]'
                          : 'bg-[#FAFFFD] text-[#17443F] ring-[#D6EDE7]')
                      }
                    >
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {target.priority}순위
                        </span>
                        <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(target.status)}>
                          {statusLabel(target.status)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{target.municipality_name}</h3>
                      <p className={'mt-2 text-sm font-bold leading-7 ' + (selected?.target_key === target.target_key ? 'text-white/75' : 'text-[#637B76]')}>
                        {target.region || '-'} · {target.department_name || '-'}
                        <br />
                        다음: {target.next_action || '-'}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="space-y-5">
              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                {selected ? (
                  <>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <span className={'inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(selected.status)}>
                          {statusLabel(selected.status)}
                        </span>
                        <h2 className="mt-3 text-3xl font-black tracking-[-0.06em]">{selected.municipality_name}</h2>
                        <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                          {selected.region || '-'} · {selected.department_name || '-'}
                          <br />
                          연락처 {selected.contact_phone || '미확인'} · 이메일 {selected.contact_email || '미확인'}
                        </p>
                      </div>

                      <div className="grid gap-2 lg:min-w-44">
                        <button onClick={copyEmail} className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white">
                          메일 복사
                        </button>
                        {selected.contact_email ? (
                          <a href={`mailto:${selected.contact_email}?subject=${encodeURIComponent(emailSubject(selected))}&body=${encodeURIComponent(emailBody(selected))}`} className="rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                            메일 열기
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <EditInput label="담당자명" value={String(edit.contact_name || '')} onChange={(v) => setEdit({ ...edit, contact_name: v })} />
                      <EditInput label="직책" value={String(edit.role_title || '')} onChange={(v) => setEdit({ ...edit, role_title: v })} />
                      <EditInput label="부서" value={String(edit.department_name || '')} onChange={(v) => setEdit({ ...edit, department_name: v })} />
                      <EditInput label="전화" value={String(edit.contact_phone || '')} onChange={(v) => setEdit({ ...edit, contact_phone: v })} />
                      <EditInput label="이메일" value={String(edit.contact_email || '')} onChange={(v) => setEdit({ ...edit, contact_email: v })} />
                      <EditInput label="다음 액션" value={String(edit.next_action || '')} onChange={(v) => setEdit({ ...edit, next_action: v })} />
                    </div>

                    <label className="mt-3 grid gap-2">
                      <span className="text-sm font-black text-[#637B76]">메모</span>
                      <textarea
                        value={String(edit.notes || '')}
                        onChange={(event) => setEdit({ ...edit, notes: event.target.value })}
                        className="min-h-24 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={saveEdit} disabled={loading} className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white disabled:opacity-50">
                        정보 저장
                      </button>
                      <button onClick={() => quickLog('phone_confirm', 'phone', 'done', 'email_ready', '이메일 발송')} disabled={loading} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
                        전화 확인 완료
                      </button>
                      <button onClick={() => quickLog('email_sent', 'email', 'sent', 'email_sent', '회신 대기')} disabled={loading} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
                        메일 발송 기록
                      </button>
                      <button onClick={() => quickLog('reply_received', 'email', 'replied', 'replied', '시연 일정 협의')} disabled={loading} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
                        회신 기록
                      </button>
                      <button onClick={() => quickLog('meeting_scheduled', 'meeting', 'scheduled', 'meeting_scheduled', '시연 준비')} disabled={loading} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
                        미팅 예정
                      </button>
                      <button onClick={() => post('updateTarget', { targetKey: selected.target_key, patch: { status: 'hold', next_action: '추후 재접촉' } })} disabled={loading} className="rounded-xl bg-[#FFF4F4] px-4 py-3 text-sm font-black text-[#8A3030] ring-1 ring-[#F3C8C8] disabled:opacity-50">
                        보류
                      </button>
                    </div>

                    <label className="mt-4 grid gap-2">
                      <span className="text-sm font-black text-[#637B76]">접촉 기록 메모</span>
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="전화 결과, 담당자 반응, 다음 액션을 적어주세요."
                        className="min-h-24 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                      />
                    </label>
                  </>
                ) : (
                  <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                    지자체 대상을 선택해주세요.
                  </div>
                )}
              </section>

              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">선택 지자체 최근 기록</h2>
                <div className="mt-5 space-y-3">
                  {selectedLogs.length === 0 ? (
                    <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                      아직 기록이 없습니다.
                    </div>
                  ) : (
                    selectedLogs.slice(0, 8).map((log) => (
                      <article key={log.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                        <div className="text-xs font-black text-[#2AA897]">{log.channel} · {log.action_type}</div>
                        <h3 className="mt-2 text-lg font-black">{log.subject || statusLabel(log.next_status)}</h3>
                        <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{log.note || '-'}</p>
                        <p className="mt-1 text-xs font-bold text-[#637B76]">{log.created_by || '-'} · {log.created_at || ''}</p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </section>
          </section>
        ) : null}

        {activeTab === 'email' ? (
          <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">메일 대상</h2>

              <div className="mt-5 grid gap-3">
                {targets.map((target) => (
                  <button
                    key={target.target_key}
                    onClick={() => setSelectedKey(target.target_key)}
                    className={
                      'rounded-2xl p-4 text-left ring-1 ' +
                      (selected?.target_key === target.target_key
                        ? 'bg-[#247A71] text-white ring-[#247A71]'
                        : 'bg-[#FAFFFD] text-[#17443F] ring-[#D6EDE7]')
                    }
                  >
                    <div className="text-xs font-black opacity-70">{target.priority}순위</div>
                    <div className="mt-1 text-lg font-black">{target.municipality_name}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">메일 초안</h2>

              <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-sm font-black text-[#637B76]">제목</div>
                <div className="mt-2 text-lg font-black">{emailSubject(selected || undefined)}</div>
              </div>

              <textarea
                value={emailBody(selected || undefined)}
                readOnly
                className="mt-4 min-h-[34rem] w-full rounded-2xl border border-[#D6EDE7] bg-[#FAFFFD] px-4 py-4 text-sm font-bold leading-7 outline-none"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={copyEmail} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
                  메일 복사
                </button>
                {selected?.contact_email ? (
                  <a href={`mailto:${selected.contact_email}?subject=${encodeURIComponent(emailSubject(selected))}&body=${encodeURIComponent(emailBody(selected))}`} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                    메일 앱 열기
                  </a>
                ) : null}
                <button onClick={() => selected && quickLog('email_sent', 'email', 'sent', 'email_sent', '회신 대기')} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  발송 완료로 기록
                </button>
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'logs' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">전체 접촉 기록</h2>

            <div className="mt-5 space-y-3">
              {logs.length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 접촉 기록이 없습니다.
                </div>
              ) : (
                logs.map((log) => (
                  <article key={log.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                        {log.municipality_name || '-'}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                        {log.channel || '-'}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                        {log.action_type || '-'}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black">{log.subject || statusLabel(log.next_status)}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{log.note || '-'}</p>
                    <p className="mt-1 text-xs font-bold text-[#637B76]">{log.created_by || '-'} · {log.created_at || ''}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'history' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">CRM 저장 기록</h2>

            <div className="mt-5 space-y-3">
              {(data?.runs || []).length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 저장 기록이 없습니다.
                </div>
              ) : (
                (data?.runs || []).map((run, index) => (
                  <article key={String(run.id || index)} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-xs font-black text-[#2AA897]">{String(run.run_type || 'snapshot')}</div>
                    <h3 className="mt-2 text-lg font-black">{String(run.status || 'recorded')}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{String(run.summary || '-')}</p>
                    <p className="mt-1 text-xs font-bold text-[#637B76]">{String(run.created_at || '')}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function EditInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
      />
    </label>
  )
}

export default OutreachCrmPanel
