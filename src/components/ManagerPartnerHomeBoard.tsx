'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'

type AnyRow = Record<string, any>

type Dashboard = {
  manager: AnyRow | null
  offers: AnyRow[]
  assignments: AnyRow[]
  earnings: AnyRow[]
  availability: AnyRow[]
  summary: {
    sentOffers: number
    acceptedOffers: number
    activeAssignments: number
    completedAssignments: number
    expectedEarnings: number
    paidEarnings: number
  }
}

function formatWon(value: number) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

function labelOffer(status: string) {
  const map: Record<string, string> = {
    sent: '새 제안',
    accepted: '수락함',
    declined: '거절',
    assigned: '배정됨',
    cancelled: '취소'
  }
  return map[status] || status
}

function labelAssignment(status: string) {
  const map: Record<string, string> = {
    assigned: '배정됨',
    in_progress: '진행 중',
    completed: '완료'
  }
  return map[status] || status
}

export function ManagerPartnerHomeBoard() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [memo, setMemo] = useState('')
  const [managerProfileId, setManagerProfileId] = useState('')

  async function load(inputManagerProfileId = managerProfileId) {
    setLoading(true)
    setMessage('')

    try {
      const query = inputManagerProfileId
        ? `?managerProfileId=${encodeURIComponent(inputManagerProfileId)}`
        : ''

      const response = await fetch('/api/manager-mobile' + query, { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '매니저앱 정보를 불러오지 못했습니다.')
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매니저앱 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function postAction(payload: Record<string, unknown>) {
    setMessage('')

    try {
      const response = await fetch('/api/manager-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerProfileId: managerProfileId || undefined,
          ...payload
        })
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
    const params = new URLSearchParams(window.location.search)
    const id = params.get('managerProfileId') || ''

    setManagerProfileId(id)
    load(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const manager = data?.manager
  const offers = data?.offers || []
  const assignments = data?.assignments || []
  const earnings = data?.earnings || []
  const summary = data?.summary || {
    sentOffers: 0,
    acceptedOffers: 0,
    activeAssignments: 0,
    completedAssignments: 0,
    expectedEarnings: 0,
    paidEarnings: 0
  }

  return (
    <AppFrame title="매니저 앱" subtitle="제안·배정·정산 관리 화면" showMobileNav={false}>
      <section className="mx-auto max-w-5xl">
        <header className="rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-black text-[#19A98E]">케어파트너 앱</div>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] md:text-6xl">
                오늘 가능한 일
              </h1>
              <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-[#607D79]">
                검증이 끝난 케어파트너에게만 일이 도착합니다. 가능한 일은 수락하고, 어려운 일은 거절하면 됩니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={load} className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]">
                새로고침
              </button>
              <Link href="/manager/install" className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                안드로이드 설치
              </Link>
            </div>
          </div>
        </header>

        {managerProfileId ? (
          <div className="mt-5 rounded-2xl bg-[#EAFBF6] p-4 font-black text-[#2F756B]">
            개인 제안 링크로 접속했습니다. 이 매니저에게 온 제안만 표시됩니다.
          </div>
        ) : null}

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-[2rem] bg-white p-8 text-center text-xl font-black">
            불러오는 중...
          </div>
        ) : !manager ? (
          <section className="mt-6 rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <h2 className="text-3xl font-black">아직 검증 완료 매니저가 없습니다.</h2>
            <p className="mt-3 text-base font-bold leading-7 text-[#607D79]">
              먼저 3분 간단 등록 후 단계별 검증을 완료해야 일감을 받을 수 있습니다.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Link href="/manager/apply" className="rounded-2xl bg-[#19B99A] px-5 py-4 text-center font-black text-white">
                매니저 간단 등록
              </Link>
              <Link href="/manager/vetting" className="rounded-2xl bg-white px-5 py-4 text-center font-black text-[#426C68] ring-1 ring-[#CFE7E2]">
                검증자료 제출
              </Link>
              <button onClick={() => postAction({ action: 'create_demo_partner' })} className="rounded-2xl bg-[#DCEFF7] px-5 py-4 font-black text-[#365E78]">
                테스트 매니저 만들기
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="mt-6 grid gap-3 md:grid-cols-4">
              <Stat label="새 제안" value={summary.sentOffers} />
              <Stat label="진행 배정" value={summary.activeAssignments} />
              <Stat label="완료 건수" value={summary.completedAssignments} />
              <Stat label="예상 정산" value={formatWon(summary.expectedEarnings)} />
            </section>

            <section className="mt-6 rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black">{manager.manager_name}</h2>
                  <p className="mt-2 text-sm font-bold text-[#607D79]">
                    {manager.trust_card_summary || '검증 완료 케어파트너'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/manager/vetting" className="rounded-2xl bg-[#EAFBF6] px-4 py-3 text-sm font-black text-[#2F756B]">
                    검증 상태
                  </Link>
                  <Link href="/manager/earnings" className="rounded-2xl bg-[#DCEFF7] px-4 py-3 text-sm font-black text-[#365E78]">
                    정산 예정
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <button onClick={() => postAction({ action: 'set_availability', days: ['월', '화', '수', '목', '금'], timeSlots: ['오전', '오후'], regionText: '평일 오전/오후 가능' })} className="rounded-2xl bg-[#F6FCFA] p-5 text-left font-black ring-1 ring-[#E3EFEC]">
                  평일 가능으로 설정
                  <span className="mt-2 block text-sm font-bold text-[#607D79]">월~금 오전/오후 일감 알림 받기</span>
                </button>
                <button onClick={() => postAction({ action: 'set_availability', days: ['토', '일'], timeSlots: ['오전', '오후'], regionText: '주말 가능' })} className="rounded-2xl bg-[#F6FCFA] p-5 text-left font-black ring-1 ring-[#E3EFEC]">
                  주말 가능으로 설정
                  <span className="mt-2 block text-sm font-bold text-[#607D79]">토·일 케어 요청 알림 받기</span>
                </button>
              </div>
            </section>

            <section className="mt-6">
              <h2 className="text-3xl font-black tracking-[-0.04em]">새로 도착한 일</h2>
              <div className="mt-4 space-y-4">
                {offers.filter((offer) => offer.offer_status === 'sent').length === 0 ? (
                  <Empty message="아직 새 제안이 없습니다." />
                ) : (
                  offers.filter((offer) => offer.offer_status === 'sent').map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      memo={memo}
                      setMemo={setMemo}
                      onAccept={() => postAction({ action: 'accept_offer', offerId: offer.id, memo })}
                      onDecline={() => postAction({ action: 'decline_offer', offerId: offer.id, memo })}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-3xl font-black tracking-[-0.04em]">수락한 일</h2>
              <div className="mt-4 space-y-4">
                {offers.filter((offer) => offer.offer_status === 'accepted').length === 0 ? (
                  <Empty message="아직 수락한 일이 없습니다." />
                ) : (
                  offers.filter((offer) => offer.offer_status === 'accepted').map((offer) => (
                    <div key={offer.id} className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
                      <h3 className="text-2xl font-black">{offer.request_snapshot?.request_title || '수락한 케어 요청'}</h3>
                      <p className="mt-2 text-sm font-bold text-[#607D79]">
                        예상 보수 {formatWon(offer.expected_fee)} · 예상 {offer.estimated_minutes || 120}분
                      </p>
                      <button onClick={() => postAction({ action: 'create_assignment_from_offer', offerId: offer.id })} className="mt-5 w-full rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                        오늘 배정으로 만들기
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-3xl font-black tracking-[-0.04em]">오늘 배정</h2>
              <div className="mt-4 space-y-4">
                {assignments.length === 0 ? (
                  <Empty message="아직 배정된 일이 없습니다." />
                ) : (
                  assignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onStart={() => postAction({ action: 'start_assignment', assignmentId: assignment.id })}
                      onComplete={() => postAction({ action: 'complete_assignment', assignmentId: assignment.id })}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="mt-8 pb-16">
              <h2 className="text-3xl font-black tracking-[-0.04em]">최근 정산 예정</h2>
              <div className="mt-4 space-y-3">
                {earnings.length === 0 ? (
                  <Empty message="아직 정산 예정 내역이 없습니다." />
                ) : (
                  earnings.slice(0, 5).map((earning) => (
                    <div key={earning.id} className="rounded-2xl bg-white p-5 ring-1 ring-[#E3EFEC]">
                      <div className="text-lg font-black">{earning.earning_title}</div>
                      <p className="mt-2 text-sm font-bold text-[#607D79]">
                        {formatWon(earning.amount)} · {earning.earning_status}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </section>
    </AppFrame>
  )
}

function OfferCard({
  offer,
  memo,
  setMemo,
  onAccept,
  onDecline
}: {
  offer: AnyRow
  memo: string
  setMemo: (value: string) => void
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <article className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
      <div className="flex flex-wrap gap-2">
        <Badge text={labelOffer(offer.offer_status)} />
        <Badge text={`${offer.offer_score || 0}점`} />
        <Badge text={formatWon(offer.expected_fee)} />
      </div>
      <h3 className="mt-4 text-3xl font-black tracking-[-0.04em]">
        {offer.request_snapshot?.request_title || '새 케어 요청'}
      </h3>
      <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">
        부모님: {offer.request_snapshot?.elder_name || '부모님'} · 지역: {offer.request_snapshot?.region_text || '미정'} · 시간: {offer.request_snapshot?.appointment_time || '협의'}
      </p>
      <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
        장소: {offer.request_snapshot?.hospital_name || offer.request_snapshot?.meeting_location || '협의'}
      </p>

      <textarea
        value={memo}
        onChange={(event) => setMemo(event.target.value)}
        className="mt-5 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold outline-none focus:border-[#19B99A]"
        rows={3}
        placeholder="응답 메모. 예: 오전 가능합니다."
      />

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <button onClick={onAccept} className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
          수락하기
        </button>
        <button onClick={onDecline} className="rounded-2xl bg-[#FFF0F1] px-5 py-4 font-black text-[#965D65]">
          거절하기
        </button>
      </div>
    </article>
  )
}

function AssignmentCard({
  assignment,
  onStart,
  onComplete
}: {
  assignment: AnyRow
  onStart: () => void
  onComplete: () => void
}) {
  return (
    <article className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
      <div className="flex flex-wrap gap-2">
        <Badge text={labelAssignment(assignment.status)} />
        <Badge text={assignment.checkin_status || 'not_started'} />
        <Badge text={formatWon(assignment.expected_fee)} />
      </div>
      <h3 className="mt-4 text-3xl font-black tracking-[-0.04em]">{assignment.title}</h3>
      <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">
        부모님: {assignment.elder_name} · 만남장소: {assignment.meeting_location || '협의'} · 만남암호: {assignment.meeting_code || '2580'}
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <button onClick={onStart} className="rounded-2xl bg-[#DCEFF7] px-5 py-4 font-black text-[#365E78]">
          현장 시작
        </button>
        <button onClick={onComplete} className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
          완료하고 정산 반영
        </button>
      </div>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-[#E3EFEC]">
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
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
    <div className="rounded-[2rem] bg-white p-8 text-center font-black text-[#607D79] ring-1 ring-[#E3EFEC]">
      {message}
    </div>
  )
}
