'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  labelTodaySourceType,
  type TodayCareSource,
  type TodayReassuranceSummary
} from '@/lib/today-reassurance-engine'

type TodayData = {
  ok: boolean
  message?: string
  summary?: TodayReassuranceSummary
  sources?: TodayCareSource[]
  snapshots?: Array<{
    id: string
    elder_name: string
    reassurance_state: '안심' | '확인 필요' | '긴급'
    summary_text: string
    created_at: string
  }>
}

export function TodayReassuranceBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/today-reassurance', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '오늘의 안심판을 불러오지 못했습니다.')
      }

      setData(result)
    } catch (error) {
      setData({ ok: false, message: error instanceof Error ? error.message : '오늘의 안심판을 불러오지 못했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  async function saveSnapshot() {
    setMessage('')

    try {
      const response = await fetch('/api/today-reassurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elderName: '어머니' })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '스냅샷 저장 실패')
      }

      setMessage('오늘의 안심판 스냅샷을 저장했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '스냅샷 저장 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = data?.summary
  const sources = data?.sources || []

  const groupedSources = useMemo(() => {
    return sources.reduce<Record<string, TodayCareSource[]>>((acc, source) => {
      acc[source.sourceType] = acc[source.sourceType] || []
      acc[source.sourceType].push(source)
      return acc
    }, {})
  }, [sources])

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-xl font-black shadow-sm">
        오늘의 안심판을 불러오는 중...
      </div>
    )
  }

  if (!data?.ok || !summary) {
    return (
      <div className="rounded-3xl bg-red-50 p-6 text-red-800">
        <h2 className="text-xl font-black">오늘의 안심판을 불러오지 못했습니다</h2>
        <p className="mt-2">{data?.message || '잠시 후 다시 확인해주세요.'}</p>
      </div>
    )
  }

  return (
    <div>
      <section
        className={
          'rounded-[2rem] p-6 shadow-sm md:p-8 ' +
          (summary.reassuranceState === '긴급'
            ? 'bg-red-50'
            : summary.reassuranceState === '확인 필요'
              ? 'bg-amber-50'
              : 'bg-emerald-50')
        }
      >
        <p className="text-sm font-black text-[#63807C]">오늘의 안심판</p>
        <h2 className="mt-2 text-5xl font-black tracking-tight md:text-6xl">
          {summary.reassuranceState}
        </h2>
        <p className="mt-5 max-w-3xl text-xl font-bold leading-9 text-[#345A56]">
          {summary.summaryText}
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Stat label="전체 신호" value={summary.sourceCount} />
          <Stat label="긴급" value={summary.urgentCount} />
          <Stat label="확인 필요" value={summary.attentionCount} />
          <Stat label="가족 할 일" value={summary.familyNextActions.length} />
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">가족이 할 일 3개</h2>
        <div className="mt-4 space-y-3">
          {summary.familyNextActions.map((action, index) => (
            <div key={action} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
              {index + 1}. {action}
            </div>
          ))}
        </div>
      </section>

      {summary.topReasons.length > 0 ? (
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">확인 필요한 이유</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {summary.topReasons.map((source) => (
              <Link
                key={`${source.sourceType}-${source.id}`}
                href={source.url}
                className={
                  'rounded-2xl p-4 transition ' +
                  (source.severity === 'urgent'
                    ? 'bg-red-50 text-red-950'
                    : 'bg-amber-50 text-amber-950')
                }
              >
                <div className="flex flex-wrap gap-2">
                  <Badge text={labelTodaySourceType(source.sourceType)} />
                  <Badge text={source.statusLabel} />
                </div>
                <div className="mt-3 text-lg font-black">{source.label}</div>
                {source.memo ? <p className="mt-2 text-sm leading-6 opacity-80">{source.memo}</p> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">연결된 전체 신호</h2>
        {Object.keys(groupedSources).length === 0 ? (
          <p className="mt-3 text-[#7A9692]">아직 연결된 신호가 없습니다.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {Object.entries(groupedSources).map(([type, items]) => (
              <div key={type} className="rounded-2xl bg-slate-50 p-4">
                <div className="font-black">{labelTodaySourceType(type)}</div>
                <div className="mt-2 text-3xl font-black">{items.length}</div>
                <div className="mt-3 space-y-2">
                  {items.slice(0, 3).map((item) => (
                    <Link key={`${item.sourceType}-${item.id}`} href={item.url} className="block rounded-xl bg-white p-3 text-sm font-bold">
                      {item.label}
                      <span className="ml-2 text-xs text-[#7A9692]">{item.statusLabel}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {summary.importantNotes.length > 0 ? (
        <section className="mt-6 rounded-3xl bg-[#5F7C92] p-6 text-[#2E504D]">
          <h2 className="text-2xl font-black">중요 메모</h2>
          <div className="mt-4 space-y-3">
            {summary.importantNotes.map((note) => (
              <div key={note} className="rounded-2xl bg-white/70 p-4 font-bold">
                {note}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
          새로고침
        </button>

        {mode === 'ops' ? (
          <button onClick={saveSnapshot} className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
            오늘 안심판 저장
          </button>
        ) : null}

        <Link href="/care-intake" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
          사진·카톡으로 맡기기
        </Link>

        <Link href="/child/tasks" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
          가족 할 일
        </Link>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      {mode === 'ops' && data.snapshots && data.snapshots.length > 0 ? (
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">최근 저장된 안심판</h2>
          <div className="mt-4 space-y-3">
            {data.snapshots.slice(0, 5).map((snapshot) => (
              <div key={snapshot.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge text={snapshot.reassurance_state} />
                  <Badge text={new Date(snapshot.created_at).toLocaleString('ko-KR')} />
                </div>
                <p className="mt-2 text-sm leading-6 text-[#4E6D69]">{snapshot.summary_text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69]">
      {text}
    </span>
  )
}
