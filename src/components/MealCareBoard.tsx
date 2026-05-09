'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  buildMealCareSummary,
  labelDeliveryStatus,
  labelMealDietType,
  labelMealStatus,
  labelMealSupportType,
  labelMealTime,
  type MealRequestStatus,
  type MealServiceEvent,
  type MealStatus,
  type MealSupportRequest
} from '@/lib/meal-care-engine'

export function MealCareBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [requests, setRequests] = useState<MealSupportRequest[]>([])
  const [events, setEvents] = useState<MealServiceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/meal-care', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '식사 케어 목록을 불러오지 못했습니다.')
      }

      setRequests(data.requests || [])
      setEvents(data.events || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '식사 케어 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateRequest(id: string, status: MealRequestStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/meal-care', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'request', id, status })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '요청 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 상태 변경 실패')
    }
  }

  async function updateEvent(id: string, input: { mealStatus?: MealStatus; deliveryStatus?: string }) {
    setMessage('')

    try {
      const response = await fetch('/api/meal-care', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'event',
          id,
          mealStatus: input.mealStatus,
          deliveryStatus: input.deliveryStatus
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '식사 체크 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '식사 체크 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildMealCareSummary(requests, events), [requests, events])

  const eventsByRequest = useMemo(() => {
    const map = new Map<string, MealServiceEvent[]>()

    for (const event of events) {
      const current = map.get(event.meal_support_request_id) || []
      current.push(event)
      map.set(event.meal_support_request_id, current)
    }

    return map
  }, [events])

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
        <p className="text-sm font-black text-[#63807C]">식사 안심판</p>
        <div className="mt-2 text-5xl font-black">{summary.reassuranceState}</div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="식사 케어" value={summary.activeRequestTotal} />
          <Stat label="식사 체크" value={summary.eventTotal} />
          <Stat label="못 드심" value={summary.notEatenTotal} />
          <Stat label="도움 요청" value={summary.needsHelpTotal} />
          <Stat label="배송 완료" value={summary.deliveredTotal} />
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
        <button onClick={load} className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
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
        ) : requests.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">등록된 안심밥상 요청이 없습니다.</div>
            <p className="mt-2 text-[#7A9692]">/care-meals 에서 먼저 등록해보세요.</p>
          </div>
        ) : (
          requests.map((request) => {
            const requestEvents = (eventsByRequest.get(request.id) || []).sort((a, b) => {
              const dateCompare = a.event_date.localeCompare(b.event_date)
              if (dateCompare !== 0) return dateCompare
              return a.meal_time.localeCompare(b.meal_time)
            })

            return (
              <article key={request.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelMealSupportType(request.support_type)} />
                      <Badge text={labelMealDietType(request.diet_type)} />
                      <Badge text={request.status} />
                      {request.social_care_requested ? <Badge text="사회공헌 요청" /> : null}
                      <Badge text={`${request.start_date} 시작`} />
                    </div>

                    <h3 className="mt-3 text-3xl font-black">{request.elder_name} 안심밥상</h3>
                    <p className="mt-2 text-sm leading-6 text-[#63807C]">
                      식사 시간: {request.meal_times.map(labelMealTime).join(', ')}
                      {request.delivery_address ? ` · 배송지: ${request.delivery_address}` : ''}
                    </p>

                    {request.memo ? (
                      <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-[#4E6D69]">
                        {request.memo}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid min-w-[180px] gap-2">
                    {mode === 'ops' ? (
                      <>
                        <button onClick={() => updateRequest(request.id, 'reviewing')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                          검토 중
                        </button>
                        <button onClick={() => updateRequest(request.id, 'active')} className="rounded-2xl bg-[#8CCFC3] px-4 py-3 font-black text-[#2E504D]">
                          활성화
                        </button>
                        <button onClick={() => updateRequest(request.id, 'completed')} className="rounded-2xl bg-[#5F7C92] px-4 py-3 font-black text-[#2E504D]">
                          완료
                        </button>
                        <button onClick={() => updateRequest(request.id, 'cancelled')} className="rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700">
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => updateRequest(request.id, 'paused')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                          잠시 중지
                        </button>
                        <button onClick={() => updateRequest(request.id, 'completed')} className="rounded-2xl bg-[#8CCFC3] px-4 py-3 font-black text-[#2E504D]">
                          완료
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {requestEvents.map((event) => (
                    <div
                      key={event.id}
                      className={
                        'rounded-3xl p-5 ' +
                        (event.meal_status === 'needs_help'
                          ? 'bg-red-50'
                          : event.meal_status === 'not_eaten' || event.delivery_status === 'failed'
                            ? 'bg-amber-50'
                            : event.meal_status === 'eaten'
                              ? 'bg-emerald-50'
                              : 'bg-slate-50')
                      }
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge text={event.event_date} />
                            <Badge text={labelMealTime(event.meal_time)} />
                            <Badge text={labelMealStatus(event.meal_status)} />
                            <Badge text={labelDeliveryStatus(event.delivery_status)} />
                          </div>

                          <h4 className="mt-3 text-2xl font-black">
                            {event.event_date} {labelMealTime(event.meal_time)}
                          </h4>

                          {event.memo ? (
                            <p className="mt-2 text-sm leading-6 text-[#4E6D69]">{event.memo}</p>
                          ) : null}
                        </div>

                        <div className="grid min-w-[170px] gap-2">
                          <button onClick={() => updateEvent(event.id, { mealStatus: 'eaten' })} className="rounded-2xl bg-[#8CCFC3] px-4 py-3 font-black text-[#2E504D]">
                            드셨어요
                          </button>
                          <button onClick={() => updateEvent(event.id, { mealStatus: 'not_eaten' })} className="rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-900">
                            못 드셨어요
                          </button>
                          <button onClick={() => updateEvent(event.id, { mealStatus: 'needs_help' })} className="rounded-2xl bg-[#F2B8B8] px-4 py-3 font-black text-[#2E504D]">
                            도움 필요
                          </button>
                          {mode === 'ops' ? (
                            <>
                              <button onClick={() => updateEvent(event.id, { deliveryStatus: 'delivered' })} className="rounded-2xl bg-[#5F7C92] px-4 py-3 font-black text-[#2E504D]">
                                배송 완료
                              </button>
                              <button onClick={() => updateEvent(event.id, { deliveryStatus: 'failed' })} className="rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700">
                                배송 실패
                              </button>
                            </>
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
