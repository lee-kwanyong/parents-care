'use client'

import { useEffect, useState } from 'react'
import { readParentSession, type ParentSession } from '@/components/auth/ParentSessionBridge'
import { ParentRoutineCheckin } from '@/components/parent/ParentRoutineCheckin'

export function ParentTodayConnectedPanel() {
  const [session, setSession] = useState<ParentSession | null>(null)

  useEffect(() => {
    const stored = readParentSession()

    if (!stored) {
      window.location.replace('/parent/login')
      return
    }

    setSession(stored)
  }, [])

  if (!session) {
    return (
      <main className="min-h-[100svh] bg-[#F7FFFC] px-4 py-8 text-[#17443F]">
        <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="text-2xl font-black">부모님 연결 확인 중입니다.</div>
        </section>
      </main>
    )
  }

  return <ParentRoutineCheckin initialFamilyCode={session.familyCode} lockFamilyCode />
}
