import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { AppFrame } from '@/components/ui/AppFrame'
import { AdminLoginPanel } from '@/components/auth/AdminLoginPanel'

export default async function OpsLayout({
  children
}: {
  children: ReactNode
}) {
  const cookieStore = await cookies()
  const role = cookieStore.get('pc_role')?.value || ''

  if (role !== 'admin') {
    return (
      <AppFrame
        title="운영실 Admin"
        subtitle="운영실은 관리자 코드로 접속합니다"
        showMobileNav={false}
      >
        <section className="mx-auto max-w-xl">
          <AdminLoginPanel />
        </section>
      </AppFrame>
    )
  }

  return <>{children}</>
}
