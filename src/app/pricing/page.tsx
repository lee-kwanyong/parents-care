import { PricingMvp } from '@/components/AnbuWorksBuildout'

export const metadata = {
  title: '요금제 | 안부웍스',
  description: '안부온 구독과 케어파트너 연결 요금 구조입니다.'
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8">
      <section className="mx-auto max-w-6xl">
        <PricingMvp />
      </section>
    </main>
  )
}
