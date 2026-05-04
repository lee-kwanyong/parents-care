'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  buildDischargeSummary,
  labelConditionStatus,
  labelDischargeCheckStatus,
  labelMealStatus,
  labelMedicationStatus,
  type DischargeCheckStatus,
  type DischargePackStatus,
  type PostDischargeCarePack,
  type PostDischargeDailyCheck
} from '@/lib/discharge-care-engine'

export function DischargeCareBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [packs, setPacks] = useState<PostDischargeCarePack[]>([])
  const [checks, setChecks] = useState<PostDischargeDailyCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/discharge-care', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '퇴원 후 안심팩을 불러오지 못했습니다.')
      }

      setPacks(data.packs || [])
      setChecks(data.checks || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '퇴원 후 안심팩을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateCheck(id: string, status: DischargeCheckStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/discharge-care', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'check', id, status })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '체크 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '체크 상태 변경 실패')
    }
  }

  async function updatePack(id: string, status: DischargePackStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/discharge-care', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'pack', id, status })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '안심팩 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '안심팩 상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildDischargeSummary(packs, checks), [packs, checks])

  const checksByPack = useMemo(() => {
    const map = new Map<string, PostDischargeDailyCheck[]>()

    for (const check of checks) {
      const current = map.get(check.care_pack_id) || []
      current.push(check)
      map.set(check.care_pack_id, current)
    }

    return map
  }, [checks])

  return (
    <div>
      <div
        className={
          'rounded-3xl p-6 ' +
          (summary.reassuranceState === '확인 필요' ? 'bg-amber-50' : 'bg-emerald-50')
        }
      >
        <p className="text-sm font-black text-slate-600">퇴원 후 7일 안심판</p>
        <div className="mt-2 text-5xl font-black">{summary.reassuranceState}</div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="안심팩" value={summary.activePackTotal} />
          <Stat label="전체 체크" value={summary.checkTotal} />
          <Stat label="완료" value={summary.doneTotal} />
          <Stat label="예정" value={summary.plannedTotal} />
          <Stat label="주의" value={summary.needsAttentionTotal} />
        </div>
      </div>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">가족이 할 일</h2>
        <div className="mt-4 space-y-3">
          {summary.familyNextActions.map((action, index) => (
            <div key={action} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
              {index + 1}. {action}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
          새로고침
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      <section className="mt-8 space-y-5">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            불러오는 중...
          </div>
        ) : packs.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">등록된 퇴원 후 7일 안심팩이 없습니다.</div>
            <p className="mt-2 text-slate-500">/care-discharge 에서 먼저 등록해보세요.</p>
          </div>
        ) : (
          packs.map((pack) => {
            const packChecks = (checksByPack.get(pack.id) || []).sort((a, b) => a.day_index - b.day_index)

            return (
              <article key={pack.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={pack.status} />
                      <Badge text={`퇴원일 ${pack.discharge_date}`} />
                      {pack.next_visit_date ? <Badge text={`다음 외래 ${pack.next_visit_date}`} /> : null}
                      {pack.medication_risk ? <Badge text="약 확인" /> : null}
                      {pack.meal_risk ? <Badge text="식사 확인" /> : null}
                      {pack.fall_risk || pack.mobility_risk ? <Badge text="이동/낙상 주의" /> : null}
                    </div>

                    <h3 className="mt-3 text-3xl font-black">{pack.elder_name} 퇴원 후 7일 안심팩</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      병원: {pack.hospital_name || '미입력'} · 진단/수술: {pack.primary_diagnosis || '미입력'}
                    </p>

                    {pack.memo ? (
                      <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {pack.memo}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid min-w-[180px] gap-2">
                    {pack.status === 'active' ? (
                      <button onClick={() => updatePack(pack.id, 'paused')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                        일시중지
                      </button>
                    ) : (
                      <button onClick={() => updatePack(pack.id, 'active')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                        다시 활성
                      </button>
                    )}

                    <button onClick={() => updatePack(pack.id, 'completed')} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
                      7일 케어 완료
                    </button>

                    {mode === 'ops' ? (
                      <button onClick={() => updatePack(pack.id, 'cancelled')} className="rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700">
                        취소
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {packChecks.map((check) => (
                    <div
                      key={check.id}
                      className={
                        'rounded-3xl p-5 ' +
                        (check.status === 'needs_attention' || check.status === 'overdue'
                          ? 'bg-amber-50'
                          : check.status === 'done'
                            ? 'bg-emerald-50'
                            : 'bg-slate-50')
                      }
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge text={`${check.day_index}일차`} />
                            <Badge text={check.check_date} />
                            <Badge text={labelDischargeCheckStatus(check.status)} />
                            <Badge text={`약 ${labelMedicationStatus(check.medication_status)}`} />
                            <Badge text={`식사 ${labelMealStatus(check.meal_status)}`} />
                            <Badge text={`컨디션 ${labelConditionStatus(check.condition_status)}`} />
                          </div>

                          <h4 className="mt-3 text-2xl font-black">{check.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{check.check_focus}</p>

                          {check.family_note ? (
                            <p className="mt-3 rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-700">
                              가족 메모: {check.family_note}
                            </p>
                          ) : null}
                        </div>

                        <div className="grid min-w-[170px] gap-2">
                          <button onClick={() => updateCheck(check.id, 'done')} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
                            확인 완료
                          </button>
                          <button onClick={() => updateCheck(check.id, 'needs_attention')} className="rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-900">
                            주의 필요
                          </button>
                          {mode === 'ops' ? (
                            <button onClick={() => updateCheck(check.id, 'skipped')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                              건너뜀
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
      {text}
    </span>
  )
}
