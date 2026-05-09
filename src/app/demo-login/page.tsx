'use client'

import { useState } from 'react'
import Link from 'next/link'
import { demoRoles, homePathForDemoRole, type DemoRole } from '@/lib/demo-engine'
import { CareCard } from '@/components/ui/CareCard'
import { CareButton } from '@/components/ui/CareButton'
import { StatusPill } from '@/components/ui/StatusPill'

export default function DemoLoginPage() {
  const [role, setRole] = useState<DemoRole>('guardian')
  const [message, setMessage] = useState('')

  async function chooseRole(nextRole: DemoRole) {
    setRole(nextRole)
    setMessage('')

    try {
      const response = await fetch('/api/demo/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '역할 선택 실패')
      }

      setMessage(`${demoRoles.find((item) => item.code === nextRole)?.label || nextRole} 역할로 설정했습니다.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '역할 선택 실패')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2F4948]">
      <section className="mx-auto max-w-5xl">
        <CareCard tone="dark">
          <StatusPill text="DEMO LOGIN" tone="white" />
          <h1 className="mt-5 text-5xl font-black leading-tight">
            데모 역할을
            <br />
            선택하세요.
          </h1>
          <p className="mt-5 text-lg font-bold leading-8 text-[#63807C]">
            실제 로그인 전에도 보호자, 운영실, 매니저, 부모님 화면을 역할별로 시연할 수 있습니다.
          </p>
        </CareCard>

        <section className="mt-8 grid gap-4 md:grid-cols-5">
          {demoRoles.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => chooseRole(item.code)}
              className={
                'rounded-3xl border p-5 text-left transition ' +
                (role === item.code
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-[#E0EFEC] bg-white hover:bg-slate-50')
              }
            >
              <div className="text-xl font-black">{item.label}</div>
              <p className="mt-2 text-xs font-bold leading-5 text-[#63807C]">{item.description}</p>
            </button>
          ))}
        </section>

        {message ? (
          <p className="mt-6 rounded-2xl bg-blue-50 p-4 text-lg font-black text-blue-900">
            {message}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <CareButton href={homePathForDemoRole(role)} tone="dark" size="xl">
            선택한 역할 화면으로 이동
          </CareButton>
          <CareButton href="/demo-start" tone="soft" size="xl">
            데모 시작 페이지
          </CareButton>
          <Link href="/login" className="rounded-3xl bg-white px-7 py-6 text-xl font-black ring-1 ring-[#DCEBE8]">
            실제 로그인
          </Link>
        </div>
      </section>
    </main>
  )
}
