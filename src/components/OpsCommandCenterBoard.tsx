'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  labelOpsCategory,
  labelOpsSourceType,
  type OpsCommandSignal,
  type OpsCommandSummary,
  type OpsSignalCategory
} from '@/lib/ops-command-engine'

type OpsCommandData = {
  ok: boolean
  message?: string
  summary?: OpsCommandSummary
  signals?: OpsCommandSignal[]
  snapshots?: Array<{
    id: string
    reassurance_state: '안심' | '확인 필요' | '긴급'
    summary_text: string
    total_count: number
    urgent_count: number
    attention_count: number
    in_progress_count: number
    completed_count: number
    created_at: string
  }>
}

const categoryOrder: OpsSignalCategory[] = ['urgent', 'attention', 'in_progress', 'completed']

export function OpsCommandCenterBoard() {
  const [data, setData] = useState<OpsCommandData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops-command', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '운영실 통합 관제 정보를 불러오지 못했습니다.')
      }

      setData(result)
    } catch (error) {
      setData({
        ok: false,
        message: error instanceof Error ? error.message : '운영실 통합 관제 정보를 불러오지 못했습니다.'
      })
    } finally {
      setLoading(false)
    }
  }

  async function saveSnapshot() {
    setMessage('')

    try {
      const response = await fetch('/api/ops-command', {
        method: 'POST'
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '스냅샷 저장 실패')
      }

      setMessage('운영실 통합 관제 스냅샷을 저장했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '스냅샷 저장 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = data?.summary
  const signals = data?.signals || []

  const signalsByCategory = useMemo(() => {
    const grouped: Record<OpsSignalCategory, OpsCommandSignal[]> = {
      urgent: [],
      attention: [],
      in_progress: [],
      completed: []
    }

    for (const signal of signals) {
      grouped[signal.category].push(signal)
    }

    return grouped
  }, [signals])

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-xl font-black shadow-sm">
        운영실 통합 관제 정보를 불러오는 중...
      </div>
    )
  }

  if (!data?.ok || !summary) {
    return (
      <div className="rounded-3xl bg-red-50 p-6 text-red-800">
        <h2 className="text-xl font-black">운영실 통합 관제를 불러오지 못했습니다</h2>
        <p className="mt-2">{data?.message || 'STEP26 SQL이 실행됐는지 확인해주세요.'}</p>
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
        <p className="text-sm font-black text-[#63807C]">운영실 통합 관제</p>
        <h2 className="mt-2 text-5xl font-black tracking-tight md:text-6xl">
          {summary.reassuranceState}
        </h2>
        <p className="mt-5 max-w-3xl text-xl font-bold leading-9 text-[#345A56]">
          {summary.summaryText}
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          <Stat label="전체" value={summary.totalCount} />
          <Stat label="긴급" value={summary.urgentCount} />
          <Stat label="확인 필요" value={summary.attentionCount} />
          <Stat label="진행 중" value={summary.inProgressCount} />
          <Stat label="완료" value={summary.completedCount} />
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">운영실 우선 처리</h2>
        <div className="mt-4 space-y-3">
          {summary.opsNextActions.map((action, index) => (
            <div key={action} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
              {index + 1}. {action}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
          새로고침
        </button>
        <button onClick={saveSnapshot} className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
          관제 스냅샷 저장
        </button>
        <Link href="/admin/ops/cases" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
          통합 케이스
        </Link>
        <Link href="/admin/ops/worry-center" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
          걱정센터
        </Link>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        {categoryOrder.map((category) => {
          const items = signalsByCategory[category]

          return (
            <article key={category} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black">{labelOpsCategory(category)}</h2>
                  <p className="mt-1 text-sm text-[#7A9692]">
                    {items.length}건
                  </p>
                </div>
              </div>

              {items.length === 0 ? (
                <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-[#7A9692]">
                  항목이 없습니다.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {items.slice(0, category === 'completed' ? 8 : 12).map((signal) => (
                    <Link
                      key={`${signal.sourceType}-${signal.id}`}
                      href={signal.url}
                      className={
                        'block rounded-2xl p-4 transition ' +
                        (category === 'urgent'
                          ? 'bg-red-50 hover:bg-red-100'
                          : category === 'attention'
                            ? 'bg-amber-50 hover:bg-amber-100'
                            : category === 'in_progress'
                              ? 'bg-blue-50 hover:bg-blue-100'
                              : 'bg-slate-50 hover:bg-slate-100')
                      }
                    >
                      <div className="flex flex-wrap gap-2">
                        <Badge text={labelOpsSourceType(signal.sourceType)} />
                        <Badge text={signal.statusLabel} />
                        <Badge text={signal.priority} />
                      </div>

                      <div className="mt-3 text-lg font-black">{signal.title}</div>

                      {signal.description ? (
                        <p className="mt-2 text-sm leading-6 text-[#63807C]">{signal.description}</p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </section>

      {data.snapshots && data.snapshots.length > 0 ? (
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">최근 저장된 관제 스냅샷</h2>
          <div className="mt-4 space-y-3">
            {data.snapshots.slice(0, 5).map((snapshot) => (
              <div key={snapshot.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge text={snapshot.reassurance_state} />
                  <Badge text={`긴급 ${snapshot.urgent_count}`} />
                  <Badge text={`확인 ${snapshot.attention_count}`} />
                  <Badge text={new Date(snapshot.created_at).toLocaleString('ko-KR')} />
                </div>
                <p className="mt-2 text-sm leading-6 text-[#4E6D69]">
                  {snapshot.summary_text}
                </p>
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
