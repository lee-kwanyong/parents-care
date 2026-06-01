'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type RiskLevel = 'normal' | 'watch' | 'risk' | 'urgent'

type RiskSignal = {
  type: string
  level: RiskLevel
  title: string
  description: string
}

type RiskAction = {
  actionType: string
  label: string
  description: string
  priority: 'normal' | 'important' | 'urgent'
  buttonLabel: string
}

type RiskActionGuide = {
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  riskLevel: RiskLevel
  riskScore: number
  primarySituation: string
  summary: string
  signals: RiskSignal[]
  confirmationQuestions: string[]
  callScript: string
  guardianMessage: string
  carePartnerBrief: string
  nextActions: RiskAction[]
  safetyNote: string
}

type Dashboard = {
  generatedAt: string
  cards: Array<{
    key: string
    label: string
    value: number
    help: string
  }>
  guides: RiskActionGuide[]
  systemInsights: string[]
  rawCounts: Record<string, number>
}

function levelClass(level: RiskLevel) {
  if (level === 'urgent') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (level === 'risk') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  if (level === 'watch') return 'bg-[#F7FBFF] text-[#234B68] ring-[#DCEDE7]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
}

function priorityClass(priority: string) {
  if (priority === 'urgent') return 'bg-[#8A2525] text-white'
  if (priority === 'important') return 'bg-[#193B38] text-white'
  return 'bg-white text-[#173B36] ring-1 ring-[#D8EEE8]'
}

function levelLabel(level: RiskLevel) {
  if (level === 'urgent') return '즉시 확인'
  if (level === 'risk') return '확인 필요'
  if (level === 'watch') return '주의 관찰'
  return '정상'
}

