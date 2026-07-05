'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Role = 'guardian' | 'parent'

type Agreements = {
  service: boolean
  privacy: boolean
  nonMedical: boolean
  emergency: boolean
  ringData: boolean
}

function initialFamilyCode() {
  if (typeof window === 'undefined') return ''

  const params = new URLSearchParams(window.location.search)

  return (
    params.get('familyCode') ||
    window.localStorage.getItem('anbu-guardian-family-code') ||
    window.localStorage.getItem('anbu-parent-family-code') ||
    ''
  )
}

function initialRole(): Role {
  if (typeof window === 'undefined') return 'guardian'

  const role = new URLSearchParams(window.location.search).get('role')

  return role === 'parent' ? 'parent' : 'guardian'
}

function saveFamilyCode(code: string) {
  if (typeof window === 'undefined' || !code) return
  window.localStorage.setItem('anbu-guardian-family-code', code)
  window.localStorage.setItem('anbu-parent-family-code', code)
}

export function ConsentFlowPanel() {
  const [familyCode, setFamilyCode] = useState('')
  const [role, setRole] = useState<Role>('guardian')
  const [agreements, setAgreements] = useState<Agreements>({
    service: false,
    privacy: false,
    nonMedical: false,
    emergency: false,
    ringData: false
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)

  const allAgreed = useMemo(() => Object.values(agreements).every(Boolean), [agreements])

  const nextHref = useMemo(() => {
    const code = encodeURIComponent(familyCode.trim())

    if (!code) return '/onboarding'

    return role === 'parent'
      ? `/mobile/parent?familyCode=${code}`
      : `/guardian/today?familyCode=${code}`
  }, [familyCode, role])

  function toggle(key: keyof Agreements) {
    setAgreements((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  function agreeAll() {
    setAgreements({
      service: true,
      privacy: true,
      nonMedical: true,
      emergency: true,
      ringData: true
    })
  }

  async function saveConsent() {
    const clean = familyCode.trim()

    if (!clean) {
      setMessage('가족코드를 먼저 입력해주세요.')
      return
    }

    if (!allAgreed) {
      setMessage('필수 동의 항목을 모두 확인해주세요.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/family-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          action: 'consent',
          familyCode: clean,
          role,
          agreed: true,
          items: agreements
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '동의 저장에 실패했습니다.')
        return
      }

      saveFamilyCode(clean)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`anbu-consent-${clean}-${role}`, 'true')
      }

      setDone(true)
      setMessage(result.persisted ? '동의가 저장되었습니다.' : '이 기기에 동의 상태를 저장했습니다. 서버 저장은 나중에 다시 확인하세요.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '동의 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    setFamilyCode(initialFamilyCode())
    setRole(initialRole())
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[2.5rem] bg-white/95 p-6 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7] sm:p-9">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
              실증 참여 동의
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              비의료 안부 참고 서비스
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
            시작 전에
            <br />
            꼭 확인해주세요.
          </h1>

          <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            안부웍스는 부모님의 생활 안부를 보호자가 참고할 수 있도록 돕는 비의료 서비스입니다.
            진단·치료·응급 판단을 대체하지 않습니다.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              value={familyCode}
              onChange={(event) => setFamilyCode(event.target.value.replace(/[^\w-]/g, '').slice(0, 32))}
              placeholder="가족코드 입력"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black outline-none"
            />

            <button
              onClick={() => setRole('guardian')}
              className={role === 'guardian'
                ? 'rounded-2xl bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]'
                : 'rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]'}
            >
              보호자
            </button>

            <button
              onClick={() => setRole('parent')}
              className={role === 'parent'
                ? 'rounded-2xl bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]'
                : 'rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]'}
            >
              부모님
            </button>
          </div>
        </section>

        {message ? (
          <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            {message}
          </section>
        ) : null}

        <section className="grid gap-4">
          {[
            ['service', '서비스 이용 동의', '부모님 안부 입력, 보호자 리포트, 대리입력, 안부리포트 참고 리포트 기능을 이용합니다.'],
            ['privacy', '개인정보 수집·이용 동의', '가족코드, 이름, 연락처, 안부 기록, 리포트 조회 정보를 서비스 제공 목적으로 처리합니다.'],
            ['nonMedical', '비의료 고지 확인', '안부웍스는 진단·치료·처방·응급 판단을 제공하지 않습니다. 리포트는 가족 안부 참고 정보입니다.'],
            ['emergency', '응급상황 안내 확인', '호흡곤란, 흉통, 의식저하, 낙상 등 응급상황이 의심되면 앱보다 먼저 119 또는 의료기관에 연락합니다.'],
            ['ringData', '안부리포트 참고 데이터 동의', '심박, HRV, SpO2, 체온, 수면, 활동, 착용, 배터리 등은 비의료 안부 참고 신호로만 사용합니다.']
          ].map(([key, title, desc]) => (
            <label
              key={key}
              className="flex cursor-pointer gap-4 rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7]"
            >
              <input
                type="checkbox"
                checked={agreements[key as keyof Agreements]}
                onChange={() => toggle(key as keyof Agreements)}
                className="mt-1 h-6 w-6 accent-[#2AA897]"
              />
              <span>
                <span className="block text-xl font-black tracking-[-0.05em]">{title}</span>
                <span className="mt-2 block text-sm font-bold leading-7 text-[#637B76]">{desc}</span>
              </span>
            </label>
          ))}
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={agreeAll}
            className="rounded-2xl bg-white px-5 py-5 text-base font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
          >
            전체 확인
          </button>

          <button
            onClick={saveConsent}
            disabled={saving || !allAgreed}
            className="rounded-2xl bg-[#EFFFFA] px-5 py-5 text-base font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
          >
            {saving ? '저장 중...' : '동의 저장'}
          </button>

          <Link
            href={done ? nextHref : '/onboarding'}
            className="rounded-2xl bg-white px-5 py-5 text-center text-base font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
          >
            {done ? '시작하기' : '가족코드 만들기'}
          </Link>
        </section>

        <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
          본 서비스는 비의료 안부 참고 서비스입니다. 의료진의 진단·치료·응급 판단을 대체하지 않습니다.
        </section>
      </section>
    </main>
  )
}

export default ConsentFlowPanel
