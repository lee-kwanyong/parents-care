'use client'

import { useEffect, useMemo, useState } from 'react'

type Report = Record<string, any>

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function dateLabel(value: unknown) {
  const raw = text(value)
  if (!raw) return '-'
  const date = new Date(raw)
  if (!Number.isFinite(date.getTime())) return raw
  return date.toLocaleString('ko-KR')
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    submitted: '검수대기',
    approved: '승인/공개',
    needs_revision: '수정요청',
    rejected: '반려',
    hidden: '숨김'
  }
  return map[status] || status || '검수대기'
}

function qualityLabel(status: string) {
  const map: Record<string, string> = {
    pass: '품질통과',
    warning: '품질주의',
    block: '승인주의',
    unchecked: '미점검'
  }
  return map[status] || status || '미점검'
}

function badgeClass(kind: string) {
  if (kind === 'approved' || kind === 'pass') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  if (kind === 'needs_revision' || kind === 'warning') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  if (kind === 'rejected' || kind === 'hidden' || kind === 'block') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  return 'bg-[#F7FBFF] text-[#234B68] ring-[#DCEDE7]'
}

function parseArray(value: unknown) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export function AnbuCareReportReviewPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [reviewMemo, setReviewMemo] = useState('')
  const [reviewerName, setReviewerName] = useState('운영실')

  async function load() {
    setLoading(true)
    const response = await fetch('/api/anbu-care-reports/list?scope=ops', { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))
    setReports(Array.isArray(data.reports) ? data.reports : [])
    setResult(data)
    setLoading(false)
  }

  async function qualityCheck(reportId: string) {
    setLoading(true)
    const response = await fetch('/api/anbu-care-reports/quality-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId })
    })
    const data = await response.json().catch(() => ({}))
    setResult(data)
    await load()
    setLoading(false)
  }

  async function review(reportId: string, status: string) {
    setLoading(true)
    const response = await fetch('/api/anbu-care-reports/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status, reviewMemo, reviewerName })
    })
    const data = await response.json().catch(() => ({}))
    setResult(data)
    await load()
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => {
    return {
      total: reports.length,
      submitted: reports.filter((item) => !item.report_status || item.report_status === 'submitted').length,
      approved: reports.filter((item) => item.report_status === 'approved').length,
      risk: reports.filter((item) => item.quality_status === 'block' || item.quality_status === 'warning').length
    }
  }, [reports])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            운영실 · 리포트 품질 검수
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            의료판단·개인정보 표현을 자동으로 점검합니다.
          </h1>
          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            케어파트너 리포트는 운영실이 먼저 확인하고, 승인된 리포트만 보호자 화면에 공개됩니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60">
              {loading ? '처리 중...' : '새로고침'}
            </button>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-4">
          <Summary label="전체" value={summary.total} />
          <Summary label="검수대기" value={summary.submitted} />
          <Summary label="승인" value={summary.approved} />
          <Summary label="품질주의" value={summary.risk} />
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">검수 메모</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[14rem_1fr]">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#55736E]">검수자</span>
              <input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#55736E]">메모</span>
              <input value={reviewMemo} onChange={(event) => setReviewMemo(event.target.value)} placeholder="예: 개인정보 없음, 의료판단 표현 없음, 보호자 공개 가능" className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]" />
            </label>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">리포트 목록</h2>
          <div className="mt-5 grid gap-3">
            {reports.length === 0 ? (
              <p className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">검수할 리포트가 없습니다.</p>
            ) : (
              reports.map((report) => {
                const status = text(report.report_status) || 'submitted'
                const qualityStatus = text(report.quality_status) || 'unchecked'
                const flags = parseArray(report.quality_flags)
                const checklist = parseArray(report.ops_checklist)
                const score = typeof report.quality_score === 'number' ? report.quality_score : null

                return (
                  <article key={text(report.id)} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                    <div className="flex flex-wrap gap-2">
                      <Badge text={statusLabel(status)} className={badgeClass(status)} />
                      <Badge text={qualityLabel(qualityStatus)} className={badgeClass(qualityStatus)} />
                      {score !== null ? <Badge text={`품질점수 ${score}`} /> : null}
                      <Badge text={report.guardian_visible ? '보호자 공개' : '비공개'} />
                      <Badge text={text(report.partner?.applicant_name) || '파트너'} />
                      <Badge text={text(report.request?.parent_name) || '부모님'} />
                    </div>

                    <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">
                      {text(report.request?.parent_name) || '부모님'} 케어 리포트
                    </h3>

                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      수행일시: {dateLabel(report.performed_at)} · 제출: {dateLabel(report.created_at)}
                    </p>

                    <ReportSection title="수행한 일" value={text(report.service_summary)} />
                    <ReportSection title="부모님 상태" value={text(report.parent_condition)} />
                    <ReportSection title="식사 상태" value={text(report.meal_status)} />
                    <ReportSection title="복약 상태" value={text(report.medication_status)} />
                    <ReportSection title="병원/방문 결과" value={text(report.hospital_result)} />
                    <ReportSection title="다음 할 일" value={text(report.next_action)} />
                    <ReportSection title="보호자 전달사항" value={text(report.guardian_message)} />
                    <ReportSection title="검수 메모" value={text(report.review_memo)} />

                    {flags.length > 0 ? (
                      <div className="mt-4 rounded-2xl bg-[#FFF8E8] p-4 ring-1 ring-[#F4D8A5]">
                        <div className="text-sm font-black text-[#795313]">자동 감지된 주의사항</div>
                        <div className="mt-3 space-y-2">
                          {flags.map((flag: any, index: number) => (
                            <div key={index} className="rounded-xl bg-white p-3 text-sm font-bold leading-6 text-[#795313]">
                              <div className="font-black">{flag.label} · {flag.severity}</div>
                              {flag.matchedText ? <div>감지: {flag.matchedText}</div> : null}
                              <div>{flag.suggestion}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {checklist.length > 0 ? (
                      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[#D8EEE8]">
                        <div className="text-sm font-black text-[#11977F]">운영실 체크리스트</div>
                        <div className="mt-3 space-y-2">
                          {checklist.map((item: any) => (
                            <div key={item.key} className="text-sm font-bold leading-6 text-[#4E6D69]">
                              {item.passed ? '✓' : '⚠'} {item.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button onClick={() => qualityCheck(text(report.id))} disabled={loading} className="rounded-xl bg-white px-4 py-2 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-60">
                        품질 재점검
                      </button>
                      <button onClick={() => review(text(report.id), 'approved')} disabled={loading} className="rounded-xl bg-[#20C5A8] px-4 py-2 text-xs font-black text-white disabled:opacity-60">
                        승인/공개
                      </button>
                      <button onClick={() => review(text(report.id), 'needs_revision')} disabled={loading} className="rounded-xl bg-[#FFF8E8] px-4 py-2 text-xs font-black text-[#795313] ring-1 ring-[#F4D8A5] disabled:opacity-60">
                        수정요청
                      </button>
                      <button onClick={() => review(text(report.id), 'hidden')} disabled={loading} className="rounded-xl bg-white px-4 py-2 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-60">
                        숨김
                      </button>
                      <button onClick={() => review(text(report.id), 'rejected')} disabled={loading} className="rounded-xl bg-[#FFF1F1] px-4 py-2 text-xs font-black text-[#8A2525] ring-1 ring-[#F3BBBB] disabled:opacity-60">
                        반려
                      </button>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#123F38] p-5 text-white sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">검수 기준</h2>
          <ol className="mt-4 space-y-3 text-sm font-bold leading-7 text-[#E7FFF7]">
            <li>1. 진단, 처방, 복약 변경 지시처럼 보이는 표현이 없는지 확인합니다.</li>
            <li>2. 주민번호, 상세 주소, 계좌번호, 비밀번호 등 불필요한 개인정보가 없는지 확인합니다.</li>
            <li>3. 보호자가 바로 이해할 수 있게 사실 중심으로 작성됐는지 확인합니다.</li>
            <li>4. 응급 가능성이 있으면 리포트 승인보다 보호자 연락 또는 119 안내가 우선입니다.</li>
          </ol>
        </section>

        <RawBox result={result} />
      </section>
    </main>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8]">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#11977F]">{value}</div>
    </section>
  )
}

function Badge({ text, className = '' }: { text: string; className?: string }) {
  return <span className={'rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#D8EEE7] ' + className}>{text}</span>
}

function ReportSection({ title, value }: { title: string; value: string }) {
  if (!value) return null
  return (
    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[#D8EEE8]">
      <div className="text-xs font-black text-[#11977F]">{title}</div>
      <p className="mt-2 whitespace-pre-line text-sm font-bold leading-7 text-[#4E6D69]">{value}</p>
    </div>
  )
}

function RawBox({ result }: { result: unknown }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
      <h2 className="text-2xl font-black tracking-[-0.05em]">최근 처리 결과</h2>
      <pre className="mt-4 max-h-[24rem] overflow-auto rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
        {JSON.stringify(result, null, 2)}
      </pre>
    </section>
  )
}
