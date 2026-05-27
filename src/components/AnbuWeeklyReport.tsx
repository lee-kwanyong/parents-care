'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type WeeklyReport = {
  familyCode: string
  parentName: string
  guardianName: string
  periodLabel: string
  state: '정상' | '주의' | '확인 필요'
  score: number
  summary: string
  stats: Array<{
    label: string
    value: string
    help: string
  }>
  dayRows: Array<{
    date: string
    meal: number
    medication: number
    condition: number
    risk: number
  }>
  signals: string[]
  nextActions: string[]
}

function stateClass(state?: string) {
  if (state === '확인 필요') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (state === '주의') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
}

export function AnbuWeeklyReport() {
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const [raw, setRaw] = useState<unknown>(null)

  async function load() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/anbu-reports/weekly', { cache: 'no-store' })
      const data = await response.json()
      setRaw(data)

      if (!data.ok) {
        setError(data.message || '리포트를 불러오지 못했습니다.')
        return
      }

      setReport(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : '리포트를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            안부온 · 주간 리포트
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            최근 7일 부모님 안부를 자동으로 요약합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            식사, 복약, 몸 상태, 응답 없음, 보호자 알림, 병원·복약 일정을 모아 정상/주의/확인 필요 상태로 보여줍니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? '불러오는 중...' : '리포트 새로고침'}
            </button>

            <Link
              href="/child/dashboard"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              보호자 대시보드
            </Link>

            <button
              onClick={() => setShowRaw((value) => !value)}
              className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              {showRaw ? '원본 숨기기' : '원본 보기'}
            </button>
          </div>
        </section>

        {error ? (
          <section className="rounded-[2rem] bg-[#FFF1F1] p-5 text-sm font-black text-[#8A2525] ring-1 ring-[#F3BBBB]">
            {error}
          </section>
        ) : null}

        {!report ? (
          <section className="rounded-[2rem] bg-white p-8 text-center text-lg font-black shadow-sm ring-1 ring-[#D8EEE8]">
            {loading ? '리포트를 불러오는 중입니다.' : '리포트 데이터가 없습니다.'}
          </section>
        ) : (
          <>
            <section className={'rounded-[2rem] p-6 ring-1 ' + stateClass(report.state)}>
              <div className="grid gap-5 lg:grid-cols-[1fr_0.55fr]">
                <div>
                  <p className="text-sm font-black opacity-75">{report.periodLabel}</p>
                  <h2 className="mt-3 text-5xl font-black tracking-[-0.08em]">{report.state}</h2>
                  <p className="mt-5 text-lg font-bold leading-8">{report.summary}</p>
                </div>

                <div className="rounded-[1.75rem] bg-white/75 p-5">
                  <div className="text-sm font-black opacity-70">안부온 주간 점수</div>
                  <div className="mt-2 text-6xl font-black tracking-[-0.08em]">{report.score}</div>
                  <p className="mt-2 text-sm font-bold leading-6 opacity-75">
                    의료 진단이 아닌 안부 확인 참고 신호입니다.
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-3">
              {report.stats.map((stat) => (
                <section key={stat.label} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8]">
                  <div className="text-sm font-black text-[#7A9692]">{stat.label}</div>
                  <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#11977F]">{stat.value}</div>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{stat.help}</p>
                </section>
              ))}
            </div>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">요일별 안부 흐름</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-7">
                {report.dayRows.map((day) => (
                  <div key={day.date} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                    <div className="text-xs font-black text-[#7A9692]">{day.date.slice(5)}</div>
                    <div className="mt-3 space-y-2 text-sm font-bold text-[#4E6D69]">
                      <p>식사 {day.meal}</p>
                      <p>약 {day.medication}</p>
                      <p>상태 {day.condition}</p>
                      <p className={day.risk > 0 ? 'font-black text-[#8A2525]' : ''}>주의 {day.risk}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">이번 주 확인된 신호</h2>
                <div className="mt-5 space-y-3">
                  {report.signals.map((signal) => (
                    <div key={signal} className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-black leading-7 ring-1 ring-[#D8EEE8]">
                      {signal}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">다음 행동 추천</h2>
                <div className="mt-5 space-y-3">
                  {report.nextActions.map((action, index) => (
                    <div key={action} className="rounded-2xl bg-[#F7FBFF] p-4 text-sm font-black leading-7 text-[#234B68] ring-1 ring-[#DCEDE7]">
                      {index + 1}. {action}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

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
