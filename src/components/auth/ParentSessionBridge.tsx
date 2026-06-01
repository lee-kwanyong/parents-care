'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export type ParentSession = {
  familyCode: string
  parentName?: string
  parentPhone?: string
  guardianName?: string
  guardianPhone?: string
  role?: string
  loggedIn?: boolean
  connected?: boolean
}

function code6(value: string | null | undefined) {
  return String(value || '').replace(/[^\d]/g, '').slice(0, 6)
}

function setCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 90) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : ''
}

export function saveParentSession(session: ParentSession) {
  const familyCode = code6(session.familyCode)
  if (!/^\d{6}$/.test(familyCode)) return

  const payload = {
    ...session,
    familyCode,
    role: 'parent',
    loggedIn: true,
    connected: true,
    savedAt: new Date().toISOString()
  }

  const raw = JSON.stringify(payload)

  window.localStorage.setItem('anbu_family_code', familyCode)
  window.localStorage.setItem('pc_parent_invite_code', familyCode)
  window.localStorage.setItem('anbu_parent_code', familyCode)
  window.localStorage.setItem('parent_family_code', familyCode)
  window.localStorage.setItem('parent_invite_code', familyCode)
  window.localStorage.setItem('parent_link_code', familyCode)
  window.localStorage.setItem('anbu_login_role', 'parent')
  window.localStorage.setItem('anbu_auth_state', 'parent-signed-in')
  window.localStorage.setItem('anbu_parent_logged_in', 'true')
  window.localStorage.setItem('anbu_parent_connected', 'true')
  window.localStorage.setItem('anbu_parent_session', raw)
  window.localStorage.setItem('parents_care_parent_session', raw)

  setCookie('anbu_family_code', familyCode)
  setCookie('pc_parent_invite_code', familyCode)
  setCookie('anbu_parent_code', familyCode)
  setCookie('parent_family_code', familyCode)
  setCookie('parent_invite_code', familyCode)
  setCookie('anbu_login_role', 'parent')
  setCookie('anbu_parent_connected', 'true')
  setCookie('anbu_parent_session', raw)

  window.dispatchEvent(new CustomEvent('anbu-parent-session-changed', { detail: payload }))
  window.dispatchEvent(new CustomEvent('anbu-auth-changed', { detail: payload }))
}

export function readParentCode() {
  if (typeof window === 'undefined') return ''

  const keys = [
    'anbu_family_code',
    'pc_parent_invite_code',
    'anbu_parent_code',
    'parent_family_code',
    'parent_invite_code',
    'parent_link_code'
  ]

  for (const key of keys) {
    const code = code6(window.localStorage.getItem(key))
    if (/^\d{6}$/.test(code)) return code
  }

  for (const key of keys) {
    const code = code6(getCookie(key))
    if (/^\d{6}$/.test(code)) return code
  }

  return ''
}

async function refreshParentSession() {
  const code = readParentCode()

  if (code) {
    saveParentSession({ familyCode: code })
  }

  try {
    const url = code
      ? '/api/parent-session?familyCode=' + encodeURIComponent(code)
      : '/api/parent-session'

    const response = await fetch(url, { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))

    if (response.ok && data.ok && data.session) {
      saveParentSession(data.session)
    }
  } catch {
    // 조용히 실패
  }
}

export function ParentSessionBridge() {
  const pathname = usePathname() || ''

  useEffect(() => {
    refreshParentSession()

    function onChanged() {
      refreshParentSession()
    }

    window.addEventListener('anbu-parent-session-changed', onChanged)
    window.addEventListener('storage', onChanged)
    window.addEventListener('focus', onChanged)

    return () => {
      window.removeEventListener('anbu-parent-session-changed', onChanged)
      window.removeEventListener('storage', onChanged)
      window.removeEventListener('focus', onChanged)
    }
  }, [])

  useEffect(() => {
    if (pathname.startsWith('/parent')) {
      refreshParentSession()
    }
  }, [pathname])

  return null
}

export default ParentSessionBridge
