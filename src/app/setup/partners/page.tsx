import { PartnerSetupPanel } from '@/components/PartnerSetupPanel'

export const metadata = {
  title: '파트너 DB 설정 | 안부웍스',
  description: '케어파트너 신청과 배정 관리용 Supabase 설정'
}

export default function PartnerSetupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <PartnerSetupPanel />
    </main>
  )
}
