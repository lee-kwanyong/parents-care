'use client'

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function setCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 90) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'parents-care-auth'
    }
  })
}

type GuardianInput = {
  id?: string
  email?: string
  name?: string
  phone?: string
  provider?: string
}

export function saveGuardianSession(input: GuardianInput) {
  if (typeof window === 'undefined') return

  const profile = {
    role: 'guardian',
    loggedIn: true,
    guardianId: input.id || '',
    guardianEmail: input.email || '',
    guardianName: input.name || '보호자',
    guardianPhone: input.phone || '',
    provider: input.provider || 'email',
    savedAt: new Date().toISOString()
  }

  window.localStorage.setItem('anbu_login_role', 'guardian')
  window.localStorage.setItem('anbu_auth_state', 'signed-in')
  window.localStorage.setItem('anbu_guardian_logged_in', 'true')
  window.localStorage.setItem('anbu_guardian_profile', JSON.stringify(profile))
  window.localStorage.setItem('anbu_current_user', JSON.stringify(profile))
  window.localStorage.setItem('parents_care_auth', JSON.stringify(profile))

  setCookie('anbu_login_role', 'guardian')
  setCookie('anbu_guardian_logged_in', 'true')
  setCookie('anbu_guardian_profile', JSON.stringify(profile))

  window.dispatchEvent(new CustomEvent('anbu-auth-changed', { detail: profile }))
}

function userNameFromMetadata(metadata: Record<string, unknown>) {
  const name =
    typeof metadata.name === 'string'
      ? metadata.name
      : typeof metadata.full_name === 'string'
        ? metadata.full_name
        : typeof metadata.guardian_name === 'string'
          ? metadata.guardian_name
          : ''

  return name || '보호자'
}

export function AnbuAuthPersistence() {
  useEffect(() => {
    const supabaseClient = getSupabase()

    if (!supabaseClient) return

    let alive = true
    const client = supabaseClient

    async function sync() {
      const { data } = await client.auth.getSession()

      if (!alive) return

      const user = data.session?.user

      if (!user) return

      const metadata = (user.user_metadata || {}) as Record<string, unknown>

      saveGuardianSession({
        id: user.id,
        email: user.email || '',
        name: userNameFromMetadata(metadata),
        phone: typeof metadata.guardian_phone === 'string' ? metadata.guardian_phone : '',
        provider: typeof user.app_metadata?.provider === 'string' ? user.app_metadata.provider : 'email'
      })
    }

    void sync()

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user

      if (!user) return

      const metadata = (user.user_metadata || {}) as Record<string, unknown>

      saveGuardianSession({
        id: user.id,
        email: user.email || '',
        name: userNameFromMetadata(metadata),
        phone: typeof metadata.guardian_phone === 'string' ? metadata.guardian_phone : '',
        provider: typeof user.app_metadata?.provider === 'string' ? user.app_metadata.provider : 'email'
      })
    })

    return () => {
      alive = false
      data.subscription.unsubscribe()
    }
  }, [])

  return null
}

export default AnbuAuthPersistence
