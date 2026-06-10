'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type Signal = {
  key: string
  emoji: string
  title: string
  shortTitle: string
  desc: string
  tone: 'safe' | 'warning' | 'urgent'
}

type SubmitResult = {
  ok: boolean
  message: string
  signalTitle: string
  signalKey: string
  requestId?: string
}

const signals: Signal[] = [
  {
    key: 'ok',
    emoji: '✅',
    title: '괜찮아요',
    shortTitle: '괜찮아요',
    desc: '오늘 상태가 괜찮으면 눌러주세요.',
    tone: 'safe'
  },
  {
    key: 'meal',
    emoji: '🍚',
    title: '밥을 못 먹었어요',
    shortTitle: '밥 못 먹음',
    desc: '식사를 못 했거나 도움이 필요하면 눌러주세요.',
    tone: 'warning'
  },
  {
    key: 'medication',
    emoji: '💊',
    title: '약을 못 먹었어요',
    shortTitle: '약 못 먹음',
    desc: '약을 못 먹었거나 확인이 필요하면 눌러주세요.',
    tone: 'warning'
  },
  {
    key: 'sick',
    emoji: '🤒',
    title: '몸이 아파요',
    shortTitle: '몸이 아파요',
    desc: '몸이 불편하거나 보호자 확인이 필요하면 눌러주세요.',
    tone: 'urgent'
  },
  {
    key: 'urgent',
    emoji: '🆘',
    title: '지금 도움이 필요해요',
    shortTitle: '도움 필요',
    desc: '지금 바로 보호자 확인이 필요하면 눌러주세요.',
    tone: 'urgent'
  }
]

function phoneOnly(value: string) {
  return value.replace(/[^\d]/g, '')
}

function toneButtonClass(tone: Signal['tone']) {
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
}

