'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

function getCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : ''
}

function hasVerifiedParentSession() {
  if (typeof window === 'undefined') return false

  const verified =
    window.localStorage.getItem('anbu_parent_verified') === 'true' ||
    getCookie('anbu_parent_verified') === 'true'

  if (!verified) return false

  const role = window.localStorage.getItem('anbu_login_role')
  const authState = window.localStorage.getItem('anbu_auth_state')
  const connected = window.localStorage.getItem('anbu_parent_connected')

  return role === 'parent' || authState === 'parent-signed-in' || connected === 'true'
}

function isParentAllowedPath(pathname: string) {
  if (pathname.startsWith('/parent')) return true
  if (pathname.startsWith('/install')) return true
  if (pathname.startsWith('/api')) return true
  if (pathname.startsWith('/_next')) return true

  return false
}

export function ParentOnlyGuard() {
  const pathname = usePathname() || '/'

  useEffect(() => {
    if (!hasVerifiedParentSession()) return
    if (isParentAllowedPath(pathname)) return

    window.location.replace('/parent/today')
  }, [pathname])

  return null
}

export default ParentOnlyGuard
