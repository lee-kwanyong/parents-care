import type { ReactNode } from 'react'
import { ParentNavigation } from '../../../components/ParentTodayNavigation'

export default function ParentInstallLayout({ children }: { children: ReactNode }) {
  return <ParentNavigation currentLabel="앱 설치 안내 화면">{children}</ParentNavigation>
}
