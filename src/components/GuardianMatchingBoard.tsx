'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'
import { CarePartnerTrustCard } from '@/components/CarePartnerTrustCard'
import { CareRequestSummaryCard } from '@/components/CareRequestSummaryCard'
import { GuardianChoiceGuide } from '@/components/GuardianChoiceGuide'
import { TrustSafetyGuide } from '@/components/TrustSafetyGuide'

type AnyRow = Record<string, any>

type MatchingData = {
  requests: AnyRow[]
  offers: AnyRow[]
  decisions: AnyRow[]
  warning?: string | null
}

function labelStatus(status: string) {
  const map: Record<string, string> = {
    requested: '매칭 대기',
    candidate_generated: '후보 추천 완료',
    guardian_confirmed: '보호자 확정',
    guardian_reviewing: '보호자 검토',
    assigned: '배정 완료',
    completed: '완료'
  }

  return map[status] || status || '확인 중'
}

function formatWon(value: unknown) {
  const number = Number(value || 0)
  if (!number) return '상담 후 안내'
  return `${number.toLocaleString('ko-KR')}원 예상`
}

function offerMessage(offer: AnyRow) {
  const snapshot = offer.request_snapshot || {}
  const title = snapshot.request_title || '부모님 안심케어'
  const manager = offer.manager_name || '케어파트너'
  const region = snapshot.region_text || '지역 협의'
  const appointment = snapshot.appointment_time || snapshot.appointment_date || '일정 협의'

  return [
    '[부모님 안심케어]',
    '',
    `${title} 후보 케어파트너가 추천되었습니다.`,
    '',
    `케어파트너: ${manager}`,
    `지역: ${region}`,
    `일정: ${appointment}`,
    `예상 소요: ${offer.estimated_minutes || 90}분`,
    `예상 정산 기준: ${formatWon(offer.expected_fee)}`,
    '',
    '아래 화면에서 신뢰카드와 추천 이유를 확인해주세요.',
    `${window.location.origin}/child/matching`
  ].join('\n')
}

