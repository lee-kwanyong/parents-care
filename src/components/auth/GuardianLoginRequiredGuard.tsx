'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

function hasGuardianSession() {
  if (typeof window === 'undefined') return false

  const role = window.localStorage.getItem('anbu_login_role')
  const authState = window.localStorage.getItem('anbu_auth_state')
  const guardianLoggedIn = window.localStorage.getItem('anbu_guardian_logged_in')

  if (role === 'guardian') return true
  if (authState === 'signed-in') return true
  if (guardianLoggedIn === 'true') return true
  if (window.localStorage.getItem('anbu_guardian_profile')) return true
  if (window.localStorage.getItem('parents_care_auth')) return true

  return false
}

function alertAndMove() {
  alert('부모님과 연결시 로그인이 필요해요 !')
  window.location.href = '/login?next=/family-link'
}

function isFamilyLinkUrl(href: string) {
  try {
    const url = new URL(href, window.location.origin)
    return url.pathname === '/family-link'
  } catch {
    return href === '/family-link'
  }
}

export function GuardianLoginRequiredGuard() {
  const pathname = usePathname() || '/'

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null

      if (!anchor) return
      if (!isFamilyLinkUrl(anchor.getAttribute('href') || '')) return
      if (hasGuardianSession()) return

      event.preventDefault()
      event.stopPropagation()
      alertAndMove()
    }

    document.addEventListener('click', onClick, true)

    return () => {
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  useEffect(() => {
    if (pathname !== '/family-link') return
    if (hasGuardianSession()) return

    const alreadyAlerted = window.sessionStorage.getItem('family-link-login-alerted')

    if (!alreadyAlerted) {
      window.sessionStorage.setItem('family-link-login-alerted', 'true')
      alert('부모님과 연결시 로그인이 필요해요 !')
    }

    window.location.replace('/login?next=/family-link')
  }, [pathname])

  return null
}

export default GuardianLoginRequiredGuard
