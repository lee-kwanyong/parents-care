'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type DemoRun = {
  id: string
  scenario_key?: string
  scenario_label?: string
  demo_phone?: string
  status?: string
  family_code?: string
  summary?: string
  created_at?: string
  completed_at?: string
  cleaned_at?: string
}

type Metrics = {
  demoRuns: number
  createdRuns: number
  completedRuns: number
  cleanedRuns: number
  demoHouseholds: number
  demoRequests: number
  demoProviders: number
  demoOutbox: number
  queuedDemoOutbox: number
}

function phoneOnly(value: string) {
  return value.replace(/[^\d]/g, '')
}

function statusLabel(status?: string) {
  if (status === 'created') return '생성됨'
  if (status === 'completed') return '완료됨'
  if (status === 'cleaned') return '정리됨'
  return status || '기록'
}

function statusClass(status?: string) {
  if (status === 'completed') return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
  if (status === 'cleaned') return 'bg-[#FAFFFD] text-[#637B76] ring-[#D6EDE7]'
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

export function GovDemoRunnerPanel({
  title = '지자체 실증 시연 모드',
  subtitle = '버튼 하나로 A그룹 대상자, 도움 요청 사건, 도움망, 문자 대기열, 타임라인, 보고서 반영 흐름을 생성합니다.'
}: {
  title?: string
  subtitle?: string
}) {
  const [demoPhone, setDemoPhone] = useState('')
  const [serviceArea, setServiceArea] = useState('데모동')
  const [scenarioKey, setScenarioKey] = useState('urgent_full')
  const [runs, setRuns] = useState<DemoRun[]>([])
  const [latestRun, setLatestRun] = useState<DemoRun | null>(null)
  const [metrics, setMetrics] = useState<Metrics>({ demoRuns: 0, createdRuns: 0, completedRuns: 0, cleanedRuns: 0, demoHouseholds: 0, demoRequests: 0, demoProviders: 0, demoOutbox: 0, queuedDemoOutbox: 0 })
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/gov-demo-runner', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '시연 기록을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setRuns(Array.isArray(data.runs) ? data.runs : [])
      setLatestRun(data.latestRun || null)
      setMetrics(data.metrics || { demoRuns: 0, createdRuns: 0, completedRuns: 0, cleanedRuns: 0, demoHouseholds: 0, demoRequests: 0, demoProviders: 0, demoOutbox: 0, queuedDemoOutbox: 0 })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '시연 기록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-demo-runner', {
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

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            실증 시연 모드
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            {subtitle}
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            시연 모드는 실제 문자 발송이 아니라 문자 대기열을 생성합니다. 발송하려면 알림 발송센터에서 직접 실행하세요.
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <input
              value={demoPhone}
              onChange={(event) => setDemoPhone(phoneOnly(event.target.value))}
              inputMode="tel"
              placeholder="시연용 수신번호 예: 01012345678"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
            />

            <input
              value={serviceArea}
              onChange={(event) => setServiceArea(event.target.value)}
              placeholder="권역 예: 데모동"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
            />

            <select
              value={scenarioKey}
              onChange={(event) => setScenarioKey(event.target.value)}
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
            >
              <option value="urgent_full">전체 흐름 시연</option>
              <option value="urgent_only">긴급 도움 요청만</option>
            </select>

            <button
              onClick={() => post('runScenario', { demoPhone, serviceArea, scenarioKey })}
              disabled={loading || !demoPhone}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              시연 데이터 생성
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => post('fastForward', { runId: latestRun?.id })}
              disabled={loading || !latestRun}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              시연 완료 처리
            </button>

            <button
              onClick={() => post('cleanupDemo')}
              disabled={loading || metrics.demoRuns === 0}
              className="rounded-2xl bg-[#FFF4F4] px-5 py-4 text-sm font-black text-[#8A3030] ring-1 ring-[#F3C8C8] disabled:opacity-50"
            >
              시연 데이터 정리
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

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="시연 실행" value={`${metrics.demoRuns}회`} desc="누적 시연" />
          <MetricCard title="생성됨" value={`${metrics.createdRuns}회`} desc="진행 중" danger={metrics.createdRuns > 0} />
          <MetricCard title="완료됨" value={`${metrics.completedRuns}회`} desc="완료 처리" />
          <MetricCard title="정리됨" value={`${metrics.cleanedRuns}회`} desc="데이터 정리" />
          <MetricCard title="대상자" value={`${metrics.demoHouseholds}명`} desc="데모 대상자" />
          <MetricCard title="사건" value={`${metrics.demoRequests}건`} desc="데모 사건" />
          <MetricCard title="도움망" value={`${metrics.demoProviders}명`} desc="데모 도움망" />
          <MetricCard title="문자 대기" value={`${metrics.queuedDemoOutbox}건`} desc="발송센터 확인" danger={metrics.queuedDemoOutbox > 0} />
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">시연 순서</h2>

          <div className="mt-5 overflow-x-auto">
            <div className="flex min-w-max items-center gap-3">
              <FlowStep number="1" title="대상자 생성" desc="A그룹 고위험 어르신" />
              <FlowArrow />
              <FlowStep number="2" title="사건 생성" desc="도움 요청·식사·복약" />
              <FlowArrow />
              <FlowStep number="3" title="도움망 요청" desc="돌봄·요양·식사·약국" />
              <FlowArrow />
              <FlowStep number="4" title="문자 대기열" desc="보호자·도움망 알림" />
              <FlowArrow />
              <FlowStep number="5" title="타임라인" desc="사건 처리 증적" />
              <FlowArrow />
              <FlowStep number="6" title="보고서 반영" desc="제출 패키지 확인" />
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">최근 시연 기록</h2>

            <div className="mt-5 space-y-3">
              {runs.length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 시연 기록이 없습니다.
                </div>
              ) : (
                runs.slice(0, 20).map((run) => (
                  <article key={run.id} className={'rounded-2xl p-4 ring-1 ' + statusClass(run.status)}>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                        {statusLabel(run.status)}
                      </span>
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                        가족코드 {run.family_code || '-'}
                      </span>
                    </div>

                    <div className="mt-3 text-lg font-black tracking-[-0.04em]">{run.scenario_label || '시연'}</div>
                    <div className="mt-2 text-sm font-bold leading-7 opacity-80">
                      {run.summary || '-'}
                      <br />
                      생성 {run.created_at || '-'} · 완료 {run.completed_at || '-'} · 정리 {run.cleaned_at || '-'}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">시연 후 확인 화면</h2>

            <div className="mt-5 grid gap-3">
              <Link href="/admin/ops/incidents" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
                사건 타임라인 확인
              </Link>
              <Link href="/admin/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                알림 발송센터 확인
              </Link>
              <Link href="/provider/requests" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                도움망 요청함 확인
              </Link>
              <Link href="/gov/reports" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                운영보고서 확인
              </Link>
              <Link href="/gov/submission-package" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                제출 패키지 확인
              </Link>
            </div>

            <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
              발표 순서 추천:
              <br />
              1. 시연 데이터 생성
              <br />
              2. 사건 타임라인 확인
              <br />
              3. 알림 발송센터에서 문자 대기열 확인
              <br />
              4. 시연 완료 처리
              <br />
              5. 운영보고서와 제출 패키지 확인
            </div>
          </section>
        </section>

        <div className="grid gap-3 sm:grid-cols-5">
          <Link href="/admin/ops/incidents" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
            사건 타임라인
          </Link>
          <Link href="/admin/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            알림 발송센터
          </Link>
          <Link href="/gov/reports" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            운영보고서
          </Link>
          <Link href="/gov/submission-package" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            제출 패키지
          </Link>
          <button onClick={load} className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

function FlowStep({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex min-w-[14rem] items-center gap-3 rounded-full bg-[#247A71] px-4 py-3 text-white">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#17443F]">
        {number}
      </div>
      <div>
        <div className="text-sm font-black">{title}</div>
        <div className="mt-1 text-xs font-bold text-white/65">{desc}</div>
      </div>
    </div>
  )
}

function FlowArrow() {
  return <div className="text-2xl font-black text-[#17443F]/30">→</div>
}

export default GovDemoRunnerPanel
