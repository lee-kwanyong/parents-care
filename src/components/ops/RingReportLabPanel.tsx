'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'

type ReportCard = {
  key: string
  title: string
  status: string
  value: string
  detail: string
}

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
  cards: ReportCard[]
  shareMessage: string
  createdKst: string
  viewedCount: number
}

type Family = {
  source: string
  familyCode: string
  parentName: string
  parentPhone: string
  guardianName: string
  guardianPhone: string
  serviceArea: string
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

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

function MetricCard({ title, value, desc, tone }: { title: string; value: string; desc: string; tone?: string }) {
  return (
    <article className={'rounded-[1.6rem] p-5 shadow-sm ring-1 ' + toneClass(tone)}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

function Pill({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span className={'inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ' + toneClass(tone)}>
      {children}
    </span>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || label}
        type={type}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold outline-none"
      />
    </label>
  )
}

export function RingReportLabPanel() {
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [reports, setReports] = useState<Report[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [activeTab, setActiveTab] = useState<'create' | 'reports' | 'events'>('create')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [latestReport, setLatestReport] = useState<Report | null>(null)

  const [form, setForm] = useState<Record<string, string>>({
    familyCode: '',
    parentName: '어머니',
    guardianName: '보호자',
    guardianPhone: '',
    parentPhone: '',
    reportDate: today(),
    sleepMinutes: '310',
    baselineSleepMinutes: '400',
    steps: '1240',
    baselineSteps: '3100',
    restingHr: '82',
    baselineRestingHr: '74',
    hrv: '28',
    baselineHrv: '38',
    spo2: '96',
    baselineSpo2: '97',
    temperatureDelta: '0.3',
    wearMinutes: '1080',
    batteryLevel: '62',
    notes: ''
  })

  const guardianReportUrl = useMemo(() => {
    if (!latestReport) return ''
    const last4 = latestReport.guardianPhoneLast4 || latestReport.parentPhoneLast4
    return `/guardian/ring-report?familyCode=${encodeURIComponent(latestReport.familyCode)}${last4 ? `&last4=${last4}` : ''}`
  }, [latestReport])

  function update(key: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [key]: value
    }))
  }

  function applyFamily(familyCode: string) {
    const family = families.find((item) => item.familyCode === familyCode)

    if (!family) {
      update('familyCode', familyCode)
      return
    }

    setForm((previous) => ({
      ...previous,
      familyCode: family.familyCode,
      parentName: family.parentName || previous.parentName,
      parentPhone: family.parentPhone || previous.parentPhone,
      guardianName: family.guardianName || previous.guardianName,
      guardianPhone: family.guardianPhone || previous.guardianPhone
    }))
  }

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/ring-report-lab', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '스마트링 리포트 정보를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMetrics(data.metrics || {})
      setReports(Array.isArray(data.reports) ? data.reports : [])
      setFamilies(Array.isArray(data.families) ? data.families : [])

      if (!form.familyCode && data.families?.[0]?.familyCode) {
        applyFamily(data.families[0].familyCode)
      }

      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '스마트링 리포트 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createReport() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/ring-report-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createReport',
          ...form,
          createdBy: '운영실'
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '리포트 생성에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setLatestReport(result.report)
      setMessage(result.message || '리포트를 생성했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '리포트 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            스마트링 안부리듬 리포트 실험실
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                링 데이터가 없어도
                <br />
                리포트 UX부터 검증합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                수면, 활동, 심박, HRV, SpO2, 체온 추세, 착용 시간, 배터리를 입력하면 보호자용 안부리듬 리포트를 생성합니다.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#EFFFFA] px-6 py-5 text-center text-[#247A71] ring-1 ring-[#CDEFE7]">
              <div className="text-sm font-black opacity-70">누적 리포트</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{Number(metrics.totalReports || 0)}건</div>
              <div className="mt-2 text-xs font-bold">오늘 {Number(metrics.todayReports || 0)}건</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            본 리포트는 의료 진단이 아닌 가족 안부 참고 신호입니다. 응급상황이 의심되면 즉시 119 또는 의료기관에 연락해야 합니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              새로고침
            </button>
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

        <section className="grid gap-4 md:grid-cols-5">
          <MetricCard title="정상" value={`${Number(metrics.normalReports || 0)}건`} desc="평소와 유사" tone="normal" />
          <MetricCard title="주의" value={`${Number(metrics.watchReports || 0)}건`} desc="전화 권장" tone="watch" />
          <MetricCard title="확인필요" value={`${Number(metrics.checkNeededReports || 0)}건`} desc="보호자 확인" tone="check_needed" />
          <MetricCard title="보호자 조회" value={`${Number(metrics.publicViews || 0)}회`} desc="리포트 열람" />
          <MetricCard title="실증 가구" value={`${Number(metrics.families || 0)}건`} desc="선택 가능" />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ['create', '리포트 생성'],
              ['reports', '생성 기록'],
              ['events', '이벤트']
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

        {activeTab === 'create' ? (
          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">입력값</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-black text-[#637B76]">실증 가구 선택</span>
                  <select
                    value={form.familyCode}
                    onChange={(event) => applyFamily(event.target.value)}
                    className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-black outline-none"
                  >
                    <option value="">직접 입력</option>
                    {families.map((family) => (
                      <option key={`${family.source}-${family.familyCode}`} value={family.familyCode}>
                        {family.familyCode} · {family.parentName || '부모님'} · {family.guardianName || '보호자'}
                      </option>
                    ))}
                  </select>
                </label>

                <Field label="가족코드" value={form.familyCode} onChange={(value) => update('familyCode', value)} />
                <Field label="리포트 날짜" value={form.reportDate} onChange={(value) => update('reportDate', value)} type="date" />
                <Field label="부모님 이름" value={form.parentName} onChange={(value) => update('parentName', value)} />
                <Field label="보호자 이름" value={form.guardianName} onChange={(value) => update('guardianName', value)} />
                <Field label="보호자 연락처" value={form.guardianPhone} onChange={(value) => update('guardianPhone', value.replace(/[^\d]/g, ''))} />
                <Field label="부모님 연락처" value={form.parentPhone} onChange={(value) => update('parentPhone', value.replace(/[^\d]/g, ''))} />
                <Field label="오늘 수면, 분" value={form.sleepMinutes} onChange={(value) => update('sleepMinutes', value)} type="number" />
                <Field label="평소 수면, 분" value={form.baselineSleepMinutes} onChange={(value) => update('baselineSleepMinutes', value)} type="number" />
                <Field label="오늘 걸음 수" value={form.steps} onChange={(value) => update('steps', value)} type="number" />
                <Field label="평소 걸음 수" value={form.baselineSteps} onChange={(value) => update('baselineSteps', value)} type="number" />
                <Field label="오늘 안정 심박" value={form.restingHr} onChange={(value) => update('restingHr', value)} type="number" />
                <Field label="평소 안정 심박" value={form.baselineRestingHr} onChange={(value) => update('baselineRestingHr', value)} type="number" />
                <Field label="오늘 HRV" value={form.hrv} onChange={(value) => update('hrv', value)} type="number" />
                <Field label="평소 HRV" value={form.baselineHrv} onChange={(value) => update('baselineHrv', value)} type="number" />
                <Field label="SpO2" value={form.spo2} onChange={(value) => update('spo2', value)} type="number" />
                <Field label="평소 SpO2" value={form.baselineSpo2} onChange={(value) => update('baselineSpo2', value)} type="number" />
                <Field label="체온 추세 변화, ℃" value={form.temperatureDelta} onChange={(value) => update('temperatureDelta', value)} type="number" />
                <Field label="착용 시간, 분" value={form.wearMinutes} onChange={(value) => update('wearMinutes', value)} type="number" />
                <Field label="배터리, %" value={form.batteryLevel} onChange={(value) => update('batteryLevel', value)} type="number" />

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-black text-[#637B76]">메모</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => update('notes', event.target.value)}
                    className="min-h-24 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold leading-7 outline-none"
                  />
                </label>
              </div>

              <button onClick={createReport} disabled={loading} className="mt-5 w-full rounded-2xl bg-[#247A71] px-5 py-5 text-base font-black text-white disabled:opacity-50">
                스마트링 안부리듬 리포트 생성
              </button>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">생성 결과</h2>

              {latestReport ? (
                <ReportPreview report={latestReport} onCopy={copyText} guardianReportUrl={guardianReportUrl} />
              ) : (
                <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                  왼쪽 값을 입력하고 리포트를 생성하면 보호자에게 보낼 요약문과 리포트 링크가 나타납니다.
                </div>
              )}
            </section>
          </section>
        ) : null}

        {activeTab === 'reports' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">생성 기록</h2>

            <div className="mt-5 space-y-3">
              {reports.length ? (
                reports.map((report) => (
                  <article key={report.id} className={'rounded-2xl p-4 ring-1 ' + toneClass(report.overallStatus)}>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={report.overallStatus}>{statusLabel(report.overallStatus)}</Pill>
                      <Pill>{report.familyCode}</Pill>
                      <Pill>{report.reportDate}</Pill>
                      <Pill>조회 {report.viewedCount || 0}회</Pill>
                    </div>
                    <h3 className="mt-3 text-xl font-black">{report.parentName} · {report.anbuScore}점</h3>
                    <p className="mt-2 text-sm font-bold leading-7 opacity-80">{report.summaryText}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => setLatestReport(report)} className="rounded-xl bg-white px-4 py-3 text-xs font-black text-[#17443F] ring-1 ring-current/10">
                        결과 보기
                      </button>
                      <Link
                        href={`/guardian/ring-report?familyCode=${encodeURIComponent(report.familyCode)}&last4=${report.guardianPhoneLast4 || report.parentPhoneLast4}`}
                        className="rounded-xl bg-[#247A71] px-4 py-3 text-xs font-black text-white"
                      >
                        보호자 화면
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 생성한 리포트가 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'events' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">이벤트는 API에 저장됩니다</h2>
            <p className="mt-4 rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
              리포트 생성, 보호자 조회, 스키마 적용 이벤트가 저장됩니다. 다음 단계에서 운영실 스마트링 대시보드로 확장합니다.
            </p>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function ReportPreview({ report, onCopy, guardianReportUrl }: { report: Report; onCopy: (value: string) => void; guardianReportUrl: string }) {
  return (
    <div className="mt-5 space-y-4">
      <article className={'rounded-2xl p-5 ring-1 ' + toneClass(report.overallStatus)}>
        <div className="flex flex-wrap gap-2">
          <Pill tone={report.overallStatus}>{statusLabel(report.overallStatus)}</Pill>
          <Pill>안부리듬 {report.anbuScore}점</Pill>
          <Pill>데이터 신뢰도 {report.dataQualityScore}점</Pill>
        </div>

        <h3 className="mt-4 text-2xl font-black tracking-[-0.06em]">{report.parentName} 오늘 안부리듬</h3>
        <p className="mt-3 text-base font-black leading-8">{report.summaryText}</p>

        <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-black leading-7 ring-1 ring-current/10">
          {report.recommendedAction}
        </div>
      </article>

      <div className="grid gap-3 md:grid-cols-2">
        {report.cards.map((card) => (
          <article key={card.key} className={'rounded-2xl p-4 ring-1 ' + toneClass(card.status)}>
            <div className="flex flex-wrap gap-2">
              <Pill tone={card.status}>{statusLabel(card.status)}</Pill>
            </div>
            <h4 className="mt-3 text-lg font-black">{card.title}</h4>
            <p className="mt-2 text-sm font-black leading-7">{card.value}</p>
            <p className="mt-1 text-sm font-bold leading-7 opacity-75">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={() => onCopy(report.shareMessage)} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
          보호자 공유 문구 복사
        </button>
        {guardianReportUrl ? (
          <Link href={guardianReportUrl} className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            보호자 리포트 열기
          </Link>
        ) : null}
      </div>

      <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#17443F] ring-1 ring-[#D6EDE7]">
        {report.shareMessage}
      </pre>
    </div>
  )
}

export default RingReportLabPanel
