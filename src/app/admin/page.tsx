import { AppFrame } from '@/components/ui/AppFrame'
import { AdminLoginPanel } from '@/components/auth/AdminLoginPanel'

export default function AdminPage() {
  return (
    <AppFrame title="운영실 Admin" subtitle="운영실은 별도 관리자 화면으로 접속합니다" showMobileNav={false}>
      <section className="mx-auto max-w-xl">
        <AdminLoginPanel />
      </section>
    </AppFrame>
  )
}
