'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type TokenData = {
  ok: boolean
  expired?: boolean
  canAccept?: boolean
  canComplete?: boolean
  message?: string
  match?: {
    id: string
    match_status?: string
    notified_at?: string
    accepted_at?: string
    completed_at?: string
    expires_at?: string
    note?: string
  }
  provider?: {
    id: string
    provider_type?: string
    provider_name?: string
    service_area?: string
    qualification?: string
  }
  request?: {
    id: string
    family_code?: string
    parent_name?: string
    signal_label?: string
    request_type?: string
    risk_level?: string
    status?: string
    service_area?: string
    address_hint?: string
    requested_action?: string
    guardian_name?: string
    guardian_phone?: string
    created_at?: string
  }
}

function phoneOnly(value: string) {
  return value.replace(/[^\d]/g, '')
}

function statusLabel(status?: string) {
  if (status === 'notified') return '수락 대기'
  if (status === 'accepted') return '수락함'
  if (status === 'completed') return '완료'
  if (status === 'declined') return '다른 도움망 수락'
  if (status === 'expired') return '만료'
  return status || '요청'
}

export function UrgentProviderRequestsPanel() {
  const searchParams = useSearchParams()
  const initialToken = searchParams.get('token') || ''

  const [token, setToken] = useState(initialToken)
  const [data, setData] = useState<TokenData | null>(null)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const [registerForm, setRegisterForm] = useState({
    providerName: '',
    phone: '',
    serviceArea: '',
    providerType: 'caregiver',
    qualification: '요양보호사',
    availableHours: ''
  })

  async function loadByToken(nextToken = token) {
    if (!nextToken) {
      setMessage('문자로 받은 요청 링크의 토큰이 필요합니다.')
      return
    }

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const params = new URLSearchParams()
      params.set('mode', 'token')
      params.set('token', nextToken)

      const response = await fetch('/api/urgent-caregiver-dispatch?' + params.toString(), { cache: 'no-store' })
      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.ok) {
        setMessage(result.message || '요청을 불러오지 못했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        setData(null)
        return
      }

      setData(result)
      setMessage(result.message || '긴급 요청을 불러왔습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청을 불러오지 못했습니다.')
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

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.ok) {
        setMessage(result.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await loadByToken()
        return
      }

      setMessage(result.message || '처리되었습니다.')
      setDebug(JSON.stringify(result, null, 2))
      await loadByToken()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialToken) loadByToken(initialToken)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            요양보호사 긴급 요청함
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            문자로 받은 링크에서
            <br />
            긴급 요청을 수락합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#637B76]">
            운영실이 보낸 1회용 링크로 요청을 확인합니다. 수락 전에는 상세 위치가 숨겨지고, 수락 후에만 상세 정보가 표시됩니다.
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            안부웍스는 119를 대체하지 않습니다. 생명 위협, 낙상, 의식저하, 호흡곤란 등 응급상황이 의심되면 즉시 119 또는 의료기관 연락을 안내해주세요.
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={token}
              onChange={(event) => setToken(event.target.value.trim())}
              placeholder="문자 링크 토큰"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <button
              onClick={() => loadByToken()}
              disabled={loading || !token}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              요청 확인
            </button>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white" open>
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        {data?.request ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#FFF4F4] px-3 py-1 text-xs font-black text-[#8A3030] ring-1 ring-[#F3C8C8]">
                    긴급
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                    {statusLabel(data.match?.match_status)}
                  </span>
                  {data.expired ? (
                    <span className="rounded-full bg-[#FFF9EE] px-3 py-1 text-xs font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
                      링크 만료
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-4 text-3xl font-black tracking-[-0.06em]">
                  {data.request.signal_label || '긴급 확인 요청'}
                </h2>

                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                  대상자: {data.request.parent_name || '-'}
                  <br />
                  권역: {data.request.service_area || '-'}
                  <br />
                  위치: {data.request.address_hint || '-'}
                  <br />
                  보호자: {data.request.guardian_name || '-'} {data.request.guardian_phone || ''}
                  <br />
                  요청시각: {data.request.created_at || '-'}
                </p>

                <div className="mt-4 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                  {data.request.requested_action || '운영실 요청을 확인해주세요.'}
                </div>
              </div>

              <div className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7] lg:min-w-64">
                <div className="font-black text-[#17443F]">담당 도움망</div>
                <div className="mt-2">{data.provider?.provider_name || '-'}</div>
                <div>{data.provider?.provider_type === 'caregiver' ? '요양보호사' : '돌봄파트너'}</div>
                <div>{data.provider?.service_area || '-'}</div>
                <div>{data.provider?.qualification || '-'}</div>
                <div className="mt-3 text-xs">링크 만료: {data.match?.expires_at || '-'}</div>
              </div>
            </div>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="처리 메모 예: 지금 출발합니다, 보호자 통화 완료, 방문 확인 완료"
              className="mt-5 min-h-24 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => post('acceptDispatchByToken', { token, note })}
                disabled={loading || !data.canAccept}
                className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                수락하고 상세 위치 확인
              </button>

              <button
                onClick={() => post('completeDispatchByToken', { token, note })}
                disabled={loading || !data.canComplete}
                className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
              >
                확인 완료 처리
              </button>
            </div>
          </section>
        ) : null}

        {!data?.request ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">요양보호사·돌봄파트너 등록</h2>

            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              등록 후 운영실 검증이 완료되면 즉시 배치 대상에 포함됩니다.
            </p>

            <div className="mt-5 grid gap-3">
              <input
                value={registerForm.providerName}
                onChange={(event) => setRegisterForm({ ...registerForm, providerName: event.target.value })}
                placeholder="이름"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
              />

              <input
                value={registerForm.phone}
                onChange={(event) => setRegisterForm({ ...registerForm, phone: phoneOnly(event.target.value) })}
                placeholder="휴대폰 번호"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
              />

              <input
                value={registerForm.serviceArea}
                onChange={(event) => setRegisterForm({ ...registerForm, serviceArea: event.target.value })}
                placeholder="활동 권역 예: 청양읍"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
              />

              <select
                value={registerForm.providerType}
                onChange={(event) => setRegisterForm({ ...registerForm, providerType: event.target.value })}
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="caregiver">요양보호사</option>
                <option value="care_partner">돌봄파트너</option>
              </select>

              <input
                value={registerForm.qualification}
                onChange={(event) => setRegisterForm({ ...registerForm, qualification: event.target.value })}
                placeholder="자격/경력"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
              />

              <button
                onClick={() => post('registerCaregiver', registerForm)}
                disabled={loading || !registerForm.providerName || !registerForm.phone}
                className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                등록 요청
              </button>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default UrgentProviderRequestsPanel
