'use client'

import { useEffect, useState } from 'react'

type Family = {
  family_code?: string
  parent_name?: string
  guardian_name?: string
  guardian_phone?: string
  parent_phone?: string
  link_status?: string
}

type Subscription = {
  id?: string
  family_code?: string
  plan_name?: string
  status?: string
  started_at?: string
  ended_at?: string
  created_at?: string
}

export function AnbuSubscriptionOpsPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [familyCode, setFamilyCode] = useState('')
  const [days, setDays] = useState('30')
  const [planName, setPlanName] = useState('안부온 베이직 운영실 승인')
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)

    const response = await fetch('/api/anbu-subscriptions/list', { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))

    setFamilies(Array.isArray(data.families) ? data.families : [])
    setSubscriptions(Array.isArray(data.subscriptions) ? data.subscriptions : [])
    setResult(data)
    setLoading(false)
  }

  async function activate() {
    setLoading(true)

    const response = await fetch('/api/anbu-subscriptions/admin-activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyCode, days: Number(days), planName })
    })

    const data = await response.json().catch(() => ({}))
    setResult(data)
    await load()
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            운영실 · 구독 관리
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            가족코드 기준으로 구독을 활성화합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            Toss 키가 없는 동안 운영실에서 수동으로 베이직 구독을 활성화해 주간 리포트 접근을 테스트할 수 있습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? '처리 중...' : '새로고침'}
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">구독 수동 활성화</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Input label="6자리 가족코드" value={familyCode} onChange={setFamilyCode} placeholder="예: 462015" />
            <Input label="플랜명" value={planName} onChange={setPlanName} />
            <Input label="일수" value={days} onChange={setDays} />
            <div className="flex items-end">
              <button
                onClick={activate}
                disabled={loading || !familyCode}
                className="w-full rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
              >
                구독 활성화
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">최근 가족 연결</h2>
            <div className="mt-5 space-y-3">
              {families.length === 0 ? (
                <p className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                  가족 연결 데이터가 없습니다.
                </p>
              ) : (
                families.map((family) => (
                  <button
                    key={family.family_code}
                    onClick={() => setFamilyCode(family.family_code || '')}
                    className="w-full rounded-2xl bg-[#F8FCFB] p-4 text-left ring-1 ring-[#D8EEE8] transition hover:bg-[#EFFFF9]"
                  >
                    <div className="text-xs font-black text-[#11977F]">{family.family_code}</div>
                    <div className="mt-1 text-lg font-black">{family.parent_name || '부모님'}</div>
                    <p className="mt-1 text-sm font-bold text-[#637B76]">
                      보호자: {family.guardian_name || '-'} · {family.guardian_phone || '-'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">최근 구독</h2>
            <div className="mt-5 space-y-3">
              {subscriptions.length === 0 ? (
                <p className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                  구독 데이터가 없습니다.
                </p>
              ) : (
                subscriptions.map((sub) => (
                  <article key={sub.id} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                    <div className="flex flex-wrap gap-2">
                      <Badge text={sub.status || '-'} />
                      <Badge text={sub.family_code || '-'} />
                    </div>
                    <div className="mt-3 text-lg font-black">{sub.plan_name || '구독'}</div>
                    <p className="mt-1 text-sm font-bold text-[#637B76]">
                      시작: {sub.started_at ? new Date(sub.started_at).toLocaleString('ko-KR') : '-'}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#637B76]">
                      종료: {sub.ended_at ? new Date(sub.ended_at).toLocaleString('ko-KR') : '-'}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">최근 처리 결과</h2>
          <pre className="mt-4 max-h-[24rem] overflow-auto rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      </section>
    </main>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder = ''
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#D8EEE7]">
      {text}
    </span>
  )
}
