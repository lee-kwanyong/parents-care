import { PaymentSuccessClient } from '@/components/PaymentSuccessClient'

export const metadata = {
  title: '결제 완료 | 안부웍스',
  description: '안부웍스 결제 승인 처리'
}

type SearchParams = Promise<{
  paymentKey?: string
  orderId?: string
  amount?: string
}>

export default async function PaymentSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <PaymentSuccessClient
        paymentKey={params.paymentKey || ''}
        orderId={params.orderId || ''}
        amount={params.amount || '0'}
      />
    </main>
  )
}