export function GuardianMatchingBoard() {
  const [data, setData] = useState<MatchingData>({
    requests: [],
    offers: [],
    decisions: []
  })
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  const selectedRequest = useMemo(() => {
    return data.requests.find((item) => item.id === selectedRequestId) || data.requests[0] || null
  }, [data.requests, selectedRequestId])

  const requestOffers = useMemo(() => {
    if (!selectedRequest) return []
    return data.offers.filter((offer) => offer.matching_request_id === selectedRequest.id)
  }, [data.offers, selectedRequest])

  const latestDecisionByOffer = useMemo(() => {
    const map = new Map<string, AnyRow>()

    for (const decision of data.decisions) {
      if (decision.match_offer_id && !map.has(decision.match_offer_id)) {
        map.set(decision.match_offer_id, decision)
      }
    }

    return map
  }, [data.decisions])

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/guardian-matching', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '매칭 정보를 불러오지 못했습니다.')
      }

      setData({
        requests: result.requests || [],
        offers: result.offers || [],
        decisions: result.decisions || [],
        warning: result.warning || null
      })

      if (!selectedRequestId && result.requests?.[0]?.id) {
        setSelectedRequestId(result.requests[0].id)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매칭 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function postAction(action: string, offer?: AnyRow) {
    if (!selectedRequest) return

    setWorking(true)
    setMessage('')

    try {
      const response = await fetch('/api/guardian-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          matchingRequestId: selectedRequest.id,
          offerId: offer?.id || null,
          managerProfileId: offer?.manager_profile_id || null,
          managerName: offer?.manager_name || null
        })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '처리 중 오류가 발생했습니다.')
      }

      setMessage(result.warning ? `${result.message} ${result.warning}` : result.message)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setWorking(false)
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      setMessage(`${label}를 복사했습니다.`)
    } catch {
      setMessage(value)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasOffers = requestOffers.length > 0

  return (
    <AppFrame title="보호자 매칭 확인" subtitle="추천 케어파트너를 확인하고 진행 여부를 선택합니다">
      <section className="space-y-6">
        <CareCard tone="green">
          <div className="flex flex-wrap gap-2">
            <StatusPill text="보호자 케어" tone="green" />
            <StatusPill text="매칭 확인" tone="slate" />
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
            추천 케어파트너를
            <br />
            확인해주세요.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#4E6D69] md:text-lg">
            운영실이 부모님 상황에 맞는 케어파트너 후보를 추천하면, 보호자가 신뢰카드와 추천 이유를 보고 진행 여부를 선택합니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={load}
              className="rounded-3xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
            >
              새로고침
            </button>
            <Link
              href="/care-request"
              className="rounded-3xl bg-[#19B99A] px-5 py-4 font-black text-white"
            >
              새 안심케어 신청
            </Link>
            <Link
              href="/child/reports"
              className="rounded-3xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
            >
              보호자 리포트
            </Link>
          </div>
        </CareCard>

        {message ? (
          <div className="rounded-2xl bg-[#FFF5DF] p-4 font-black leading-6 text-[#886B35]">
            {message}
          </div>
        ) : null}

        {data.warning ? (
          <div className="rounded-2xl bg-[#FFF9EF] p-4 text-sm font-bold leading-6 text-[#6F5B31] ring-1 ring-[#F0E0C4]">
            {data.warning}
          </div>
        ) : null}

        {loading ? (
          <CareCard tone="white">
            <p className="text-lg font-black">매칭 정보를 불러오는 중...</p>
          </CareCard>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <GuardianChoiceGuide compact />
          <TrustSafetyGuide compact />
        </div>

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <CareCard tone="white">
            <h2 className="text-2xl font-black">내 안심케어 요청</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
              요청을 선택하면 추천 후보를 확인할 수 있습니다.
            </p>

            <div className="mt-5 space-y-3">
              {data.requests.length === 0 ? (
                <Empty message="아직 매칭 요청이 없습니다. 안심케어를 먼저 신청해주세요." />
              ) : (
                data.requests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedRequestId(request.id)}
                    className={
                      'w-full rounded-2xl p-4 text-left ring-1 transition ' +
                      (selectedRequest?.id === request.id
                        ? 'bg-emerald-50 ring-emerald-400'
                        : 'bg-[#F8FCFB] ring-[#E3EFEC] hover:bg-white')
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelStatus(request.matching_status)} />
                      <Badge text={request.region_text || '지역 협의'} />
                    </div>
                    <div className="mt-3 text-lg font-black">{request.request_title || '안심케어 요청'}</div>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                      {request.elder_name || '부모님'} · {request.appointment_time || '일정 협의'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </CareCard>

          <div className="space-y-5">
            {selectedRequest ? (
              <CareRequestSummaryCard request={selectedRequest} />
            ) : null}

            <CareCard tone={hasOffers ? 'green' : 'amber'}>
              <div className="flex flex-wrap gap-2">
                <StatusPill text="추천 후보" tone={hasOffers ? 'green' : 'blue'} />
                <StatusPill text={`${requestOffers.length}명`} tone="slate" />
              </div>

              <h2 className="mt-4 text-3xl font-black">
                {hasOffers ? '케어파트너 후보가 추천됐습니다.' : '아직 추천 후보가 없습니다.'}
              </h2>

              <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                최종 금액과 진행 범위는 운영실 확인 후 안내됩니다. 보호자가 확인하기 전에는 결제가 진행되지 않습니다.
              </p>

              {!hasOffers ? (
                <div className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-[#6F5B31] ring-1 ring-[#F0E0C4]">
                  운영실에서 후보를 생성하면 이곳에 케어파트너 신뢰카드가 표시됩니다.
                </div>
              ) : null}
            </CareCard>

            <div className="space-y-4">
              {requestOffers.map((offer, index) => {
                const decision = latestDecisionByOffer.get(offer.id)

                return (
                  <CareCard key={offer.id} tone="white">
                    <div className="flex flex-wrap gap-2">
                      <Badge text={`${index + 1}순위 후보`} />
                      <Badge text={`${offer.offer_score || 0}점`} />
                      <Badge text={formatWon(offer.expected_fee)} />
                      {decision ? <Badge text="요청 접수됨" /> : null}
                    </div>

                    <div className="mt-4">
                      <CarePartnerTrustCard offer={offer} compact />
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => postAction('confirm_offer', offer)}
                        className="rounded-2xl bg-[#19B99A] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                      >
                        이분으로 진행
                      </button>

                      <button
                        type="button"
                        disabled={working}
                        onClick={() => postAction('request_call', offer)}
                        className="rounded-2xl bg-[#193B38] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                      >
                        전화 상담 요청
                      </button>

                      <button
                        type="button"
                        disabled={working}
                        onClick={() => postAction('request_other', offer)}
                        className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#426C68] ring-1 ring-[#CFE7E2] disabled:opacity-60"
                      >
                        다른 후보 요청
                      </button>

                      <button
                        type="button"
                        onClick={() => copyText(offerMessage(offer), '안내 문구')}
                        className="rounded-2xl bg-[#F4FAF9] px-4 py-3 text-sm font-black text-[#5B7774] ring-1 ring-[#E2EFEC]"
                      >
                        안내 문구 복사
                      </button>
                    </div>

                    {decision ? (
                      <div className="mt-4 rounded-2xl bg-[#EAFBF6] p-4 text-sm font-black leading-6 text-[#2F756B] ring-1 ring-[#CBEAE4]">
                        보호자 요청 상태: {decision.decision_type === 'confirmed'
                          ? '이 케어파트너로 진행 요청'
                          : decision.decision_type === 'call_requested'
                            ? '전화 상담 요청'
                            : '다른 후보 요청'}
                      </div>
                    ) : null}
                  </CareCard>
                )
              })}
            </div>
          </div>
        </section>
      </section>
    </AppFrame>
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
    <div className="rounded-2xl bg-white p-5 text-center font-black text-[#607D79] ring-1 ring-[#E3EFEC]">
      {message}
    </div>
  )
}
