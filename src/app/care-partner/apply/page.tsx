import { CarePartnerApplyMvp } from '@/components/AnbuWorksBuildout'

export const metadata = {
  title: '케어파트너 신청 | 안부웍스',
  description: '요양보호사, 병원동행매니저, 돌봄 파트너 등록 화면입니다.'
}

export default function CarePartnerApplyPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8">
      <section className="mx-auto max-w-6xl">
        <CarePartnerApplyMvp />
      </section>
    </main>
  )
}
