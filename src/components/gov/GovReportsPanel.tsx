'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type ReportMetrics = {
  totalHouseholds: number
  activeHouseholds: number
  groupA: number
  groupB: number
  consentApproved: number
  consentPending: number

  signals: number
  urgentSignals: number
  mealSignals: number
  medicationSignals: number
  conditionSignals: number
  helpSignals: number

  openIncidents: number
  urgentOpenIncidents: number
  completedIncidents: number
  manualNeeded: number
  dispatched: number

  providers: number
  availableProviders: number
  matches: number
  acceptedMatches: number
  matchAcceptanceRate: number
  avgAcceptMinutes: number
  avgCompletionMinutes: number

  smsQueued: number
  smsSent: number
  smsFailed: number
  smsSuccessRate: number

  heartbeatRuns: number
  heartbeatSuccess: number
  heartbeatFailed: number
  autopilotLogs: number
}

type Breakdown = {
  label: string
  count: number
}

type Daily = {
  date: string
  signals: number
  urgent: number
  completed: number
  smsSent: number
  smsFailed: number
}

type RiskHousehold = {
  family_code?: string
  parent_name?: string
  guardian_name?: string
  service_area?: string
  risk_group?: string
  signal_count?: number
  urgent_count?: number
  open_count?: number
  completed_count?: number
  last_signal_label?: string
  last_signal_at?: string
}

type Snapshot = {
  id: string
  title?: string
  period_start?: string
  period_end?: string
  created_at?: string
  summary?: string
}

type Report = {
  ok: boolean
  period: string
  range: {
    start: string
    end: string
  }
  generatedAt: string
  title: string
  summary: string
  summaryLines: string[]
  metrics: ReportMetrics
  typeBreakdown: Breakdown[]
  statusBreakdown: Breakdown[]
  smsBreakdown: Breakdown[]
  daily: Daily[]
  riskHouseholds: RiskHousehold[]
  snapshots: Snapshot[]
}

function formatNumber(value: number | undefined) {
  return Number(value || 0).toLocaleString('ko-KR')
}

