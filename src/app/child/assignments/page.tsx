import { ChildAssignmentsPanel } from '@/components/ChildAssignmentsPanel'

export const metadata = {
  title: '케어파트너 배정 현황 | 안부웍스',
  description: '보호자가 배정된 케어파트너와 진행 상태를 확인합니다.'
}

export default function ChildAssignmentsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)]">
      <ChildAssignmentsPanel />
    </main>
  )
}
