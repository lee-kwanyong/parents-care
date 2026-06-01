'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type OutcomeRisk = 'normal' | 'watch' | 'risk' | 'urgent'
type OutcomeStatus = 'pending' | 'labeled' | 'closed'

type OutcomeCandidate = {
  key: string
  sourceType: string
  sourceId: string
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  title: string
  description: string
  actionType: string
  actionLabel: string
  sourceStatus: string
  riskLevel: OutcomeRisk
  createdAt: string
  ageHours: number | null
  outcomeStatus: OutcomeStatus
  outcome?: {
    id: string
    outcomeCategory: string
    outcomeLabel: string
    outcomeStatus: string
    confidenceScore: number | null
    impactScore: number | null
    followUpRequired: boolean
    followUpNote: string
    memo: string
    actorName: string
    createdAt: string
    updatedAt: string
  } | null
  learningNotes: string[]
  recommendedNextLabels: string[]
  sourcePayload: Record<string, unknown>
}

type OutcomeDashboard = {
  generatedAt: string
  cards: Array<{
    key: string
    label: string
    value: string | number
    help: string
  }>
  candidates: OutcomeCandidate[]
  systemInsights: string[]
  learningReport: string
  rawCounts: Record<string, number>
}

type Category = {
  value: string
  label: string
  desc: string
}

function riskClass(risk: OutcomeRisk) {
  if (risk === 'urgent') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (risk === 'risk') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  if (risk === 'watch') return 'bg-[#F7FBFF] text-[#234B68] ring-[#DCEDE7]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
}

function statusClass(status: OutcomeStatus) {
  if (status === 'closed') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  if (status === 'labeled') return 'bg-[#F7FBFF] text-[#234B68] ring-[#DCEDE7]'
  return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
}

function riskLabel(risk: OutcomeRisk) {
  if (risk === 'urgent') return '긴급'
  if (risk === 'risk') return '위험'
  if (risk === 'watch') return '관찰'
  return '일반'
}

function statusLabel(status: OutcomeStatus) {
  if (status === 'closed') return '종료'
  if (status === 'labeled') return '라벨됨'
  return '미라벨링'
}

function sourceLabel(sourceType: string) {
  if (sourceType === 'risk_action') return 'Risk-to-Action'
  if (sourceType === 'escalation') return '무응답 관리'
  if (sourceType === 'safety_loop') return '안심루프'
  if (sourceType === 'care_request') return '케어 요청'
  if (sourceType === 'care_report') return '케어 리포트'
  if (sourceType === 'pilot_event') return '실증 이벤트'
  return sourceType
}

