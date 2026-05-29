'use client'

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  })
}

function saveGuardianSession(user: any, provider = 'oauth') {
  const email = user?.email || ''
  const name =
    user?.user_metadata?.guardian_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    email?.split('@')?.[0] ||
    '보호자'

  const phone = user?.user_metadata?.guardian_phone || user?.phone || ''

  const profile = {
    id: user?.id || '',
    guardianName: name,
    guardianEmail: email,
    guardianPhone: phone,
    role: 'guardian',
    authProvider: provider,
    loggedIn: true,
    createdAt: new Date().toISOString()
  }

  window.localStorage.setItem('anbu_guardian_profile', JSON.stringify(profile))
  window.localStorage.setItem('anbu_login_role', 'guardian')
  window.localStorage.setItem('anbu_auth_state', 'signed-in')
  window.localStorage.setItem('parents_care_auth', JSON.stringify(profile))
  window.localStorage.setItem('anbu_current_user', JSON.stringify(profile))

  document.cookie = `anbu_login_role=guardian; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`

  if (email) {
    document.cookie = `anbu_guardian_email=${encodeURIComponent(email)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
  }

  window.dispatchEvent(new CustomEvent('anbu-auth-changed', { detail: profile }))

  return profile
}

export function AuthSessionBridge() {
  useEffect(() => {
    async function run() {
      const supabase = getSupabase()
      if (!supabase) return

      const url = new URL(window.location.href)
      const params = url.searchParams
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))

      const code = params.get('code')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const hasOAuthPayload = Boolean(code || accessToken || refreshToken)

      try {
        if (hasOAuthPayload) {
          if (code) {
            await supabase.auth.exchangeCodeForSession(code)
          } else if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
          }
        }

        const { data } = await supabase.auth.getSession()
        const user = data.session?.user

        if (user) {
          const provider =
            user.app_metadata?.provider ||
            window.localStorage.getItem('anbu_oauth_provider') ||
            'oauth'

          saveGuardianSession(user, provider)

          if (hasOAuthPayload) {
            const next = window.localStorage.getItem('anbu_oauth_next') || '/family-link'
            window.localStorage.removeItem('anbu_oauth_next')
            window.localStorage.removeItem('anbu_oauth_provider')
            window.location.replace(next)
          }
        }
      } catch {
        // 조용히 유지
      }
    }

    run()
  }, [])

  return null
}
