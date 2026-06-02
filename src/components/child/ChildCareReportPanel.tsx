'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type ReportItem = {
  key: string
  title: string
  value: string
  detail: string
  time: string
  tone: 'good' | 'warn' | 'danger' | 'empty'
}

type Report = {
  familyCode: string
  parentName: string
  date: string
  state: '정상' | '주의' | '확인 필요'
  score: number
  lastResponse: {
    label: string
    detail: string
    time: string
  }
  items: ReportItem[]
  warnings: string[]
  actions: string[]
}

function toneClass(tone: ReportItem['tone']) {
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
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            자녀용 부모님 리포트
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            식사와 약을
            <br />
            확인할 수 있습니다.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            부모님이 누른 안부버튼을 기준으로 오늘 식사, 복약, 몸 상태, 도움 요청을 정리합니다.
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
              {loading ? '확인 중' : '조회'}
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
              <div className="grid gap-5 lg:grid-cols-[1fr_0.45fr]">
                <div>
                  <p className="text-sm font-black opacity-75">
                    {report.parentName} · 가족코드 {report.familyCode} · {report.date}
                  </p>
                  <h2 className="mt-3 text-5xl font-black tracking-[-0.08em]">
                    {report.state}
                  </h2>
                  <p className="mt-5 text-lg font-bold leading-8">
                    {report.state === '확인 필요'
                      ? '오늘 확인이 필요한 항목이 있습니다. 부모님께 전화해서 식사와 약 복용을 확인해주세요.'
                      : report.state === '주의'
                        ? '일부 항목이 아직 확인되지 않았습니다. 한 번 더 안부를 확인해주세요.'
                        : '오늘 식사와 약 상태가 안정적으로 확인되고 있습니다.'}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/75 p-5">
                  <div className="text-sm font-black opacity-70">오늘 안부 점수</div>
                  <div className="mt-2 text-6xl font-black tracking-[-0.08em]">{report.score}</div>
                  <p className="mt-2 text-sm font-bold leading-6 opacity-75">
                    의료 진단이 아닌 가족 안부 확인용 점수입니다.
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              {report.items.map((item) => (
                <article key={item.key} className={'rounded-[2rem] p-5 ring-1 sm:p-6 ' + toneClass(item.tone)}>
                  <div className="text-sm font-black opacity-70">{item.title}</div>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.06em]">{item.value}</h3>
                  <p className="mt-3 text-sm font-bold leading-7">{item.detail}</p>
                  <p className="mt-3 text-xs font-black opacity-70">{item.time}</p>
                </article>
              ))}
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">확인할 점</h2>
                <div className="mt-5 space-y-3">
                  {report.warnings.map((warning) => (
                    <div key={warning} className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                      {warning}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">자녀 다음 행동</h2>
                <div className="mt-5 space-y-3">
                  {report.actions.map((action) => (
                    <div key={action} className="rounded-2xl bg-[#EFFFF9] p-4 text-sm font-bold leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
                      {action}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/family-link"
                className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
              >
                부모님 연결코드
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
