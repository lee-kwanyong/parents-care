'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { OpsPasswordGate } from '@/components/ops/OpsPasswordGate'

export function OpsLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/ops/login') {
    return <>{children}</>
  }

  return <OpsPasswordGate>{children}</OpsPasswordGate>
}

export default OpsLayoutClient
