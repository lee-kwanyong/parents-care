import { PaymentCheckoutClient } from '@/components/PaymentCheckoutClient'

export const metadata = {
  title: '결제하기 | 안부웍스',
  description: '안부웍스 요금제 결제'
}

type SearchParams = Promise<{
  plan?: string
}>

export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)]">
      <PaymentCheckoutClient initialPlanId={params.plan || 'basic'} />
    </main>
  )
}
