import { PricingReferralPanel } from '@/components/public/PricingReferralPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '요금제 | 안부웍스',
  description: '퇴원 후 14일 케어와 월 9,900원 안부완료 리포트 요금제를 확인하세요.'
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl">
        <PricingReferralPanel />
      </section>
    </main>
  )
}
