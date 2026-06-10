'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type SessionInfo = {
  accessToken: string
  email?: string
  phone?: string
}

function readSession(): SessionInfo | null {
  if (typeof window === 'undefined') return null

  const keys = Object.keys(window.localStorage)

  for (const key of keys) {
    if (!key.startsWith('sb-') || !key.endsWith('-auth-token')) continue

    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || '{}')
      const accessToken =
        parsed.access_token ||
        parsed.currentSession?.access_token ||
        parsed.session?.access_token

      const user =
        parsed.user ||
        parsed.currentSession?.user ||
        parsed.session?.user

      if (accessToken) {
        return {
          accessToken,
          email: user?.email,
          phone: user?.phone
        }
      }
    } catch {
      continue
    }
  }

  return null
}

function localRole() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('anbu_onboarding_role') || ''
}

function destinationForRole(role: string) {
  if (role === 'guardian') return '/guardian/today'
  if (role === 'parent') return '/mobile/parent'
  if (role === 'provider') return '/provider/urgent-requests'
  if (role === 'ops') return '/portal/ops'
  return '/auth/role?source=auth-redirect'
}

export function AuthRedirectPanel() {
  const [message, setMessage] = useState('로그인 정보를 확인하고 있습니다.')
  const [debug, setDebug] = useState('')

  useEffect(() => {
    async function run() {
      const session = readSession()

      if (!session?.accessToken) {
        const fallbackRole = localRole()

        if (fallbackRole) {
          setMessage('저장된 역할 기준으로 이동합니다.')
          window.location.replace(destinationForRole(fallbackRole))
          return
        }

        setMessage('로그인 세션을 찾지 못했습니다. 역할 선택 화면으로 이동합니다.')
        setTimeout(() => window.location.replace('/auth/role?source=no-session'), 700)
        return
      }

      try {
        const response = await fetch('/api/auth-role', {
          headers: {
            Authorization: 'Bearer ' + session.accessToken
          },
          cache: 'no-store'
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok || !data.ok) {
          setMessage(data.message || '역할 확인에 실패했습니다. 역할 선택 화면으로 이동합니다.')
          setDebug(JSON.stringify(data, null, 2))
          setTimeout(() => window.location.replace('/auth/role?source=role-check-failed'), 900)
          return
        }

        const role = data.user?.role || localRole() || 'unknown'
        const next = destinationForRole(role)

        setMessage(`${data.user?.roleLabel || role} 역할로 이동합니다.`)

        setTimeout(() => window.location.replace(next), 500)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '역할 확인 중 오류가 발생했습니다.')
        setTimeout(() => window.location.replace('/auth/role?source=redirect-error'), 900)
      }
    }

    run()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-2xl rounded-[2rem] bg-white/95 p-6 text-center shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFFFFA] text-3xl ring-1 ring-[#CDEFE7]">
          💚
        </div>

        <h1 className="mt-5 text-4xl font-black tracking-[-0.07em]">
          안부웍스로 이동 중입니다.
        </h1>

        <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
          {message}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/auth/role" className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
            역할 선택
          </Link>
          <Link href="/onboarding" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            시작 화면
          </Link>
          <Link href="/login" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            로그인
          </Link>
        </div>

        {debug ? (
          <details className="mt-5 rounded-2xl bg-[#247A71] p-4 text-left text-xs font-bold leading-6 text-white">
            <summary className="cursor-pointer text-sm font-black">상세 보기</summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
          </details>
        ) : null}
      </section>
    </main>
  )
}

export default AuthRedirectPanel
