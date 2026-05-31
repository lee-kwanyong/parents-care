'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type NodeStatus = 'normal' | 'watch' | 'risk' | 'done' | 'unknown'

type GraphNode = {
  id: string
  kind: string
  label: string
  status: NodeStatus
  score?: number
  subtitle: string
  metrics: Array<{
    label: string
    value: string
  }>
}

type GraphEdge = {
  id: string
  from: string
  to: string
  label: string
  status: 'normal' | 'watch' | 'risk' | 'done'
}

type FamilyGraph = {
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  overallState: '정상' | '주의' | '확인 필요'
  riskScore: number
  closureScore: number
  burdenScore: number
  burdenLevel: '낮음' | '보통' | '높음'
  consentScore: number
  noResponseHours: number | null
  lastCheckinAt: string | null
  insights: string[]
  recommendedActions: string[]
  nodes: GraphNode[]
  edges: GraphEdge[]
}

type AnbuGraph = {
  generatedAt: string
  cards: Array<{
    key: string
    label: string
    value: number | string
    help: string
  }>
  families: FamilyGraph[]
  systemInsights: string[]
  rawCounts: Record<string, number>
}

function statusClass(status: NodeStatus) {
  if (status === 'risk') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (status === 'watch') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  if (status === 'done') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  if (status === 'normal') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  return 'bg-[#F8FCFB] text-[#637B76] ring-[#D8EEE8]'
}

function stateClass(state: string) {
  if (state === '확인 필요') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (state === '주의') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
}

function edgeClass(status: string) {
  if (status === 'risk') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (status === 'watch') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  if (status === 'done') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  return 'bg-white text-[#4E6D69] ring-[#D8EEE8]'
}

function kindLabel(kind: string) {
  const map: Record<string, string> = {
    parent: '부모님',
    guardian: '보호자',
    consent: '동의',
    risk: '위험',
    safety_loop: '루프',
    escalation: '무응답',
    care_request: '케어',
    partner: '파트너',
    report: '리포트',
    burden: '부담도'
  }

  return map[kind] || kind
}

function timeLabel(value: string | null | undefined) {
  if (!value) return '-'

  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) return value

  return date.toLocaleString('ko-KR')
}

