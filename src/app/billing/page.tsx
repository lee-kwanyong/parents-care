import { BillingPanel } from '@/components/BillingPanel'

export const metadata = {
  title: '결제내역 | 안부웍스',
  description: '안부웍스 구독과 결제 내역'
}

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <BillingPanel />
    </main>
  )
}
