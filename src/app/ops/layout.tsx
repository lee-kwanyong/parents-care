import type { ReactNode } from 'react'
import { OpsLayoutClient } from '@/components/ops/OpsLayoutClient'

export default function OpsLayout({ children }: { children: ReactNode }) {
  return <OpsLayoutClient>{children}</OpsLayoutClient>
}
