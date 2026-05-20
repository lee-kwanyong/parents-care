'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

export function ParentCodeLoginPanel() {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/parent-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parent_login',
          code
        })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '접속 중 오류가 발생했습니다.')
      }

      window.location.href = result.home || '/parent/today'
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '접속 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CareCard tone="green">
      <div className="flex flex-wrap gap-2">
        <StatusPill text="부모님 전용" tone="green" />
        <StatusPill text="회원가입 없음" tone="slate" />
      </div>

      <h2 className="mt-4 text-4xl font-black tracking-[-0.05em]">
        4자리 코드만
        <br />
        입력하세요.
      </h2>

      <p className="mt-3 text-base font-bold leading-7 text-[#4E6D69]">
        자녀가 보내준 4자리 숫자만 입력하면 부모님 안심 화면으로 바로 연결됩니다.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          className="w-full rounded-[2rem] border border-[#CFE7E2] bg-white p-6 text-center text-6xl font-black tracking-[0.35em] outline-none focus:border-[#19B99A]"
          placeholder="2580"
        />

        {message ? (
          <div className="rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-3xl bg-[#19B99A] px-6 py-5 text-xl font-black text-white shadow-[0_18px_45px_rgba(25,185,154,0.25)] disabled:opacity-60"
        >
          {saving ? '접속 중...' : '부모님 안심 열기'}
        </button>
      </form>

      <Link
        href="/app"
        className="mt-4 block rounded-3xl bg-white px-6 py-5 text-center text-lg font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
      >
        다른 화면 선택하기
      </Link>
    </CareCard>
  )
}
