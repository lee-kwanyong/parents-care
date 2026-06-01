'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

function hasGuardianSession() {
  if (typeof window === 'undefined') return false

  const role = window.localStorage.getItem('anbu_login_role')
  const parentCode =
    window.localStorage.getItem('anbu_family_code') ||
    window.localStorage.getItem('pc_parent_invite_code') ||
    window.localStorage.getItem('anbu_parent_code') ||
    window.localStorage.getItem('parent_family_code') ||
    ''

  if (role === 'parent') return false
  if (/^\d{6}$/.test(parentCode)) return false
  if (role === 'guardian') return true
  if (window.localStorage.getItem('anbu_guardian_profile')) return true
  if (window.localStorage.getItem('parents_care_auth')) return true

  return false
}

export function AccountMenuButton() {
  const pathname = usePathname() || '/'
  const [visible, setVisible] = useState(false)

  function refresh() {
    if (pathname.startsWith('/parent') || pathname.startsWith('/child') || pathname.startsWith('/ops')) {
      setVisible(false)
      return
    }

    setVisible(hasGuardianSession())
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!visible) return null

  return (
    <Link
      href="/account"
      className="rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#173B36] ring-1 ring-[#BEEFE3] transition hover:bg-[#DFF7F0]"
    >
      회원정보
    </Link>
  )
}

export default AccountMenuButton
