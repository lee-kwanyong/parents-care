'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { normalizeParentCode } from '@/lib/parent-code'

export default function ParentLoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextCode = normalizeParentCode(code)

    if (nextCode.length !== 6) {
      setMessage('부모님 코드는 숫자 6자리입니다.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/parent-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: nextCode })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '부모님 코드 확인에 실패했습니다.')
      }

      router.push('/parent/today')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '부모님 코드 확인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F2FFFB_0%,#FFFFFF_58%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
      <section className="mx-auto max-w-md">
        <div className="rounded-[2rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8]">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            안부웍스 · 안부온
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.06em]">
            부모님 6자리 코드로
            <br />
            접속해주세요.
          </h1>

          <p className="mt-4 text-base font-bold leading-7 text-[#647C77]">
            보호자가 만든 6자리 숫자 코드를 입력하면 오늘 안부 체크 화면으로 이동합니다.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#55736E]">
                부모님 코드
              </span>
              <input
                value={code}
                onChange={(event) => setCode(normalizeParentCode(event.target.value))}
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="예: 123456"
                className="w-full rounded-[1.5rem] border border-[#D8EEE8] bg-[#FBFEFD] px-5 py-5 text-center text-3xl font-black tracking-[0.25em] text-[#173B36] outline-none transition focus:border-[#20C5A8] focus:ring-4 focus:ring-[#B5F1E3]"
              />
            </label>

            {message ? (
              <p className="rounded-2xl bg-[#FFF1F1] p-4 text-sm font-black leading-6 text-[#8A2525]">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[1.5rem] bg-[#123F38] px-6 py-5 text-xl font-black text-white shadow-sm disabled:opacity-60"
            >
              {loading ? '확인 중...' : '안부온 들어가기'}
            </button>
          </form>

          <div className="mt-5 grid gap-2">
            <Link
              href="/family-link"
              className="rounded-2xl bg-[#EFFFF9] px-5 py-4 text-center text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]"
            >
              부모님 연결 방법 보기
            </Link>
            <Link
              href="/signup/guardian"
              className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              보호자가 6자리 코드 만들기
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