export function AnbuRiskActionOps() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [raw, setRaw] = useState<unknown>(null)
  const [selectedCode, setSelectedCode] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showRaw, setShowRaw] = useState(false)

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-ops/risk-action', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      setRaw(data)

      if (!response.ok || data.ok === false) {
        setMessage(data.message || 'Risk-to-Action 데이터를 불러오지 못했습니다.')
        return
      }

      setDashboard(data.dashboard || null)

      if (!selectedCode && data.dashboard?.guides?.[0]?.familyCode) {
        setSelectedCode(data.dashboard.guides[0].familyCode)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Risk-to-Action 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function recordAction(guide: RiskActionGuide, action: RiskAction) {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-ops/risk-action/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: guide.familyCode,
          actionType: action.actionType,
          riskLevel: guide.riskLevel,
          riskScore: guide.riskScore,
          memo: action.description,
          guide
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false) {
        setMessage(data.message || '기록 저장에 실패했습니다.')
      } else {
        setMessage(data.message || '기록이 저장되었습니다.')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '기록 저장 중 오류가 발생했습니다.')
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

  const filteredGuides = useMemo(() => {
    const guides = dashboard?.guides || []

    if (filter === 'all') return guides

    return guides.filter((guide) => guide.riskLevel === filter)
  }, [dashboard, filter])

  const selectedGuide =
    filteredGuides.find((guide) => guide.familyCode === selectedCode) ||
    filteredGuides[0] ||
    null

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            Risk-to-Action AI™ v1
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            위험 신호를
            <br />
            보호자 행동으로 바꿉니다.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            무응답, 복약 미확인, 몸 상태 이상, 부모님 부담도, 케어 요청을 분석해
            전화 질문, 보호자 메시지, 케어파트너 전달 메모, 다음 조치를 자동 생성합니다.
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
              href="/ops/anbu-graph"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              AnbuGraph
            </Link>

            <Link
              href="/child/safety-loop"
              className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              안심루프
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
          <h2 className="text-2xl font-black tracking-[-0.05em]">시스템 인사이트</h2>
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
            <h2 className="text-2xl font-black tracking-[-0.05em]">가족별 가이드</h2>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="mt-4 w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold"
            >
              <option value="all">전체</option>
              <option value="urgent">즉시 확인</option>
              <option value="risk">확인 필요</option>
              <option value="watch">주의 관찰</option>
              <option value="normal">정상</option>
            </select>

            <div className="mt-5 space-y-3">
              {filteredGuides.length === 0 ? (
                <div className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                  표시할 가이드가 없습니다.
                </div>
              ) : (
                filteredGuides.map((guide) => (
                  <button
                    key={guide.familyCode}
                    onClick={() => setSelectedCode(guide.familyCode)}
                    className={
                      'w-full rounded-2xl p-4 text-left ring-1 transition ' +
                      (selectedGuide?.familyCode === guide.familyCode
                        ? 'bg-[#EFFFF9] ring-[#CDEFE5]'
                        : 'bg-[#F8FCFB] ring-[#D8EEE8]')
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + levelClass(guide.riskLevel)}>
                        {levelLabel(guide.riskLevel)}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#D8EEE7]">
                        {guide.familyCode || '-'}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">{guide.parentName}</h3>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#637B76]">
                      {guide.primarySituation}
                    </p>

                    <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-[#D8EEE8]">
                      <div className="text-[11px] font-black text-[#7A9692]">위험 점수</div>
                      <div className="mt-1 text-2xl font-black text-[#173B36]">{guide.riskScore}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="space-y-5">
            {!selectedGuide ? (
              <section className="rounded-[2rem] bg-white p-8 text-center text-lg font-black shadow-sm ring-1 ring-[#D8EEE8]">
                선택된 가이드가 없습니다.
              </section>
            ) : (
              <>
                <section className={'rounded-[2rem] p-5 ring-1 sm:p-6 ' + levelClass(selectedGuide.riskLevel)}>
                  <div className="grid gap-5 lg:grid-cols-[1fr_0.45fr]">
                    <div>
                      <p className="text-sm font-black opacity-75">
                        {selectedGuide.parentName} · 보호자 {selectedGuide.guardianName}
                      </p>
                      <h2 className="mt-3 text-4xl font-black tracking-[-0.07em]">
                        {levelLabel(selectedGuide.riskLevel)}
                      </h2>
                      <p className="mt-4 text-sm font-bold leading-7 opacity-90">
                        {selectedGuide.summary}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/75 p-5">
                      <div className="text-xs font-black opacity-70">주요 상황</div>
                      <div className="mt-2 text-xl font-black leading-7">{selectedGuide.primarySituation}</div>
                      <div className="mt-4 text-xs font-bold opacity-75">위험 점수 {selectedGuide.riskScore}</div>
                    </div>
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                  <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">위험 신호</h2>
                    <div className="mt-5 space-y-3">
                      {selectedGuide.signals.map((signal, index) => (
                        <article key={`${signal.type}-${index}`} className={'rounded-2xl p-4 ring-1 ' + levelClass(signal.level)}>
                          <div className="text-xs font-black opacity-75">{levelLabel(signal.level)}</div>
                          <h3 className="mt-2 text-lg font-black tracking-[-0.04em]">{signal.title}</h3>
                          <p className="mt-2 text-sm font-bold leading-7">{signal.description}</p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">확인 질문</h2>
                    <div className="mt-5 space-y-3">
                      {selectedGuide.confirmationQuestions.map((question, index) => (
                        <div key={question} className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                          <span className="font-black text-[#11977F]">{index + 1}. </span>
                          {question}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                  <h2 className="text-2xl font-black tracking-[-0.05em]">다음 행동</h2>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {selectedGuide.nextActions.map((action) => (
                      <article key={action.actionType} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                        <h3 className="text-lg font-black tracking-[-0.04em]">{action.label}</h3>
                        <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{action.description}</p>
                        <button
                          onClick={() => recordAction(selectedGuide, action)}
                          disabled={loading}
                          className={'mt-4 rounded-xl px-4 py-2 text-xs font-black disabled:opacity-60 ' + priorityClass(action.priority)}
                        >
                          {action.buttonLabel}
                        </button>
                      </article>
                    ))}
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-3">
                  <ScriptCard
                    title="전화 스크립트"
                    body={selectedGuide.callScript}
                    onCopy={() => copyText('전화 스크립트', selectedGuide.callScript)}
                  />

                  <ScriptCard
                    title="보호자 메시지"
                    body={selectedGuide.guardianMessage}
                    onCopy={() => copyText('보호자 메시지', selectedGuide.guardianMessage)}
                  />

                  <ScriptCard
                    title="케어파트너 전달 메모"
                    body={selectedGuide.carePartnerBrief}
                    onCopy={() => copyText('케어파트너 전달 메모', selectedGuide.carePartnerBrief)}
                  />
                </div>

                <section className="rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
                  {selectedGuide.safetyNote}
                </section>
              </>
            )}
          </section>
        </div>

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

function ScriptCard({
  title,
  body,
  onCopy
}: {
  title: string
  body: string
  onCopy: () => void
}) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black tracking-[-0.05em]">{title}</h2>
        <button
          onClick={onCopy}
          className="rounded-xl bg-[#F8FCFB] px-3 py-2 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
        >
          복사
        </button>
      </div>
      <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#4E6D69] ring-1 ring-[#D8EEE8]">
        {body}
      </pre>
    </section>
  )
}
