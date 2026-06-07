'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Signal = {
  key: string
  emoji: string
  title: string
  desc: string
  danger?: boolean
}

const signals: Signal[] = [
  { key: 'ok', emoji: '✅', title: '괜찮아요', desc: '오늘 상태가 괜찮다고 보호자에게 알려요.' },
  { key: 'meal', emoji: '🍚', title: '밥을 못 먹었어요', desc: '식사 확인과 도움 요청이 필요해요.' },
  { key: 'medication', emoji: '💊', title: '약을 못 먹었어요', desc: '복약 확인이 필요해요.' },
  { key: 'sick', emoji: '🤒', title: '몸이 아파요', desc: '보호자 전화 확인이 필요해요.', danger: true },
  { key: 'urgent', emoji: '🆘', title: '지금 도움이 필요해요', desc: '가까운 보호자와 운영실이 바로 확인해야 해요.', danger: true }
]

function phoneOnly(value: string) {
  return value.replace(/[^\d]/g, '')
}

export function MobileParentSignalPanel() {
  const searchParams = useSearchParams()

  const [familyCode, setFamilyCode] = useState('')
  const [parentName, setParentName] = useState('부모님')
  const [guardianName, setGuardianName] = useState('보호자')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [serviceArea, setServiceArea] = useState('우리동네')
  const [addressHint, setAddressHint] = useState('')
  const [pilotKey, setPilotKey] = useState('')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loadingKey, setLoadingKey] = useState('')

  useEffect(() => {
    const nextFamilyCode = searchParams.get('familyCode') || ''
    const nextParentName = searchParams.get('parentName') || ''
    const nextGuardianName = searchParams.get('guardianName') || ''
    const nextGuardianPhone = searchParams.get('guardianPhone') || ''
    const nextServiceArea = searchParams.get('serviceArea') || ''
    const nextAddressHint = searchParams.get('addressHint') || ''
    const nextPilotKey = searchParams.get('pilotKey') || ''

    if (nextFamilyCode) setFamilyCode(nextFamilyCode)
    if (nextParentName) setParentName(nextParentName)
    if (nextGuardianName) setGuardianName(nextGuardianName)
    if (nextGuardianPhone) setGuardianPhone(phoneOnly(nextGuardianPhone))
    if (nextServiceArea) setServiceArea(nextServiceArea)
    if (nextAddressHint) setAddressHint(nextAddressHint)
    if (nextPilotKey) setPilotKey(nextPilotKey)
  }, [searchParams])

  async function submit(signalType: string) {
    setLoadingKey(signalType)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/mobile-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalType, familyCode, parentName, guardianName, guardianPhone, serviceArea, addressHint, pilotKey })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '신호 접수에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMessage(data.message || '신호가 접수되었습니다.')
      setDebug(JSON.stringify(data, null, 2))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '신호 접수 중 오류가 발생했습니다.')
    } finally {
      setLoadingKey('')
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F]">
      <section className="mx-auto max-w-md space-y-4">
        <header className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7]">
          <Link href="/mobile" className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-xs font-black text-[#2AA897]">
            ← 안부웍스 앱
          </Link>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em]">
            지금 상태를
            <br />
            보호자에게 알려주세요.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
            버튼을 누르면 보호자 알림과 운영실 사건 기록으로 연결됩니다. 응급상황은 반드시 119에 연락하세요.
          </p>

          {pilotKey ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              예비 실증 링크로 접속했습니다. 가족코드와 기본 정보가 자동 입력되었습니다.
            </div>
          ) : null}
        </header>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7]">
          <h2 className="text-xl font-black tracking-[-0.05em]">기본 정보</h2>

          <div className="mt-4 grid gap-3">
            <input value={familyCode} onChange={(event) => setFamilyCode(event.target.value)} placeholder="가족코드 예: 123456" className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold outline-none" />
            <input value={parentName} onChange={(event) => setParentName(event.target.value)} placeholder="부모님 이름" className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold outline-none" />
            <input value={guardianName} onChange={(event) => setGuardianName(event.target.value)} placeholder="보호자 이름" className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold outline-none" />
            <input value={guardianPhone} onChange={(event) => setGuardianPhone(phoneOnly(event.target.value))} inputMode="tel" placeholder="보호자 휴대폰 번호" className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold outline-none" />
            <input value={serviceArea} onChange={(event) => setServiceArea(event.target.value)} placeholder="권역 예: 청양읍" className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold outline-none" />
            <input value={addressHint} onChange={(event) => setAddressHint(event.target.value)} placeholder="주소 힌트, 선택" className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold outline-none" />
          </div>
        </section>

        <section className="space-y-3">
          {signals.map((signal) => (
            <button
              key={signal.key}
              onClick={() => submit(signal.key)}
              disabled={Boolean(loadingKey) || !familyCode}
              className={
                'w-full rounded-[2rem] p-5 text-left shadow-sm ring-1 transition disabled:opacity-50 ' +
                (signal.danger ? 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]' : 'bg-white/95 text-[#17443F] ring-[#D6EDE7]')
              }
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-current/10">
                  {signal.emoji}
                </div>
                <div>
                  <div className="text-2xl font-black tracking-[-0.06em]">{signal.title}</div>
                  <div className="mt-1 text-sm font-bold leading-6 opacity-75">{signal.desc}</div>
                </div>
              </div>

              {loadingKey === signal.key ? (
                <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-center text-sm font-black">보내는 중...</div>
              ) : null}
            </button>
          ))}
        </section>

        {message ? (
          <section className="rounded-[2rem] bg-[#EFFFFA] p-5 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
            {message}
          </section>
        ) : null}

        {debug ? (
          <details className="rounded-[2rem] bg-[#247A71] p-5 text-xs font-bold leading-6 text-white" open>
            <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
          </details>
        ) : null}

        <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
          생명 위협, 낙상, 의식저하, 호흡곤란, 심한 통증은 앱 버튼보다 먼저 119 또는 의료기관에 연락해야 합니다.
        </section>
      </section>
    </main>
  )
}

export default MobileParentSignalPanel
