import { AppFrame } from '@/components/ui/AppFrame'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { GuardianSignupPanel } from '@/components/auth/GuardianSignupPanel'

export default function GuardianSignupPage() {
  return (
    <AppFrame title="보호자 회원가입" subtitle="부모님 안심케어 신청과 리포트 확인을 시작합니다">
      <SectionHeader
        eyebrow="보호자 케어"
        title={
          <>
            부모님 안심케어를
            <br />
            보호자가 시작합니다.
          </>
        }
        description="회원가입 후 부모님께 4자리 접속코드를 전달할 수 있습니다."
      />

      <div className="mt-8">
        <GuardianSignupPanel />
      </div>
    </AppFrame>
  )
}
