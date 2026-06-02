'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Tone = 'good' | 'warn' | 'danger' | 'empty'

type ReportSlot = {
  key: string
  title: string
  value: string
  detail: string
  time: string
  tone: Tone
}

type ReportSection = {
  key: string
  title: string
  desc: string
  slots: ReportSlot[]
}

type FingerprintItem = {
  label: string
  averageHour: number | null
  comment: string
}

type Report = {
  familyCode: string
  parentName: string
  guardianName?: string
  date: string
  state: '정상' | '주의' | '확인 필요'
  todayScore: number
  trendScore: number
  summaryText: string
  metrics: {
    responseDays: number
    responseRate: number
    mealDone: number
    mealRisk: number
    mealMissing: number
    mealRate: number
    medicationDone: number
    medicationRisk: number
    medicationMissing: number
    medicationRate: number
    conditionRisk: number
    emergencyRisk: number
    rhythmRisk: number
  }
  anbuFingerprint: {
    responseRhythm: FingerprintItem
    breakfastRhythm: FingerprintItem
    medicationRhythm: FingerprintItem
  }
  lastResponse: {
    label: string
    detail: string
    time: string
  }
  sections: ReportSection[]
  insights: string[]
  actionBoard: Array<{
    title: string
    desc: string
    priority: string
  }>
  history: Array<{
    date: string
    score: number
    hadResponse: boolean
    breakfastMeal: string
    lunchMeal: string
    dinnerMeal: string
    morningMedication: string
    noonMedication: string
    eveningMedication: string
    condition: string
    emergency: string
  }>
}

function toneClass(tone: Tone) {
  if (tone === 'danger') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (tone === 'warn') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  if (tone === 'good') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  return 'bg-[#F8FCFB] text-[#637B76] ring-[#D8EEE8]'
}

function stateClass(state: Report['state']) {
  if (state === '확인 필요') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (state === '주의') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
}

function priorityClass(priority: string) {
  if (priority === '높음') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (priority === '중간') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
}

function readStoredFamilyCode() {
  if (typeof window === 'undefined') return ''

  const keys = [
    'anbu_guardian_family_code',
    'anbu_selected_family_code',
    'anbu_last_family_code',
    'anbu_family_code',
    'pc_parent_invite_code'
  ]

  for (const key of keys) {
    const code = String(window.localStorage.getItem(key) || '').replace(/[^\d]/g, '').slice(0, 6)

    if (/^\d{6}$/.test(code)) return code
  }

  return ''
}

function MetricCard({
  title,
  value,
  desc
}: {
  title: string
  value: string
  desc: string
}) {
  return (
    <article className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8]">
      <div className="text-sm font-black text-[#7A9692]">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em] text-[#173B36]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{desc}</p>
    </article>
  )
}

function FingerprintCard({
  title,
  item
}: {
  title: string
  item: FingerprintItem
}) {
  return (
    <article className="rounded-[2rem] bg-[#F8FCFB] p-5 ring-1 ring-[#D8EEE8]">
      <div className="text-sm font-black text-[#7A9692]">{title}</div>
      <h3 className="mt-2 text-2xl font-black tracking-[-0.06em] text-[#173B36]">
        {item.label}
      </h3>
      <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
        {item.comment}
      </p>
    </article>
  )
}

