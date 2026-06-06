'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { labelDailyCareStatus, labelDailyCareType } from '@/lib/daily-care-engine'
import type { DailyCareCheckin, AnbuSignalState } from '@/lib/daily-care-engine'

type StatusData = {
  ok: boolean
  message?: string
  items?: DailyCareCheckin[]
  summary?: {
    signalState: AnbuSignalState
    signalScore: number
    signalReasons: string[]
    guardianSummary: string
    familyNextActions: string[]
    latestResponseAt: string | null
    aiDisclaimer: string
  }
}

function stateClass(state?: AnbuSignalState) {
  if (state === '확인 필요') return 'bg-[#FFF4F4] text-[#842525] ring-[#F2B8B8]'
  if (state === '주의') return 'bg-[#FFF9EE] text-[#735212] ring-[#F0D299]'
  return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
}

export default function ChildDailyCarePage() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/daily-care/status', { cache: 'no-store' })
      const result = (await response.json()) as StatusData
      setData(result)
    } catch (error) {
      setData({
        ok: false,
        message: error instanceof Error ? error.message : '불러오기 실패'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = data?.summary

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-[#13A88F]">안부웍스 · 안부온</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.07em] md:text-6xl">
              보호자 알림 화면
            </h1>
            <p className="mt-4 max-w-3xl text-lg font-bold leading-8 text-[#637B76]">
              부모님의 식사, 약, 몸 상태, 기분, 활동 응답을 모아 오늘 상태를 보여줍니다.
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-2xl bg-[#247A71] px-5 py-4 font-black text-white shadow-sm"
          >
            새로고침
          </button>
        </div>

        {loading ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            불러오는 중...
          </div>
        ) : !data?.ok ? (
          <div className="mt-8 rounded-3xl bg-red-50 p-6 text-red-800 ring-1 ring-red-100">
            <h2 className="text-xl font-black">상태를 불러오지 못했습니다</h2>
            <p className="mt-2">{data?.message}</p>
          </div>
        ) : (
          <>
            <section className={'mt-8 rounded-[2rem] p-6 ring-1 ' + stateClass(summary?.signalState)}>
              <p className="text-sm font-black opacity-75">오늘 부모님 상태</p>
              <div className="mt-3 text-5xl font-black tracking-[-0.08em] md:text-7xl">
                {summary?.signalState || '확인 필요'}
              </div>
              <p className="mt-5 max-w-2xl text-lg font-bold leading-8">
                {summary?.guardianSummary}
              </p>
              <div className="mt-5 rounded-[1.75rem] bg-white/75 p-5">
                <div className="text-sm font-black opacity-70">안부온 확인 점수</div>
                <div className="mt-2 text-5xl font-black tracking-[-0.08em]">
                  {summary?.signalScore ?? 0} / 100
                </div>
              </div>
            </section>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
                <h2 className="text-2xl font-black">확인된 신호</h2>
                <div className="mt-4 space-y-3">
                  {(summary?.signalReasons || []).map((reason) => (
                    <div key={reason} className="rounded-2xl bg-[#F5FBF9] p-4 text-base font-black leading-7">
                      {reason}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
                <h2 className="text-2xl font-black">다음 행동</h2>
                <div className="mt-4 space-y-3">
                  {(summary?.familyNextActions || []).map((item, index) => (
                    <div key={item} className="rounded-2xl bg-[#F7FBFF] p-4 text-base font-black leading-7">
                      {index + 1}. {item}
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link href="tel:119" className="rounded-2xl bg-[#FFE7E7] px-4 py-4 text-center font-black text-[#8A3030]">
                    긴급하면 119
                  </Link>
                  <Link href="/care-request" className="rounded-2xl bg-[#20C5A8] px-4 py-4 text-center font-black text-white">
                    운영실 확인 요청
                  </Link>
                  <Link href="/child/matching" className="rounded-2xl bg-[#EFFFFA] px-4 py-4 text-center font-black text-[#2AA897]">
                    케어파트너 연결
                  </Link>
                  <Link href="/child/reports" className="rounded-2xl bg-[#F7FBFF] px-4 py-4 text-center font-black text-[#234B68]">
                    리포트 보기
                  </Link>
                </div>
              </section>
            </div>

            <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black">최근 안부 기록</h2>
                  <p className="mt-2 text-sm font-bold text-[#637B76]">
                    마지막 응답: {summary?.latestResponseAt ? new Date(summary.latestResponseAt).toLocaleString('ko-KR') : '응답 없음'}
                  </p>
                </div>
                <Link href="/parent/today" className="rounded-2xl bg-[#F1FBF8] px-4 py-3 text-sm font-black text-[#2AA897]">
                  부모님 화면 보기
                </Link>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {(data.items || []).slice(0, 20).map((item) => (
                  <div key={item.id || `${item.check_type}-${item.care_label}-${item.occurred_at}`} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#E2F1ED]">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge text={labelDailyCareType(item.check_type)} />
                      <Badge text={labelDailyCareStatus(item.status)} />
                      <span className="text-xs font-bold text-[#7A9692]">
                        {item.occurred_at ? new Date(item.occurred_at).toLocaleString('ko-KR') : ''}
                      </span>
                    </div>
                    <div className="mt-3 text-lg font-black">{item.care_label}</div>
                    {item.memo ? <p className="mt-1 text-sm font-bold text-[#637B76]">{item.memo}</p> : null}
                  </div>
                ))}
              </div>
            </section>

            <p className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
              {summary?.aiDisclaimer}
            </p>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/anbuon" className="rounded-2xl bg-[#EFFFFA] px-5 py-4 font-black text-[#2AA897]">
            안부온 소개
          </Link>
          <Link href="/" className="rounded-2xl bg-white px-5 py-4 font-black ring-1 ring-[#D6EDE7]">
            홈으로
          </Link>
        </div>
      </section>
    </main>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#DCEDE7]">
      {text}
    </span>
  )
}
