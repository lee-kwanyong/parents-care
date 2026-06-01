'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { readParentCode } from '@/components/auth/ParentSessionBridge'

function hasGuardianSession() {
  if (typeof window === 'undefined') return false

  const role = window.localStorage.getItem('anbu_login_role')
  const auth = window.localStorage.getItem('anbu_auth_state')

  if (role === 'guardian' || auth === 'signed-in') return true
  if (window.localStorage.getItem('anbu_guardian_profile')) return true
  if (window.localStorage.getItem('parents_care_auth')) return true

  return false
}

export function RoleAwareLoginPage() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const parentCode = readParentCode()

    if (/^\d{6}$/.test(parentCode)) {
      window.location.replace('/parent/today')
      return
    }

    if (hasGuardianSession()) {
      window.location.replace('/child/dashboard')
      return
    }

    setReady(true)
  }, [])

  if (!ready) {
    return (
      <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
        <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#D8EEE8]">
          <div className="text-2xl font-black">역할 확인 중입니다.</div>
        </section>
      </main>
    )
  }

  const cards = [
    {
      emoji: '👨‍👩‍👧‍👦',
      title: '보호자 회원가입',
      desc: '이메일 또는 Google/Kakao로 가입하고 부모님 연결코드를 만듭니다.',
      href: '/signup/guardian'
    },
    {
      emoji: '👵',
      title: '부모님 6자리 접속',
      desc: '자녀가 알려준 6자리 코드로 부모님 안부 화면에 들어갑니다.',
      href: '/parent/login'
    },
    {
      emoji: '🧑‍⚕️',
      title: '케어파트너 지원',
      desc: '검증 후 부모님 안심케어 매칭 후보로 등록됩니다.',
      href: '/care-partner/apply'
    },
    {
      emoji: '🧭',
      title: '운영실 Admin',
      desc: '접수, 매칭, 리포트 검수를 관리하는 관리자 화면입니다.',
      href: '/ops/login'
    }
  ]

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-4 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
        <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <h1 className="text-3xl font-black tracking-[-0.07em] sm:text-5xl">
            로그인·회원가입
          </h1>
          <p className="mt-3 text-sm font-bold leading-7 text-[#637B76] sm:mt-4 sm:text-base">
            역할에 맞는 화면으로 시작하세요.
          </p>
        </section>

        <section className="grid gap-3 sm:gap-5 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="block rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] transition hover:-translate-y-1 hover:bg-[#F8FFFC] hover:shadow-[0_18px_44px_rgba(20,82,70,0.10)] sm:rounded-[2rem] sm:p-6"
            >
              <div className="text-3xl sm:text-4xl">{card.emoji}</div>
              <h3 className="mt-4 text-xl font-black tracking-[-0.05em] sm:mt-5 sm:text-2xl">
                {card.title}
              </h3>
              <p className="mt-2 text-sm font-bold leading-6 text-[#637B76] sm:mt-3 sm:leading-7">
                {card.desc}
              </p>
            </Link>
          ))}
        </section>
      </section>
    </main>
  )
}

export default RoleAwareLoginPage
