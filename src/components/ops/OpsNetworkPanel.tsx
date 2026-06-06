'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Provider = {
  id: string
  provider_type?: string
  provider_type_label?: string
  provider_name?: string
  phone?: string
  phone_masked?: string
  service_area?: string
  available_status?: string
  verified_status?: string
  qualification?: string
  response_time_min?: number
  notes?: string
  created_at?: string
}

type NetworkLog = {
  id: string
  action_type?: string
  message?: string
  created_at?: string
}

type Metrics = {
  total: number
  available: number
  paused: number
  verified: number
  pending: number
  care: number
  food: number
  pharmacy: number
}

function phoneOnly(value: string) {
  return value.replace(/[^\d]/g, '')
}

function statusClass(status?: string) {
  if (status === 'available' || status === 'verified') return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
  if (status === 'paused' || status === 'blocked') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
}

function statusLabel(status?: string) {
  if (status === 'available') return '가용'
  if (status === 'paused') return '중지'
  if (status === 'blocked') return '차단'
  if (status === 'verified') return '검증완료'
  if (status === 'pending') return '검증대기'
  return status || '대기'
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

export function OpsNetworkPanel() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [logs, setLogs] = useState<NetworkLog[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, available: 0, paused: 0, verified: 0, pending: 0, care: 0, food: 0, pharmacy: 0 })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [form, setForm] = useState({
    providerType: 'care_partner',
    providerName: '',
    phone: '',
    serviceArea: '우리동네',
    qualification: '',
    responseTimeMin: '30',
    notes: ''
  })

  const availableProviders = useMemo(
    () => providers.filter((provider) => provider.available_status === 'available'),
    [providers]
  )

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/ops-network', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '도움망 목록을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setProviders(Array.isArray(data.providers) ? data.providers : [])
      setLogs(Array.isArray(data.logs) ? data.logs : [])
      setMetrics(data.metrics || { total: 0, available: 0, paused: 0, verified: 0, pending: 0, care: 0, food: 0, pharmacy: 0 })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '도움망 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown>) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/ops-network', {
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
      setDebug(data.providers || data.provider ? JSON.stringify(data.providers || data.provider, null, 2) : '')
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            운영실 도움망 네트워크
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            오토파일럿이 연결할
            <br />
            실제 도움망을 관리합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            돌봄파트너, 요양보호사, 지역상점, 약국, 수행기관을 등록해야 오토파일럿이 수동 연결 상태에서 실제 요청 전파까지 진행할 수 있습니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <GuideCard number="1" title="등록" desc="이름, 연락처, 권역, 역할을 등록합니다." />
            <GuideCard number="2" title="검증" desc="운영실이 확인한 제공자를 검증완료로 표시합니다." />
            <GuideCard number="3" title="가용 상태" desc="현재 연락 가능한 도움망만 오토파일럿 후보가 됩니다." />
            <GuideCard number="4" title="테스트 풀" desc="내 번호로 도움망 4종을 한 번에 만들 수 있습니다." />
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]" open>
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="전체" value={`${metrics.total}명`} desc="등록된 도움망" danger={metrics.total === 0} />
          <MetricCard title="가용" value={`${metrics.available}명`} desc="요청 가능" danger={metrics.available === 0} />
          <MetricCard title="중지" value={`${metrics.paused}명`} desc="현재 제외" />
          <MetricCard title="검증" value={`${metrics.verified}명`} desc="운영실 확인" />
          <MetricCard title="대기" value={`${metrics.pending}명`} desc="검증 필요" danger={metrics.pending > 0} />
          <MetricCard title="돌봄" value={`${metrics.care}명`} desc="돌봄/요양/기관" />
          <MetricCard title="식사" value={`${metrics.food}곳`} desc="상점/도시락" />
          <MetricCard title="약국" value={`${metrics.pharmacy}곳`} desc="복약 상담" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">테스트 도움망 자동 등록</h2>

            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              내 번호 하나로 돌봄파트너, 요양보호사, 식사도움, 약국 4종을 등록합니다. 오토파일럿 후보 추천과 문자 요청 테스트에 바로 사용할 수 있습니다.
            </p>

            <div className="mt-5 grid gap-3">
              <input
                value={testPhone}
                onChange={(event) => setTestPhone(phoneOnly(event.target.value))}
                inputMode="tel"
                placeholder="테스트 수신번호 예: 01012345678"
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />

              <button
                onClick={() => post('seedDemoProviders', { testPhone, serviceArea: form.serviceArea })}
                disabled={loading || !testPhone}
                className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                테스트 도움망 4종 등록
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">도움망 직접 등록</h2>

            <div className="mt-5 grid gap-3">
              <select
                value={form.providerType}
                onChange={(event) => setForm({ ...form, providerType: event.target.value })}
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              >
                <option value="care_partner">돌봄파트너</option>
                <option value="caregiver">요양보호사</option>
                <option value="local_store">지역상점</option>
                <option value="meal_provider">도시락/반찬</option>
                <option value="pharmacy">약국</option>
                <option value="welfare_org">수행기관</option>
                <option value="gov_center">지자체</option>
                <option value="family">가족</option>
              </select>

              <Input label="이름/상호" value={form.providerName} onChange={(v) => setForm({ ...form, providerName: v })} />
              <Input label="연락처" value={form.phone} onChange={(v) => setForm({ ...form, phone: phoneOnly(v) })} />
              <Input label="권역/동네" value={form.serviceArea} onChange={(v) => setForm({ ...form, serviceArea: v })} />
              <Input label="자격/역할" value={form.qualification} onChange={(v) => setForm({ ...form, qualification: v })} />
              <Input label="응답 목표 분" value={form.responseTimeMin} onChange={(v) => setForm({ ...form, responseTimeMin: v.replace(/[^\d]/g, '') })} />
              <Input label="메모" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />

              <button
                onClick={() => post('createProvider', {
                  ...form,
                  availableStatus: 'available',
                  verifiedStatus: 'verified'
                })}
                disabled={loading || !form.providerName.trim()}
                className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                도움망 등록
              </button>
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">가용 도움망</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {availableProviders.length === 0 ? (
              <div className="rounded-2xl bg-[#FFF4F4] p-5 text-sm font-black leading-7 text-[#8A3030] ring-1 ring-[#F3C8C8]">
                현재 가용 도움망이 없습니다. 오토파일럿이 지역 도움망 요청을 보낼 수 없습니다.
              </div>
            ) : (
              availableProviders.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} loading={loading} onAction={post} />
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">전체 도움망</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {providers.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 등록된 도움망이 없습니다.
              </div>
            ) : (
              providers.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} loading={loading} onAction={post} />
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">최근 도움망 로그</h2>

          <div className="mt-5 space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 로그가 없습니다.
              </div>
            ) : (
              logs.slice(0, 20).map((log) => (
                <article key={log.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#2AA897]">{log.action_type || 'log'}</div>
                  <div className="mt-2 text-sm font-black leading-7">{log.message || '-'}</div>
                  <div className="mt-1 text-xs font-bold text-[#637B76]">{log.created_at || ''}</div>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-4">
          <Link href="/ops/autopilot" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
            오토파일럿
          </Link>
          <Link href="/ops/heartbeat" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            Heartbeat
          </Link>
          <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            알림 발송센터
          </Link>
          <button
            onClick={load}
            className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
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
    <article className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#247A71] text-xs font-black text-white">
        {number}
      </div>
      <h3 className="mt-3 text-base font-black tracking-[-0.04em]">{title}</h3>
      <p className="mt-1 text-xs font-bold leading-6 text-[#637B76]">{desc}</p>
    </article>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

function ProviderCard({ provider, loading, onAction }: { provider: Provider; loading: boolean; onAction: (action: string, payload: Record<string, unknown>) => void }) {
  return (
    <article className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
          {provider.provider_type_label || provider.provider_type}
        </span>
        <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(provider.available_status)}>
          {statusLabel(provider.available_status)}
        </span>
        <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(provider.verified_status)}>
          {statusLabel(provider.verified_status)}
        </span>
      </div>

      <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{provider.provider_name || '도움망'}</h3>

      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
        {provider.service_area || '권역 미지정'} · {provider.phone_masked || '-'} · {provider.response_time_min || 30}분 목표
      </p>

      {provider.qualification ? (
        <p className="mt-2 text-xs font-bold leading-6 text-[#637B76]">{provider.qualification}</p>
      ) : null}

      <div className="mt-4 grid gap-2">
        <button
          onClick={() => onAction('updateProvider', {
            id: provider.id,
            availableStatus: provider.available_status === 'available' ? 'paused' : 'available'
          })}
          disabled={loading}
          className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
        >
          {provider.available_status === 'available' ? '가용 중지' : '가용 전환'}
        </button>

        <button
          onClick={() => onAction('updateProvider', {
            id: provider.id,
            verifiedStatus: provider.verified_status === 'verified' ? 'pending' : 'verified'
          })}
          disabled={loading}
          className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
        >
          {provider.verified_status === 'verified' ? '검증대기로 변경' : '검증완료'}
        </button>

        <button
          onClick={() => onAction('deleteProvider', { id: provider.id })}
          disabled={loading}
          className="rounded-xl bg-[#FFF4F4] px-4 py-3 text-sm font-black text-[#8A3030] ring-1 ring-[#F3C8C8] disabled:opacity-50"
        >
          삭제
        </button>
      </div>
    </article>
  )
}

export default OpsNetworkPanel