export function ChildCareReportPanel() {
  const [familyCode, setFamilyCode] = useState('')
  const [report, setReport] = useState<Report | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(code?: string) {
    const targetCode = String(code || familyCode || readStoredFamilyCode()).replace(/[^\d]/g, '').slice(0, 6)

    if (targetCode) {
      setFamilyCode(targetCode)
      window.localStorage.setItem('anbu_selected_family_code', targetCode)
    }

    setLoading(true)
    setMessage('')

    try {
      const url = targetCode
        ? '/api/child-care-report?familyCode=' + encodeURIComponent(targetCode)
        : '/api/child-care-report'

      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false) {
        setReport(null)
        setMessage(data.message || '부모님 리포트를 불러오지 못했습니다.')
        return
      }

      if (!data.report) {
        setReport(null)
        setMessage(data.message || '아직 연결된 부모님 리포트가 없습니다.')
        return
      }

      setReport(data.report)
      setFamilyCode(data.report.familyCode)
      window.localStorage.setItem('anbu_selected_family_code', data.report.familyCode)
      window.localStorage.setItem('anbu_guardian_family_code', data.report.familyCode)
    } catch (error) {
      setReport(null)
      setMessage(error instanceof Error ? error.message : '리포트를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            안부지문 리포트
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            요즘 부모님 상태를
            <br />
            생활리듬으로 봅니다.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            부모님이 누른 식사, 복약, 몸 상태, 도움 요청 선택지를 데이터화해서 최근 14일 생활리듬과 변화 신호로 정리합니다.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <input
              value={familyCode}
              onChange={(event) => setFamilyCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="가족코드 6자리"
              className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
            />
            <button
              onClick={() => load(familyCode)}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? '분석 중' : '조회'}
            </button>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
              {message}
            </div>
          ) : null}
        </section>

        {report ? (
          <>
            <section className={'rounded-[2rem] p-5 ring-1 sm:p-6 ' + stateClass(report.state)}>
              <div className="grid gap-5 lg:grid-cols-[1fr_0.5fr_0.5fr]">
                <div>
                  <p className="text-sm font-black opacity-75">
                    {report.parentName} · {report.date}
                  </p>
                  <h2 className="mt-3 text-5xl font-black tracking-[-0.08em]">
                    {report.state}
                  </h2>
                  <p className="mt-5 text-lg font-bold leading-8">
                    {report.summaryText}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/75 p-5">
                  <div className="text-sm font-black opacity-70">오늘 점수</div>
                  <div className="mt-2 text-6xl font-black tracking-[-0.08em]">{report.todayScore}</div>
                  <p className="mt-2 text-sm font-bold leading-6 opacity-75">
                    오늘 선택지 기준
                  </p>
                </div>

                <div className="rounded-2xl bg-white/75 p-5">
                  <div className="text-sm font-black opacity-70">안부지문 점수</div>
                  <div className="mt-2 text-6xl font-black tracking-[-0.08em]">{report.trendScore}</div>
                  <p className="mt-2 text-sm font-bold leading-6 opacity-75">
                    최근 14일 생활리듬 기준
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard
                title="응답일"
                value={`${report.metrics.responseDays}일`}
                desc={`최근 14일 응답률 ${report.metrics.responseRate}%`}
              />
              <MetricCard
                title="식사 확인률"
                value={`${report.metrics.mealRate}%`}
                desc={`식사 완료 ${report.metrics.mealDone}회 · 미확인 ${report.metrics.mealMissing}회`}
              />
              <MetricCard
                title="복약 확인률"
                value={`${report.metrics.medicationRate}%`}
                desc={`복약 완료 ${report.metrics.medicationDone}회 · 미확인 ${report.metrics.medicationMissing}회`}
              />
              <MetricCard
                title="주의 신호"
                value={`${report.metrics.conditionRisk + report.metrics.emergencyRisk + report.metrics.rhythmRisk}회`}
                desc={`몸 불편 ${report.metrics.conditionRisk}회 · 도움 요청 ${report.metrics.emergencyRisk}회 · 리듬 변화 ${report.metrics.rhythmRisk}회`}
              />
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">안부지문</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                부모님마다 다른 응답 시간, 아침 식사, 아침약 복용 리듬을 분석합니다.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <FingerprintCard title="응답 리듬" item={report.anbuFingerprint.responseRhythm} />
                <FingerprintCard title="아침 식사 리듬" item={report.anbuFingerprint.breakfastRhythm} />
                <FingerprintCard title="아침약 리듬" item={report.anbuFingerprint.medicationRhythm} />
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">요즘 상태 요약</h2>
              <div className="mt-5 grid gap-3">
                {report.insights.map((insight) => (
                  <div key={insight} className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                    {insight}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">가족 다음 행동</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {report.actionBoard.map((action) => (
                  <article key={action.title} className={'rounded-2xl p-4 ring-1 ' + priorityClass(action.priority)}>
                    <div className="text-xs font-black opacity-70">우선순위 {action.priority}</div>
                    <h3 className="mt-2 text-xl font-black tracking-[-0.05em]">{action.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-7">{action.desc}</p>
                  </article>
                ))}
              </div>
            </section>

            {report.sections.map((section) => (
              <section key={section.key} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">{section.title}</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{section.desc}</p>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {section.slots.map((slot) => (
                    <article key={slot.key} className={'rounded-[1.5rem] p-5 ring-1 ' + toneClass(slot.tone)}>
                      <div className="text-sm font-black opacity-70">{slot.title}</div>
                      <h3 className="mt-2 text-2xl font-black tracking-[-0.05em]">{slot.value}</h3>
                      <p className="mt-3 text-sm font-bold leading-7">{slot.detail}</p>
                      <p className="mt-3 text-xs font-black opacity-70">{slot.time}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">마지막 응답</h2>
              <div className="mt-5 rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                <div className="text-xl font-black">{report.lastResponse.label}</div>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{report.lastResponse.detail}</p>
                <p className="mt-2 text-xs font-black text-[#7A9692]">{report.lastResponse.time}</p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">최근 14일 기록</h2>
              <div className="mt-5 space-y-3">
                {report.history.map((day) => (
                  <article key={day.date} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-black">{day.date}</h3>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#637B76] ring-1 ring-[#D8EEE8]">
                        일일 점수 {day.score}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm font-bold text-[#637B76] sm:grid-cols-2 lg:grid-cols-3">
                      <div>아침 식사: {day.breakfastMeal}</div>
                      <div>점심 식사: {day.lunchMeal}</div>
                      <div>저녁 식사: {day.dinnerMeal}</div>
                      <div>아침약: {day.morningMedication}</div>
                      <div>점심약: {day.noonMedication}</div>
                      <div>저녁약: {day.eveningMedication}</div>
                      <div>몸 상태: {day.condition}</div>
                      <div>도움 요청: {day.emergency}</div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/family/actions"
                className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white"
              >
                가족 실행 보드
              </Link>

              <Link
                href="/family/invite"
                className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
              >
                다른 가족 초대
              </Link>

              <button
                onClick={() => load(familyCode)}
                className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white"
              >
                리포트 새로고침
              </button>
            </div>
          </>
        ) : null}
      </section>
    </main>
  )
}

export default ChildCareReportPanel
