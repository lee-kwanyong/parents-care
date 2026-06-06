'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type ChecklistItem = {
  id: string
  title: string
  ok: boolean
  detail: string
  status: string
}

type FileItem = {
  name: string
  label: string
  mime: string
  content: string
  rows: number
}

type RecentPackage = {
  id: string
  title?: string
  period_start?: string
  period_end?: string
  status?: string
  ready_score?: number
  created_at?: string
}

type SubmissionPackage = {
  ok: boolean
  title: string
  period: {
    key: string
    start: string
    end: string
  }
  readyScore: number
  summary: string
  summaryLines: string[]
  checklist: ChecklistItem[]
  metrics: Record<string, number>
  files: FileItem[]
  filesManifest: Array<{
    name: string
    label: string
    mime: string
    rows: number
  }>
  recentPackages: RecentPackage[]
  generatedAt: string
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

function formatNumber(value: number | undefined) {
  return Number(value || 0).toLocaleString('ko-KR')
}

function downloadFile(file: FileItem) {
  const blob = new Blob([file.content], { type: file.mime + ';charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
}

export function GovSubmissionPackagePanel({
  title = '지자체 제출 패키지',
  subtitle = '대상자 현황, 운영보고서, 사건 처리 이력, 알림 기록, 개인정보 감사 로그를 하나의 제출 묶음으로 생성합니다.'
}: {
  title?: string
  subtitle?: string
}) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'last30' | 'custom'>('week')
  const [customStart, setCustomStart] = useState(new Date().toISOString().slice(0, 10))
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10))
  const [pkg, setPkg] = useState<SubmissionPackage | null>(null)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const metrics = pkg?.metrics || {}

  const readyLabel = useMemo(() => {
    if (!pkg) return '확인 전'
    if (pkg.readyScore >= 90) return '제출 가능'
    if (pkg.readyScore >= 70) return '보완 후 제출'
    return '점검 필요'
  }, [pkg])

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

      const response = await fetch('/api/gov-submission-package?' + params.toString(), { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '제출 패키지를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setPkg(data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '제출 패키지를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function savePackage() {
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

      const response = await fetch('/api/gov-submission-package?' + params.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'savePackage' })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '제출 패키지 저장에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMessage(data.message || '제출 패키지를 저장했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '제출 패키지 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function downloadAll() {
    if (!pkg) return

    pkg.files.forEach((file, index) => {
      setTimeout(() => downloadFile(file), index * 250)
    })
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
            지자체 제출 묶음
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            {subtitle}
          </p>

          <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
            이 화면은 제출 준비용 패키지입니다. 실제 제출 전에는 개인정보 동의 상태와 열람 로그, 사건 타임라인, 운영보고서가 모두 준비되었는지 확인하세요.
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
              onClick={savePackage}
              disabled={loading || !pkg}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              제출 패키지 저장
            </button>

            <button
              onClick={downloadAll}
              disabled={!pkg}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              전체 파일 다운로드
            </button>

            <button
              onClick={() => window.print()}
              disabled={!pkg}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              인쇄/PDF 저장
            </button>

            <Link href="/gov/reports" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영보고서
            </Link>

            <Link href="/gov/privacy-audit" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              개인정보 감사
            </Link>
          </div>

          {pkg ? (
            <div className={'mt-5 rounded-2xl p-4 text-sm font-black leading-7 ring-1 ' + (pkg.readyScore >= 80 ? 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]' : 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]')}>
              제출 준비도: {pkg.readyScore}점 · {readyLabel}
              <br />
              보고 기간: {pkg.period.start} ~ {pkg.period.end} · 생성시각: {pkg.generatedAt}
            </div>
          ) : null}

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#2AA897] ring-1 ring-[#CDEFE7]">
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

        {pkg ? (
          <>
            <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
              <MetricCard title="준비도" value={`${pkg.readyScore}점`} desc={readyLabel} danger={pkg.readyScore < 80} />
              <MetricCard title="운영 가구" value={`${formatNumber(metrics.activeHouseholds)}명`} desc="제출 대상" danger={!metrics.activeHouseholds} />
              <MetricCard title="A그룹" value={`${formatNumber(metrics.groupA)}명`} desc="고위험" danger={metrics.groupA > 0} />
              <MetricCard title="동의 대기" value={`${formatNumber(metrics.consentPending)}명`} desc="확인 필요" danger={metrics.consentPending > 0} />
              <MetricCard title="사건" value={`${formatNumber(metrics.requests)}건`} desc="기간 내 처리" />
              <MetricCard title="긴급" value={`${formatNumber(metrics.urgentRequests)}건`} desc="위험 신호" danger={metrics.urgentRequests > 0} />
              <MetricCard title="개인정보 로그" value={`${formatNumber(metrics.privacyLogs)}건`} desc="감사 기록" danger={!metrics.privacyLogs} />
              <MetricCard title="파일" value={`${pkg.files.length}개`} desc="제출 묶음" />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">제출 요약</h2>

                <div className="mt-5 space-y-3">
                  {pkg.summaryLines.map((line, index) => (
                    <div key={index} className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black leading-7 ring-1 ring-[#D6EDE7]">
                      {index + 1}. {line}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">제출 체크리스트</h2>

                <div className="mt-5 space-y-3">
                  {pkg.checklist.map((item) => (
                    <div
                      key={item.id}
                      className={
                        'rounded-2xl p-4 ring-1 ' +
                        (item.ok ? 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]' : 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]')
                      }
                    >
                      <div className="text-sm font-black">{item.ok ? '준비됨' : '점검 필요'} · {item.title}</div>
                      <div className="mt-1 text-xs font-bold leading-6 opacity-75">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </section>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">제출 파일 묶음</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                각 파일은 CSV 또는 JSON으로 저장됩니다. 필요하면 전체 파일 다운로드를 누르세요.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {pkg.files.map((file) => (
                  <article key={file.name} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-lg font-black tracking-[-0.04em]">{file.label}</div>
                        <div className="mt-2 text-xs font-bold leading-6 text-[#637B76]">
                          {file.name}
                          <br />
                          {file.rows}행 · {file.mime}
                        </div>
                      </div>

                      <button
                        onClick={() => downloadFile(file)}
                        className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white"
                      >
                        다운로드
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">최근 저장된 제출 패키지</h2>

              <div className="mt-5 space-y-3">
                {pkg.recentPackages.length === 0 ? (
                  <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                    아직 저장된 제출 패키지가 없습니다.
                  </div>
                ) : (
                  pkg.recentPackages.slice(0, 10).map((item) => (
                    <article key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                      <div className="text-sm font-black">{item.title || '제출 패키지'}</div>
                      <div className="mt-1 text-xs font-bold leading-6 text-[#637B76]">
                        {item.period_start || ''} ~ {item.period_end || ''} · 준비도 {item.ready_score || 0}점 · {item.status || '-'}
                        <br />
                        {item.created_at || ''}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="text-2xl font-black">제출 패키지를 불러오는 중입니다.</div>
          </section>
        )}

        <div className="grid gap-3 sm:grid-cols-5">
          <Link href="/gov/reports" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
            운영보고서
          </Link>
          <Link href="/gov/cases" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            사건 이력
          </Link>
          <Link href="/gov/privacy-audit" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            개인정보 감사
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

export default GovSubmissionPackagePanel
