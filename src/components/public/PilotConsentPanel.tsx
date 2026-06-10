'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const requiredChecks = [
  {
    key: 'privacy',
    title: '개인정보 수집·이용에 동의합니다',
    desc: '부모님 이름, 가족코드, 보호자 연락처, 안부 신호, 문자 기록, 리포트 조회 기록이 실증 운영 목적으로 처리됩니다.'
  },
  {
    key: 'nonMedical',
    title: '비의료 서비스임을 확인했습니다',
    desc: '안부웍스는 의료 진단, 치료, 처방, 응급구조를 제공하지 않습니다.'
  },
  {
    key: 'emergency',
    title: '응급상황은 119 또는 의료기관에 연락해야 함을 확인했습니다',
    desc: '낙상, 의식저하, 호흡곤란, 심한 통증 등은 앱보다 먼저 119 또는 의료기관에 연락해야 합니다.'
  },
  {
    key: 'reportAccess',
    title: '리포트 열람 권한 구조를 확인했습니다',
    desc: '가족코드와 휴대폰 뒤 4자리로 리포트를 볼 수 있으므로 해당 정보를 안전하게 관리해야 합니다.'
  },
  {
    key: 'proxyRecord',
    title: '보호자·운영실 대리입력 기록에 동의합니다',
    desc: '부모님이 직접 앱을 누르지 못한 경우 보호자 또는 운영실이 전화 확인 후 대신 기록할 수 있습니다.'
  }
]

function phoneOnly(value: string) {
  return value.replace(/[^\d]/g, '')
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

export function PilotConsentPanel() {
  const params = useSearchParams()

  const [role, setRole] = useState('guardian')
  const [familyCode, setFamilyCode] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  const allChecked = useMemo(() => {
    return requiredChecks.every((item) => checks[item.key])
  }, [checks])

  useEffect(() => {
    setRole(params.get('role') || 'guardian')
    setFamilyCode(params.get('familyCode') || '')
    setName(params.get('name') || '')
    setPhone(phoneOnly(params.get('phone') || ''))
    setGuardianName(params.get('guardianName') || '')
    setGuardianPhone(phoneOnly(params.get('guardianPhone') || ''))
  }, [params])

  function toggle(key: string) {
    setChecks((previous) => ({
      ...previous,
      [key]: !previous[key]
    }))
  }

  async function submit() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const agreedItems = requiredChecks.filter((item) => checks[item.key]).map((item) => item.key)

      const response = await fetch('/api/consent-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          familyCode,
          name,
          phone,
          guardianName,
          guardianPhone,
          agreedItems,
          nonMedicalAcknowledged: checks.nonMedical,
          source: 'public-consent-page',
          path: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/consent'
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.ok) {
        setMessage(result.message || '동의 기록 저장에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        return
      }

      setCompleted(true)
      setMessage(result.message || '실증 참여 동의가 기록되었습니다.')
      setDebug(JSON.stringify(result, null, 2))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '동의 기록 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (completed) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
        <section className="mx-auto max-w-2xl rounded-[2rem] bg-white/95 p-6 text-center shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#EFFFFA] text-4xl ring-1 ring-[#CDEFE7]">
            ✅
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-[-0.07em]">동의가 기록되었습니다.</h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
            안부웍스 실증 참여 동의가 저장되었습니다. 이제 부모님 앱, 보호자 리포트, 대리입력 흐름을 사용할 수 있습니다.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/mobile/parent" className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
              부모님 앱 열기
            </Link>
            <Link href="/guardian/today" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              보호자 리포트
            </Link>
            <Link href="/onboarding" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              시작 화면
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            안부웍스 실증 참여 동의
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            실증 참여 전
            <br />
            동의 내용을 확인해주세요.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
            안부웍스는 부모님 안부 신호, 보호자 알림, 미응답 확인, 대리입력, 오늘 리포트 흐름을 검증하는 비의료 생활확인 실증입니다.
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            본 서비스는 의료 진단, 치료, 처방, 응급 구조를 대체하지 않습니다. 응급상황이 의심되면 즉시 119 또는 의료기관에 연락해야 합니다.
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">참여자 정보</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#637B76]">역할</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold outline-none"
              >
                <option value="guardian">보호자</option>
                <option value="parent">부모님</option>
                <option value="provider">생활확인 파트너</option>
              </select>
            </label>

            <Field label="가족코드, 선택" value={familyCode} onChange={setFamilyCode} placeholder="예: 123456" />
            <Field label="이름" value={name} onChange={setName} placeholder="이름" />
            <Field label="연락처" value={phone} onChange={(value) => setPhone(phoneOnly(value))} placeholder="01012345678" inputMode="tel" />
            <Field label="보호자 이름, 선택" value={guardianName} onChange={setGuardianName} placeholder="보호자 이름" />
            <Field label="보호자 연락처, 선택" value={guardianPhone} onChange={(value) => setGuardianPhone(phoneOnly(value))} placeholder="01012345678" inputMode="tel" />
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">필수 확인 항목</h2>

          <div className="mt-5 space-y-3">
            {requiredChecks.map((item) => (
              <button
                key={item.key}
                onClick={() => toggle(item.key)}
                className={
                  'w-full rounded-2xl p-4 text-left ring-1 transition ' +
                  (checks[item.key]
                    ? 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
                    : 'bg-[#FAFFFD] text-[#17443F] ring-[#D6EDE7]')
                }
              >
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black ring-1 ring-current/10">
                    {checks[item.key] ? '✓' : ''}
                  </div>
                  <div>
                    <div className="text-base font-black">{item.title}</div>
                    <p className="mt-1 text-sm font-bold leading-7 opacity-75">{item.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <button
            onClick={submit}
            disabled={loading || !allChecked}
            className="w-full rounded-2xl bg-[#247A71] px-5 py-5 text-base font-black text-white disabled:opacity-50"
          >
            {loading ? '저장 중' : '동의하고 실증 참여하기'}
          </button>

          {!allChecked ? (
            <p className="mt-3 text-center text-sm font-bold text-[#795C22]">
              필수 확인 항목을 모두 체크해야 저장할 수 있습니다.
            </p>
          ) : null}

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white">
              <summary className="cursor-pointer text-sm font-black">상세 결과 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>
      </section>
    </main>
  )
}

export default PilotConsentPanel
