'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'

type Report = Record<string, any>
type Action = Record<string, any>

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('ko-KR')
  } catch {
    return value || ''
  }
}

export function GuardianReportsBoard() {
  const [reports, setReports] = useState<Report[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [summary, setSummary] = useState({
    total: 0,
    ready: 0,
    viewed: 0,
    openActions: 0
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/guardian-reports', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '보호자 리포트를 불러오지 못했습니다.')
      }

      setReports(result.reports || [])
      setActions(result.actions || [])
      setSummary(result.summary || {
        total: 0,
        ready: 0,
        viewed: 0,
        openActions: 0
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '보호자 리포트를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function patch(payload: Record<string, unknown>) {
    setMessage('')

    try {
      const response = await fetch('/api/guardian-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '처리 중 오류가 발생했습니다.')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const actionsByReport = useMemo(() => {
    const map = new Map<string, Action[]>()

    for (const action of actions) {
      const list = map.get(action.care_report_id) || []
      list.push(action)
      map.set(action.care_report_id, list)
    }

    return map
  }, [actions])

  const latestReport = reports[0] || null

  return (
    <AppFrame title="보호자 리포트" subtitle="부모님 안심케어 결과와 가족이 할 일을 확인합니다" showMobileNav={false}>
      <section className="mx-auto max-w-6xl">
        <header className="rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-black text-[#19A98E]">보호자 리포트</div>
              <h1 className="mt-2 text-5xl font-black tracking-[-0.06em] md:text-7xl">
                30초 요약
              </h1>
              <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79] md:text-lg md:leading-8">
                부모님 안심케어가 끝나면 현장 체크 내용을 바탕으로 결과와 가족이 할 일을 정리합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={load}
                className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
              >
                새로고침
              </button>
              <Link href="/child" className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                자녀앱 홈
              </Link>
            </div>
          </div>
        </header>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          <Stat label="전체 리포트" value={summary.total} />
          <Stat label="확인 가능" value={summary.ready} />
          <Stat label="확인 완료" value={summary.viewed} />
          <Stat label="가족 할 일" value={summary.openActions} />
        </section>

        {loading ? (
          <div className="mt-8 rounded-[2rem] bg-white p-8 text-center text-xl font-black ring-1 ring-[#E3EFEC]">
            리포트를 불러오는 중...
          </div>
        ) : reports.length === 0 ? (
          <section className="mt-8 rounded-[2rem] bg-white p-10 text-center ring-1 ring-[#E3EFEC] shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <h2 className="text-3xl font-black">아직 도착한 리포트가 없습니다.</h2>
            <p className="mt-3 text-base font-bold leading-7 text-[#607D79]">
              매니저가 /manager/today에서 “리포트까지 완료했습니다”를 누르면 이곳에 자동으로 표시됩니다.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <Link href="/manager/today" className="rounded-2xl bg-[#19B99A] px-5 py-4 text-center font-black text-white">
                매니저 현장 체크
              </Link>
              <Link href="/care-request" className="rounded-2xl bg-white px-5 py-4 text-center font-black text-[#426C68] ring-1 ring-[#CFE7E2]">
                부모님 안심케어 신청하기
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-8 space-y-6">
            {latestReport ? (
              <article className="rounded-[2rem] border border-[#D5EEE8] bg-[#EAFBF6] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.10)]">
                <div className="flex flex-wrap gap-2">
                  <Badge text="최근 리포트" />
                  <Badge text={latestReport.reassurance_state || '확인 필요'} />
                  <Badge text={latestReport.manager_name || '케어파트너'} />
                </div>

                <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">
                  {latestReport.report_title}
                </h2>

                <p className="mt-5 rounded-2xl bg-white p-5 text-lg font-black leading-8 text-[#24423F] ring-1 ring-[#D5EEE8]">
                  {latestReport.summary_30sec || '요약이 준비됐습니다.'}
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <Info label="부모님 상태" value={latestReport.parent_condition} />
                  <Info label="결과" value={latestReport.visit_result} />
                  <Info label="약/복약" value={latestReport.medication_result} />
                  <Info label="서류" value={latestReport.document_result} />
                </div>

                {!latestReport.viewed_by_guardian_at ? (
                  <button
                    onClick={() => patch({ kind: 'view_report', id: latestReport.id })}
                    className="mt-5 w-full rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white"
                  >
                    리포트 확인했습니다
                  </button>
                ) : (
                  <div className="mt-5 rounded-2xl bg-white p-4 text-center font-black text-[#2F756B] ring-1 ring-[#D5EEE8]">
                    확인 완료: {formatDate(latestReport.viewed_by_guardian_at)}
                  </div>
                )}
              </article>
            ) : null}

            {reports.map((report) => {
              const reportActions = actionsByReport.get(report.id) || []

              return (
                <article
                  key={report.id}
                  className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge text={report.reassurance_state || '확인 필요'} />
                        <Badge text={report.report_status || 'ready'} />
                        <Badge text={formatDate(report.created_at)} />
                      </div>
                      <h3 className="mt-4 text-3xl font-black tracking-[-0.04em]">{report.report_title}</h3>
                      <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">
                        부모님: {report.elder_name} · 매니저: {report.manager_name || '케어파트너'}
                      </p>
                    </div>

                    {!report.viewed_by_guardian_at ? (
                      <button
                        onClick={() => patch({ kind: 'view_report', id: report.id })}
                        className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white"
                      >
                        확인 완료
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-5 rounded-2xl bg-[#F6FCFA] p-5 text-base font-bold leading-8 text-[#385A56]">
                    {report.summary_30sec}
                  </p>

                  <section className="mt-5 rounded-[1.5rem] bg-[#F6FCFA] p-5 ring-1 ring-[#E3EFEC]">
                    <h4 className="text-xl font-black">가족이 할 일</h4>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {reportActions.length === 0 ? (
                        <p className="text-sm font-bold text-[#607D79]">등록된 할 일이 없습니다.</p>
                      ) : (
                        reportActions.map((action) => (
                          <div key={action.id} className="rounded-2xl bg-white p-4 ring-1 ring-[#E3EFEC]">
                            <div className="flex flex-wrap gap-2">
                              <Badge text={action.action_status === 'completed' ? '완료' : '할 일'} />
                              <Badge text={action.assigned_to_role || 'guardian'} />
                            </div>
                            <div className="mt-3 text-lg font-black">{action.action_title}</div>
                            <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                              {action.action_description}
                            </p>

                            {action.action_status !== 'completed' ? (
                              <button
                                onClick={() => patch({ kind: 'complete_action', id: action.id })}
                                className="mt-4 rounded-xl bg-[#DCEFF7] px-4 py-3 text-sm font-black text-[#365E78]"
                              >
                                완료로 표시
                              </button>
                            ) : (
                              <p className="mt-4 text-xs font-black text-[#2F756B]">
                                완료됨 {formatDate(action.completed_at)}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </article>
              )
            })}
          </section>
        )}
      </section>
    </AppFrame>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-[#E3EFEC]">
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#F4FAF9] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
      {text}
    </span>
  )
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-[#D5EEE8]">
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <p className="mt-2 text-base font-bold leading-7">{value || '확인 필요'}</p>
    </div>
  )
}
