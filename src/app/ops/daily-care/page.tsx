'use client'

import { useEffect, useMemo, useState } from 'react'
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

export default function OpsDailyCarePage() {
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

  const counts = useMemo(() => {
    const items = data?.items || []

    return {
      total: items.length,
      needsHelp: items.filter((item) => item.status === 'needs_help').length,
      mealNotDone: items.filter((item) => item.check_type === 'meal' && item.status === 'not_done').length,
      medicationNotDone: items.filter((item) => item.check_type === 'medication' && item.status === 'not_done').length,
      safeReturn: items.filter((item) => item.check_type === 'safe_return' && item.status === 'done').length
    }
  }, [data])

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              일상 케어 관제
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              식사, 약, 컨디션, 도움 요청, 안전 귀가를 확인합니다.
            </p>
          </div>

          <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
            새로고침
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <Stat label="전체 기록" value={counts.total} />
          <Stat label="도움 요청" value={counts.needsHelp} />
          <Stat label="식사 미확인" value={counts.mealNotDone} />
          <Stat label="약 미확인" value={counts.medicationNotDone} />
          <Stat label="귀가 확인" value={counts.safeReturn} />
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
          <section className="mt-8 space-y-3">
            {(data.items || []).map((item) => (
              <article
                key={item.id}
                className={
                  'rounded-3xl p-5 shadow-sm ' +
                  (item.status === 'needs_help'
                    ? 'bg-red-50'
                    : item.status === 'not_done'
                      ? 'bg-amber-50'
                      : 'bg-white')
                }
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelDailyCareType(item.check_type)} />
                      <Badge text={labelDailyCareStatus(item.status)} />
                      <Badge text={item.elder_name} />
                    </div>
                    <h2 className="mt-3 text-2xl font-black">{item.care_label}</h2>
                    {item.memo ? <p className="mt-2 text-slate-700">{item.memo}</p> : null}
                  </div>
                  <p className="text-sm font-bold text-slate-500">
                    {item.occurred_at ? new Date(item.occurred_at).toLocaleString('ko-KR') : ''}
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
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