export function AnbuGraphDashboard() {
  const [graph, setGraph] = useState<AnbuGraph | null>(null)
  const [raw, setRaw] = useState<unknown>(null)
  const [selectedCode, setSelectedCode] = useState('')
  const [filter, setFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [showRaw, setShowRaw] = useState(false)

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-ops/anbu-graph', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      setRaw(data)

      if (!response.ok || data.ok === false) {
        setMessage(data.message || 'AnbuGraph 데이터를 불러오지 못했습니다.')
        return
      }

      setGraph(data.graph || null)

      if (!selectedCode && data.graph?.families?.[0]?.familyCode) {
        setSelectedCode(data.graph.families[0].familyCode)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'AnbuGraph 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function saveSnapshot() {
    if (!graph) {
      setMessage('저장할 AnbuGraph 데이터가 없습니다.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-ops/anbu-graph/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graph,
          summary: {
            generatedAt: graph.generatedAt,
            rawCounts: graph.rawCounts,
            cards: graph.cards,
            systemInsights: graph.systemInsights
          }
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false) {
        setMessage(data.message || '스냅샷 저장에 실패했습니다.')
      } else {
        setMessage(data.message || '스냅샷이 저장되었습니다.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '스냅샷 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredFamilies = useMemo(() => {
    const families = graph?.families || []

    if (filter === 'all') return families

    if (filter === 'risk') return families.filter((family) => family.overallState === '확인 필요')
    if (filter === 'watch') return families.filter((family) => family.overallState === '주의')
    if (filter === 'burden') return families.filter((family) => family.burdenLevel === '높음')
    if (filter === 'closure') return families.filter((family) => family.closureScore < 50)

    return families
  }, [graph, filter])

  const selectedFamily =
    filteredFamilies.find((family) => family.familyCode === selectedCode) ||
    filteredFamilies[0] ||
    null

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            AnbuGraph™ v1
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            가족 돌봄 데이터를
            <br />
            하나의 안심 그래프로 연결합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            부모님, 보호자, 안부 신호, 동의 상태, 무응답 단계, 케어파트너 요청, 리포트 검수를 하나의 구조로 묶어
            우리만의 고유한 안심 운영체제를 만듭니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? '불러오는 중...' : '새로고침'}
            </button>

            <button
              onClick={saveSnapshot}
              disabled={loading || !graph}
              className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              그래프 스냅샷 저장
            </button>

            <Link
              href="/ops/dashboard"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              운영실 홈
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
          {(graph?.cards || []).map((card) => (
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
            {(graph?.systemInsights || []).map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 p-4 text-sm font-bold leading-7 text-[#E7FFF7] ring-1 ring-white/15">
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[0.42fr_1fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.05em]">가족 그래프</h2>
                <p className="mt-2 text-sm font-bold text-[#637B76]">
                  가족 단위 안심 구조를 선택하세요.
                </p>
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold"
              >
                <option value="all">전체</option>
                <option value="risk">확인 필요</option>
                <option value="watch">주의</option>
                <option value="burden">부담도 높음</option>
                <option value="closure">완료율 낮음</option>
              </select>
            </div>

            <div className="mt-5 space-y-3">
              {filteredFamilies.length === 0 ? (
                <div className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                  표시할 가족 그래프가 없습니다.
                </div>
              ) : (
                filteredFamilies.map((family) => (
                  <button
                    key={family.familyCode}
                    onClick={() => setSelectedCode(family.familyCode)}
                    className={
                      'w-full rounded-2xl p-4 text-left ring-1 transition ' +
                      (selectedFamily?.familyCode === family.familyCode
                        ? 'bg-[#EFFFF9] ring-[#CDEFE5]'
                        : 'bg-[#F8FCFB] ring-[#D8EEE8]')
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + stateClass(family.overallState)}>
                        {family.overallState}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#D8EEE7]">
                        {family.familyCode || '-'}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">
                      {family.parentName}
                    </h3>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#637B76]">
                      보호자 {family.guardianName || '-'}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <MiniMetric label="위험" value={String(family.riskScore)} />
                      <MiniMetric label="완료" value={`${family.closureScore}%`} />
                      <MiniMetric label="부담" value={family.burdenLevel} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="space-y-5">
            {!selectedFamily ? (
              <section className="rounded-[2rem] bg-white p-8 text-center text-lg font-black shadow-sm ring-1 ring-[#D8EEE8]">
                선택된 가족 그래프가 없습니다.
              </section>
            ) : (
              <>
                <section className={'rounded-[2rem] p-5 ring-1 sm:p-6 ' + stateClass(selectedFamily.overallState)}>
                  <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                    <div>
                      <p className="text-sm font-black opacity-75">
                        {selectedFamily.parentName} · 보호자 {selectedFamily.guardianName}
                      </p>
                      <h2 className="mt-3 text-4xl font-black tracking-[-0.07em]">
                        {selectedFamily.overallState}
                      </h2>
                      <p className="mt-4 text-sm font-bold leading-7 opacity-85">
                        마지막 안부: {timeLabel(selectedFamily.lastCheckinAt)} · 무응답 시간: {selectedFamily.noResponseHours === null ? '기록 없음' : `${selectedFamily.noResponseHours}시간`}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <ScoreBox label="위험 점수" value={selectedFamily.riskScore} />
                      <ScoreBox label="완료율" value={`${selectedFamily.closureScore}%`} />
                      <ScoreBox label="동의 점수" value={`${selectedFamily.consentScore}%`} />
                      <ScoreBox label="부담도" value={selectedFamily.burdenLevel} />
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                  <h2 className="text-2xl font-black tracking-[-0.05em]">AnbuGraph 노드</h2>
                  <p className="mt-2 text-sm font-bold text-[#637B76]">
                    가족 돌봄의 핵심 상태를 노드로 연결합니다.
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {selectedFamily.nodes.map((node) => (
                      <article key={node.id} className={'rounded-2xl p-4 ring-1 ' + statusClass(node.status)}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">
                            {kindLabel(node.kind)}
                          </span>
                          {typeof node.score === 'number' ? (
                            <span className="text-sm font-black opacity-80">{node.score}</span>
                          ) : null}
                        </div>

                        <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">{node.label}</h3>
                        <p className="mt-2 text-sm font-bold leading-6 opacity-80">{node.subtitle}</p>

                        <div className="mt-4 grid gap-2">
                          {node.metrics.map((metric) => (
                            <div key={metric.label} className="rounded-xl bg-white/65 p-3">
                              <div className="text-[11px] font-black opacity-65">{metric.label}</div>
                              <div className="mt-1 text-sm font-black">{metric.value}</div>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                  <h2 className="text-2xl font-black tracking-[-0.05em]">연결 관계</h2>

                  <div className="mt-5 grid gap-2 md:grid-cols-2">
                    {selectedFamily.edges.map((edge) => (
                      <div key={edge.id} className={'rounded-2xl p-4 text-sm font-black ring-1 ' + edgeClass(edge.status)}>
                        <div>{edge.label}</div>
                        <p className="mt-1 text-xs font-bold opacity-75">
                          {edge.from.split(':').pop()} → {edge.to.split(':').pop()}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">인사이트</h2>
                    <div className="mt-5 space-y-3">
                      {selectedFamily.insights.map((item) => (
                        <div key={item} className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">추천 조치</h2>
                    <div className="mt-5 space-y-3">
                      {selectedFamily.recommendedActions.map((item) => (
                        <div key={item} className="rounded-2xl bg-[#EFFFF9] p-4 text-sm font-bold leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-2 ring-1 ring-[#D8EEE8]">
      <div className="text-[10px] font-black text-[#7A9692]">{label}</div>
      <div className="mt-1 text-sm font-black text-[#173B36]">{value}</div>
    </div>
  )
}

function ScoreBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white/75 p-4">
      <div className="text-xs font-black opacity-70">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-[-0.05em]">{value}</div>
    </div>
  )
}
