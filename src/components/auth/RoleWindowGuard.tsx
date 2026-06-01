'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

function readParentCode() {
  if (typeof window === 'undefined') return ''

  const keys = [
    'anbu_family_code',
    'pc_parent_invite_code',
    'anbu_parent_code',
    'parent_family_code',
    'parent_invite_code'
  ]

  for (const key of keys) {
    const code = String(window.localStorage.getItem(key) || '').replace(/[^\d]/g, '').slice(0, 6)

    if (/^\d{6}$/.test(code)) return code
  }

  return ''
}

function hasGuardianSession() {
  if (typeof window === 'undefined') return false

  const role = window.localStorage.getItem('anbu_login_role')
  const auth = window.localStorage.getItem('anbu_auth_state')

  if (role === 'guardian') return true
  if (auth === 'signed-in') return true
  if (window.localStorage.getItem('anbu_guardian_profile')) return true
  if (window.localStorage.getItem('parents_care_auth')) return true

  return false
}

export function RoleWindowGuard() {
  const pathname = usePathname() || ''

  useEffect(() => {
    if (pathname !== '/login') return

    const parentCode = readParentCode()

    if (/^\d{6}$/.test(parentCode)) {
      window.location.replace('/parent/today')
      return
    }

    if (hasGuardianSession()) {
      window.location.replace('/child/dashboard')
    }
  }, [pathname])

  return null
}

export default RoleWindowGuard
