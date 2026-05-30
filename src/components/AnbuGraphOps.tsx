'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type GraphNode = {
  id: string
  type: string
  title: string
  subtitle: string
  metric: string
  status: 'normal' | 'warning' | 'danger' | 'done' | 'empty'
  priority: number
}

type GraphEdge = {
  id: string
  from: string
  to: string
  label: string
  description: string
  status: 'normal' | 'warning' | 'danger' | 'done'
}

type GraphInsight = {
  type: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

type FamilySummary = {
  familyCode: string
  parentName: string
  guardianName: string
  graphStatus: '정상' | '주의' | '확인 필요'
  riskScore: number
  burdenScore: number
  closureScore: number
  lastCheckinAt: string | null
}

type AnbuGraph = {
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  graphStatus: '정상' | '주의' | '확인 필요'
  riskScore: number
  burdenScore: number
  closureScore: number
  generatedAt: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  insights: GraphInsight[]
  metrics: Array<{
    label: string
    value: string
    help: string
  }>
  familySummaries: FamilySummary[]
  raw: unknown
}

function statusClass(status: string) {
  if (status === 'danger' || status === '확인 필요') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (status === 'warning' || status === '주의') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  if (status === 'done') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  if (status === 'empty') return 'bg-[#F8FCFB] text-[#7A9692] ring-[#D8EEE8]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
}

function severityClass(severity: string) {
  if (severity === 'high') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (severity === 'medium') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-[#F7FBFF] text-[#234B68] ring-[#DCEDE7]'
}

function edgeClass(status: string) {
  if (status === 'danger') return 'border-[#F3BBBB] bg-[#FFF8F8]'
  if (status === 'warning') return 'border-[#F4D8A5] bg-[#FFFDF5]'
  if (status === 'done') return 'border-[#CDEFE5] bg-[#F6FFFC]'
  return 'border-[#D8EEE8] bg-white'
}

function timeLabel(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  return date.toLocaleString('ko-KR')
}

function nodeIcon(type: string) {
  if (type === 'parent') return '👵'
  if (type === 'guardian') return '👨‍👩‍👧‍👦'
  if (type === 'consent') return '✅'
  if (type === 'checkin') return '💬'
  if (type === 'risk') return '⚠️'
  if (type === 'safety_loop') return '🔁'
  if (type === 'escalation') return '⏱️'
  if (type === 'care_request') return '🧭'
  if (type === 'partner') return '🧑‍⚕️'
  if (type === 'care_report') return '📋'
  if (type === 'notification') return '🔔'
  if (type === 'burden') return '🌿'
  if (type === 'subscription') return '🏛️'
  return '●'
}

export function AnbuGraphOps() {
  const [graph, setGraph] = useState<AnbuGraph | null>(null)
  const [raw, setRaw] = useState<unknown>(null)
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const [familyCode, setFamilyCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showRaw, setShowRaw] = useState(false)

  async function load(code = familyCode) {
    setLoading(true)
    setMessage('')

    try {
      const query = code ? '?familyCode=' + encodeURIComponent(code) : ''
      const response = await fetch('/api/anbu-ops/anbu-graph' + query, { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false) {
        setMessage(data.message || 'AnbuGraph를 불러오지 못했습니다.')
      }

      setRaw(data)
      setGraph(data.graph || null)
      setDiagnostics(Array.isArray(data.diagnostics) ? data.diagnostics : [])

      if (data.graph?.familyCode) {
        setFamilyCode(data.graph.familyCode)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'AnbuGraph를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function saveSnapshot() {
    if (!graph?.familyCode) {
      setMessage('저장할 가족 그래프가 없습니다.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-ops/anbu-graph/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph, snapshotType: 'manual', createdBy: '운영실' })
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
    load('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const familySummaries = useMemo(() => graph?.familySummaries || [], [graph])

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

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            부모님, 보호자, 동의 상태, 안부 신호, 위험 신호, 안심루프, 무응답 단계,
            케어파트너, 검수 리포트, 부모님 부담도까지 하나의 관계 그래프로 묶습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => load(familyCode)}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? '불러오는 중...' : '그래프 새로고침'}
            </button>

            <button
              onClick={saveSnapshot}
              disabled={loading || !graph?.familyCode}
              className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              스냅샷 저장
            </button>

            <Link
              href="/ops/dashboard"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              운영실 홈
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

        <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">가족 선택</h2>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#55736E]">가족 연결코드</span>
                <input
                  value={familyCode}
                  onChange={(event) => setFamilyCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                  placeholder="예: 123456"
                  inputMode="numeric"
                  maxLength={6}
                  className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-center text-2xl font-black tracking-[0.14em] outline-none focus:ring-4 focus:ring-[#D6F6EC]"
                />
              </label>

              <button
                onClick={() => load(familyCode)}
                disabled={loading}
                className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
              >
                이 가족 그래프 보기
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {familySummaries.length === 0 ? (
                <div className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                  연결된 가족 데이터가 없습니다.
                </div>
              ) : (
                familySummaries.slice(0, 12).map((family) => (
                  <button
                    key={family.familyCode}
                    onClick={() => {
                      setFamilyCode(family.familyCode)
                      load(family.familyCode)
                    }}
                    className="w-full rounded-2xl bg-[#F8FCFB] p-4 text-left ring-1 ring-[#D8EEE8] transition hover:bg-[#EFFFF9]"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(family.graphStatus)}>
                        {family.graphStatus}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#D8EEE7]">
                        {family.familyCode}
                      </span>
                    </div>

                    <div className="mt-3 text-lg font-black">{family.parentName}</div>
                    <p className="mt-1 text-xs font-bold text-[#637B76]">
                      보호자 {family.guardianName} · 위험 {family.riskScore} · 부담 {family.burdenScore} · 완료 {family.closureScore}%
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">선택된 가족 그래프</h2>

            {!graph ? (
              <div className="mt-5 rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                {loading ? 'AnbuGraph를 불러오는 중입니다.' : '그래프 데이터가 없습니다.'}
              </div>
            ) : (
              <>
                <section className={'mt-5 rounded-[2rem] p-5 ring-1 ' + statusClass(graph.graphStatus)}>
                  <div className="grid gap-4 md:grid-cols-[1fr_0.6fr]">
                    <div>
                      <div className="text-sm font-black opacity-75">
                        {graph.parentName} · 보호자 {graph.guardianName}
                      </div>
                      <div className="mt-2 text-4xl font-black tracking-[-0.07em]">
                        {graph.graphStatus}
                      </div>
                      <p className="mt-3 text-sm font-bold leading-7 opacity-80">
                        AnbuGraph는 의료 진단이 아니라 가족 돌봄 흐름의 확인 필요도를 보여주는 운영 지표입니다.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/70 p-4">
                      <div className="text-xs font-black opacity-70">고유 그래프 점수</div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-2xl font-black">{graph.riskScore}</div>
                          <div className="text-[11px] font-bold">위험</div>
                        </div>
                        <div>
                          <div className="text-2xl font-black">{graph.burdenScore}</div>
                          <div className="text-[11px] font-bold">부담</div>
                        </div>
                        <div>
                          <div className="text-2xl font-black">{graph.closureScore}%</div>
                          <div className="text-[11px] font-bold">완료</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {graph.metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                      <div className="text-xs font-black text-[#7A9692]">{metric.label}</div>
                      <div className="mt-2 text-3xl font-black text-[#11977F]">{metric.value}</div>
                      <p className="mt-2 text-xs font-bold leading-5 text-[#637B76]">{metric.help}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </section>

        {graph ? (
          <>
            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">AnbuGraph 노드</h2>
              <p className="mt-2 text-sm font-bold text-[#637B76]">
                가족 돌봄을 구성하는 핵심 노드입니다.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {graph.nodes.map((node) => (
                  <article key={node.id} className={'rounded-2xl p-4 ring-1 ' + statusClass(node.status)}>
                    <div className="text-3xl">{nodeIcon(node.type)}</div>
                    <h3 className="mt-3 text-lg font-black tracking-[-0.04em]">{node.title}</h3>
                    <p className="mt-1 text-xs font-bold opacity-75">{node.subtitle}</p>
                    <p className="mt-3 rounded-xl bg-white/75 p-2 text-xs font-black">{node.metric}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">관계 흐름</h2>
                <p className="mt-2 text-sm font-bold text-[#637B76]">
                  알림이 아니라 확인 완료까지 이어지는 관계입니다.
                </p>

                <div className="mt-5 space-y-3">
                  {graph.edges.map((edge) => (
                    <article key={edge.id} className={'rounded-2xl border p-4 ' + edgeClass(edge.status)}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                          {edge.from}
                        </span>
                        <span className="text-sm font-black">→</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                          {edge.to}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-black tracking-[-0.04em]">{edge.label}</h3>
                      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{edge.description}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">그래프 인사이트</h2>
                <p className="mt-2 text-sm font-bold text-[#637B76]">
                  위험, 부담도, 확인 완료율을 기반으로 한 운영 판단입니다.
                </p>

                <div className="mt-5 space-y-3">
                  {graph.insights.map((insight, index) => (
                    <article key={`${insight.title}-${index}`} className={'rounded-2xl p-4 ring-1 ' + severityClass(insight.severity)}>
                      <div className="text-xs font-black uppercase opacity-70">{insight.type}</div>
                      <h3 className="mt-2 text-lg font-black tracking-[-0.04em]">{insight.title}</h3>
                      <p className="mt-2 text-sm font-bold leading-7">{insight.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          </>
        ) : null}

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">데이터 연결 상태</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {diagnostics.map((item) => (
              <div
                key={item.label}
                className={
                  'rounded-2xl p-4 ring-1 ' +
                  (item.ok ? 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]' : 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]')
                }
              >
                <div className="text-sm font-black">{item.label}</div>
                <div className="mt-2 text-2xl font-black">{item.ok ? `${item.count}건` : '확인 필요'}</div>
              </div>
            ))}
          </div>
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
