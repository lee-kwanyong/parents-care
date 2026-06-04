'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type ProviderItem = {
  match: {
    id: string
    request_id: string
    provider_id: string
    match_status: string
    notified_at?: string
    accepted_at?: string
    completed_at?: string
    note?: string
  }
  provider: {
    id: string
    provider_type?: string
    provider_type_label?: string
    provider_name?: string
    service_area?: string
    verified_status?: string
    available_status?: string
  }
  request: {
    id: string
    family_code?: string
    parent_name?: string
    parent_phone?: string
    guardian_phone?: string
    address_hint?: string
    signal_label?: string
    request_type?: string
    request_type_label?: string
    risk_level?: string
    status?: string
    service_area?: string
    requested_action?: string
    created_at?: string
    private_locked?: boolean
  }
}

type Metrics = {
  total: number
  notified: number
  accepted: number
  completed: number
}

function phoneOnly(value: string) {
  return value.replace(/[^\d]/g, '')
}

function riskClass(risk?: string) {
  if (risk === 'high') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
}

function statusClass(status?: string) {
  if (status === 'completed') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  if (status === 'accepted' || status === 'in_progress') return 'bg-[#EEF6FF] text-[#1B4E7A] ring-[#CFE5FA]'
  if (status === 'declined') return 'bg-[#F8FCFB] text-[#637B76] ring-[#D8EEE8]'
  return 'bg-white text-[#173B36] ring-[#D8EEE8]'
}

function statusLabel(status?: string) {
  if (status === 'notified') return '새 요청'
  if (status === 'accepted') return '수락됨'
  if (status === 'in_progress') return '확인 중'
  if (status === 'completed') return '완료'
  if (status === 'declined') return '거절'
  return status || '대기'
}

