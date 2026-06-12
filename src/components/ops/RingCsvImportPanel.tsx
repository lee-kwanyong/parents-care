'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'

type Report = {
  id: string
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhoneLast4: string
  parentPhoneLast4: string
  reportDate: string
  overallStatus: string
  anbuScore: number
  summaryText: string
  recommendedAction: string
  dataQualityScore: number
  shareMessage: string
  createdKst: string
}

type Batch = {
  id: string
  sourceName: string
  fileName: string
  rowCount: number
  successCount: number
  failedCount: number
  createdBy: string
  createdKst: string
  errors: unknown[]
}

const SAMPLE_CSV = `familyCode,parentName,guardianName,guardianPhone,parentPhone,reportDate,sleepMinutes,baselineSleepMinutes,steps,baselineSteps,restingHr,baselineRestingHr,hrv,baselineHrv,spo2,baselineSpo2,temperatureDelta,wearMinutes,batteryLevel,deviceId,deviceModel,vendor,notes
123456,어머니,이관용,01046390336,01011112222,2026-06-12,310,400,1240,3100,82,74,28,38,96,97,0.3,1080,62,RING-001,TM22B,eIoT,첫 스마트링 CSV 테스트
917539,아버지,보호자,01046390336,01022223333,2026-06-12,430,410,4200,3900,72,73,40,38,97,97,0.1,1260,78,RING-002,TM21B,eIoT,정상 예시
197385,어머니,보호자,01046390336,01033334444,2026-06-12,180,390,420,3000,92,74,20,38,93,97,0.8,240,8,RING-003,TM22B,eIoT,확인필요 예시`

