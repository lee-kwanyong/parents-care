import { CarePartnerApplicationForm } from '@/components/CarePartnerApplicationForm'

export const metadata = {
  title: '케어파트너 신청 | 안부웍스',
  description: '요양보호사, 병원동행매니저, 생활확인 파트너 신청'
}

export default function CarePartnerApplyPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <CarePartnerApplicationForm />
    </main>
  )
}