function metricDanger(value: number | undefined) {
  return Number(value || 0) > 0
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

function BreakdownList({ title, items }: { title: string; items: Breakdown[] }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
      <h2 className="text-2xl font-black tracking-[-0.05em]">{title}</h2>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
            데이터가 없습니다.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl bg-[#FAFFFD] px-4 py-3 ring-1 ring-[#D6EDE7]">
              <span className="text-sm font-black">{item.label}</span>
              <span className="text-lg font-black text-[#2AA897]">{formatNumber(item.count)}건</span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export function GovReportsPanel({
  title = '지자체 운영보고서',
  subtitle = '실증 대상자, 안부 신호, 후속조치, 도움망, 문자 발송, 자동운영 기록을 지자체 제출용으로 집계합니다.'
}: {
  title?: string
  subtitle?: string
}) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'last30' | 'custom'>('week')
  const [customStart, setCustomStart] = useState(new Date().toISOString().slice(0, 10))
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10))
  const [report, setReport] = useState<Report | null>(null)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const metrics = report?.metrics

  const csvRows = useMemo(() => {
    if (!report) return []

    const rows: string[][] = [
      ['구분', '항목', '값'],
      ['기간', '시작일', report.range.start],
      ['기간', '종료일', report.range.end],
      ['대상자', '운영 중', String(report.metrics.activeHouseholds)],
      ['대상자', 'A그룹', String(report.metrics.groupA)],
      ['대상자', 'B그룹', String(report.metrics.groupB)],
      ['신호', '전체', String(report.metrics.signals)],
      ['신호', '긴급', String(report.metrics.urgentSignals)],
      ['사건', '열린 사건', String(report.metrics.openIncidents)],
      ['사건', '완료 사건', String(report.metrics.completedIncidents)],
      ['도움망', '수락률', String(report.metrics.matchAcceptanceRate)],
      ['문자', '발송 성공', String(report.metrics.smsSent)],
      ['문자', '발송 실패', String(report.metrics.smsFailed)]
    ]

    for (const household of report.riskHouseholds) {
      rows.push([
        '위험가구',
        household.parent_name || '-',
        `가족코드 ${household.family_code || '-'} / 긴급 ${household.urgent_count || 0} / 열린 ${household.open_count || 0}`
      ])
    }

    return rows
  }, [report])

  async function load() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const params = new URLSearchParams()
      params.set('period', period)

      if (period === 'custom') {
        params.set('start', customStart)
        params.set('end', customEnd)
      }

      const response = await fetch('/api/gov-reports?' + params.toString(), { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '운영보고서를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setReport(data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '운영보고서를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function saveSnapshot() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const params = new URLSearchParams()
      params.set('period', period)

      if (period === 'custom') {
        params.set('start', customStart)
        params.set('end', customEnd)
      }

      const response = await fetch('/api/gov-reports?' + params.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveSnapshot' })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '보고서 저장에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMessage(data.message || '운영보고서 스냅샷을 저장했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '보고서 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function downloadCsv() {
    if (!report) return

    const csv = csvRows
      .map((row) => row.map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anbu-gov-report-${report.range.start}-${report.range.end}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            지자체 제출 보고서
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            {subtitle}
          </p>

          <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
            보고서는 실증 성과, 운영 대응, 도움망 연결, 문자 발송, 행정 자동화 근거를 남기기 위한 자료입니다.
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {[
              ['today', '오늘'],
              ['week', '이번 주'],
              ['month', '이번 달'],
              ['last30', '최근 30일'],
              ['custom', '직접 선택']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key as typeof period)}
                className={
                  'rounded-2xl px-5 py-3 text-sm font-black ring-1 ' +
                  (period === key
                    ? 'bg-[#247A71] text-white ring-[#247A71]'
                    : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                }
              >
                {label}
              </button>
            ))}

            {period === 'custom' ? (
              <>
                <input
                  type="date"
                  value={customStart}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-black outline-none"
                />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-black outline-none"
                />
              </>
            ) : null}

            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#FAFFFD] px-5 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              조회
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={saveSnapshot}
              disabled={loading || !report}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              보고서 저장
            </button>

            <button
              onClick={downloadCsv}
              disabled={!report}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              CSV 다운로드
            </button>

            <button
              onClick={() => window.print()}
              disabled={!report}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              인쇄/PDF 저장
            </button>

            <Link href="/ops/households" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              대상자 관리
            </Link>

            <Link href="/ops/autopilot" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              오토파일럿
            </Link>
          </div>

          {report ? (
            <div className="mt-5 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#2AA897] ring-1 ring-[#CDEFE7]">
              보고 기간: {report.range.start} ~ {report.range.end} · 생성시각: {report.generatedAt}
            </div>
          ) : null}

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]" open>
              <summary className="cursor-pointer text-sm font-black">상세 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        {report && metrics ? (
          <>
            <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
              <MetricCard title="관리 가구" value={`${formatNumber(metrics.activeHouseholds)}명`} desc="운영 중 대상자" danger={metrics.activeHouseholds === 0} />
              <MetricCard title="A그룹" value={`${formatNumber(metrics.groupA)}명`} desc="고위험 취약" danger={metrics.groupA > 0} />
              <MetricCard title="B그룹" value={`${formatNumber(metrics.groupB)}명`} desc="일반 관리" />
              <MetricCard title="동의 대기" value={`${formatNumber(metrics.consentPending)}명`} desc="동의 확인 필요" danger={metrics.consentPending > 0} />
              <MetricCard title="안부 신호" value={`${formatNumber(metrics.signals)}건`} desc="기간 내 전체 신호" />
              <MetricCard title="긴급 신호" value={`${formatNumber(metrics.urgentSignals)}건`} desc="즉시 확인" danger={metrics.urgentSignals > 0} />
              <MetricCard title="열린 사건" value={`${formatNumber(metrics.openIncidents)}건`} desc="아직 완료 전" danger={metrics.openIncidents > 0} />
              <MetricCard title="완료 사건" value={`${formatNumber(metrics.completedIncidents)}건`} desc="기간 내 완료" />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">지자체 제출 요약</h2>

                <div className="mt-5 space-y-3">
                  {report.summaryLines.map((line, index) => (
                    <div key={index} className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black leading-7 text-[#17443F] ring-1 ring-[#D6EDE7]">
                      {index + 1}. {line}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">운영 성과</h2>

                <div className="mt-5 space-y-3">
                  <InfoLine label="도움망 등록" value={`${formatNumber(metrics.providers)}명`} />
                  <InfoLine label="가용 도움망" value={`${formatNumber(metrics.availableProviders)}명`} />
                  <InfoLine label="도움망 수락률" value={`${metrics.matchAcceptanceRate}%`} />
                  <InfoLine label="평균 수락 시간" value={`${metrics.avgAcceptMinutes}분`} />
                  <InfoLine label="평균 완료 시간" value={`${metrics.avgCompletionMinutes}분`} />
                  <InfoLine label="문자 성공률" value={`${metrics.smsSuccessRate}%`} />
                  <InfoLine label="Heartbeat 실행" value={`${formatNumber(metrics.heartbeatRuns)}회`} />
                  <InfoLine label="오토파일럿 로그" value={`${formatNumber(metrics.autopilotLogs)}건`} />
                </div>
              </section>
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
              <BreakdownList title="신호 유형별" items={report.typeBreakdown} />
              <BreakdownList title="사건 상태별" items={report.statusBreakdown} />
              <BreakdownList title="문자 상태별" items={report.smsBreakdown} />
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">위험 가구 목록</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                기간 내 신호, 긴급 신호, 열린 사건 기준으로 정렬됩니다.
              </p>

              <div className="mt-5 overflow-x-auto">
                <div className="min-w-[980px] overflow-hidden rounded-2xl ring-1 ring-[#D6EDE7]">
                  <div className="grid grid-cols-[10rem_10rem_10rem_8rem_8rem_8rem_8rem_1fr] gap-3 bg-[#FAFFFD] px-4 py-3 text-xs font-black text-[#637B76]">
                    <div>대상자</div>
                    <div>가족코드</div>
                    <div>권역</div>
                    <div>위험군</div>
                    <div>신호</div>
                    <div>긴급</div>
                    <div>열린</div>
                    <div>최근 신호</div>
                  </div>

                  <div className="divide-y divide-[#D8EEE8] bg-white">
                    {report.riskHouseholds.length === 0 ? (
                      <div className="px-4 py-5 text-sm font-black text-[#637B76]">
                        기간 내 위험 가구 기록이 없습니다.
                      </div>
                    ) : (
                      report.riskHouseholds.map((row) => (
                        <div key={row.family_code || row.parent_name} className="grid grid-cols-[10rem_10rem_10rem_8rem_8rem_8rem_8rem_1fr] gap-3 px-4 py-4 text-sm font-bold text-[#17443F] hover:bg-[#FAFFFD]">
                          <div className="font-black">{row.parent_name || '-'}</div>
                          <div>{row.family_code || '-'}</div>
                          <div>{row.service_area || '-'}</div>
                          <div>{row.risk_group || '-'}</div>
                          <div>{row.signal_count || 0}</div>
                          <div>{row.urgent_count || 0}</div>
                          <div>{row.open_count || 0}</div>
                          <div className="truncate">{row.last_signal_label || '-'} · {row.last_signal_at || ''}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">일자별 운영 추이</h2>

              <div className="mt-5 overflow-x-auto">
                <div className="min-w-[760px] overflow-hidden rounded-2xl ring-1 ring-[#D6EDE7]">
                  <div className="grid grid-cols-[10rem_1fr_1fr_1fr_1fr_1fr] gap-3 bg-[#FAFFFD] px-4 py-3 text-xs font-black text-[#637B76]">
                    <div>일자</div>
                    <div>안부 신호</div>
                    <div>긴급</div>
                    <div>완료</div>
                    <div>문자 성공</div>
                    <div>문자 실패</div>
                  </div>

                  <div className="divide-y divide-[#D8EEE8] bg-white">
                    {report.daily.map((row) => (
                      <div key={row.date} className="grid grid-cols-[10rem_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-sm font-bold">
                        <div className="font-black">{row.date}</div>
                        <div>{row.signals}</div>
                        <div>{row.urgent}</div>
                        <div>{row.completed}</div>
                        <div>{row.smsSent}</div>
                        <div>{row.smsFailed}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">저장된 보고서 스냅샷</h2>

              <div className="mt-5 space-y-3">
                {report.snapshots.length === 0 ? (
                  <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                    아직 저장된 보고서가 없습니다.
                  </div>
                ) : (
                  report.snapshots.slice(0, 10).map((snapshot) => (
                    <article key={snapshot.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                      <div className="text-sm font-black">{snapshot.title || '운영보고서'}</div>
                      <div className="mt-1 text-xs font-bold text-[#637B76]">
                        {snapshot.period_start || ''} ~ {snapshot.period_end || ''} · {snapshot.created_at || ''}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="text-2xl font-black">보고서를 불러오는 중입니다.</div>
          </section>
        )}
      </section>
    </main>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#FAFFFD] px-4 py-3 ring-1 ring-[#D6EDE7]">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <span className="text-lg font-black text-[#17443F]">{value}</span>
    </div>
  )
}

export default GovReportsPanel
