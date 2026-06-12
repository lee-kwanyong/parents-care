'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type Mode = 'guardian' | 'ops'

type Signal = {
  key: string
  emoji: string
  title: string
  desc: string
  tone: 'safe' | 'warning' | 'urgent'
}

type Family = {
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  parentPhone?: string
  serviceArea: string
  parentAppUrl: string
  matchedBy?: string
}

const signals: Signal[] = [
  {
    key: 'ok',
    emoji: '✅',
    title: '괜찮아요',
    desc: '전화 확인 결과 이상이 없을 때 기록합니다.',
    tone: 'safe'
  },
  {
    key: 'meal',
    emoji: '🍚',
    title: '밥을 못 먹었어요',
    desc: '식사 확인 또는 식사 도움이 필요할 때 기록합니다.',
    tone: 'warning'
  },
  {
    key: 'medication',
    emoji: '💊',
    title: '약을 못 먹었어요',
    desc: '복약 확인이 필요할 때 기록합니다.',
    tone: 'warning'
  },
  {
    key: 'sick',
    emoji: '🤒',
    title: '몸이 아파요',
    desc: '몸 상태 확인이나 보호자 전화 확인이 필요할 때 기록합니다.',
    tone: 'urgent'
  },
  {
    key: 'urgent',
    emoji: '🆘',
    title: '지금 도움이 필요해요',
    desc: '즉시 확인이 필요한 도움 요청으로 기록합니다.',
    tone: 'urgent'
  },
  {
    key: 'noAnswer',
    emoji: '📵',
    title: '전화 연결 안 됨',
    desc: '통화가 되지 않아 재확인이 필요할 때 기록합니다.',
    tone: 'warning'
  }
]

function toneClass(tone?: Signal['tone']) {
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'urgent') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode = 'text'
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  inputMode?: 'text' | 'tel' | 'numeric'
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold outline-none"
      />
    </label>
  )
}

