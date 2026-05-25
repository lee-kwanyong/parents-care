'use client'

import { useEffect, useMemo, useState } from 'react'
import { labelDailyCareStatus, labelDailyCareType } from '@/lib/daily-care-engine'
import type { DailyCareCheckin, AnbuSignalState } from '@/lib/daily-care-engine'

type StatusData = {
  ok: boolean
  message?: string
  items?: DailyCareCheckin[]
  summary?: {
    reassuranceState: '안심' | '확인 필요' | '긴급'
    signalState: AnbuSignalState
    signalScore: number
    signalReasons: string[]
    guardianSummary: string
    familyNextActions: string[]
    total: number
    latestResponseAt: string | null
    aiDisclaimer: string
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
      conditionNeeds: items.filter((item) => item.check_type === 'condition' && item.status !== 'done').length
    }
  }, [data])

  const stateTone =
    data?.summary?.signalState === '확인 필요'
      ? 'bg-[#FFF1F1] text-[#842525]'
      : data?.summary?.signalState === '주의'
        ? 'bg-[#FFF8E8] text-[#735212]'
        : 'bg-[#EFFFF9] text-[#116D5F]'

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_58%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-[#13A88F]">안부웍스 운영실 · 안부온</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.07em] md:text-6xl">
              안부 신호 관제
            </h1>
            <p className="mt-4 max-w-3xl text-lg font-bold leading-8 text-[#637B76]">
              응답 없음, 식사 미확인, 복약 누락, 몸 상태, 기분 저하 신호를 운영실이 우선 확인합니다.
            </p>
          </div>

          <button onClick={load} className="rounded-2xl bg-[#123F38] px-5 py-4 font-black text-white">
            새로고침
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <Stat label="전체 기록" value={counts.total} />
          <Stat label="도움 요청" value={counts.needsHelp} />
          <Stat label="식사 미확인" value={counts.mealNotDone} />
          <Stat label="약 미확인" value={counts.medicationNotDone} />
          <Stat label="상태 확인" value={counts.conditionNeeds} />
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
            <section className={'mt-8 rounded-[2rem] p-6 shadow-sm ' + stateTone}>
              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <p className="text-sm font-black opacity-75">현재 우선순위</p>
                  <div className="mt-2 text-5xl font-black tracking-[-0.08em]">
                    {data.summary?.signalState}
                  </div>
                  <p className="mt-4 text-lg font-bold leading-8">
                    {data.summary?.guardianSummary}
                  </p>
                </div>

                <div className="rounded-[1.75rem] bg-white/75 p-5">
                  <div className="text-sm font-black opacity-75">운영실 확인 이유</div>
                  <div className="mt-3 grid gap-2">
                    {(data.summary?.signalReasons || []).map((reason) => (
                      <div key={reason} className="rounded-2xl bg-white/80 p-3 text-sm font-black">
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-3">
              {(data.items || []).map((item) => (
                <article
                  key={item.id || `${item.check_type}-${item.care_label}-${item.occurred_at}`}
                  className={
                    'rounded-[1.75rem] p-5 shadow-sm ring-1 ' +
                    (item.status === 'needs_help'
                      ? 'bg-[#FFF1F1] ring-[#F2B8B8]'
                      : item.status === 'not_done'
                        ? 'bg-[#FFF8E8] ring-[#F0D299]'
                        : 'bg-white ring-[#D8EEE8]')
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
                      {item.memo ? <p className="mt-2 font-bold text-[#4E6D69]">{item.memo}</p> : null}
                    </div>
                    <p className="text-sm font-bold text-[#7A9692]">
                      {item.occurred_at ? new Date(item.occurred_at).toLocaleString('ko-KR') : ''}
                    </p>
                  </div>
                </article>
              ))}
            </section>

            <p className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
              {data.summary?.aiDisclaimer}
            </p>
          </>
        )}
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8]">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#DCEDE7]">
      {text}
    </span>
  )
}
