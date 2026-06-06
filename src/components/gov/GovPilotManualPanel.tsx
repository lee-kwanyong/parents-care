'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Phase = {
  key: string
  title: string
  period: string
  objective: string
  steps: string[]
}

type RoleGuide = {
  key: string
  title: string
  mission: string
  tasks: string[]
}

type ChecklistItem = {
  step_key: string
  phase_key: string
  role_key: string
  title: string
  description: string
  status: string
  note?: string
  completed_by?: string
  completed_at?: string
  updated_at?: string
}

type TrainingLog = {
  id: string
  training_type?: string
  audience?: string
  trainer_name?: string
  attendee_count?: number
  session_date?: string
  note?: string
  created_at?: string
}

type Metrics = {
  total: number
  completed: number
  pending: number
  progressRate: number
  trainings: number
  attendees: number
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

function roleLabel(role: string) {
  if (role === 'gov') return '지자체'
  if (role === 'ops') return '운영실'
  if (role === 'careWorker') return '도움망'
  if (role === 'guardian') return '보호자'
  return role
}

function statusClass(status: string) {
  if (status === 'done') return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
  return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
}

export function GovPilotManualPanel({
  title = '지자체 실증 운영 매뉴얼',
  subtitle = '1–2개월 인프라 구축, 3–5개월 관제 최적화, 6개월 성과 도출까지 현장 운영 순서를 관리합니다.'
}: {
  title?: string
  subtitle?: string
}) {
  const [phases, setPhases] = useState<Phase[]>([])
  const [roles, setRoles] = useState<RoleGuide[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [trainings, setTrainings] = useState<TrainingLog[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, completed: 0, pending: 0, progressRate: 0, trainings: 0, attendees: 0 })
  const [activePhase, setActivePhase] = useState('all')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [completedBy, setCompletedBy] = useState('운영실')
  const [trainingForm, setTrainingForm] = useState({
    trainingType: 'orientation',
    audience: 'ops',
    trainerName: '운영실',
    attendeeCount: '0',
    sessionDate: new Date().toISOString().slice(0, 10),
    note: ''
  })

  const visibleChecklist = useMemo(() => {
    if (activePhase === 'all') return checklist
    return checklist.filter((item) => item.phase_key === activePhase)
  }, [checklist, activePhase])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/gov-pilot-manual', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '실증 운영 매뉴얼을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setPhases(Array.isArray(data.phases) ? data.phases : [])
      setRoles(Array.isArray(data.roles) ? data.roles : [])
      setChecklist(Array.isArray(data.checklist) ? data.checklist : [])
      setTrainings(Array.isArray(data.trainings) ? data.trainings : [])
      setMetrics(data.metrics || { total: 0, completed: 0, pending: 0, progressRate: 0, trainings: 0, attendees: 0 })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '실증 운영 매뉴얼을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-pilot-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        await load()
        return
      }

      setMessage(data.message || '처리되었습니다.')
      setDebug(JSON.stringify(data, null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function downloadCsv() {
    const rows = [
      ['phase', 'role', 'title', 'status', 'completed_by', 'completed_at', 'note'],
      ...checklist.map((item) => [
        item.phase_key,
        roleLabel(item.role_key),
        item.title,
        item.status,
        item.completed_by || '',
        item.completed_at || '',
        item.note || ''
      ])
    ]

    const csv = rows
      .map((row) => row.map((value) => '"' + String(value || '').replace(/"/g, '""') + '"').join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anbu-pilot-manual-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            실증 운영 매뉴얼
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            {subtitle}
          </p>

          <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
            이 화면은 지자체 담당자, 생활지원사, 요양보호사, 운영실이 같은 운영 순서를 보도록 만드는 실증용 매뉴얼입니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => post('seedProgress')}
              disabled={loading}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              체크리스트 초기화
            </button>

            <button
              onClick={downloadCsv}
              disabled={checklist.length === 0}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              체크리스트 CSV
            </button>

            <button
              onClick={() => window.print()}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              인쇄/PDF
            </button>

            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              새로고침
            </button>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#2AA897] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]" open>
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
          <MetricCard title="진행률" value={`${metrics.progressRate}%`} desc="체크리스트 완료율" danger={metrics.progressRate < 50} />
          <MetricCard title="전체 항목" value={`${metrics.total}개`} desc="실증 운영 항목" />
          <MetricCard title="완료" value={`${metrics.completed}개`} desc="완료 처리" />
          <MetricCard title="대기" value={`${metrics.pending}개`} desc="남은 항목" danger={metrics.pending > 0} />
          <MetricCard title="교육 기록" value={`${metrics.trainings}건`} desc="실무 교육" />
          <MetricCard title="교육 인원" value={`${metrics.attendees}명`} desc="누적 참석자" />
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">3단계 실증 운영 시나리오</h2>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {phases.map((phase) => (
              <article key={phase.key} className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
                <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#2AA897] ring-1 ring-[#D6EDE7]">
                  {phase.period}
                </div>

                <h3 className="mt-4 text-xl font-black tracking-[-0.05em]">{phase.title}</h3>

                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                  {phase.objective}
                </p>

                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-bold leading-7 text-[#17443F]">
                  {phase.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">역할별 운영 책임</h2>

          <div className="mt-5 grid gap-3 lg:grid-cols-4">
            {roles.map((role) => (
              <article key={role.key} className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
                <h3 className="text-xl font-black tracking-[-0.05em]">{role.title}</h3>
                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{role.mission}</p>

                <ul className="mt-4 space-y-2 text-sm font-bold leading-7">
                  {role.tasks.map((task) => (
                    <li key={task}>• {task}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.06em]">실증 체크리스트</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                항목을 완료 처리하면 실증 진행률에 반영됩니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActivePhase('all')}
                className={
                  'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
                  (activePhase === 'all' ? 'bg-[#247A71] text-white ring-[#247A71]' : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                }
              >
                전체
              </button>

              {phases.map((phase) => (
                <button
                  key={phase.key}
                  type="button"
                  onClick={() => setActivePhase(phase.key)}
                  className={
                    'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
                    (activePhase === phase.key ? 'bg-[#247A71] text-white ring-[#247A71]' : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                  }
                >
                  {phase.period}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {visibleChecklist.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                체크리스트가 없습니다. 체크리스트 초기화를 먼저 실행하세요.
              </div>
            ) : (
              visibleChecklist.map((item) => (
                <article key={item.step_key} className={'rounded-2xl p-4 ring-1 ' + statusClass(item.status)}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {item.status === 'done' ? '완료' : '대기'}
                        </span>
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {roleLabel(item.role_key)}
                        </span>
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {item.phase_key}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{item.title}</h3>
                      <p className="mt-2 text-sm font-bold leading-7 opacity-80">{item.note || item.description}</p>

                      {item.completed_at ? (
                        <p className="mt-2 text-xs font-bold opacity-70">
                          완료자 {item.completed_by || '-'} · {item.completed_at}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid min-w-44 gap-2">
                      <button
                        onClick={() => post('markStep', {
                          stepKey: item.step_key,
                          status: 'done',
                          completedBy
                        })}
                        disabled={loading || item.status === 'done'}
                        className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                      >
                        완료 처리
                      </button>

                      <button
                        onClick={() => post('markStep', {
                          stepKey: item.step_key,
                          status: 'pending',
                          completedBy
                        })}
                        disabled={loading || item.status !== 'done'}
                        className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                      >
                        대기 전환
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">교육 기록 추가</h2>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#637B76]">완료 처리자</span>
                <input
                  value={completedBy}
                  onChange={(event) => setCompletedBy(event.target.value)}
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#637B76]">교육 유형</span>
                <select
                  value={trainingForm.trainingType}
                  onChange={(event) => setTrainingForm({ ...trainingForm, trainingType: event.target.value })}
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                >
                  <option value="orientation">초기 오리엔테이션</option>
                  <option value="dashboard">관제 대시보드 교육</option>
                  <option value="privacy">개인정보·동의 교육</option>
                  <option value="incident">사건 대응 교육</option>
                  <option value="report">보고서·제출 교육</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#637B76]">대상</span>
                <select
                  value={trainingForm.audience}
                  onChange={(event) => setTrainingForm({ ...trainingForm, audience: event.target.value })}
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                >
                  <option value="gov">지자체 담당자</option>
                  <option value="ops">운영실</option>
                  <option value="careWorker">생활지원사·요양보호사</option>
                  <option value="guardian">보호자</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#637B76]">강사/진행자</span>
                <input
                  value={trainingForm.trainerName}
                  onChange={(event) => setTrainingForm({ ...trainingForm, trainerName: event.target.value })}
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#637B76]">참석 인원</span>
                  <input
                    value={trainingForm.attendeeCount}
                    onChange={(event) => setTrainingForm({ ...trainingForm, attendeeCount: event.target.value.replace(/[^\d]/g, '') })}
                    className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#637B76]">교육일</span>
                  <input
                    type="date"
                    value={trainingForm.sessionDate}
                    onChange={(event) => setTrainingForm({ ...trainingForm, sessionDate: event.target.value })}
                    className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#637B76]">교육 메모</span>
                <textarea
                  value={trainingForm.note}
                  onChange={(event) => setTrainingForm({ ...trainingForm, note: event.target.value })}
                  className="min-h-24 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />
              </label>

              <button
                onClick={() => post('addTrainingLog', trainingForm)}
                disabled={loading}
                className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                교육 기록 저장
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">최근 교육 기록</h2>

            <div className="mt-5 space-y-3">
              {trainings.length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 교육 기록이 없습니다.
                </div>
              ) : (
                trainings.slice(0, 20).map((training) => (
                  <article key={training.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-xs font-black text-[#2AA897]">
                      {roleLabel(training.audience || '')} · {training.training_type || '교육'}
                    </div>
                    <div className="mt-2 text-sm font-black leading-7">
                      {training.trainer_name || '-'} · {training.attendee_count || 0}명 · {training.session_date || ''}
                    </div>
                    <div className="mt-1 text-xs font-bold leading-6 text-[#637B76]">{training.note || '-'}</div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>

        <div className="grid gap-3 sm:grid-cols-5">
          <Link href="/gov/submission-package" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
            제출 패키지
          </Link>
          <Link href="/gov/reports" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            운영보고서
          </Link>
          <Link href="/gov/cases" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            사건 이력
          </Link>
          <Link href="/ops/households" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            대상자 관리
          </Link>
          <button onClick={load} className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

export default GovPilotManualPanel
