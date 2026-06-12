'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type ChecklistItem = {
  key: string
  title: string
  desc: string
  href: string
  autoStatus: string
  reason: string
  manualStatus: string
  manualNote: string
  manualBy: string
  manualKst: string
  finalStatus: string
}

type RunRow = {
  id: string
  runDate: string
  action: string
  stepKey: string
  stepTitle: string
  status: string
  note: string
  createdBy: string
  createdKst: string
}

type SignalRow = {
  id: string
  familyCode: string
  parentName: string
  signalLabel: string
  riskLevel: string
  status: string
  createdKst: string
}

type MessageRow = {
  id: string
  familyCode: string
  toName: string
  toPhone: string
  title: string
  status: string
  provider: string
  createdKst: string
}

function toneClass(tone?: string) {
  if (['pass', 'completed', 'ok', 'safe'].includes(tone || '')) return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (['warning', 'manual'].includes(tone || '')) return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (['danger', 'failed', 'blocked'].includes(tone || '')) return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function statusLabel(status: string) {
  if (status === 'pass') return '자동 통과'
  if (status === 'completed') return '완료'
  if (status === 'ok') return '정상'
  if (status === 'warning') return '주의'
  if (status === 'manual') return '수동 확인'
  if (status === 'blocked') return '보류'
  return status || '확인'
}

function MetricCard({ title, value, desc, tone }: { title: string; value: string; desc: string; tone?: string }) {
  return (
    <article className={'rounded-[1.6rem] p-5 shadow-sm ring-1 ' + toneClass(tone)}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={'inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ' + toneClass(tone)}>
      {children}
    </span>
  )
}

export function TodayRunbookPanel() {
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [summary, setSummary] = useState<Record<string, any>>({})
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [runs, setRuns] = useState<RunRow[]>([])
  const [recentSignals, setRecentSignals] = useState<SignalRow[]>([])
  const [recentMessages, setRecentMessages] = useState<MessageRow[]>([])
  const [activeTab, setActiveTab] = useState<'checklist' | 'metrics' | 'recent' | 'runs'>('checklist')
  const [createdBy, setCreatedBy] = useState('운영실')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const overallTone = useMemo(() => {
    if (Number(summary.warning || 0) > 0) return 'warning'
    if (Number(summary.pass || 0) >= Number(summary.total || 1)) return 'safe'
    return 'manual'
  }, [summary])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/today-runbook', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '오늘 실증 운영 상태를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMetrics(data.metrics || {})
      setSummary(data.summary || {})
      setChecklist(Array.isArray(data.checklist) ? data.checklist : [])
      setRuns(Array.isArray(data.runs) ? data.runs : [])
      setRecentSignals(Array.isArray(data.recentSignals) ? data.recentSignals : [])
      setRecentMessages(Array.isArray(data.recentMessages) ? data.recentMessages : [])
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '오늘 실증 운영 상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(body: Record<string, unknown>) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/today-runbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, createdBy, note })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '저장에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '저장했습니다.')
      setDebug(JSON.stringify(result, null, 2))
      setNote('')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function markStep(item: ChecklistItem, status: string) {
    await post({
      action: 'markStep',
      stepKey: item.key,
      stepTitle: item.title,
      status,
      metrics
    })
  }

  async function saveDailySummary() {
    await post({
      action: 'saveDailySummary'
    })
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            오늘 실증 운영센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                오늘 무엇을 만져야 하는지
                <br />
                순서대로 확인합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                가입, 동의, 실증 가구, 안부 신호, 보호자 리포트, 미응답, 문자 비용, 실증 리포트를 매일 같은 순서로 점검합니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + toneClass(overallTone)}>
              <div className="text-sm font-black opacity-70">오늘 상태</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">
                {overallTone === 'safe' ? '좋음' : overallTone === 'warning' ? '주의' : '확인'}
              </div>
              <div className="mt-2 text-xs font-bold">
                {Number(summary.pass || 0)}/{Number(summary.total || 0)} 완료
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            실증 운영은 기능을 많이 누르는 것이 아니라, 오늘의 증거를 남기는 것입니다. 1가구, 안부 1건, 리포트 1회, 문자 1건부터 확인하세요.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <input
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              placeholder="처리자"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="메모, 선택"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <button onClick={load} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              새로고침
            </button>

            <button onClick={saveDailySummary} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              오늘 요약 저장
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/admin/ops/pilot-report" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              실증 리포트
            </Link>
            <Link href="/admin/ops/no-response" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              미응답 처리
            </Link>
            <Link href="/admin/ops/sms-budget-guard" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              문자 비용 보호
            </Link>
            <Link href="/admin/ops" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 홈
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white">
              <summary className="cursor-pointer text-sm font-black">상세 결과 보기</summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="가입자" value={`${Number(metrics.totalUsers || 0)}명`} desc="전체" tone="safe" />
          <MetricCard title="최근 24시간" value={`${Number(metrics.users24h || 0)}명`} desc="신규 가입" tone="safe" />
          <MetricCard title="동의 기록" value={`${Number(metrics.consentRecords || 0)}건`} desc="실증 동의" tone={Number(metrics.consentRecords || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="실증 가구" value={`${Number(metrics.totalFamilies || 0)}가구`} desc="운영 대상" tone={Number(metrics.totalFamilies || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="오늘 안부" value={`${Number(metrics.todayCareSignals || 0)}건`} desc="신호" tone={Number(metrics.todayCareSignals || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="미응답" value={`${Number(metrics.todayNoResponseFamilies || 0)}가구`} desc="확인 필요" tone={Number(metrics.todayNoResponseFamilies || 0) > 0 ? 'warning' : 'safe'} />
          <MetricCard title="리포트 성공" value={`${Number(metrics.todayReportSuccess || 0)}건`} desc="오늘 조회" tone={Number(metrics.todayReportSuccess || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="문자 실패" value={`${Number(metrics.failedMessages || 0)}건`} desc="정리 필요" tone={Number(metrics.failedMessages || 0) > 0 ? 'danger' : 'safe'} />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              ['checklist', '오늘 할 일'],
              ['metrics', '전체 지표'],
              ['recent', '최근 기록'],
              ['runs', '저장 기록']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={
                  'rounded-2xl px-4 py-4 text-sm font-black ring-1 ' +
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

        {activeTab === 'checklist' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">오늘 할 일</h2>

            <div className="mt-5 space-y-3">
              {checklist.map((item, index) => (
                <article key={item.key} className={'rounded-2xl p-4 ring-1 ' + toneClass(item.finalStatus)}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Pill tone={item.finalStatus}>{statusLabel(item.finalStatus)}</Pill>
                        <Pill>{index + 1}순서</Pill>
                        {item.manualKst ? <Pill tone="safe">{item.manualBy || '운영실'} · {item.manualKst}</Pill> : null}
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{item.title}</h3>
                      <p className="mt-2 text-sm font-bold leading-7 opacity-80">
                        {item.desc}
                        <br />
                        기준: {item.reason}
                      </p>

                      {item.manualNote ? (
                        <p className="mt-2 rounded-2xl bg-white/70 p-3 text-sm font-black leading-7">
                          메모: {item.manualNote}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
                      <Link href={item.href} className="rounded-xl bg-white px-4 py-3 text-center text-xs font-black text-[#17443F] ring-1 ring-current/10">
                        이동
                      </Link>
                      <button disabled={loading} onClick={() => markStep(item, 'completed')} className="rounded-xl bg-[#247A71] px-4 py-3 text-xs font-black text-white disabled:opacity-50">
                        완료 표시
                      </button>
                      <button disabled={loading} onClick={() => markStep(item, 'warning')} className="rounded-xl bg-white px-4 py-3 text-xs font-black text-[#795C22] ring-1 ring-[#F3DEB5] disabled:opacity-50">
                        주의 표시
                      </button>
                      <button disabled={loading} onClick={() => markStep(item, 'blocked')} className="rounded-xl bg-white px-4 py-3 text-xs font-black text-[#8A3030] ring-1 ring-[#F3C8C8] disabled:opacity-50">
                        보류 표시
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'metrics' ? (
          <section className="grid gap-5 xl:grid-cols-3">
            <MetricGroup
              title="가입·역할"
              rows={[
                ['전체 가입자', metrics.totalUsers],
                ['최근 24시간 가입자', metrics.users24h],
                ['인증 완료', metrics.confirmedUsers],
                ['로그인 완료', metrics.signedInUsers],
                ['역할 미분류', metrics.unknownRoleUsers],
                ['보호자', metrics.guardianUsers],
                ['부모님', metrics.parentUsers],
                ['파트너', metrics.providerUsers]
              ]}
            />

            <MetricGroup
              title="실증·안부"
              rows={[
                ['실증 가구', metrics.pilotHouseholds],
                ['가족 연결', metrics.familyLinks],
                ['전체 가족코드', metrics.totalFamilies],
                ['누적 안부 신호', metrics.careSignals],
                ['오늘 안부 신호', metrics.todayCareSignals],
                ['오늘 미응답 가구', metrics.todayNoResponseFamilies],
                ['긴급 신호', metrics.urgentSignals]
              ]}
            />

            <MetricGroup
              title="문자·리포트"
              rows={[
                ['문자 대기', metrics.queuedMessages],
                ['오늘 문자 성공', metrics.sentTodayMessages],
                ['오늘 문자 실패', metrics.failedTodayMessages],
                ['누적 문자 실패', metrics.failedMessages],
                ['오늘 리포트 성공', metrics.todayReportSuccess],
                ['오늘 리포트 실패', metrics.todayReportFailed],
                ['부모님 링크 복사', metrics.parentLinkCopied],
                ['실증 리포트 저장', metrics.pilotReportSnapshots]
              ]}
            />
          </section>
        ) : null}

        {activeTab === 'recent' ? (
          <section className="grid gap-5 xl:grid-cols-2">
            <RecentList
              title="최근 안부 신호"
              empty="안부 신호가 없습니다."
              items={recentSignals.map((item) => ({
                id: item.id,
                title: `${item.familyCode || '-'} · ${item.signalLabel || '-'}`,
                meta: `${item.parentName || '부모님'} · ${item.status || '-'} · ${item.createdKst || '-'}`,
                tone: item.riskLevel === 'high' ? 'danger' : item.riskLevel === 'medium' ? 'warning' : 'safe'
              }))}
            />

            <RecentList
              title="최근 문자 기록"
              empty="문자 기록이 없습니다."
              items={recentMessages.map((item) => ({
                id: item.id,
                title: item.title || '안부웍스 알림',
                meta: `${item.toName || '-'} · ${item.toPhone || '-'} · ${item.status || '-'} · ${item.createdKst || '-'}`,
                tone: item.status === 'failed' ? 'danger' : item.status === 'queued' ? 'warning' : 'safe'
              }))}
            />
          </section>
        ) : null}

        {activeTab === 'runs' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">오늘 저장 기록</h2>

            <div className="mt-5 space-y-3">
              {runs.length ? (
                runs.map((run) => (
                  <article key={run.id} className={'rounded-2xl p-4 ring-1 ' + toneClass(run.status)}>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={run.status}>{statusLabel(run.status)}</Pill>
                      <Pill>{run.action}</Pill>
                      <Pill>{run.createdBy || '운영실'} · {run.createdKst}</Pill>
                    </div>

                    <h3 className="mt-3 text-lg font-black">{run.stepTitle || run.stepKey}</h3>

                    {run.note ? (
                      <p className="mt-2 text-sm font-bold leading-7 opacity-80">{run.note}</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 오늘 저장한 운영 기록이 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function MetricGroup({ title, rows }: { title: string; rows: Array<[string, unknown]> }) {
  return (
    <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
      <h2 className="text-3xl font-black tracking-[-0.06em]">{title}</h2>

      <div className="mt-5 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
            <div className="text-sm font-black">{label}</div>
            <div className="text-lg font-black">{String(value ?? 0)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function RecentList({
  title,
  empty,
  items
}: {
  title: string
  empty: string
  items: Array<{ id: string; title: string; meta: string; tone: string }>
}) {
  return (
    <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
      <h2 className="text-3xl font-black tracking-[-0.06em]">{title}</h2>

      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className={'rounded-2xl p-4 ring-1 ' + toneClass(item.tone)}>
              <h3 className="text-lg font-black">{item.title}</h3>
              <p className="mt-2 text-sm font-bold leading-7 opacity-80">{item.meta}</p>
            </article>
          ))
        ) : (
          <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
            {empty}
          </div>
        )}
      </div>
    </section>
  )
}

export default TodayRunbookPanel
