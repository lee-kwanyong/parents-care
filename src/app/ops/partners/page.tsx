import { OpsPartnerConsole } from '@/components/OpsPartnerConsole'

export const metadata = {
  title: '케어파트너 승인 | 안부웍스 운영실',
  description: '케어파트너 신청 승인, 거절, 보류'
}

export default function OpsPartnersPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <OpsPartnerConsole mode="partners" />
    </main>
  )
}
