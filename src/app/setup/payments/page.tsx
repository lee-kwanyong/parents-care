import { PaymentSetupPanel } from '@/components/PaymentSetupPanel'

export const metadata = {
  title: '결제 설정 | 안부웍스',
  description: '안부웍스 토스페이먼츠 결제 설정'
}

export default function PaymentSetupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <PaymentSetupPanel />
    </main>
  )
}
