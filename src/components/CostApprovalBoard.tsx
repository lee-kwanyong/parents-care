'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  buildCostApprovalSummary,
  costItemTypeOptions,
  formatKrw,
  labelApprovalMethod,
  labelCostApprovalStatus,
  labelCostItemType,
  type CostApprovalEvent,
  type CostApprovalItem,
  type CostApprovalRequest,
  type CostApprovalStatus,
  type CostItemType,
  type CostPriority,
  type CostSourceType
} from '@/lib/cost-approval-engine'

export function CostApprovalBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [requests, setRequests] = useState<CostApprovalRequest[]>([])
  const [items, setItems] = useState<CostApprovalItem[]>([])
  const [events, setEvents] = useState<CostApprovalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/cost-approval', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '비용 승인 정보를 불러오지 못했습니다.')
      }

      setRequests(data.requests || [])
      setItems(data.items || [])
      setEvents(data.events || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '비용 승인 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const formData = new FormData(event.currentTarget)

    const itemType = String(formData.get('itemType') || 'other') as CostItemType
    const amountKrw = String(formData.get('amountKrw') || '')
    const label = String(formData.get('itemLabel') || '') || labelCostItemType(itemType)

    try {
      const response = await fetch('/api/cost-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderName: formData.get('elderName'),
          guardianName: formData.get('guardianName'),
          guardianPhone: formData.get('guardianPhone'),
          title: formData.get('title'),
          reason: formData.get('reason'),
          sourceType: formData.get('sourceType') as CostSourceType,
          priority: formData.get('priority') as CostPriority,
          approvalMethod: formData.get('approvalMethod'),
          guardianMessage: formData.get('guardianMessage'),
          items: [
            {
              itemType,
              label,
              quantity: 1,
              amountKrw,
              memo: formData.get('reason')
            }
          ]
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '비용 승인 요청 생성 실패')
      }

      setMessage('보호자 추가비용 사전승인 요청이 만들어졌습니다.')
      event.currentTarget.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '비용 승인 요청 생성 실패')
    }
  }

  async function updateRequest(id: string, status: CostApprovalStatus) {
    setMessage('')

    let approvedByName = ''
    let rejectedReason = ''

    if (status === 'approved') {
      approvedByName = window.prompt('승인자 이름을 입력해주세요.', '보호자') || '보호자'
    }

    if (status === 'rejected') {
      rejectedReason = window.prompt('거절 사유를 입력해주세요.', '승인하지 않음') || '승인하지 않음'
    }

    try {
      const response = await fetch('/api/cost-approval', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          approvedByName,
          rejectedReason
        })
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

  const summary = useMemo(() => buildCostApprovalSummary(requests), [requests])

  const itemsByRequest = useMemo(() => {
    const map = new Map<string, CostApprovalItem[]>()

    for (const item of items) {
      const current = map.get(item.cost_approval_request_id) || []
      current.push(item)
      map.set(item.cost_approval_request_id, current)
    }

    return map
  }, [items])

  const eventsByRequest = useMemo(() => {
    const map = new Map<string, CostApprovalEvent[]>()

    for (const event of events) {
      const current = map.get(event.cost_approval_request_id) || []
      current.push(event)
      map.set(event.cost_approval_request_id, current)
    }

    return map
  }, [events])

  return (
    <div>
      <div
        className={
          'rounded-3xl p-6 ' +
          (summary.reassuranceState === '확인 필요' ? 'bg-amber-50' : 'bg-emerald-50')
        }
      >
        <p className="text-sm font-black text-slate-600">비용 안심판</p>
        <div className="mt-2 text-5xl font-black">{summary.reassuranceState}</div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="전체 요청" value={summary.total} />
          <Stat label="승인 필요" value={summary.pending} />
          <Stat label="승인 완료" value={summary.approved} />
          <Stat label="결제 대기" value={summary.paymentPending} />
          <Stat label="결제 완료" value={summary.paid} />
        </div>

        {summary.pendingAmount > 0 ? (
          <p className="mt-4 rounded-2xl bg-white p-4 text-lg font-black">
            승인 대기 금액: {formatKrw(summary.pendingAmount)}
          </p>
        ) : null}
      </div>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">가족이 볼 안내</h2>
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

      {mode === 'ops' ? (
        <form onSubmit={createRequest} className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">추가비용 사전승인 요청 만들기</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            보호자 승인 전에는 결제 완료나 비용 집행으로 넘어갈 수 없도록 설계했습니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <input name="elderName" className="rounded-2xl border border-slate-200 p-4" placeholder="부모님" defaultValue="어머니" />
            <input name="guardianName" className="rounded-2xl border border-slate-200 p-4" placeholder="보호자 이름" />
            <input name="guardianPhone" className="rounded-2xl border border-slate-200 p-4" placeholder="010-1234-5678" />

            <input name="title" className="rounded-2xl border border-slate-200 p-4" placeholder="예: 택시비 사전승인" defaultValue="추가비용 사전승인" />

            <select name="sourceType" className="rounded-2xl border border-slate-200 p-4">
              <option value="manual">수동</option>
              <option value="appointment">병원동행</option>
              <option value="meal_care">안심밥상</option>
              <option value="documents">서류</option>
              <option value="discharge_care">퇴원 후 케어</option>
              <option value="manager_field">매니저 현장</option>
              <option value="social_support">사회공헌</option>
            </select>

            <select name="priority" className="rounded-2xl border border-slate-200 p-4">
              <option value="normal">보통</option>
              <option value="high">중요</option>
              <option value="urgent">긴급</option>
              <option value="low">낮음</option>
            </select>

            <select name="approvalMethod" className="rounded-2xl border border-slate-200 p-4">
              <option value="app">앱 승인</option>
              <option value="phone">전화 승인</option>
              <option value="kakao">카톡 승인</option>
              <option value="ops">운영실 확인</option>
            </select>

            <select name="itemType" className="rounded-2xl border border-slate-200 p-4">
              {costItemTypeOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>

            <input name="itemLabel" className="rounded-2xl border border-slate-200 p-4" placeholder="항목명 예: 병원 왕복 택시비" />
            <input name="amountKrw" className="rounded-2xl border border-slate-200 p-4" inputMode="numeric" placeholder="금액 예: 18000" />
          </div>

          <textarea name="reason" rows={3} className="mt-4 w-full rounded-2xl border border-slate-200 p-4" placeholder="비용 발생 이유. 예: 집 앞 만남 후 택시 동행이 필요합니다." />

          <textarea name="guardianMessage" rows={3} className="mt-4 w-full rounded-2xl border border-slate-200 p-4" placeholder="보호자에게 보여줄 안내 문구. 비워두면 자동 생성됩니다." />

          <button className="mt-4 w-full rounded-3xl bg-emerald-600 px-6 py-5 text-xl font-black text-white">
            사전승인 요청 만들기
          </button>
        </form>
      ) : null}

      <section className="mt-8 space-y-5">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            불러오는 중...
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 추가비용 승인 요청이 없습니다.</div>
            {mode === 'ops' ? <p className="mt-2 text-slate-500">위에서 승인 요청을 만들어보세요.</p> : null}
          </div>
        ) : (
          requests.map((request) => {
            const requestItems = itemsByRequest.get(request.id) || []
            const requestEvents = eventsByRequest.get(request.id) || []

            return (
              <article key={request.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelCostApprovalStatus(request.status)} />
                      <Badge text={labelApprovalMethod(request.approval_method)} />
                      <Badge text={request.priority} />
                      <Badge text={request.source_type} />
                    </div>

                    <h3 className="mt-3 text-3xl font-black">{request.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {request.elder_name} · {request.guardian_name || '보호자 미입력'} · {request.guardian_phone || '연락처 미입력'}
                    </p>

                    <div className="mt-4 rounded-2xl bg-amber-50 p-5">
                      <div className="text-sm font-black text-amber-700">승인 요청 금액</div>
                      <div className="mt-1 text-4xl font-black text-amber-950">{formatKrw(request.total_amount_krw)}</div>
                      <p className="mt-3 text-sm font-bold leading-6 text-amber-900">
                        {request.guardian_message || '추가비용은 보호자 승인 후 진행합니다.'}
                      </p>
                    </div>

                    {request.reason ? (
                      <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {request.reason}
                      </p>
                    ) : null}

                    {requestItems.length > 0 ? (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <h4 className="font-black">비용 항목</h4>
                        <div className="mt-3 space-y-2">
                          {requestItems.map((item) => (
                            <div key={item.id} className="flex justify-between gap-3 rounded-xl bg-white p-3 text-sm">
                              <div>
                                <div className="font-black">{item.label}</div>
                                <div className="text-slate-500">{labelCostItemType(item.item_type)}</div>
                              </div>
                              <div className="font-black">{formatKrw(item.amount_krw)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {requestEvents.length > 0 ? (
                      <div className="mt-4 rounded-2xl bg-blue-50 p-4">
                        <h4 className="font-black text-blue-950">처리 기록</h4>
                        <div className="mt-3 space-y-2">
                          {requestEvents.slice(0, 5).map((event) => (
                            <div key={event.id} className="rounded-xl bg-white p-3 text-sm">
                              <div className="font-black">{event.title}</div>
                              {event.description ? <p className="mt-1 text-slate-600">{event.description}</p> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid min-w-[190px] gap-2">
                    {request.status === 'pending_guardian' ? (
                      <>
                        <button onClick={() => updateRequest(request.id, 'approved')} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
                          승인해요
                        </button>
                        <button onClick={() => updateRequest(request.id, 'rejected')} className="rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700">
                          거절해요
                        </button>
                      </>
                    ) : null}

                    {mode === 'ops' ? (
                      <>
                        <button onClick={() => updateRequest(request.id, 'payment_pending')} className="rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-900">
                          결제 대기
                        </button>
                        <button onClick={() => updateRequest(request.id, 'paid')} className="rounded-2xl bg-slate-900 px-4 py-3 font-black text-white">
                          결제 완료
                        </button>
                        <button onClick={() => updateRequest(request.id, 'cancelled')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                          취소
                        </button>
                      </>
                    ) : null}
                  </div>
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
