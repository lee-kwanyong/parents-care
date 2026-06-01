'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

function hasSession() {
  if (typeof window === 'undefined') return false

  const role = window.localStorage.getItem('anbu_login_role')
  const auth = window.localStorage.getItem('anbu_auth_state')
  const parentCode =
    window.localStorage.getItem('anbu_family_code') ||
    window.localStorage.getItem('pc_parent_invite_code') ||
    window.localStorage.getItem('anbu_parent_code') ||
    window.localStorage.getItem('parent_family_code') ||
    ''

  if (role === 'parent' || role === 'guardian') return true
  if (auth === 'signed-in' || auth === 'parent-signed-in') return true
  if (/^\d{6}$/.test(parentCode)) return true

  if (window.localStorage.getItem('anbu_guardian_profile')) return true
  if (window.localStorage.getItem('anbu_parent_session')) return true

  return false
}

function shouldHide(pathname: string) {
  const path = pathname || '/'
  if (path === '/login') return true
  if (path === '/account') return true

  return (
    path.startsWith('/signup') ||
    path.startsWith('/parent') ||
    path.startsWith('/child') ||
    path.startsWith('/ops') ||
    path.startsWith('/family-link') ||
    path.startsWith('/care')
  )
}

export function MobileLoginButton() {
  const pathname = usePathname() || '/'
  const [ready, setReady] = useState(false)
  const [logged, setLogged] = useState(false)

  function refresh() {
    setLogged(hasSession())
    setReady(true)
  }

  useEffect(() => {
    refresh()

    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('anbu-auth-changed', refresh)
    window.addEventListener('anbu-parent-session-changed', refresh)

    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('anbu-auth-changed', refresh)
      window.removeEventListener('anbu-parent-session-changed', refresh)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [pathname])

  if (!ready) return null
  if (logged) return null
  if (shouldHide(pathname)) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-3 z-[80] px-4 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="pointer-events-auto mx-auto max-w-sm rounded-[1.4rem] bg-white/95 p-2 shadow-[0_12px_35px_rgba(20,82,70,0.18)] ring-1 ring-[#D8EEE8] backdrop-blur">
        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-[1.1rem] bg-[#193B38] px-5 py-4 text-base font-black text-white"
        >
          로그인 / 회원가입
        </Link>
      </div>
    </div>
  )
}

export default MobileLoginButton