function toneSolidClass(tone: Signal['tone']) {
  if (tone === 'safe') return 'bg-[#247A71] text-white'
  if (tone === 'warning') return 'bg-[#C48722] text-white'
  return 'bg-[#B43C3C] text-white'
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

export function MobileParentSignalPanel() {
  const searchParams = useSearchParams()

  const [familyCode, setFamilyCode] = useState('')
  const [parentName, setParentName] = useState('부모님')
  const [parentPhone, setParentPhone] = useState('')
  const [guardianName, setGuardianName] = useState('보호자')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [serviceArea, setServiceArea] = useState('우리동네')
  const [addressHint, setAddressHint] = useState('')
  const [pilotKey, setPilotKey] = useState('')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loadingKey, setLoadingKey] = useState('')
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const hasRequiredInfo = Boolean(familyCode.trim())

  const selectedSignal = useMemo(() => {
    return signals.find((item) => item.key === result?.signalKey)
  }, [result])

  useEffect(() => {
    const nextFamilyCode = searchParams.get('familyCode') || ''
    const nextParentName = searchParams.get('parentName') || ''
    const nextParentPhone = searchParams.get('parentPhone') || ''
    const nextGuardianName = searchParams.get('guardianName') || ''
    const nextGuardianPhone = searchParams.get('guardianPhone') || ''
    const nextServiceArea = searchParams.get('serviceArea') || ''
    const nextAddressHint = searchParams.get('addressHint') || ''
    const nextPilotKey = searchParams.get('pilotKey') || ''

    const storedFamilyCode = typeof window !== 'undefined' ? localStorage.getItem('anbu_parent_family_code') || '' : ''
    const storedParentName = typeof window !== 'undefined' ? localStorage.getItem('anbu_parent_name') || '' : ''
    const storedParentPhone = typeof window !== 'undefined' ? localStorage.getItem('anbu_parent_phone') || '' : ''
    const storedGuardianName = typeof window !== 'undefined' ? localStorage.getItem('anbu_guardian_name') || '' : ''
    const storedGuardianPhone = typeof window !== 'undefined' ? localStorage.getItem('anbu_guardian_phone') || '' : ''
    const storedServiceArea = typeof window !== 'undefined' ? localStorage.getItem('anbu_service_area') || '' : ''
    const storedAddressHint = typeof window !== 'undefined' ? localStorage.getItem('anbu_address_hint') || '' : ''
    const storedPilotKey = typeof window !== 'undefined' ? localStorage.getItem('anbu_pilot_key') || '' : ''

    const finalFamilyCode = nextFamilyCode || storedFamilyCode
    const finalParentName = nextParentName || storedParentName
    const finalParentPhone = nextParentPhone || storedParentPhone
    const finalGuardianName = nextGuardianName || storedGuardianName
    const finalGuardianPhone = nextGuardianPhone || storedGuardianPhone
    const finalServiceArea = nextServiceArea || storedServiceArea
    const finalAddressHint = nextAddressHint || storedAddressHint
    const finalPilotKey = nextPilotKey || storedPilotKey

    if (finalFamilyCode) setFamilyCode(finalFamilyCode)
    if (finalParentName) setParentName(finalParentName)
    if (finalParentPhone) setParentPhone(phoneOnly(finalParentPhone))
    if (finalGuardianName) setGuardianName(finalGuardianName)
    if (finalGuardianPhone) setGuardianPhone(phoneOnly(finalGuardianPhone))
    if (finalServiceArea) setServiceArea(finalServiceArea)
    if (finalAddressHint) setAddressHint(finalAddressHint)
    if (finalPilotKey) setPilotKey(finalPilotKey)

    if (!finalFamilyCode) setShowSettings(true)
  }, [searchParams])

  function saveInfo() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('anbu_parent_family_code', familyCode)
      localStorage.setItem('anbu_parent_name', parentName)
      localStorage.setItem('anbu_parent_phone', parentPhone)
      localStorage.setItem('anbu_guardian_name', guardianName)
      localStorage.setItem('anbu_guardian_phone', guardianPhone)
      localStorage.setItem('anbu_service_area', serviceArea)
      localStorage.setItem('anbu_address_hint', addressHint)
      localStorage.setItem('anbu_pilot_key', pilotKey)
    }

    setMessage('기본 정보가 저장되었습니다. 이제 아래 큰 버튼으로 안부를 보낼 수 있습니다.')
    setShowSettings(false)
  }

  async function submit(signal: Signal) {
    if (!familyCode.trim()) {
      setShowSettings(true)
      setMessage('가족코드가 필요합니다. 기본 정보를 먼저 확인해주세요.')
      return
    }

    saveInfo()
    setLoadingKey(signal.key)
    setMessage('')
    setDebug('')
    setResult(null)

    try {
      const response = await fetch('/api/mobile-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signalType: signal.key,
          familyCode,
          parentName,
          parentPhone,
          guardianName,
          guardianPhone,
          serviceArea,
          addressHint,
          pilotKey
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '안부 전송에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setResult({
        ok: true,
        message: data.message || '안부가 보호자에게 전달되었습니다.',
        signalTitle: signal.title,
        signalKey: signal.key,
        requestId: data.request?.id
      })
      setMessage(data.message || '안부가 접수되었습니다.')
      setDebug(JSON.stringify(data, null, 2))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '안부 전송 중 오류가 발생했습니다.')
    } finally {
      setLoadingKey('')
    }
  }

  if (result && selectedSignal) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F]">
        <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-md flex-col justify-center space-y-4">
          <section className={'rounded-[2rem] p-6 text-center shadow-sm ring-1 ' + toneButtonClass(selectedSignal.tone)}>
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white text-5xl shadow-sm ring-1 ring-current/10">
              {selectedSignal.emoji}
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-[-0.08em]">
              전송 완료
            </h1>

            <p className="mt-4 text-2xl font-black tracking-[-0.06em]">
              {result.signalTitle}
            </p>

            <p className="mt-4 text-base font-bold leading-8 opacity-80">
              {result.message}
            </p>
          </section>

          {selectedSignal.tone === 'urgent' ? (
            <section className="rounded-[2rem] bg-[#FFF4F4] p-5 text-sm font-black leading-7 text-[#8A3030] ring-1 ring-[#F3C8C8]">
              몸이 많이 아프거나 낙상, 호흡곤란, 의식저하, 심한 통증이 있으면 앱보다 먼저 119 또는 의료기관에 연락해주세요.
            </section>
          ) : (
            <section className="rounded-[2rem] bg-[#EFFFFA] p-5 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              보호자가 확인할 수 있도록 기록되었습니다.
            </section>
          )}

          <button
            onClick={() => {
              setResult(null)
              setMessage('')
            }}
            className="rounded-2xl bg-[#247A71] px-5 py-5 text-base font-black text-white"
          >
            다른 안부 보내기
          </button>

          <Link href="/mobile" className="rounded-2xl bg-white px-5 py-5 text-center text-base font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            앱 홈으로
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F]">
      <section className="mx-auto max-w-md space-y-4">
        <header className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7]">
          <div className="flex items-center justify-between gap-3">
            <Link href="/mobile" className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-xs font-black text-[#2AA897]">
              안부웍스 앱
            </Link>

            {familyCode ? (
              <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                코드 {familyCode}
              </span>
            ) : null}
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em]">
            오늘 상태를
            <br />
            눌러주세요.
          </h1>

          <p className="mt-4 text-base font-bold leading-8 text-[#637B76]">
            괜찮으면 초록 버튼을 누르고, 불편하면 해당 버튼을 눌러 보호자에게 알려주세요.
          </p>

          {pilotKey ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              예비 실증 링크로 접속했습니다. 기본 정보가 자동 입력되었습니다.
            </div>
          ) : null}
        </header>

        {!hasRequiredInfo || showSettings ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-[-0.06em]">기본 정보 확인</h2>
                <p className="mt-1 text-sm font-bold leading-6 text-[#637B76]">
                  처음 한 번만 확인하면 됩니다.
                </p>
              </div>

              {hasRequiredInfo ? (
                <button
                  onClick={() => setShowSettings(false)}
                  className="rounded-xl bg-[#FAFFFD] px-3 py-2 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  닫기
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3">
              <Field label="가족코드" value={familyCode} onChange={setFamilyCode} placeholder="예: 123456" />
              <Field label="부모님 이름" value={parentName} onChange={setParentName} placeholder="부모님 이름" />
              <Field label="부모님 휴대폰, 선택" value={parentPhone} onChange={(value) => setParentPhone(phoneOnly(value))} placeholder="선택" inputMode="tel" />
              <Field label="보호자 이름" value={guardianName} onChange={setGuardianName} placeholder="보호자 이름" />
              <Field label="보호자 휴대폰" value={guardianPhone} onChange={(value) => setGuardianPhone(phoneOnly(value))} placeholder="예: 01012345678" inputMode="tel" />
              <Field label="권역" value={serviceArea} onChange={setServiceArea} placeholder="예: 청양읍" />
              <Field label="주소 힌트, 선택" value={addressHint} onChange={setAddressHint} placeholder="선택" />

              <button
                onClick={saveInfo}
                className="rounded-2xl bg-[#247A71] px-5 py-4 text-base font-black text-white"
              >
                기본 정보 저장
              </button>
            </div>
          </section>
        ) : (
          <button
            onClick={() => setShowSettings(true)}
            className="w-full rounded-2xl bg-white/95 px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
          >
            기본 정보 수정하기
          </button>
        )}

        <section className="grid gap-3">
          {signals.map((signal, index) => (
            <button
              key={signal.key}
              onClick={() => submit(signal)}
              disabled={Boolean(loadingKey) || !hasRequiredInfo}
              className={
                'w-full rounded-[2rem] p-5 text-left shadow-sm ring-1 transition active:scale-[0.99] disabled:opacity-50 ' +
                (index === 0 ? toneSolidClass(signal.tone) : toneButtonClass(signal.tone))
              }
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm ring-1 ring-current/10">
                  {signal.emoji}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-black tracking-[-0.06em]">{signal.title}</div>
                  <div className="mt-1 text-sm font-bold leading-6 opacity-75">{signal.desc}</div>
                </div>
              </div>

              {loadingKey === signal.key ? (
                <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-center text-sm font-black text-[#17443F]">
                  보내는 중...
                </div>
              ) : null}
            </button>
          ))}
        </section>

        {message ? (
          <section className="rounded-[2rem] bg-[#EFFFFA] p-5 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
            {message}
          </section>
        ) : null}

        <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
          응급상황이면 앱 버튼보다 먼저 119 또는 의료기관에 연락해주세요.
        </section>

        {searchParams.get('debug') === '1' && debug ? (
          <details className="rounded-[2rem] bg-[#247A71] p-5 text-xs font-bold leading-6 text-white">
            <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
          </details>
        ) : null}
      </section>
    </main>
  )
}

export default MobileParentSignalPanel
