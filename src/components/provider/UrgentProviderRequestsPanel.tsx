'use client'

import { useState } from 'react'

type MatchItem = {
  match: {
    id: string
    match_status?: string
    notified_at?: string
    accepted_at?: string
    completed_at?: string
    note?: string
  }
  request: {
    id: string
    parent_name?: string
    signal_label?: string
    service_area?: string
    address_hint?: string
    requested_action?: string
    status?: string
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
  if (status === 'declined') return '거절'
  return status || '요청'
}

export function UrgentProviderRequestsPanel() {
  const [providerPhone, setProviderPhone] = useState('')
  const [provider, setProvider] = useState<Record<string, unknown> | null>(null)
  const [items, setItems] = useState<MatchItem[]>([])
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

  async function load() {
    if (!providerPhone) {
      setMessage('휴대폰 번호를 입력해주세요.')
      return
    }

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const params = new URLSearchParams()
      params.set('mode', 'provider')
      params.set('providerPhone', providerPhone)

      const response = await fetch('/api/urgent-caregiver-dispatch?' + params.toString(), { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '요청함을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setProvider(data.provider || null)
      setItems(Array.isArray(data.matches) ? data.matches : [])
      setMessage(data.message || '요청함을 불러왔습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청함을 불러오지 못했습니다.')
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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            요양보호사 긴급 요청함
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            가까운 어르신의
            <br />
            긴급 확인 요청을 받습니다.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#637B76]">
            운영실이 보낸 긴급 확인 요청을 수락하고, 전화 또는 방문 확인 후 처리 완료를 남깁니다.
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            응급상황이 의심되면 직접 판단하지 말고 119 또는 의료기관 연락을 안내해주세요.
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={providerPhone}
              onChange={(event) => setProviderPhone(phoneOnly(event.target.value))}
              inputMode="tel"
              placeholder="등록한 휴대폰 번호"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <button
              onClick={load}
              disabled={loading || !providerPhone}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              요청함 조회
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

        {!provider ? (
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
                onChange={(event) => {
                  const next = phoneOnly(event.target.value)
                  setRegisterForm({ ...registerForm, phone: next })
                  setProviderPhone(next)
                }}
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

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">받은 긴급 요청</h2>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="처리 메모 예: 보호자 통화 완료, 방문 확인 예정, 119 안내 완료"
            className="mt-4 min-h-20 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
          />

          <div className="mt-5 space-y-3">
            {items.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                받은 긴급 요청이 없습니다.
              </div>
            ) : (
              items.map((item) => (
                <article key={item.match.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#FFF4F4] px-3 py-1 text-xs font-black text-[#8A3030] ring-1 ring-[#F3C8C8]">
                          {statusLabel(item.match.match_status)}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                          {item.request.service_area || '-'}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{item.request.signal_label || '긴급 확인 요청'}</h3>
                      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                        {item.request.parent_name || '어르신'} · {item.request.address_hint || '-'}
                        <br />
                        {item.request.requested_action || '운영실 요청을 확인해주세요.'}
                      </p>
                    </div>

                    <div className="grid min-w-40 gap-2">
                      <button
                        onClick={() => post('acceptDispatch', { matchId: item.match.id, providerPhone, note })}
                        disabled={loading || item.match.match_status !== 'notified'}
                        className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                      >
                        수락
                      </button>

                      <button
                        onClick={() => post('completeDispatch', { matchId: item.match.id, providerPhone, note })}
                        disabled={loading || item.match.match_status === 'completed'}
                        className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
                      >
                        완료
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default UrgentProviderRequestsPanel
