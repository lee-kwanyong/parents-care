'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { labelDailyCareStatus, labelDailyCareType } from '@/lib/daily-care-engine'
import type { DailyCareCheckin } from '@/lib/daily-care-engine'

type StatusData = {
  ok: boolean
  message?: string
  items?: DailyCareCheckin[]
  summary?: {
    reassuranceState: '안심' | '확인 필요' | '긴급'
    total: number
    latest: DailyCareCheckin[]
    hasEmergency: boolean
    mealNeedsCheck: boolean
    medicationNeedsCheck: boolean
    safeReturnDone: boolean
    familyNextActions: string[]
  }
}

export default function ChildDailyCarePage() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/daily-care/status', { cache: 'no-store' })
      const result = await response.json()
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
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">자녀앱</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              밥·약·컨디션 확인
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              부모님이 큰 버튼으로 누른 식사, 약, 컨디션, 도움 요청을 확인합니다.
            </p>
          </div>

          <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
            새로고침
          </button>
        </div>

        {loading ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            불러오는 중...
          </div>
        ) : !data?.ok ? (
          <div className="mt-8 rounded-3xl bg-red-50 p-6 text-red-800">
            <h2 className="text-xl font-black">상태를 불러오지 못했습니다</h2>
            <p className="mt-2">{data?.message}</p>
          </div>
        ) : (
          <>
            <div
              className={
                'mt-8 rounded-3xl p-6 ' +
                (summary?.reassuranceState === '긴급'
                  ? 'bg-red-50'
                  : summary?.reassuranceState === '확인 필요'
                    ? 'bg-amber-50'
                    : 'bg-emerald-50')
              }
            >
              <p className="text-sm font-black text-slate-600">오늘의 안심판</p>
              <div className="mt-2 text-5xl font-black">{summary?.reassuranceState || '확인 필요'}</div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <StatusCard label="식사" value={summary?.mealNeedsCheck ? '확인 필요' : '확인됨'} />
                <StatusCard label="약" value={summary?.medicationNeedsCheck ? '확인 필요' : '확인됨'} />
                <StatusCard label="귀가" value={summary?.safeReturnDone ? '확인됨' : '미확인'} />
              </div>
            </div>

            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">가족이 할 일</h2>
              <div className="mt-4 space-y-3">
                {(summary?.familyNextActions || []).map((item, index) => (
                  <div key={item} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
                    {index + 1}. {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">최근 확인 기록</h2>
              <div className="mt-4 space-y-3">
                {(data.items || []).slice(0, 20).map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge text={labelDailyCareType(item.check_type)} />
                      <Badge text={labelDailyCareStatus(item.status)} />
                      <span className="text-sm text-slate-500">
                        {item.occurred_at ? new Date(item.occurred_at).toLocaleString('ko-KR') : ''}
                      </span>
                    </div>
                    <div className="mt-2 text-lg font-black">{item.care_label}</div>
                    {item.memo ? <p className="mt-1 text-sm text-slate-600">{item.memo}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/parent/today" className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
            부모님 화면 보기
          </Link>
          <Link href="/child" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
            자녀 홈
          </Link>
        </div>
      </section>
    </main>
  )
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">
      {text}
    </span>
  )
}
