import { ChildAssignmentsPanel } from '@/components/ChildAssignmentsPanel'

export const metadata = {
  title: '케어파트너 배정 현황 | 안부웍스',
  description: '보호자가 배정된 케어파트너와 진행 상태를 확인합니다.'
}

export default function ChildAssignmentsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <ChildAssignmentsPanel />
    </main>
  )
}
