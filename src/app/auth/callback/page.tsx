'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth-client'

function safeNext(value: string | null) {
  if (!value) return '/login'
  if (!value.startsWith('/')) return '/login'
  if (value.startsWith('//')) return '/login'
  return value
}

function withAuthDone(path: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}auth=done`
}

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('로그인 정보를 확인하는 중입니다...')

  useEffect(() => {
    async function run() {
      try {
        const supabase = createSupabaseBrowserClient()
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        const next = safeNext(url.searchParams.get('next'))

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }

        const { data } = await supabase.auth.getSession()
        const session = data.session

        if (session) {
          const provider = String(session.user.app_metadata?.provider || 'easy')

          await fetch('/api/auth/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + session.access_token
            },
            body: JSON.stringify({
              userRole: 'guardian',
              loginMethod: provider === 'google' || provider === 'kakao' ? provider : 'easy'
            })
          }).catch(() => null)

          setMessage('로그인이 완료됐습니다. 보호자 화면으로 이동합니다.')
          window.location.replace(withAuthDone(next))
          return
        }

        setMessage('로그인 세션을 확인하지 못했습니다. 다시 로그인해주세요.')
        window.location.replace('/login?auth=failed')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '로그인 처리 중 오류가 발생했습니다.')
      }
    }

    run()
  }, [])

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-10 text-[#24423F]">
      <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
        <div className="text-5xl">✅</div>
        <h1 className="mt-5 text-3xl font-black">로그인 처리</h1>
        <p className="mt-4 text-base font-bold leading-7 text-[#607D79]">{message}</p>
      </section>
    </main>
  )
}
