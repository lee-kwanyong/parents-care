import type { ReactNode } from 'react'
import { OpsPasswordGate } from '@/components/ops/OpsPasswordGate'

export default function OpsLayout({ children }: { children: ReactNode }) {
  return <OpsPasswordGate>{children}</OpsPasswordGate>
}
