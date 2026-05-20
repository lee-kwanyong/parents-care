'use client'

import { FormEvent, useState } from 'react'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

export function AdminLoginPanel() {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/session-lite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_login',
          code
        })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '운영실 접속 중 오류가 발생했습니다.')
      }

      window.location.href = '/ops'
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '운영실 접속 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CareCard tone="white">
      <div className="flex flex-wrap gap-2">
        <StatusPill text="운영실 Admin" tone="green" />
        <StatusPill text="관리자 전용" tone="slate" />
      </div>

      <h2 className="mt-4 text-3xl font-black">
        운영실 관리자 접속
      </h2>

      <p className="mt-2 text-sm font-bold leading-6 text-[#63807C]">
        접수, 매칭, 매니저 승인, 리포트, 정산 관리를 위한 별도 관리자 화면입니다.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="w-full rounded-2xl border border-[#E0EFEC] p-4 text-lg font-black outline-none focus:border-emerald-500"
          placeholder="관리자 코드"
        />

        {message ? (
          <div className="rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-3xl bg-[#193B38] px-6 py-5 text-xl font-black text-white disabled:opacity-60"
        >
          {saving ? '접속 중...' : '운영실 들어가기'}
        </button>
      </form>
    </CareCard>
  )
}
