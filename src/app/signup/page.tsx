import { EasyAuthPanel } from '@/components/EasyAuthPanel'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function SignupPage() {
  return (
    <AppFrame title="회원가입" subtitle="역할을 고르고 편한 방식으로 시작하세요">
      <SectionHeader
        eyebrow="회원가입"
        title={
          <>
            부모님 케어를
            <br />
            함께 시작합니다.
          </>
        }
        description="대표 보호자, 가족, 부모님, 매니저, 운영실 역할에 따라 첫 화면을 다르게 열어줍니다."
        actions={
          <CareButton href="/login" tone="soft">
            이미 계정이 있어요
          </CareButton>
        }
      />

      <div className="mt-8">
        <EasyAuthPanel defaultMode="email_magic" nextPath="/child" />
      </div>
    </AppFrame>
  )
}
