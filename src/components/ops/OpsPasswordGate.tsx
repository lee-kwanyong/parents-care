'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

export function OpsPasswordGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    if (pathname === '/ops/login') {
      setChecking(false)
      setAuthenticated(true)
      return
    }

    let alive = true

    async function check() {
      setChecking(true)

      try {
        const response = await fetch('/api/ops-auth', {
          cache: 'no-store'
        })
        const data = await response.json().catch(() => ({}))

        if (!alive) return

        if (data.authenticated) {
          setAuthenticated(true)
          setChecking(false)
          return
        }

        const next = window.location.pathname + window.location.search
        window.location.replace('/ops/login?next=' + encodeURIComponent(next))
      } catch {
        if (!alive) return
        const next = window.location.pathname + window.location.search
        window.location.replace('/ops/login?next=' + encodeURIComponent(next))
      }
    }

    check()

    return () => {
      alive = false
    }
  }, [pathname])

  async function logout() {
    await fetch('/api/ops-auth', { method: 'DELETE' }).catch(() => null)
    window.location.replace('/ops/login?next=/ops')
  }

  if (pathname === '/ops/login') {
    return <>{children}</>
  }

  if (checking || !authenticated) {
    return (
      <main className="min-h-[70vh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
        <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#D8EEE8]">
          <div className="text-2xl font-black tracking-[-0.05em]">운영실 인증 확인 중입니다.</div>
        </section>
      </main>
    )
  }

  return (
    <>
      <div className="border-b border-[#D8EEE8] bg-[#F8FCFB] px-4 py-2">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="text-xs font-black text-[#637B76]">운영실 인증 완료</div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            운영실 로그아웃
          </button>
        </div>
      </div>
      {children}
    </>
  )
}

export default OpsPasswordGate
