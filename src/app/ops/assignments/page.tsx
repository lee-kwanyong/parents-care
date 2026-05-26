import { OpsPartnerConsole } from '@/components/OpsPartnerConsole'

export const metadata = {
  title: '케어 배정 관리 | 안부웍스 운영실',
  description: '케어파트너를 부모님 연결코드에 배정합니다.'
}

export default function OpsAssignmentsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <OpsPartnerConsole mode="assignments" />
    </main>
  )
}
