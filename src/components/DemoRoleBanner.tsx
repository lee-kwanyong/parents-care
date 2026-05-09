'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { labelDemoRole } from '@/lib/demo-engine'

export function DemoRoleBanner() {
  const [role, setRole] = useState<string | null>(null)

  async function load() {
    try {
      const response = await fetch('/api/demo/session', { cache: 'no-store' })
      const data = await response.json()
      setRole(data.role || null)
    } catch {
      setRole(null)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (!role) {
    return null
  }

  return (
    <div className="border-b border-blue-200 bg-blue-50 px-5 py-2 text-sm font-black text-blue-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <span>데모 역할: {labelDemoRole(role)}</span>
        <div className="flex gap-2">
          <Link href="/demo-start" className="rounded-xl bg-white px-3 py-1">
            데모 시작
          </Link>
          <Link href="/demo-login" className="rounded-xl bg-white px-3 py-1">
            역할 변경
          </Link>
        </div>
      </div>
    </div>
  )
}