export function AnbuOutcomeOps() {
  const [dashboard, setDashboard] = useState<OutcomeDashboard | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [raw, setRaw] = useState<unknown>(null)
  const [selectedKey, setSelectedKey] = useState('')
  const [filter, setFilter] = useState('pending')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [showRaw, setShowRaw] = useState(false)
  const [outcomeCategory, setOutcomeCategory] = useState('resolved_ok')
  const [confidenceScore, setConfidenceScore] = useState(4)
  const [impactScore, setImpactScore] = useState(3)
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [followUpNote, setFollowUpNote] = useState('')
  const [memo, setMemo] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-ops/outcomes', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      setRaw(data)

      if (!response.ok || data.ok === false) {
        setMessage(data.message || '결과 라벨링 데이터를 불러오지 못했습니다.')
        return
      }

      setDashboard(data.dashboard || null)
      setCategories(data.outcomeCategories || [])

      const first = data.dashboard?.candidates?.[0]
      if (!selectedKey && first?.key) {
        setSelectedKey(first.key)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '결과 라벨링 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function applyCandidate(candidate: OutcomeCandidate | null) {
    if (!candidate) return

    if (candidate.outcome?.outcomeCategory) {
      setOutcomeCategory(candidate.outcome.outcomeCategory)
      setConfidenceScore(candidate.outcome.confidenceScore || 4)
      setImpactScore(candidate.outcome.impactScore || 3)
      setFollowUpRequired(Boolean(candidate.outcome.followUpRequired))
      setFollowUpNote(candidate.outcome.followUpNote || '')
      setMemo(candidate.outcome.memo || '')
      return
    }

    const recommended = candidate.recommendedNextLabels[0]
    const found = categories.find((category) => category.label === recommended)
    setOutcomeCategory(found?.value || 'resolved_ok')
    setConfidenceScore(4)
    setImpactScore(candidate.riskLevel === 'urgent' || candidate.riskLevel === 'risk' ? 4 : 3)
    setFollowUpRequired(candidate.riskLevel === 'urgent')
    setFollowUpNote('')
    setMemo('')
  }

  async function saveOutcome() {
    if (!selectedCandidate) {
      setMessage('선택된 조치 후보가 없습니다.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-ops/outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: selectedCandidate.sourceType,
          sourceId: selectedCandidate.sourceId,
          familyCode: selectedCandidate.familyCode,
          outcomeCategory,
          confidenceScore,
          impactScore,
          followUpRequired,
          followUpNote,
          memo,
          sourcePayload: selectedCandidate.sourcePayload
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false) {
        setMessage(data.message || '결과 라벨 저장에 실패했습니다.')
      } else {
        setMessage(data.message || '결과 라벨이 저장되었습니다.')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '결과 라벨 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setMessage(`${label}이 복사되었습니다.`)
    } catch {
      setMessage('복사에 실패했습니다. 직접 선택해서 복사해주세요.')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const candidates = useMemo(() => {
    const rows = dashboard?.candidates || []

    if (filter === 'all') return rows
    if (filter === 'pending') return rows.filter((row) => row.outcomeStatus === 'pending')
    if (filter === 'labeled') return rows.filter((row) => row.outcomeStatus !== 'pending')
    if (filter === 'urgent') return rows.filter((row) => ['urgent', 'risk'].includes(row.riskLevel))
    if (filter === 'followup') return rows.filter((row) => row.outcome?.followUpRequired)

    return rows
  }, [dashboard, filter])

  const selectedCandidate =
    candidates.find((candidate) => candidate.key === selectedKey) ||
    candidates[0] ||
    null

  useEffect(() => {
    applyCandidate(selectedCandidate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCandidate?.key, categories.length])

  const selectedCategory = categories.find((category) => category.value === outcomeCategory)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            Outcome Labeling Engine™
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            추천 행동의 실제 결과를
            <br />
            우리만의 데이터로 쌓습니다.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            Risk-to-Action, 안심루프, 무응답 관리, 케어 요청의 실제 결과를 라벨링해
            앞으로의 위험 판단과 보호자 행동 추천을 고도화합니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? '불러오는 중...' : '새로고침'}
            </button>

            <Link
              href="/ops/risk-action"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              Risk-to-Action
            </Link>

            <Link
              href="/ops/pilot"
              className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              실증 운영실
            </Link>

            <button
              onClick={() => setShowRaw((value) => !value)}
              className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              {showRaw ? '원본 숨기기' : '원본 보기'}
            </button>
          </div>
        </section>

        {message ? (
          <section className="rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
            {message}
          </section>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(dashboard?.cards || []).map((card) => (
            <section key={card.key} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8]">
              <div className="text-sm font-black text-[#7A9692]">{card.label}</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#11977F]">{card.value}</div>
              <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{card.help}</p>
            </section>
          ))}
        </div>

        <section className="rounded-[2rem] bg-[#123F38] p-5 text-white sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">학습 인사이트</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(dashboard?.systemInsights || []).map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 p-4 text-sm font-bold leading-7 text-[#E7FFF7] ring-1 ring-white/15">
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[0.38fr_1fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">라벨링 후보</h2>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="mt-4 w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold"
            >
              <option value="pending">미라벨링</option>
              <option value="urgent">위험 우선</option>
              <option value="followup">후속 필요</option>
              <option value="labeled">라벨 완료</option>
              <option value="all">전체</option>
            </select>

            <div className="mt-5 space-y-3">
              {candidates.length === 0 ? (
                <div className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                  표시할 라벨링 후보가 없습니다.
                </div>
              ) : (
                candidates.map((candidate) => (
                  <button
                    key={candidate.key}
                    onClick={() => setSelectedKey(candidate.key)}
                    className={
                      'w-full rounded-2xl p-4 text-left ring-1 transition ' +
                      (selectedCandidate?.key === candidate.key
                        ? 'bg-[#EFFFF9] ring-[#CDEFE5]'
                        : 'bg-[#F8FCFB] ring-[#D8EEE8]')
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + riskClass(candidate.riskLevel)}>
                        {riskLabel(candidate.riskLevel)}
                      </span>
                      <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(candidate.outcomeStatus)}>
                        {statusLabel(candidate.outcomeStatus)}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black tracking-[-0.04em]">
                      {candidate.parentName}
                    </h3>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#637B76]">
                      {sourceLabel(candidate.sourceType)} · {candidate.actionLabel}
                    </p>
                    <p className="mt-2 text-xs font-bold text-[#7A9692]">
                      {candidate.ageHours === null ? '시간 정보 없음' : `${candidate.ageHours}시간 전`}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="space-y-5">
            {!selectedCandidate ? (
              <section className="rounded-[2rem] bg-white p-8 text-center text-lg font-black shadow-sm ring-1 ring-[#D8EEE8]">
                선택된 라벨링 후보가 없습니다.
              </section>
            ) : (
              <>
                <section className={'rounded-[2rem] p-5 ring-1 sm:p-6 ' + riskClass(selectedCandidate.riskLevel)}>
                  <div className="grid gap-5 lg:grid-cols-[1fr_0.55fr]">
                    <div>
                      <p className="text-sm font-black opacity-75">
                        {selectedCandidate.parentName} · 보호자 {selectedCandidate.guardianName}
                      </p>
                      <h2 className="mt-3 text-4xl font-black tracking-[-0.07em]">
                        {selectedCandidate.title}
                      </h2>
                      <p className="mt-4 text-sm font-bold leading-7 opacity-90">
                        {selectedCandidate.description}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/75 p-5">
                      <div className="text-xs font-black opacity-70">소스</div>
                      <div className="mt-2 text-xl font-black">{sourceLabel(selectedCandidate.sourceType)}</div>
                      <p className="mt-3 text-sm font-bold leading-6 opacity-80">
                        코드 {selectedCandidate.familyCode || '-'}
                      </p>
                      <p className="mt-1 text-sm font-bold leading-6 opacity-80">
                        상태 {selectedCandidate.sourceStatus || '-'}
                      </p>
                    </div>
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                  <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">결과 라벨 입력</h2>

                    <div className="mt-5 space-y-4">
                      <label className="grid gap-2">
                        <span className="text-sm font-black text-[#55736E]">결과 라벨</span>
                        <select
                          value={outcomeCategory}
                          onChange={(event) => setOutcomeCategory(event.target.value)}
                          className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold"
                        >
                          {categories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                        {selectedCategory ? (
                          <p className="text-xs font-bold leading-5 text-[#7A9692]">
                            {selectedCategory.desc}
                          </p>
                        ) : null}
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-2">
                          <span className="text-sm font-black text-[#55736E]">확신도 1~5</span>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={confidenceScore}
                            onChange={(event) => setConfidenceScore(Number(event.target.value || 4))}
                            className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-black text-[#55736E]">영향도 1~5</span>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={impactScore}
                            onChange={(event) => setImpactScore(Number(event.target.value || 3))}
                            className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFollowUpRequired((value) => !value)}
                        className={
                          'w-full rounded-2xl px-5 py-4 text-sm font-black ring-1 ' +
                          (followUpRequired
                            ? 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
                            : 'bg-[#F8FCFB] text-[#173B36] ring-[#D8EEE8]')
                        }
                      >
                        {followUpRequired ? '후속 조치 필요 ON' : '후속 조치 필요 OFF'}
                      </button>

                      <label className="grid gap-2">
                        <span className="text-sm font-black text-[#55736E]">후속 조치 메모</span>
                        <input
                          value={followUpNote}
                          onChange={(event) => setFollowUpNote(event.target.value)}
                          placeholder="예: 내일 오전 재확인 필요"
                          className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-black text-[#55736E]">운영 메모</span>
                        <textarea
                          value={memo}
                          onChange={(event) => setMemo(event.target.value)}
                          placeholder="실제 확인 결과를 적어주세요."
                          className="min-h-28 rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold"
                        />
                      </label>

                      <button
                        onClick={saveOutcome}
                        disabled={loading}
                        className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:opacity-60"
                      >
                        {loading ? '저장 중...' : '결과 라벨 저장'}
                      </button>
                    </div>
                  </section>

                  <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">학습 메모</h2>

                    <div className="mt-5 space-y-3">
                      {selectedCandidate.learningNotes.map((note) => (
                        <div key={note} className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                          {note}
                        </div>
                      ))}
                    </div>

                    <h3 className="mt-6 text-lg font-black tracking-[-0.04em]">추천 라벨</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedCandidate.recommendedNextLabels.map((label) => (
                        <span key={label} className="rounded-full bg-[#E8FAF5] px-3 py-2 text-xs font-black text-[#11977F] ring-1 ring-[#BEEFE3]">
                          {label}
                        </span>
                      ))}
                    </div>

                    {selectedCandidate.outcome ? (
                      <div className="mt-6 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-bold leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
                        기존 라벨: {selectedCandidate.outcome.outcomeLabel}
                        <br />
                        메모: {selectedCandidate.outcome.memo || '-'}
                      </div>
                    ) : null}
                  </section>
                </div>
              </>
            )}
          </section>
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black tracking-[-0.05em]">학습 리포트</h2>
            <button
              onClick={() => copyText('학습 리포트', dashboard?.learningReport || '')}
              className="rounded-xl bg-[#F8FCFB] px-4 py-2 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              복사
            </button>
          </div>

          <pre className="mt-4 max-h-[24rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-[#123F38] p-4 text-sm font-bold leading-7 text-[#E7FFF7]">
            {dashboard?.learningReport || '학습 리포트 데이터가 없습니다.'}
          </pre>
        </section>

        {showRaw ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">원본 데이터</h2>
            <pre className="mt-4 max-h-[30rem] overflow-auto rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              {JSON.stringify(raw, null, 2)}
            </pre>
          </section>
        ) : null}
      </section>
    </main>
  )
}
