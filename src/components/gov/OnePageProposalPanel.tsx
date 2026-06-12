'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Proposal = {
  municipalityName: string
  title: string
  subtitle: string
  oneLine: string
  problem: string
  solution: string
  pilotScale: string
  pilotPeriod: string
  target: string
  workflow: string[]
  keyFeatures: string[]
  safety: string
  expectedEffects: string[]
  proofMetrics: string[]
  ask: string
  contactName: string
  contactEmail: string
  serviceUrl: string
  generatedAt: string
}

type HistoryRow = {
  id: string
  municipality_name?: string
  title?: string
  status?: string
  version_label?: string
  created_by?: string
  created_at?: string
}

function emptyProposal(): Proposal {
  return {
    municipalityName: '',
    title: '',
    subtitle: '',
    oneLine: '',
    problem: '',
    solution: '',
    pilotScale: '',
    pilotPeriod: '',
    target: '',
    workflow: [],
    keyFeatures: [],
    safety: '',
    expectedEffects: [],
    proofMetrics: [],
    ask: '',
    contactName: '',
    contactEmail: '',
    serviceUrl: '',
    generatedAt: ''
  }
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function joinLines(value: string[]) {
  return value.join('\n')
}

export function OnePageProposalPanel({
  title = '지자체 1페이지 실증 제안서',
  subtitle = '지자체 담당자에게 바로 전달할 수 있는 한 장짜리 실증 협업 제안서입니다.'
}: {
  title?: string
  subtitle?: string
}) {
  const [proposal, setProposal] = useState<Proposal>(emptyProposal())
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [metrics, setMetrics] = useState<Record<string, number>>({})
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'edit' | 'mail' | 'history'>('preview')

  const mailBody = useMemo(() => {
    return [
      `안녕하세요. ${proposal.municipalityName || '귀 지자체'} 담당자님.`,
      '',
      '안부웍스 대표 이관용입니다.',
      '',
      `${proposal.municipalityName || '귀 지자체'}의 고령친화도시, 노인맞춤돌봄, 통합돌봄, 독거노인 생활안전 정책과 연계 가능한 실증 협업을 제안드립니다.`,
      '',
      proposal.oneLine,
      '',
      '[제안 실증안]',
      `- 대상: ${proposal.target}`,
      `- 규모: ${proposal.pilotScale}`,
      `- 기간: ${proposal.pilotPeriod}`,
      '- 방식: 보호자 알림 + 운영실 관제 + 요양보호사 즉시 배치 + 사건 타임라인 + 보고서 자동화',
      '',
      '[핵심 기능]',
      ...proposal.keyFeatures.map((item) => `- ${item}`),
      '',
      '[안전 원칙]',
      proposal.safety,
      '',
      '서비스 소개 페이지:',
      proposal.serviceUrl,
      '',
      '가능하시다면 20분 내외 온라인 시연 또는 실증 협의 미팅을 요청드립니다.',
      '',
      '감사합니다.',
      '',
      `${proposal.contactName || '이관용'} 드림`,
      `이메일: ${proposal.contactEmail || 'contact@parents-care.net'}`
    ].join('\n')
  }, [proposal])

  function updateField<K extends keyof Proposal>(key: K, value: Proposal[K]) {
    setProposal((prev) => ({ ...prev, [key]: value }))
  }

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/one-page-proposal', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '1페이지 제안서를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setProposal(data.defaultProposal || emptyProposal())
      setHistory(Array.isArray(data.history) ? data.history : [])
      setMetrics(data.metrics || {})
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '1페이지 제안서를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/one-page-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveProposal', proposal, createdBy: '운영실' })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.ok) {
        setMessage(result.message || '저장에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '저장되었습니다.')
      setDebug(JSON.stringify(result, null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyMail() {
    try {
      await navigator.clipboard.writeText(mailBody)
      setMessage('메일 본문을 클립보드에 복사했습니다.')
    } catch {
      setMessage('클립보드 복사에 실패했습니다.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="anbu-print-hide rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            1페이지 실증 제안서
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
              <div className="text-sm font-black opacity-70">현재 데이터</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{Number(metrics.households || 0)}명</div>
              <div className="mt-2 text-xs font-bold">관리 대상자</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              새로고침
            </button>

            <button onClick={save} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              저장
            </button>

            <button onClick={() => window.print()} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              PDF 저장/인쇄
            </button>

            <button onClick={copyMail} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              메일 본문 복사
            </button>

            <Link href="/admin/ops/pilot-qa" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              실증 QA
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

        <section className="anbu-print-hide rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              ['preview', '제안서 미리보기'],
              ['edit', '내용 편집'],
              ['mail', '메일 본문'],
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

        {activeTab === 'preview' ? <ProposalPreview proposal={proposal} /> : null}

        {activeTab === 'edit' ? (
          <section className="anbu-print-hide grid gap-5 xl:grid-cols-2">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">기본 정보</h2>

              <div className="mt-5 grid gap-3">
                <EditInput label="지자체명" value={proposal.municipalityName} onChange={(v) => updateField('municipalityName', v)} />
                <EditInput label="제목" value={proposal.title} onChange={(v) => updateField('title', v)} />
                <EditInput label="부제" value={proposal.subtitle} onChange={(v) => updateField('subtitle', v)} />
                <EditArea label="한 줄 소개" value={proposal.oneLine} onChange={(v) => updateField('oneLine', v)} />
                <EditArea label="문제" value={proposal.problem} onChange={(v) => updateField('problem', v)} />
                <EditArea label="해법" value={proposal.solution} onChange={(v) => updateField('solution', v)} />
                <EditInput label="실증 규모" value={proposal.pilotScale} onChange={(v) => updateField('pilotScale', v)} />
                <EditInput label="실증 기간" value={proposal.pilotPeriod} onChange={(v) => updateField('pilotPeriod', v)} />
                <EditArea label="대상" value={proposal.target} onChange={(v) => updateField('target', v)} />
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">목록 정보</h2>

              <div className="mt-5 grid gap-3">
                <EditArea label="핵심 기능, 줄바꿈 구분" value={joinLines(proposal.keyFeatures)} onChange={(v) => updateField('keyFeatures', splitLines(v))} />
                <EditArea label="기대효과, 줄바꿈 구분" value={joinLines(proposal.expectedEffects)} onChange={(v) => updateField('expectedEffects', splitLines(v))} />
                <EditArea label="성과 지표, 줄바꿈 구분" value={joinLines(proposal.proofMetrics)} onChange={(v) => updateField('proofMetrics', splitLines(v))} />
                <EditArea label="안전 원칙" value={proposal.safety} onChange={(v) => updateField('safety', v)} />
                <EditArea label="요청사항" value={proposal.ask} onChange={(v) => updateField('ask', v)} />
                <EditInput label="담당자" value={proposal.contactName} onChange={(v) => updateField('contactName', v)} />
                <EditInput label="이메일" value={proposal.contactEmail} onChange={(v) => updateField('contactEmail', v)} />
                <EditInput label="서비스 URL" value={proposal.serviceUrl} onChange={(v) => updateField('serviceUrl', v)} />
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'mail' ? (
          <section className="anbu-print-hide rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">메일 본문</h2>

            <textarea
              value={mailBody}
              readOnly
              className="mt-5 min-h-[32rem] w-full rounded-2xl border border-[#D6EDE7] bg-[#FAFFFD] px-4 py-4 text-sm font-bold leading-7 outline-none"
            />

            <button onClick={copyMail} className="mt-4 rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
              메일 본문 복사
            </button>
          </section>
        ) : null}

        {activeTab === 'history' ? (
          <section className="anbu-print-hide rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">저장 기록</h2>

            <div className="mt-5 space-y-3">
              {history.length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  저장된 제안서가 없습니다.
                </div>
              ) : (
                history.map((item) => (
                  <article key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-xs font-black text-[#2AA897]">{item.version_label || item.status || 'saved'}</div>
                    <h3 className="mt-2 text-lg font-black tracking-[-0.04em]">{item.title || '제안서'}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      {item.municipality_name || '-'} · {item.created_by || '-'} · {item.created_at || ''}
                    </p>
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

function ProposalPreview({ proposal }: { proposal: Proposal }) {
  return (
    <section className="anbu-one-page-print mx-auto max-w-[210mm] rounded-[2rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] print:rounded-none print:ring-0 sm:p-8">
      <div className="flex items-start justify-between gap-4 border-b border-[#D6EDE7] pb-5">
        <div>
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-xs font-black text-[#2AA897]">
            지자체 실증 협업 제안
          </div>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.08em] text-[#17443F]">
            {proposal.title}
          </h1>
          <p className="mt-3 text-lg font-black leading-7 text-[#247A71]">{proposal.subtitle}</p>
        </div>

        <div className="shrink-0 rounded-2xl bg-[#FAFFFD] p-4 text-right text-xs font-black leading-6 text-[#637B76] ring-1 ring-[#D6EDE7]">
          안부웍스
          <br />
          AnbuWorks
          <br />
          {proposal.municipalityName}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-[#EFFFFA] p-5 text-xl font-black leading-8 text-[#17443F] ring-1 ring-[#CDEFE7]">
        {proposal.oneLine}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoBox title="문제" body={proposal.problem} tone="danger" />
        <InfoBox title="해법" body={proposal.solution} tone="mint" />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <SmallBox title="실증 규모" value={proposal.pilotScale} />
        <SmallBox title="실증 기간" value={proposal.pilotPeriod} />
        <SmallBox title="대상" value={proposal.target} />
      </div>

      <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
        <h2 className="text-xl font-black tracking-[-0.05em]">운영 흐름</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {proposal.workflow.map((item, index) => (
            <div key={item} className="flex items-center gap-2">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                {item}
              </span>
              {index < proposal.workflow.length - 1 ? <span className="font-black text-[#247A71]/40">→</span> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <ListBox title="핵심 기능" items={proposal.keyFeatures} />
        <ListBox title="기대효과" items={proposal.expectedEffects} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <ListBox title="현재 확인 지표" items={proposal.proofMetrics} />
        <InfoBox title="안전 원칙" body={proposal.safety} tone="warning" />
      </div>

      <div className="mt-5 rounded-2xl bg-[#247A71] p-5 text-white">
        <h2 className="text-xl font-black tracking-[-0.05em]">제안 요청</h2>
        <p className="mt-2 text-sm font-bold leading-7 text-white/85">{proposal.ask}</p>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-[#D6EDE7] pt-4 text-xs font-bold leading-6 text-[#637B76] sm:flex-row sm:items-center sm:justify-between">
        <div>
          담당: {proposal.contactName} · {proposal.contactEmail}
        </div>
        <div>
          {proposal.serviceUrl}
        </div>
      </div>
    </section>
  )
}

function InfoBox({ title, body, tone }: { title: string; body: string; tone: 'mint' | 'warning' | 'danger' }) {
  const cls =
    tone === 'mint'
      ? 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
      : tone === 'warning'
        ? 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
        : 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'

  return (
    <article className={'rounded-2xl p-5 ring-1 ' + cls}>
      <h2 className="text-xl font-black tracking-[-0.05em]">{title}</h2>
      <p className="mt-2 text-sm font-bold leading-7 opacity-85">{body}</p>
    </article>
  )
}

function SmallBox({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
      <div className="text-xs font-black text-[#2AA897]">{title}</div>
      <div className="mt-2 text-base font-black leading-6 text-[#17443F]">{value}</div>
    </article>
  )
}

function ListBox({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
      <h2 className="text-xl font-black tracking-[-0.05em]">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-[#637B76]">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </article>
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

function EditArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold leading-7 outline-none"
      />
    </label>
  )
}

export default OnePageProposalPanel
