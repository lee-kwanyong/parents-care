import { LegalSetupPanel } from '@/components/LegalSetupPanel'

export const metadata = {
  title: '법무 DB 설정 | 안부웍스',
  description: '개인정보 및 데이터 요청 저장용 Supabase 설정'
}

export default function LegalSetupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)]">
      <LegalSetupPanel />
    </main>
  )
}
