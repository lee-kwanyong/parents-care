import { AdminMenuHub } from '@/components/admin/AdminMenuHub'
import { AdminOpsDashboardPanel } from '@/components/admin/AdminOpsDashboardPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin 운영실 | 안부웍스',
  description: '운영실 KPI, 지자체, R&D, 스마트링, 문자·알림 기능을 통합 관리합니다.'
}

export default function AdminOpsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-6">
        <AdminOpsDashboardPanel />

        <AdminMenuHub
          role="admin"
          showAdminOnly
          embedded
          hideHeader
          title="Admin 운영실"
          subtitle="운영, 스마트링·R&D, 지자체·R&D, 문자·알림을 한눈에 보고 바로 처리합니다."
        />
      </section>
    </main>
  )
}
