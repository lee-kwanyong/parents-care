import { LegalCard, LegalPageShell } from '@/components/LegalPageShell'
import { DataRequestForm } from '@/components/DataRequestForm'
import { supportEmail } from '@/lib/anbu-legal-content'

export const metadata = {
  title: '문의하기 | 안부웍스',
  description: '안부웍스 고객지원 및 문의'
}

export default function ContactPage() {
  return (
    <LegalPageShell
      eyebrow="고객지원"
      title="문의, 데이터 요청, 동의 철회를 접수하세요."
      description="서비스 이용, 결제, 개인정보, 안부 기록, 케어파트너 관련 문의를 접수할 수 있습니다."
    >
      <LegalCard title="고객지원 이메일">
        <p>
          이메일 문의: <strong>{supportEmail}</strong>
        </p>
        <p className="mt-2">
          실제 Play Store 등록 전에는 Vercel 환경변수 <strong>NEXT_PUBLIC_SUPPORT_EMAIL</strong>에 실제 고객지원 이메일을 넣어주세요.
        </p>
      </LegalCard>

      <DataRequestForm defaultType="contact" />
    </LegalPageShell>
  )
}
