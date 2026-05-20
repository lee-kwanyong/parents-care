'use client'

import { FormEvent, useState } from 'react'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

function safeNext(value: string | null) {
  if (!value) return '/ops'
  if (!value.startsWith('/')) return '/ops'
  if (value.startsWith('//')) return '/ops'
  if (value === '/admin' || value.startsWith('/admin?')) return '/ops'

  return value
}

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

      const params = new URLSearchParams(window.location.search)
      const nextPath = safeNext(params.get('next'))

      window.location.href = nextPath || result.home || '/ops'
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
        접수, 매칭, 케어파트너 승인, 리포트, 알림센터는 관리자만 접근할 수 있습니다.
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

      <div className="mt-5 rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-6 text-[#607D79] ring-1 ring-[#E3EFEC]">
        관리자 코드는 Vercel 환경변수 <span className="font-black">PARENTS_CARE_ADMIN_CODE</span> 값입니다.
        값이 없으면 기본값은 <span className="font-black">admin2580</span> 입니다.
      </div>
    </CareCard>
  )
}
