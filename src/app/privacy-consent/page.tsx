import { PrivacyConsentMvp } from '@/components/AnbuWorksBuildout'

export const metadata = {
  title: '개인정보 동의 | 안부웍스',
  description: '부모님 안부 정보 수집과 보호자 공유 동의 화면입니다.'
}

export default function PrivacyConsentPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-5 py-8">
      <section className="mx-auto max-w-6xl">
        <PrivacyConsentMvp />
      </section>
    </main>
  )
}
