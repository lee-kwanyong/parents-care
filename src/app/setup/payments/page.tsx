import { PaymentSetupPanel } from '@/components/PaymentSetupPanel'

export const metadata = {
  title: '결제 설정 | 안부웍스',
  description: '안부웍스 토스페이먼츠 결제 설정'
}

export default function PaymentSetupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)]">
      <PaymentSetupPanel />
    </main>
  )
}
