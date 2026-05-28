'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export function AnbuOpsLogin() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/ops/dashboard'

  const [accessCode, setAccessCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const response = await fetch('/api/ops-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessCode })
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok || !data.ok) {
      setMessage(data.message || '운영실 로그인에 실패했습니다.')
      setLoading(false)
      return
    }

    window.location.href = next
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-md space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            안부웍스 운영실
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em]">
            운영실 접근코드를 입력하세요.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
            안부 위험신호, 케어 요청, 파트너 승인, 리포트 검수 화면은 운영실 로그인 후 접근할 수 있습니다.
          </p>

          <form onSubmit={login} className="mt-6 space-y-4">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#55736E]">6자리 운영실 코드</span>
              <input
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="예: 123456"
                className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-center text-3xl font-black tracking-[0.18em] outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />
            </label>

            {message ? (
              <div className="rounded-2xl bg-[#FFF1F1] p-4 text-sm font-black text-[#8A2525] ring-1 ring-[#F3BBBB]">
                {message}
              </div>
            ) : null}

            <button
              disabled={loading || accessCode.length !== 6}
              className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:bg-[#9FB8B3]"
            >
              {loading ? '확인 중...' : '운영실 들어가기'}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] bg-[#FFF8E8] p-5 text-sm font-bold leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
          운영실 코드는 외부에 공유하지 마세요. 코드가 노출되면 다시 생성해서 Vercel 환경변수에 교체해야 합니다.
        </section>

        <div className="text-center">
          <Link href="/" className="text-sm font-black text-[#11977F]">
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  )
}