function MetricCard({ title, value, desc, danger }: { title: string; value: string; desc: string; danger?: boolean }) {
  return (
    <article className={'rounded-[2rem] p-5 shadow-sm ring-1 ' + (danger ? 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]' : 'bg-white text-[#173B36] ring-[#D8EEE8]')}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

export function ProviderRequestsPanel() {
  const [phone, setPhone] = useState('')
  const [token, setToken] = useState('')
  const [tokenMode, setTokenMode] = useState(false)
  const [items, setItems] = useState<ProviderItem[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, notified: 0, accepted: 0, completed: 0 })
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [noteById, setNoteById] = useState<Record<string, string>>({})

  const activeItems = useMemo(
    () => items.filter((item) => !['completed', 'declined'].includes(item.match.match_status)),
    [items]
  )

  const doneItems = useMemo(
    () => items.filter((item) => ['completed', 'declined'].includes(item.match.match_status)),
    [items]
  )

  async function loadByToken(targetToken = token) {
    if (!targetToken) {
      setMessage('요청 링크가 없습니다.')
      return
    }

    setToken(targetToken)
    setTokenMode(true)

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/provider-requests?t=' + encodeURIComponent(targetToken), {
        cache: 'no-store'
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '요청 링크를 확인하지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        setItems([])
        setMetrics({ total: 0, notified: 0, accepted: 0, completed: 0 })
        return
      }

      if (data.message) setMessage(data.message)

      setItems(Array.isArray(data.items) ? data.items : [])
      setMetrics(data.metrics || { total: 0, notified: 0, accepted: 0, completed: 0 })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청 링크를 확인하지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function loadByPhone(targetPhone = phone) {
    const cleanPhone = phoneOnly(targetPhone)

    if (!cleanPhone) {
      setMessage('등록된 연락처를 입력해주세요.')
      return
    }

    setPhone(cleanPhone)
    setTokenMode(false)
    window.localStorage.setItem('anbu_provider_phone', cleanPhone)

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/provider-requests?phone=' + encodeURIComponent(cleanPhone), {
        cache: 'no-store'
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '요청함을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        setItems([])
        setMetrics({ total: 0, notified: 0, accepted: 0, completed: 0 })
        return
      }

      if (data.message) setMessage(data.message)

      setItems(Array.isArray(data.items) ? data.items : [])
      setMetrics(data.metrics || { total: 0, notified: 0, accepted: 0, completed: 0 })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청함을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function update(item: ProviderItem, action: 'accept' | 'start' | 'complete' | 'decline') {
    const cleanPhone = phoneOnly(phone)
    const note = noteById[item.match.id] || ''

    if (!tokenMode && !cleanPhone) {
      setMessage('등록된 연락처를 입력해주세요.')
      return
    }

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/provider-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenMode ? token : '',
          phone: tokenMode ? '' : cleanPhone,
          matchId: item.match.id,
          action,
          note
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '요청 상태 변경에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMessage(data.message || '처리되었습니다.')

      if (tokenMode) await loadByToken(token)
      else await loadByPhone(cleanPhone)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('t') || ''
    const p = params.get('phone') || ''

    if (t) {
      setToken(t)
      setTokenMode(true)
      loadByToken(t)
      return
    }

    if (p) {
      setPhone(phoneOnly(p))
      loadByPhone(p)
      return
    }

    const storedPhone = window.localStorage.getItem('anbu_provider_phone') || ''
    if (storedPhone) {
      setPhone(storedPhone)
      loadByPhone(storedPhone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            지역 도움망 요청함
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            가까운 사람이
            <br />
            먼저 확인할 수 있습니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            운영실에서 요청을 보낸 돌봄파트너, 요양보호사, 지역상점, 약국, 수행기관이 받은 요청을 확인하고 처리 결과를 남기는 화면입니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <GuideCard number="1" title={tokenMode ? '보안 링크 확인' : '연락처 입력'} desc={tokenMode ? '문자 링크로 들어온 요청만 안전하게 확인합니다.' : '운영실에 등록된 연락처로 본인 요청만 확인합니다.'} />
            <GuideCard number="2" title="요청 수락" desc="수락 전에는 상세 연락처와 주소가 제한됩니다." />
            <GuideCard number="3" title="처리 완료" desc="전화·방문·식사 연결 등 가능한 조치 후 결과를 남깁니다." />
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
            응급상황을 앱이 직접 판단하지 않습니다. 현장에서 응급 가능성이 보이면 119 또는 의료기관에 즉시 연락해야 합니다.
          </div>

          {tokenMode ? (
            <div className="mt-6 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
              보안 요청 링크로 접속했습니다. 연락처 입력 없이 이 요청을 확인할 수 있습니다.
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_10rem]">
              <input
                value={phone}
                onChange={(event) => setPhone(phoneOnly(event.target.value))}
                inputMode="tel"
                placeholder="등록된 연락처 입력"
                className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />

              <button
                onClick={() => loadByPhone(phone)}
                disabled={loading}
                className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                {loading ? '조회 중' : '요청 조회'}
              </button>
            </div>
          )}

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              <summary className="cursor-pointer text-sm font-black">상세 오류 보기</summary>
              <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="전체" value={`${metrics.total}개`} desc="받은 요청 전체" />
          <MetricCard title="새 요청" value={`${metrics.notified}개`} desc="아직 수락하지 않은 요청" danger={metrics.notified > 0} />
          <MetricCard title="확인 중" value={`${metrics.accepted}개`} desc="수락 또는 처리 중" />
          <MetricCard title="완료" value={`${metrics.completed}개`} desc="처리 완료된 요청" />
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">지금 받은 요청</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
            수락하면 필요한 연락처와 주소 힌트가 표시됩니다. 수행이 어렵다면 거절을 눌러 운영실이 다른 도움망을 찾을 수 있게 해주세요.
          </p>

          <div className="mt-5 space-y-3">
            {activeItems.length === 0 ? (
              <div className="rounded-2xl bg-[#EFFFF9] p-5 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
                현재 처리할 요청이 없습니다.
              </div>
            ) : (
              activeItems.map((item) => (
                <article key={item.match.id} className={'rounded-[2rem] p-5 ring-1 ' + riskClass(item.request.risk_level)}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {item.request.risk_level === 'high' ? '긴급' : '주의'}
                        </span>
                        <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(item.match.match_status)}>
                          {statusLabel(item.match.match_status)}
                        </span>
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {item.request.request_type_label}
                        </span>
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {item.provider.provider_type_label}
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-black tracking-[-0.05em]">
                        {item.request.signal_label || item.request.request_type_label}
                      </h3>

                      <p className="mt-3 text-sm font-bold leading-7">
                        {item.request.parent_name || '부모님'} · {item.request.service_area || item.provider.service_area || '권역 미지정'}
                      </p>

                      <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm font-black leading-7 ring-1 ring-current">
                        {item.request.requested_action || '가능한 도움을 확인하고 결과를 남겨주세요.'}
                      </div>

                      {item.request.private_locked ? (
                        <div className="mt-3 rounded-2xl bg-white/60 p-4 text-sm font-black leading-7 ring-1 ring-current">
                          개인정보 보호를 위해 부모님 연락처와 주소 힌트는 요청 수락 후 표시됩니다.
                        </div>
                      ) : (
                        <div className="mt-3 grid gap-2 rounded-2xl bg-white/70 p-4 text-sm font-black leading-7 ring-1 ring-current">
                          <div>부모님 연락처: {item.request.parent_phone || '-'}</div>
                          <div>보호자 연락처: {item.request.guardian_phone || '-'}</div>
                          <div>주소 힌트: {item.request.address_hint || '-'}</div>
                        </div>
                      )}

                      <textarea
                        value={noteById[item.match.id] || ''}
                        onChange={(event) => setNoteById({ ...noteById, [item.match.id]: event.target.value })}
                        placeholder="처리 메모 예: 전화 연결 완료, 방문 예정, 식사 배달 가능"
                        className="mt-3 min-h-24 w-full rounded-2xl border border-current bg-white/70 px-4 py-3 text-sm font-bold outline-none placeholder:text-current/50"
                      />
                    </div>

                    <div className="grid min-w-52 gap-2">
                      {item.request.parent_phone && !item.request.private_locked ? (
                        <a
                          href={`tel:${item.request.parent_phone}`}
                          className="rounded-xl bg-[#193B38] px-4 py-3 text-center text-sm font-black text-white"
                        >
                          부모님께 전화
                        </a>
                      ) : null}

                      {item.request.guardian_phone && !item.request.private_locked ? (
                        <a
                          href={`tel:${item.request.guardian_phone}`}
                          className="rounded-xl bg-white/80 px-4 py-3 text-center text-sm font-black ring-1 ring-current"
                        >
                          보호자에게 전화
                        </a>
                      ) : null}

                      {item.match.match_status === 'notified' ? (
                        <button
                          onClick={() => update(item, 'accept')}
                          disabled={loading}
                          className="rounded-xl bg-[#193B38] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                        >
                          요청 수락
                        </button>
                      ) : null}

                      {item.match.match_status === 'accepted' ? (
                        <button
                          onClick={() => update(item, 'start')}
                          disabled={loading}
                          className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                        >
                          확인 시작
                        </button>
                      ) : null}

                      {['accepted', 'in_progress'].includes(item.match.match_status) ? (
                        <button
                          onClick={() => update(item, 'complete')}
                          disabled={loading}
                          className="rounded-xl bg-[#123F38] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                        >
                          처리 완료
                        </button>
                      ) : null}

                      {item.match.match_status === 'notified' ? (
                        <button
                          onClick={() => update(item, 'decline')}
                          disabled={loading}
                          className="rounded-xl bg-white/60 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                        >
                          수행 어려움
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">완료 또는 거절한 요청</h2>

          <div className="mt-5 space-y-3">
            {doneItems.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                아직 완료된 요청이 없습니다.
              </div>
            ) : (
              doneItems.slice(0, 10).map((item) => (
                <article key={item.match.id} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(item.match.match_status)}>
                      {statusLabel(item.match.match_status)}
                    </span>
                    <span className="text-lg font-black">{item.request.signal_label || item.request.request_type_label}</span>
                  </div>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                    {item.match.note || '-'}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/response/about" className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white">
            지역 안심망 소개
          </Link>
          <Link href="/response" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            보호자 후속조치
          </Link>
          <button
            onClick={() => (tokenMode ? loadByToken(token) : loadByPhone(phone))}
            className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

function GuideCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <article className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#193B38] text-xs font-black text-white">
        {number}
      </div>
      <h3 className="mt-3 text-base font-black tracking-[-0.04em]">{title}</h3>
      <p className="mt-1 text-xs font-bold leading-6 text-[#637B76]">{desc}</p>
    </article>
  )
}

export default ProviderRequestsPanel
