import type { ReactNode } from 'react'
import { ParentSessionBridge } from '@/components/auth/ParentSessionBridge'
import { RoleWindowGuard } from '@/components/auth/RoleWindowGuard'

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ParentSessionBridge />
      <RoleWindowGuard />
      {children}
    </>
  )
}