function toneClass(tone?: string) {
  if (['normal', 'safe', 'ok'].includes(tone || '')) return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (['watch', 'warning'].includes(tone || '')) return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (['check_needed', 'danger'].includes(tone || '')) return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function statusLabel(status?: string) {
  if (status === 'normal') return '정상'
  if (status === 'watch') return '주의'
  if (status === 'check_needed') return '확인필요'
  return status || '확인'
}

function Pill({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span className={'inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ' + toneClass(tone)}>
      {children}
    </span>
  )
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

export function RingCsvImportPanel() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV)
  const [fileName, setFileName] = useState('sample-ring-data.csv')
  const [sourceName, setSourceName] = useState('csv')
  const [createdBy, setCreatedBy] = useState('운영실')
  const [batches, setBatches] = useState<Batch[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [latestReports, setLatestReports] = useState<Report[]>([])
  const [activeTab, setActiveTab] = useState<'import' | 'results' | 'batches'>('import')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const latestMetrics = useMemo(() => {
    return {
      total: latestReports.length,
      normal: latestReports.filter((item) => item.overallStatus === 'normal').length,
      watch: latestReports.filter((item) => item.overallStatus === 'watch').length,
      checkNeeded: latestReports.filter((item) => item.overallStatus === 'check_needed').length
    }
  }, [latestReports])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/ring-csv-import', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || 'CSV 업로드 기록을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setBatches(Array.isArray(data.batches) ? data.batches : [])
      setReports(Array.isArray(data.reports) ? data.reports : [])
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'CSV 업로드 기록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function importCsv() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/ring-csv-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'importCsv',
          csvText,
          fileName,
          sourceName,
          createdBy
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || 'CSV 업로드에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setLatestReports(Array.isArray(result.reports) ? result.reports : [])
      setMessage(result.message || 'CSV 업로드가 완료되었습니다.')
      setDebug(JSON.stringify(result.metrics || result, null, 2))
      setActiveTab('results')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'CSV 업로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function readFile(file: File) {
    setFileName(file.name)
    const text = await file.text()
    setCsvText(text)
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setMessage('복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 직접 선택해서 복사해주세요.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            스마트링 CSV 업로드 센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                링 데이터를 붙여넣으면
                <br />
                리포트가 한 번에 생성됩니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                브링 CSV, eIoT/Goodway 샘플 데이터, 수동 정리표를 업로드해 여러 가구의 안부리듬 리포트를 일괄 생성합니다.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#EFFFFA] px-6 py-5 text-center text-[#247A71] ring-1 ring-[#CDEFE7]">
              <div className="text-sm font-black opacity-70">최근 생성</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{latestMetrics.total}건</div>
              <div className="mt-2 text-xs font-bold">CSV 리포트</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            업로드 데이터는 의료 진단이 아닌 가족 안부 참고 신호로만 사용합니다. 외부 공유 전에는 가족코드와 휴대폰 뒤 4자리 접근 방식을 확인하세요.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <input
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              placeholder="처리자"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <input
              value={sourceName}
              onChange={(event) => setSourceName(event.target.value)}
              placeholder="데이터 출처, eIoT/Goodway/b.ring"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <button onClick={load} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              새로고침
            </button>

            <Link href="/ops/ring-report-lab" className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
              수동 리포트
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/guardian/ring-report" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              보호자 리포트
            </Link>
            <Link href="/ops/pilot-report" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              실증 리포트
            </Link>
            <Link href="/portal/ops" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
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

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="정상" value={`${latestMetrics.normal}건`} desc="평소와 유사" tone="normal" />
          <MetricCard title="주의" value={`${latestMetrics.watch}건`} desc="전화 권장" tone="watch" />
          <MetricCard title="확인필요" value={`${latestMetrics.checkNeeded}건`} desc="확인 필요" tone="check_needed" />
          <MetricCard title="배치 기록" value={`${batches.length}건`} desc="CSV 업로드" />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ['import', 'CSV 업로드'],
              ['results', '최근 결과'],
              ['batches', '업로드 기록']
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

        {activeTab === 'import' ? (
          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">CSV 파일 또는 붙여넣기</h2>

              <label className="mt-5 grid gap-2">
                <span className="text-sm font-black text-[#637B76]">CSV 파일 선택</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) readFile(file)
                  }}
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
                />
              </label>

              <label className="mt-4 grid gap-2">
                <span className="text-sm font-black text-[#637B76]">파일명</span>
                <input
                  value={fileName}
                  onChange={(event) => setFileName(event.target.value)}
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
                />
              </label>

              <label className="mt-4 grid gap-2">
                <span className="text-sm font-black text-[#637B76]">CSV 내용</span>
                <textarea
                  value={csvText}
                  onChange={(event) => setCsvText(event.target.value)}
                  className="min-h-[520px] rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 font-mono text-xs leading-6 outline-none"
                />
              </label>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button onClick={() => setCsvText(SAMPLE_CSV)} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  샘플 CSV 넣기
                </button>

                <button onClick={importCsv} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
                  CSV 리포트 생성
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">필수 컬럼</h2>

              <div className="mt-5 space-y-3">
                {[
                  ['familyCode', '가족코드, 필수'],
                  ['parentName', '부모님 이름'],
                  ['guardianPhone', '보호자 연락처, 뒤 4자리 인증용'],
                  ['reportDate', '리포트 날짜'],
                  ['sleepMinutes', '오늘 수면, 분'],
                  ['baselineSleepMinutes', '평소 수면, 분'],
                  ['steps', '오늘 걸음 수'],
                  ['baselineSteps', '평소 걸음 수'],
                  ['restingHr / hrv / spo2', '심박·HRV·산소포화도'],
                  ['temperatureDelta', '평소 대비 체온 추세 변화'],
                  ['wearMinutes', '착용 시간, 분'],
                  ['batteryLevel', '배터리, %']
                ].map(([key, desc]) => (
                  <div key={key} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-base font-black">{key}</div>
                    <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'results' ? (
          <ReportList reports={latestReports.length ? latestReports : reports} onCopy={copyText} />
        ) : null}

        {activeTab === 'batches' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">업로드 기록</h2>

            <div className="mt-5 space-y-3">
              {batches.length ? (
                batches.map((batch) => (
                  <article key={batch.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-wrap gap-2">
                      <Pill tone="safe">{batch.sourceName}</Pill>
                      <Pill>{batch.fileName}</Pill>
                      <Pill>{batch.createdKst}</Pill>
                    </div>
                    <h3 className="mt-3 text-lg font-black">
                      성공 {batch.successCount}건 · 실패 {batch.failedCount}건
                    </h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      전체 행 {batch.rowCount}개 · 처리자 {batch.createdBy}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 업로드 기록이 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function ReportList({ reports, onCopy }: { reports: Report[]; onCopy: (value: string) => void }) {
  return (
    <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
      <h2 className="text-3xl font-black tracking-[-0.06em]">생성된 리포트</h2>

      <div className="mt-5 space-y-3">
        {reports.length ? (
          reports.map((report) => (
            <article key={report.id} className={'rounded-2xl p-4 ring-1 ' + toneClass(report.overallStatus)}>
              <div className="flex flex-wrap gap-2">
                <Pill tone={report.overallStatus}>{statusLabel(report.overallStatus)}</Pill>
                <Pill>{report.familyCode}</Pill>
                <Pill>{report.reportDate}</Pill>
                <Pill>{report.anbuScore}점</Pill>
              </div>

              <h3 className="mt-3 text-xl font-black">{report.parentName} 안부리듬</h3>
              <p className="mt-2 text-sm font-bold leading-7 opacity-80">{report.summaryText}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => onCopy(report.shareMessage)} className="rounded-xl bg-white px-4 py-3 text-xs font-black text-[#17443F] ring-1 ring-current/10">
                  공유 문구 복사
                </button>

                <Link
                  href={`/guardian/ring-report?familyCode=${encodeURIComponent(report.familyCode)}&last4=${report.guardianPhoneLast4 || report.parentPhoneLast4}`}
                  className="rounded-xl bg-[#247A71] px-4 py-3 text-xs font-black text-white"
                >
                  보호자 리포트
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
            아직 생성된 리포트가 없습니다.
          </div>
        )}
      </div>
    </section>
  )
}

export default RingCsvImportPanel
