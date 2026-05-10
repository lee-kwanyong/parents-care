'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type RequestRow = Record<string, any>
type OfferRow = Record<string, any>
type ManagerRow = Record<string, any>

type DataState = {
  requests: RequestRow[]
  offers: OfferRow[]
  managers: ManagerRow[]
  summary: {
    requests: number
    offers: number
    sent: number
    accepted: number
    assigned: number
    declined: number
    verifiedManagers: number
  }
}

function labelStatus(status: string) {
  const map: Record<string, string> = {
    requested: '요청됨',
    candidate_generated: '제안 발송',
    matched: '매칭 선택',
    assigned: '배정 완료',
    sent: '제안 발송',
    accepted: '수락',
    declined: '거절',
    assigned_offer: '배정',
    cancelled: '취소'
  }

  return map[status] || status
}

function labelType(type: string) {
  const map: Record<string, string> = {
    hospital_visit: '병원동행',
    meal_check: '식사·약 확인',
    discharge_check: '퇴원 후 확인',
    document_pickup: '서류 챙김',
    wellbeing_check: '안부 확인',
    custom: '기타'
  }

  return map[type] || type
}

function formatDate(value: string) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString('ko-KR')
  } catch {
    return value
  }
}

export function ManagerOfferBoard({ mode = 'ops' }: { mode?: 'ops' | 'manager' }) {
  const [data, setData] = useState<DataState | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [memo, setMemo] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/manager-offers', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '매니저 제안 정보를 불러오지 못했습니다.')
      }

      setData({
        requests: result.requests || [],
        offers: result.offers || [],
        managers: result.managers || [],
        summary: result.summary
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매니저 제안 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function postAction(payload: Record<string, unknown>) {
    setMessage('')

    try {
      const response = await fetch('/api/manager-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '처리 중 오류가 발생했습니다.')
      }

      setMessage(result.message || '처리됐습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = data?.summary || {
    requests: 0,
    offers: 0,
    sent: 0,
    accepted: 0,
    assigned: 0,
    declined: 0,
    verifiedManagers: 0
  }

  const requestMap = useMemo(() => {
    const map = new Map<string, RequestRow>()
    for (const request of data?.requests || []) map.set(request.id, request)
    return map
  }, [data?.requests])

  const managerMap = useMemo(() => {
    const map = new Map<string, ManagerRow>()
    for (const manager of data?.managers || []) map.set(manager.id, manager)
    return map
  }, [data?.managers])

  const offersByRequest = useMemo(() => {
    const map = new Map<string, OfferRow[]>()
    for (const offer of data?.offers || []) {
      const current = map.get(offer.matching_request_id) || []
      current.push(offer)
      map.set(offer.matching_request_id, current)
    }

    for (const [key, value] of map) {
      map.set(key, value.sort((a, b) => Number(b.offer_score || 0) - Number(a.offer_score || 0)))
    }

    return map
  }, [data?.offers])

  const visibleOffers =
    mode === 'manager'
      ? (data?.offers || []).filter((offer) => ['sent', 'accepted'].includes(offer.offer_status))
      : data?.offers || []

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-black text-[#19A98E]">
              {mode === 'manager' ? '매니저앱' : '운영실'}
            </div>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] md:text-6xl">
              {mode === 'manager' ? '새 케어 제안' : '매니저 알림·수락 매칭'}
            </h1>
            <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79]">
              검증된 매니저에게 케어 요청 알림을 보내고, 매니저가 수락하면 운영실이 최종 배정합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={load}
              className="rounded-2xl bg-[#DCEFF7] px-5 py-4 font-black text-[#365E78] ring-1 ring-[#C2DDEA]"
            >
              새로고침
            </button>
            {mode === 'ops' ? (
              <button
                onClick={() => postAction({ action: 'create_request_from_latest_intake' })}
                className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white"
              >
                최근 접수로 매칭 요청 만들기
              </button>
            ) : null}
            <Link
              href={mode === 'manager' ? '/manager' : '/ops'}
              className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
            >
              홈으로
            </Link>
          </div>
        </header>

        <section className="rounded-[2rem] border border-[#D5EEE8] bg-[#EAFBF6] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.10)]">
          <div className="text-sm font-black text-[#3F706B]">매니저 매칭판</div>
          <h2 className="mt-2 text-5xl font-black tracking-[-0.04em]">
            {summary.accepted > 0 ? '수락 확인' : summary.sent > 0 ? '응답 대기' : '알림 필요'}
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-6">
            <Stat label="매칭 요청" value={summary.requests} />
            <Stat label="검증 매니저" value={summary.verifiedManagers} />
            <Stat label="제안 발송" value={summary.sent} />
            <Stat label="수락" value={summary.accepted} />
            <Stat label="거절" value={summary.declined} />
            <Stat label="배정" value={summary.assigned} />
          </div>
        </section>

        {message ? (
          <p className="mt-6 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </p>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-[2rem] bg-white p-8 text-center text-xl font-black shadow-[0_12px_34px_rgba(93,139,131,0.08)]">
            매칭 정보를 불러오는 중...
          </div>
        ) : mode === 'manager' ? (
          <section className="mt-8 space-y-4">
            {visibleOffers.length === 0 ? (
              <Empty message="아직 도착한 케어 제안이 없습니다." />
            ) : (
              visibleOffers.map((offer) => {
                const request = requestMap.get(offer.matching_request_id) || offer.request_snapshot || {}

                return (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    request={request}
                    mode="manager"
                    memo={memo}
                    setMemo={setMemo}
                    onAccept={() => postAction({ action: 'accept_offer', offerId: offer.id, memo })}
                    onDecline={() => postAction({ action: 'decline_offer', offerId: offer.id, memo })}
                  />
                )
              })
            )}
          </section>
        ) : (
          <section className="mt-8 space-y-6">
            {(data?.requests || []).length === 0 ? (
              <Empty message="매칭 요청이 없습니다. 최근 접수를 매칭 요청으로 먼저 만들어주세요." />
            ) : (
              (data?.requests || []).map((request) => {
                const offers = offersByRequest.get(request.id) || []

                return (
                  <article
                    key={request.id}
                    className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge text={labelType(request.request_type)} />
                          <Badge text={labelStatus(request.matching_status)} />
                          <Badge text={request.priority || 'normal'} />
                        </div>

                        <h3 className="mt-4 text-3xl font-black tracking-[-0.03em]">
                          {request.request_title}
                        </h3>

                        <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">
                          부모님: {request.elder_name} · 보호자: {request.guardian_name || '미입력'} · 연락처: {request.guardian_phone || '미입력'}
                        </p>

                        <p className="mt-2 text-xs font-bold text-[#8AA29E]">
                          생성일: {formatDate(request.created_at)}
                        </p>
                      </div>

                      <button
                        onClick={() => postAction({ action: 'broadcast_offers', requestId: request.id })}
                        className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white"
                      >
                        등록 매니저에게 알림 보내기
                      </button>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {offers.length === 0 ? (
                        <div className="rounded-2xl bg-[#F6FCFA] p-5 font-bold text-[#607D79]">
                          아직 발송된 매니저 제안이 없습니다.
                        </div>
                      ) : (
                        offers.map((offer) => (
                          <OfferCard
                            key={offer.id}
                            offer={offer}
                            request={request}
                            manager={managerMap.get(offer.manager_profile_id)}
                            mode="ops"
                            onAssign={() => postAction({ action: 'assign_offer', offerId: offer.id })}
                          />
                        ))
                      )}
                    </div>
                  </article>
                )
              })
            )}
          </section>
        )}
      </section>
    </main>
  )
}

function OfferCard({
  offer,
  request,
  manager,
  mode,
  memo,
  setMemo,
  onAccept,
  onDecline,
  onAssign
}: {
  offer: OfferRow
  request: RequestRow
  manager?: ManagerRow
  mode: 'ops' | 'manager'
  memo?: string
  setMemo?: (value: string) => void
  onAccept?: () => void
  onDecline?: () => void
  onAssign?: () => void
}) {
  const managerName = offer.manager_name || manager?.manager_name || '매니저'
  const reasons = Array.isArray(offer.offer_reasons) ? offer.offer_reasons : []

  return (
    <div className="rounded-[1.75rem] border border-[#E3EFEC] bg-[#FBFEFD] p-5">
      <div className="flex flex-wrap gap-2">
        <Badge text={labelStatus(offer.offer_status)} />
        <Badge text={`${offer.offer_score || 0}점`} />
        <Badge text={managerName} />
      </div>

      <h4 className="mt-4 text-2xl font-black">
        {mode === 'manager' ? request.request_title || offer.request_snapshot?.request_title : managerName}
      </h4>

      <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">
        {mode === 'manager'
          ? `부모님: ${request.elder_name || offer.request_snapshot?.elder_name || '부모님'} · 유형: ${labelType(request.request_type || offer.request_snapshot?.request_type)}`
          : offer.manager_snapshot?.trust_card_summary || manager?.trust_card_summary || '신뢰카드 정보 없음'}
      </p>

      {reasons.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {reasons.map((reason: string) => (
            <span key={reason} className="rounded-full bg-[#E5F8F4] px-3 py-1 text-xs font-black text-[#2F756B]">
              {reason}
            </span>
          ))}
        </div>
      ) : null}

      {mode === 'manager' ? (
        <>
          <textarea
            value={memo || ''}
            onChange={(event) => setMemo?.(event.target.value)}
            className="mt-4 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 text-sm font-bold outline-none focus:border-[#19B99A]"
            rows={3}
            placeholder="응답 메모. 예: 오전 시간 가능합니다."
          />
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <button onClick={onAccept} className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
              수락하기
            </button>
            <button onClick={onDecline} className="rounded-2xl bg-[#FFF0F1] px-5 py-4 font-black text-[#965D65]">
              거절하기
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4">
          {offer.offer_status === 'accepted' ? (
            <button onClick={onAssign} className="w-full rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
              수락 매니저 배정 확정
            </button>
          ) : (
            <div className="rounded-2xl bg-white p-4 text-sm font-black text-[#607D79] ring-1 ring-[#E3EFEC]">
              매니저 응답 대기 중입니다.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#F4FAF9] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
      {text}
    </span>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-[2rem] bg-white p-10 text-center shadow-[0_12px_34px_rgba(93,139,131,0.08)]">
      <h3 className="text-2xl font-black">{message}</h3>
      <p className="mt-3 text-sm font-bold text-[#607D79]">
        접수 → 매칭 요청 → 매니저 알림 순서로 진행됩니다.
      </p>
    </div>
  )
}
