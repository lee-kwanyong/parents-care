'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  buildRoutineSummary,
  labelCadence,
  labelNextVisitStatus,
  labelRoutineStatus,
  labelRoutineType,
  type CareNextVisitDraft,
  type CareRoutineSchedule,
  type NextVisitStatus,
  type RoutineStatus
} from '@/lib/recurring-care-engine'

export function RecurringCareBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [routines, setRoutines] = useState<CareRoutineSchedule[]>([])
  const [drafts, setDrafts] = useState<CareNextVisitDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/recurring-care', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '정기 케어 목록을 불러오지 못했습니다.')
      }

      setRoutines(data.routines || [])
      setDrafts(data.drafts || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '정기 케어 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateRoutine(id: string, status: RoutineStatus) {
    await patch({ kind: 'routine', id, status })
  }

  async function updateDraft(id: string, status: NextVisitStatus) {
    await patch({ kind: 'draft', id, status })
  }

  async function patch(body: Record<string, string>) {
    setMessage('')

    try {
      const response = await fetch('/api/recurring-care', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildRoutineSummary(routines, drafts), [routines, drafts])
  const openDrafts = drafts.filter((draft) => !['booked', 'done', 'cancelled'].includes(draft.status))

  return (
    <div>
      <div
        className={
          'rounded-3xl p-6 ' +
          (summary.reassuranceState === '긴급'
            ? 'bg-red-50'
            : summary.reassuranceState === '확인 필요'
              ? 'bg-amber-50'
              : 'bg-emerald-50')
        }
      >
        <p className="text-sm font-black text-[#63807C]">정기진료 안심판</p>
        <div className="mt-2 text-5xl font-black">{summary.reassuranceState}</div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="정기 케어" value={summary.routineTotal} />
          <Stat label="활성" value={summary.activeTotal} />
          <Stat label="지난 일정" value={summary.overdueTotal} />
          <Stat label="곧 필요" value={summary.soonTotal} />
          <Stat label="예약 완료" value={summary.bookedTotal} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
          새로고침
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

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

      <section className="mt-8">
        <h2 className="text-2xl font-black">다음 예약 후보</h2>

        {loading ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            불러오는 중...
          </div>
        ) : openDrafts.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">확인할 다음 예약 후보가 없습니다.</div>
            <p className="mt-2 text-[#7A9692]">정기진료를 등록하면 자동으로 후보가 만들어집니다.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {openDrafts.map((draft) => (
              <article key={draft.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelNextVisitStatus(draft.status)} />
                      <Badge text={draft.priority} />
                      {draft.suggested_date ? <Badge text={draft.suggested_date} /> : null}
                    </div>
                    <h3 className="mt-3 text-2xl font-black">{draft.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#63807C]">
                      병원: {draft.hospital_name || '미입력'} · 진료과: {draft.department || '미입력'} · 선호시간: {draft.preferred_time || '미입력'}
                    </p>
                    {draft.memo ? (
                      <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-[#4E6D69]">
                        {draft.memo}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid min-w-[190px] gap-2">
                    <button
                      onClick={() => updateDraft(draft.id, 'family_review')}
                      className="rounded-2xl bg-slate-100 px-4 py-3 font-black"
                    >
                      가족 확인 중
                    </button>
                    <button
                      onClick={() => updateDraft(draft.id, 'appointment_requested')}
                      className="rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-900"
                    >
                      예약 요청
                    </button>
                    <button
                      onClick={() => updateDraft(draft.id, 'booked')}
                      className="rounded-2xl bg-[#8CCFC3] px-4 py-3 font-black text-[#2E504D]"
                    >
                      예약 완료
                    </button>
                    {mode === 'ops' ? (
                      <button
                        onClick={() => updateDraft(draft.id, 'cancelled')}
                        className="rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700"
                      >
                        취소
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-black">정기 케어 목록</h2>

        {loading ? null : routines.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">등록된 정기 케어가 없습니다.</div>
            <p className="mt-2 text-[#7A9692]">/care-routines 에서 정기진료를 등록해보세요.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {routines.map((routine) => (
              <article key={routine.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelRoutineType(routine.routine_type)} />
                      <Badge text={labelCadence(routine.cadence_type)} />
                      <Badge text={labelRoutineStatus(routine.status)} />
                      {routine.next_due_date ? <Badge text={`다음: ${routine.next_due_date}`} /> : null}
                    </div>
                    <h3 className="mt-3 text-2xl font-black">{routine.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#63807C]">
                      {routine.elder_name} · {routine.hospital_name || '병원 미입력'} · {routine.department || '진료과 미입력'}
                    </p>
                    {routine.memo ? (
                      <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-[#4E6D69]">
                        {routine.memo}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid min-w-[160px] gap-2">
                    <button
                      onClick={() => updateRoutine(routine.id, routine.status === 'active' ? 'paused' : 'active')}
                      className="rounded-2xl bg-slate-100 px-4 py-3 font-black"
                    >
                      {routine.status === 'active' ? '일시중지' : '다시 활성'}
                    </button>
                    {mode === 'ops' ? (
                      <button
                        onClick={() => updateRoutine(routine.id, 'completed')}
                        className="rounded-2xl bg-emerald-100 px-4 py-3 font-black text-emerald-900"
                      >
                        종료
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
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
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[#4E6D69]">
      {text}
    </span>
  )
}
