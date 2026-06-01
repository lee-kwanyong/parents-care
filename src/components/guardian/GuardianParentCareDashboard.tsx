'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type CareItem = {
  key: string
  title: string
  value: string
  detail: string
  time: string
  tone: 'good' | 'warn' | 'danger' | 'empty'
}

type CareData = {
  familyCode: string
  parentName: string
  guardianName: string
  state: '정상' | '주의' | '확인 필요'
  score: number
  summary: string
  lastResponse: {
    label: string
    detail: string
    time: string
  }
  items: CareItem[]
  reasons: string[]
  actions: string[]
  reports: Array<{
    title: string
    summary: string
    status: string
    time: string
  }>
}

function stateClass(state?: string) {
  if (state === '확인 필요') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (state === '주의') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
}

function itemClass(tone: CareItem['tone']) {
  if (tone === 'danger') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (tone === 'warn') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  if (tone === 'good') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  return 'bg-[#F8FCFB] text-[#637B76] ring-[#D8EEE8]'
}

export function GuardianParentCareDashboard() {
  const [care, setCare] = useState<CareData | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/guardian-parent-care', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false || !data.care) {
        setCare(null)
        setMessage(data.message || '부모님 케어 정보를 불러오지 못했습니다.')
        return
      }

      setCare(data.care)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '부모님 케어 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            보호자 부모님 케어
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            부모님 상태를
            <br />
            한 화면에서 확인합니다.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            식사, 약, 몸 상태, 불편한 곳, 도움 요청을 보호자가 바로 확인할 수 있게 정리했습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60">
              {loading ? '불러오는 중...' : '새로고침'}
            </button>

            <Link href="/family-link" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
              부모님 연결관리
            </Link>

            <Link href="/ops/risk-action" className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
              다음 행동 가이드
            </Link>
          </div>
        </section>

        {message ? (
          <section className="rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
            {message}
          </section>
        ) : null}

        {care ? (
          <>
            <section className={'rounded-[2rem] p-5 ring-1 sm:p-6 ' + stateClass(care.state)}>
              <div className="grid gap-5 lg:grid-cols-[1fr_0.45fr]">
                <div>
                  <p className="text-sm font-black opacity-75">
                    {care.parentName} · 가족코드 {care.familyCode}
                  </p>
                  <h2 className="mt-3 text-5xl font-black tracking-[-0.08em]">{care.state}</h2>
                  <p className="mt-5 text-lg font-bold leading-8">{care.summary}</p>
                </div>

                <div className="rounded-2xl bg-white/75 p-5">
                  <div className="text-sm font-black opacity-70">안부 점수</div>
                  <div className="mt-2 text-6xl font-black tracking-[-0.08em]">{care.score}</div>
                  <p className="mt-2 text-sm font-bold leading-6 opacity-75">
                    의료 진단이 아닌 안부 확인 참고 신호입니다.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">최근 안부</h2>
              <div className="mt-4 rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                <div className="text-xl font-black">{care.lastResponse.label}</div>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{care.lastResponse.detail}</p>
                <p className="mt-2 text-xs font-black text-[#7A9692]">{care.lastResponse.time}</p>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              {care.items.map((item) => (
                <article key={item.key} className={'rounded-[2rem] p-5 ring-1 sm:p-6 ' + itemClass(item.tone)}>
                  <div className="text-sm font-black opacity-70">{item.title}</div>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.06em]">{item.value}</h3>
                  <p className="mt-3 text-sm font-bold leading-7">{item.detail}</p>
                  <p className="mt-3 text-xs font-black opacity-70">{item.time}</p>
                </article>
              ))}
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">확인된 이유</h2>
                <div className="mt-5 space-y-3">
                  {care.reasons.map((reason) => (
                    <div key={reason} className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                      {reason}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">보호자 다음 행동</h2>
                <div className="mt-5 space-y-3">
                  {care.actions.map((action) => (
                    <div key={action} className="rounded-2xl bg-[#EFFFF9] p-4 text-sm font-bold leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
                      {action}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">최근 리포트</h2>
              <div className="mt-5 space-y-3">
                {care.reports.length === 0 ? (
                  <div className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                    아직 제출된 케어 리포트가 없습니다.
                  </div>
                ) : (
                  care.reports.map((report) => (
                    <article key={`${report.title}-${report.time}`} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                      <h3 className="text-lg font-black">{report.title}</h3>
                      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{report.summary}</p>
                      <p className="mt-2 text-xs font-black text-[#7A9692]">{report.status} · {report.time}</p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  )
}

export default GuardianParentCareDashboard