export function ProxyCheckinPanel({ mode = 'guardian' }: { mode?: Mode }) {
  const params = useSearchParams()
  const [familyCode, setFamilyCode] = useState('')
  const [last4, setLast4] = useState('')
  const [actorName, setActorName] = useState(mode === 'ops' ? '운영실' : '보호자')
  const [actorPhone, setActorPhone] = useState('')
  const [family, setFamily] = useState<Family | null>(null)
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [note, setNote] = useState('')
  const [notifyGuardian, setNotifyGuardian] = useState(false)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const pageTitle = mode === 'ops' ? '운영실 대리 안부 기록' : '보호자 대리 안부 기록'
  const pageDesc =
    mode === 'ops'
      ? '운영실이 전화 확인 후 부모님 상태를 대신 기록합니다.'
      : '보호자가 부모님과 전화한 뒤 앱 대신 상태를 기록합니다.'

  const reportUrl = useMemo(() => {
    if (!familyCode || !last4) return '/guardian/today'
    const search = new URLSearchParams()
    search.set('familyCode', familyCode)
    search.set('last4', last4)
    return '/guardian/today?' + search.toString()
  }, [familyCode, last4])

  useEffect(() => {
    const qFamilyCode = params.get('familyCode') || ''
    const qLast4 = params.get('last4') || ''

    const storedFamilyCode = typeof window !== 'undefined' ? localStorage.getItem('anbu_guardian_family_code') || '' : ''
    const storedLast4 = typeof window !== 'undefined' ? localStorage.getItem('anbu_guardian_last4') || '' : ''

    const nextFamilyCode = qFamilyCode || storedFamilyCode
    const nextLast4 = qLast4 || storedLast4

    if (nextFamilyCode) setFamilyCode(nextFamilyCode)
    if (nextLast4) setLast4(nextLast4)

    if (nextFamilyCode && nextLast4) {
      lookup(nextFamilyCode, nextLast4)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  async function lookup(nextFamilyCode = familyCode, nextLast4 = last4) {
    const cleanFamilyCode = nextFamilyCode.trim()
    const cleanLast4 = nextLast4.replace(/[^\d]/g, '').slice(-4)

    if (!cleanFamilyCode) {
      setMessage('가족코드를 입력해주세요.')
      return
    }

    if (mode !== 'ops' && cleanLast4.length !== 4) {
      setMessage('휴대폰 뒤 4자리를 입력해주세요.')
      return
    }

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('anbu_guardian_family_code', cleanFamilyCode)
        localStorage.setItem('anbu_guardian_last4', cleanLast4)
      }

      const search = new URLSearchParams()
      search.set('familyCode', cleanFamilyCode)
      if (cleanLast4) search.set('last4', cleanLast4)

      const response = await fetch('/api/proxy-checkin?' + search.toString(), { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setFamily(null)
        setMessage(data.message || '가족 정보를 찾지 못했습니다.')
        setDebug(JSON.stringify(data, null, 2))
        return
      }

      setFamily(data.family)
      setFamilyCode(data.family.familyCode)
      setActorName(mode === 'ops' ? '운영실' : data.family.guardianName || '보호자')
      setActorPhone(data.family.guardianPhone || actorPhone)
      setMessage(`${data.family.parentName}님의 정보를 불러왔습니다.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function submit(signal: Signal) {
    if (!familyCode.trim()) {
      setMessage('가족코드가 필요합니다.')
      return
    }

    if (mode !== 'ops' && last4.replace(/[^\d]/g, '').length !== 4) {
      setMessage('휴대폰 뒤 4자리가 필요합니다.')
      return
    }

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/proxy-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createProxyCheckin',
          actorType: mode,
          actorName,
          actorPhone,
          familyCode,
          last4,
          signalKey: signal.key,
          note,
          notifyGuardian
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '대리 안부 기록에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setFamily(data.family || family)
      setSelectedSignal(signal)
      setMessage(data.message || '대리 안부 기록이 완료되었습니다.')
      setDebug(JSON.stringify(data, null, 2))
      setNote('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '대리 안부 기록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            {mode === 'ops' ? '운영실 확인' : '보호자 확인'}
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                {pageTitle}
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                {pageDesc} 부모님이 직접 앱을 누르지 못해도 리포트와 운영실 기록에 남길 수 있습니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + toneClass(selectedSignal?.tone)}>
              <div className="text-sm font-black opacity-70">최근 기록</div>
              <div className="mt-2 text-3xl font-black tracking-[-0.08em]">
                {selectedSignal?.title || '대기'}
              </div>
              <div className="mt-2 text-xs font-bold">
                {family?.parentName || '부모님'}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            대리입력은 의료 판단이 아닙니다. 응급상황이 의심되면 즉시 119 또는 의료기관 연락을 안내해야 합니다.
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">가족 확인</h2>

            <div className="mt-5 grid gap-3">
              <Field
                label="가족코드"
                value={familyCode}
                onChange={setFamilyCode}
                placeholder="예: 123456"
              />

              <Field
                label={mode === 'ops' ? '휴대폰 뒤 4자리, 선택' : '보호자 또는 부모님 휴대폰 뒤 4자리'}
                value={last4}
                onChange={(value) => setLast4(value.replace(/[^\d]/g, '').slice(-4))}
                placeholder="예: 0336"
                inputMode="numeric"
              />

              <button
                onClick={() => lookup()}
                disabled={loading}
                className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                가족 정보 확인
              </button>
            </div>

            {family ? (
              <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
                <div className="text-xs font-black text-[#2AA897]">{family.familyCode}</div>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.06em]">{family.parentName}</h3>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  보호자 {family.guardianName || '-'} · {family.guardianPhone || '-'}
                  <br />
                  권역 {family.serviceArea || '-'}
                </p>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3">
              <Field
                label="기록자 이름"
                value={actorName}
                onChange={setActorName}
                placeholder="예: 이관용"
              />

              <Field
                label="기록자 휴대폰, 선택"
                value={actorPhone}
                onChange={(value) => setActorPhone(value.replace(/[^\d]/g, ''))}
                placeholder="선택"
                inputMode="tel"
              />

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#637B76]">메모</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="예: 전화 확인 완료. 식사는 아직 못 했다고 함."
                  className="min-h-28 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold leading-7 outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                <input
                  type="checkbox"
                  checked={notifyGuardian}
                  onChange={(event) => setNotifyGuardian(event.target.checked)}
                />
                보호자 문자도 자동화 대상에 포함
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">전화 확인 결과</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              부모님과 통화한 뒤 가장 가까운 상태를 하나만 선택하세요.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {signals.map((signal) => (
                <button
                  key={signal.key}
                  onClick={() => submit(signal)}
                  disabled={loading || !familyCode}
                  className={'rounded-[2rem] p-5 text-left shadow-sm ring-1 transition active:scale-[0.99] disabled:opacity-50 ' + toneClass(signal.tone)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-current/10">
                      {signal.emoji}
                    </div>
                    <div>
                      <div className="text-xl font-black tracking-[-0.05em]">{signal.title}</div>
                      <div className="mt-1 text-sm font-bold leading-6 opacity-75">{signal.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {message ? (
              <div className="mt-5 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
                {message}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={reportUrl} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
                오늘 리포트 확인
              </Link>

              {family?.parentAppUrl ? (
                <Link href={family.parentAppUrl} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  부모님 앱 링크 열기
                </Link>
              ) : (
                <Link href="/mobile/parent" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  부모님 앱 열기
                </Link>
              )}

              <Link href="/admin/ops/control-center" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                운영실 상태판
              </Link>
            </div>

            {params.get('debug') === '1' && debug ? (
              <details className="mt-5 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white">
                <summary className="cursor-pointer text-sm font-black">상세 결과 보기</summary>
                <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
              </details>
            ) : null}
          </section>
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">언제 쓰나요?</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ['부모님이 앱을 못 쓰실 때', '보호자가 전화로 확인하고 대신 기록합니다.'],
              ['전화했는데 연결이 안 될 때', '전화 연결 안 됨으로 남겨 재확인 대상을 만듭니다.'],
              ['운영실이 직접 확인했을 때', '운영실 통화 결과를 사건 기록과 리포트에 남깁니다.']
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-lg font-black">{title}</div>
                <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default ProxyCheckinPanel
