import type { ReactNode } from 'react'
import { ParentTodayNavigation } from '../../../components/ParentTodayNavigation'

export default function ParentTodayLayout({ children }: { children: ReactNode }) {
  return <ParentTodayNavigation>{children}</ParentTodayNavigation>
}
