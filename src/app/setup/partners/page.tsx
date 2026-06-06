import { PartnerSetupPanel } from '@/components/PartnerSetupPanel'

export const metadata = {
  title: '파트너 DB 설정 | 안부웍스',
  description: '케어파트너 신청과 배정 관리용 Supabase 설정'
}

export default function PartnerSetupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)]">
      <PartnerSetupPanel />
    </main>
  )
}
