'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Lead = {
  id: string
  organization_name?: string
  region?: string
  department_name?: string
  contact_name?: string
  role_title?: string
  phone?: string
  email?: string
  households_count?: number
  interest_area?: string
  message?: string
  privacy_agreed?: boolean
  status?: string
  followup_note?: string
  assigned_to?: string
  created_at?: string
  updated_at?: string
}

type Metrics = {
  total: number
  new: number
  contacted: number
  qualified: number
  closed: number
  today: number
  pilot: number
  procurement: number
}

type FilterKey = 'all' | 'new' | 'contacted' | 'qualified' | 'closed'

function statusLabel(status?: string) {
  if (status === 'new') return '신규'
  if (status === 'contacted') return '연락 완료'
  if (status === 'qualified') return '유효 문의'
  if (status === 'closed') return '종료'
  return status || '기록'
}

function interestLabel(value?: string) {
  if (value === 'pilot') return '지자체 실증'
  if (value === 'demo') return '서비스 시연'
  if (value === 'procurement') return '조달·공공 SaaS'
  if (value === 'reporting') return '보고서 자동화'
  if (value === 'partnership') return '수행기관 협력'
  return value || '문의'
}

function statusClass(status?: string) {
  if (status === 'new') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (status === 'qualified') return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
  if (status === 'closed') return 'bg-[#FAFFFD] text-[#637B76] ring-[#D6EDE7]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
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

export function GovProposalLeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, new: 0, contacted: 0, qualified: 0, closed: 0, today: 0, pilot: 0, procurement: 0 })
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selectedId, setSelectedId] = useState('')
  const [followupNote, setFollowupNote] = useState('')
  const [assignedTo, setAssignedTo] = useState('운영실')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const filteredLeads = useMemo(() => {
    if (filter === 'all') return leads
    return leads.filter((lead) => lead.status === filter)
  }, [leads, filter])

  const selected = useMemo(
    () => leads.find((lead) => lead.id === selectedId) || filteredLeads[0] || leads[0] || null,
    [leads, selectedId, filteredLeads]
  )

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/gov-proposal-leads', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '제안 문의 목록을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      const nextLeads = Array.isArray(data.leads) ? data.leads : []
      setLeads(nextLeads)
      setMetrics(data.metrics || { total: 0, new: 0, contacted: 0, qualified: 0, closed: 0, today: 0, pilot: 0, procurement: 0 })

      if (nextLeads.length > 0 && !nextLeads.some((lead: Lead) => lead.id === selectedId)) {
        setSelectedId(nextLeads[0].id)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '제안 문의 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateLead(status: string) {
    if (!selected) return

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-proposal-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateLead',
          id: selected.id,
          status,
          followupNote,
          assignedTo
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '문의 상태 수정에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        await load()
        return
      }

      setMessage(data.message || '문의 상태를 수정했습니다.')
      setFollowupNote('')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '문의 상태 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function downloadCsv() {
    const rows = [
      ['created_at', 'status', 'organization', 'region', 'department', 'contact', 'phone', 'email', 'interest', 'households', 'message', 'followup_note'],
      ...leads.map((lead) => [
        lead.created_at || '',
        statusLabel(lead.status),
        lead.organization_name || '',
        lead.region || '',
        lead.department_name || '',
        lead.contact_name || '',
        lead.phone || '',
        lead.email || '',
        interestLabel(lead.interest_area),
        lead.households_count || '',
        lead.message || '',
        lead.followup_note || ''
      ])
    ]

    const csv = rows
      .map((row) => row.map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anbu-proposal-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            제안 문의 관리
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            지자체·기관 문의를
            <br />
            운영실에서 관리합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            /proposal 또는 /gov/proposal에서 접수된 실증·시연·조달 문의를 확인하고 후속 연락 상태를 관리합니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              새로고침
            </button>
            <button onClick={downloadCsv} disabled={leads.length === 0} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              CSV 다운로드
            </button>
            <Link href="/proposal" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              외부 제안 페이지
            </Link>
            <Link href="/gov/demo-runner" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              시연 모드
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#2AA897] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]" open>
              <summary className="cursor-pointer text-sm font-black">상세 보기</summary>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="전체" value={`${metrics.total}건`} desc="누적 문의" />
          <MetricCard title="신규" value={`${metrics.new}건`} desc="확인 필요" danger={metrics.new > 0} />
          <MetricCard title="오늘" value={`${metrics.today}건`} desc="금일 접수" danger={metrics.today > 0} />
          <MetricCard title="연락 완료" value={`${metrics.contacted}건`} desc="1차 연락" />
          <MetricCard title="유효 문의" value={`${metrics.qualified}건`} desc="시연 가능성" />
          <MetricCard title="종료" value={`${metrics.closed}건`} desc="종료 처리" />
          <MetricCard title="실증 관심" value={`${metrics.pilot}건`} desc="파일럿 문의" />
          <MetricCard title="조달 관심" value={`${metrics.procurement}건`} desc="조달 문의" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-[-0.06em]">문의 목록</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  상태별로 문의를 확인합니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  ['all', '전체'],
                  ['new', '신규'],
                  ['contacted', '연락'],
                  ['qualified', '유효'],
                  ['closed', '종료']
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key as FilterKey)}
                    className={
                      'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
                      (filter === key
                        ? 'bg-[#247A71] text-white ring-[#247A71]'
                        : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredLeads.length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  표시할 문의가 없습니다.
                </div>
              ) : (
                filteredLeads.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => setSelectedId(lead.id)}
                    className={
                      'w-full rounded-2xl p-4 text-left ring-1 ' +
                      (selected?.id === lead.id
                        ? 'bg-[#247A71] text-white ring-[#247A71]'
                        : statusClass(lead.status))
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                        {statusLabel(lead.status)}
                      </span>
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                        {interestLabel(lead.interest_area)}
                      </span>
                    </div>

                    <div className="mt-3 text-lg font-black tracking-[-0.05em]">{lead.organization_name || '기관'}</div>
                    <div className={'mt-2 text-sm font-bold leading-6 ' + (selected?.id === lead.id ? 'text-white/70' : 'opacity-80')}>
                      {lead.region || '-'} · {lead.contact_name || '-'} · {lead.created_at || ''}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            {selected ? (
              <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <span className={'inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(selected.status)}>
                      {statusLabel(selected.status)}
                    </span>

                    <h2 className="mt-4 text-3xl font-black tracking-[-0.06em]">{selected.organization_name || '기관'}</h2>

                    <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                      {selected.region || '-'} · {selected.department_name || '-'} · {interestLabel(selected.interest_area)}
                      <br />
                      담당자 {selected.contact_name || '-'} · {selected.role_title || '-'}
                      <br />
                      연락처 {selected.phone || '-'} · 이메일 {selected.email || '-'}
                      <br />
                      예상 대상 {selected.households_count || '-'}가구
                    </p>
                  </div>

                  <div className="grid gap-2 lg:min-w-48">
                    {selected.phone ? (
                      <a href={`tel:${selected.phone}`} className="rounded-xl bg-[#247A71] px-4 py-3 text-center text-sm font-black text-white">
                        전화하기
                      </a>
                    ) : null}
                    {selected.email ? (
                      <a href={`mailto:${selected.email}`} className="rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                        이메일
                      </a>
                    ) : null}
                  </div>
                </div>

                <section className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <h3 className="text-xl font-black tracking-[-0.05em]">문의 내용</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-7 text-[#637B76]">
                    {selected.message || '문의 내용이 없습니다.'}
                  </p>
                </section>

                <section className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <h3 className="text-xl font-black tracking-[-0.05em]">후속 관리</h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#637B76]">담당자</span>
                      <input
                        value={assignedTo}
                        onChange={(event) => setAssignedTo(event.target.value)}
                        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#637B76]">후속 메모</span>
                      <input
                        value={followupNote}
                        onChange={(event) => setFollowupNote(event.target.value)}
                        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-2 md:grid-cols-4">
                    <button onClick={() => updateLead('contacted')} disabled={loading} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
                      연락 완료
                    </button>
                    <button onClick={() => updateLead('qualified')} disabled={loading} className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white disabled:opacity-50">
                      유효 문의
                    </button>
                    <button onClick={() => updateLead('closed')} disabled={loading} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
                      종료
                    </button>
                    <button onClick={() => updateLead('new')} disabled={loading} className="rounded-xl bg-[#FAFFFD] px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
                      신규로 복구
                    </button>
                  </div>
                </section>
              </>
            ) : (
              <div className="rounded-2xl bg-[#FAFFFD] p-8 text-center text-sm font-black text-[#637B76] ring-1 ring-[#D6EDE7]">
                문의를 선택해주세요.
              </div>
            )}
          </section>
        </section>

        <div className="grid gap-3 sm:grid-cols-5">
          <Link href="/proposal" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
            외부 제안 페이지
          </Link>
          <Link href="/gov/demo-runner" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            시연 모드
          </Link>
          <Link href="/gov/submission-package" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            제출 패키지
          </Link>
          <Link href="/gov/pilot-manual" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            실증 매뉴얼
          </Link>
          <button onClick={load} className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

export default GovProposalLeadsPanel
