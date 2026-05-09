'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth-client'
import { CareCard } from '@/components/ui/CareCard'

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('로그인을 확인하는 중입니다...')

  useEffect(() => {
    async function finish() {
      const supabase = createSupabaseBrowserClient()
      const code = searchParams.get('code')
      const next = searchParams.get('next') || '/child'

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }

        const { data } = await supabase.auth.getSession()

        if (data.session?.access_token) {
          await fetch('/api/auth/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + data.session.access_token
            },
            body: JSON.stringify({
              loginMethod: 'easy'
            })
          })
        }

        setMessage('로그인이 완료됐습니다. 화면으로 이동합니다.')
        router.replace(next)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '로그인 처리 중 오류가 발생했습니다.')
      }
    }

    finish()
  }, [router, searchParams])

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <section className="mx-auto max-w-xl">
        <CareCard tone="green">
          <h1 className="text-3xl font-black">로그인 확인</h1>
          <p className="mt-4 text-lg font-bold leading-8">{message}</p>
        </CareCard>
      </section>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>로그인 확인 중...</div>}>
      <AuthCallbackInner />
    </Suspense>
  )
}
