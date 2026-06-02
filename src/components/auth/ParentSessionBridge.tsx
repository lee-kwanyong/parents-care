'use client'

export type ParentSession = {
  familyCode: string
  parentName?: string
  parentPhone?: string
  guardianName?: string
  guardianPhone?: string
  role?: string
  loggedIn?: boolean
  connected?: boolean
  verified?: boolean
}

function code6(value: string | null | undefined) {
  return String(value || '').replace(/[^\d]/g, '').slice(0, 6)
}

function setCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 90) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : ''
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`
}

export function saveParentSession(session: ParentSession) {
  if (typeof window === 'undefined') return

  const familyCode = code6(session.familyCode)

  if (!/^\d{6}$/.test(familyCode)) return

  const payload = {
    ...session,
    familyCode,
    parentName: session.parentName || '부모님',
    guardianName: session.guardianName || '보호자',
    role: 'parent',
    loggedIn: true,
    connected: true,
    verified: true,
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
  window.localStorage.setItem('anbu_parent_verified', 'true')
  window.localStorage.setItem('anbu_parent_session', raw)
  window.localStorage.setItem('parents_care_parent_session', raw)

  setCookie('anbu_family_code', familyCode)
  setCookie('pc_parent_invite_code', familyCode)
  setCookie('anbu_parent_code', familyCode)
  setCookie('parent_family_code', familyCode)
  setCookie('parent_invite_code', familyCode)
  setCookie('anbu_login_role', 'parent')
  setCookie('anbu_parent_connected', 'true')
  setCookie('anbu_parent_verified', 'true')
  setCookie('anbu_parent_session', raw)

  window.dispatchEvent(new CustomEvent('anbu-parent-session-changed', { detail: payload }))
  window.dispatchEvent(new CustomEvent('anbu-auth-changed', { detail: payload }))
}

export function readParentSession(): ParentSession | null {
  if (typeof window === 'undefined') return null

  const verified =
    window.localStorage.getItem('anbu_parent_verified') === 'true' ||
    getCookie('anbu_parent_verified') === 'true'

  if (!verified) return null

  const raw =
    window.localStorage.getItem('anbu_parent_session') ||
    window.localStorage.getItem('parents_care_parent_session') ||
    getCookie('anbu_parent_session')

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ParentSession
      const familyCode = code6(parsed.familyCode)

      if (/^\d{6}$/.test(familyCode)) {
        return {
          ...parsed,
          familyCode,
          role: 'parent',
          loggedIn: true,
          connected: true,
          verified: true
        }
      }
    } catch {
      // ignore
    }
  }

  const keys = [
    'anbu_family_code',
    'pc_parent_invite_code',
    'anbu_parent_code',
    'parent_family_code',
    'parent_invite_code',
    'parent_link_code'
  ]

  for (const key of keys) {
    const code = code6(window.localStorage.getItem(key) || getCookie(key))

    if (/^\d{6}$/.test(code)) {
      return {
        familyCode: code,
        parentName: '부모님',
        guardianName: '보호자',
        role: 'parent',
        loggedIn: true,
        connected: true,
        verified: true
      }
    }
  }

  return null
}

export function readParentCode() {
  return readParentSession()?.familyCode || ''
}

export function clearParentSessionStorage() {
  if (typeof window === 'undefined') return

  const keys = [
    'anbu_family_code',
    'pc_parent_invite_code',
    'anbu_parent_code',
    'parent_family_code',
    'parent_invite_code',
    'parent_link_code',
    'anbu_login_role',
    'anbu_auth_state',
    'anbu_parent_logged_in',
    'anbu_parent_connected',
    'anbu_parent_verified',
    'anbu_parent_session',
    'parents_care_parent_session'
  ]

  for (const key of keys) {
    window.localStorage.removeItem(key)
    clearCookie(key)
  }

  window.dispatchEvent(new CustomEvent('anbu-parent-session-changed'))
  window.dispatchEvent(new CustomEvent('anbu-auth-changed'))
}

export function ParentSessionBridge() {
  return null
}

export default ParentSessionBridge
