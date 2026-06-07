'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type UrgentRequest = {
  id: string
  family_code?: string
  parent_name?: string
  guardian_name?: string
  guardian_phone?: string
  signal_label?: string
  request_type?: string
  risk_level?: string
  status?: string
  service_area?: string
  address_hint?: string
  created_at?: string
  match_count?: number
  accepted_match?: unknown
}

type Provider = {
  id: string
  provider_type?: string
  provider_name?: string
  phone?: string
  service_area?: string
  available_status?: string
  verified_status?: string
  response_time_min?: number
  qualification?: string
}

type Metrics = {
  urgentOpen: number
  eligibleProviders: number
  caregivers: number
  carePartners: number
  notifiedMatches: number
  acceptedMatches: number
  queuedSms: number
}

function phoneOnly(value: string) {
  return value.replace(/[^\d]/g, '')
}

function MetricCard({ title, value, desc, danger }: { title: string; value: string; desc: string; danger?: boolean }) {
  return (
    <article className={'rounded-[2rem] p-5 shadow-sm ring-1 ' + (danger ? 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]' : 'bg-white text-[#17443F] ring-[#D6EDE7]')}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

export function UrgentCaregiverDispatchPanel() {
  const [requests, setRequests] = useState<UrgentRequest[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ urgentOpen: 0, eligibleProviders: 0, caregivers: 0, carePartners: 0, notifiedMatches: 0, acceptedMatches: 0, queuedSms: 0 })
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const [providerForm, setProviderForm] = useState({
    providerName: '',
    phone: '',
    serviceArea: '우리동네',
    providerType: 'caregiver',
    qualification: '요양보호사',
    responseTimeMin: '15'
  })

  const [urgentForm, setUrgentForm] = useState({
    parentName: '긴급 확인 어르신',
    guardianName: '보호자',
    guardianPhone: '',
    serviceArea: '우리동네',
    addressHint: ''
  })

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/urgent-caregiver-dispatch', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '즉시 배치 데이터를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setRequests(Array.isArray(data.urgentRequests) ? data.urgentRequests : [])
      setProviders(Array.isArray(data.eligibleProviders) ? data.eligibleProviders : [])
      setMetrics(data.metrics || { urgentOpen: 0, eligibleProviders: 0, caregivers: 0, carePartners: 0, notifiedMatches: 0, acceptedMatches: 0, queuedSms: 0 })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '즉시 배치 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/urgent-caregiver-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        await load()
        return
      }

      setMessage(data.message || '처리되었습니다.')
      setDebug(JSON.stringify(data, null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            요양보호사 즉시 배치센터
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            가까운 요양보호사에게
            <br />
            바로 확인 요청을 보냅니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            갑자기 도움이 필요한 어르신의 신호를 운영실이 확인하고, 같은 권역의 가용 요양보호사·돌봄파트너에게 즉시 배치합니다.
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            안부웍스는 119를 대체하지 않습니다. 응급상황이 의심되면 119 또는 의료기관 연락을 안내해야 합니다. 이 기능은 응급 전 단계의 생활 확인·연결·기록을 위한 배치 기능입니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              새로고침
            </button>

            <Link href="/provider/urgent-requests" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              요양보호사 요청함
            </Link>

            <Link href="/ops/incidents" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              사건 타임라인
            </Link>

            <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              알림 발송센터
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white" open>
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          <MetricCard title="긴급 열린 사건" value={`${metrics.urgentOpen}건`} desc="즉시 확인 필요" danger={metrics.urgentOpen > 0} />
          <MetricCard title="가용 도움망" value={`${metrics.eligibleProviders}명`} desc="즉시 배치 가능" danger={metrics.eligibleProviders === 0} />
          <MetricCard title="요양보호사" value={`${metrics.caregivers}명`} desc="검증 완료" />
          <MetricCard title="돌봄파트너" value={`${metrics.carePartners}명`} desc="검증 완료" />
          <MetricCard title="요청 전파" value={`${metrics.notifiedMatches}건`} desc="수락 대기" />
          <MetricCard title="수락" value={`${metrics.acceptedMatches}건`} desc="확인 진행" />
          <MetricCard title="문자 대기" value={`${metrics.queuedSms}건`} desc="발송센터 확인" danger={metrics.queuedSms > 0} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">긴급 요청</h2>

            <div className="mt-5 space-y-3">
              {requests.length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  열린 긴급 요청이 없습니다.
                </div>
              ) : (
                requests.map((request) => (
                  <article key={request.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#FFF4F4] px-3 py-1 text-xs font-black text-[#8A3030] ring-1 ring-[#F3C8C8]">
                            긴급
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                            {request.status || '-'}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                            요청 {request.match_count || 0}명
                          </span>
                        </div>

                        <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{request.signal_label || '지금 도움이 필요해요'}</h3>
                        <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                          {request.parent_name || '대상자'} · {request.service_area || '-'} · {request.address_hint || '-'}
                          <br />
                          보호자 {request.guardian_name || '-'} · {request.guardian_phone || '-'}
                        </p>
                      </div>

                      <button
                        onClick={() => post('dispatchNearest', { requestId: request.id, limit: 5 })}
                        disabled={loading}
                        className="rounded-xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                      >
                        가용 요양보호사 즉시 배치
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="space-y-5">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">요양보호사 즉시 등록</h2>

              <div className="mt-5 grid gap-3">
                <input
                  value={providerForm.providerName}
                  onChange={(event) => setProviderForm({ ...providerForm, providerName: event.target.value })}
                  placeholder="이름"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />

                <input
                  value={providerForm.phone}
                  onChange={(event) => setProviderForm({ ...providerForm, phone: phoneOnly(event.target.value) })}
                  placeholder="휴대폰 번호"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />

                <input
                  value={providerForm.serviceArea}
                  onChange={(event) => setProviderForm({ ...providerForm, serviceArea: event.target.value })}
                  placeholder="활동 권역"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />

                <select
                  value={providerForm.providerType}
                  onChange={(event) => setProviderForm({ ...providerForm, providerType: event.target.value })}
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                >
                  <option value="caregiver">요양보호사</option>
                  <option value="care_partner">돌봄파트너</option>
                </select>

                <input
                  value={providerForm.qualification}
                  onChange={(event) => setProviderForm({ ...providerForm, qualification: event.target.value })}
                  placeholder="자격/메모"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />

                <button
                  onClick={() => post('registerCaregiver', providerForm)}
                  disabled={loading || !providerForm.providerName || !providerForm.phone}
                  className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  검증된 도움망으로 등록
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">테스트 긴급 요청 생성</h2>

              <div className="mt-5 grid gap-3">
                <input
                  value={urgentForm.parentName}
                  onChange={(event) => setUrgentForm({ ...urgentForm, parentName: event.target.value })}
                  placeholder="대상자 이름"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />

                <input
                  value={urgentForm.guardianName}
                  onChange={(event) => setUrgentForm({ ...urgentForm, guardianName: event.target.value })}
                  placeholder="보호자 이름"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />

                <input
                  value={urgentForm.guardianPhone}
                  onChange={(event) => setUrgentForm({ ...urgentForm, guardianPhone: phoneOnly(event.target.value) })}
                  placeholder="보호자 휴대폰"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />

                <input
                  value={urgentForm.serviceArea}
                  onChange={(event) => setUrgentForm({ ...urgentForm, serviceArea: event.target.value })}
                  placeholder="권역"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />

                <input
                  value={urgentForm.addressHint}
                  onChange={(event) => setUrgentForm({ ...urgentForm, addressHint: event.target.value })}
                  placeholder="주소 힌트"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                />

                <button
                  onClick={() => post('createUrgentRequest', urgentForm)}
                  disabled={loading}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
                >
                  테스트 긴급 요청 생성
                </button>
              </div>
            </section>
          </section>
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">가용 요양보호사·돌봄파트너</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {providers.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                현재 즉시 배치 가능한 검증 도움망이 없습니다.
              </div>
            ) : (
              providers.map((provider) => (
                <article key={provider.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#2AA897]">
                    {provider.provider_type === 'caregiver' ? '요양보호사' : '돌봄파트너'}
                  </div>
                  <h3 className="mt-2 text-lg font-black">{provider.provider_name}</h3>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                    {provider.service_area || '-'} · {provider.phone || '-'}
                    <br />
                    예상 응답 {provider.response_time_min || 15}분 · {provider.qualification || '-'}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default UrgentCaregiverDispatchPanel
