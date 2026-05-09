import { EasyAuthPanel } from '@/components/EasyAuthPanel'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function LoginPage() {
  return (
    <AppFrame title="로그인" subtitle="카카오·휴대폰·이메일 중 편한 방식으로 시작하세요">
      <SectionHeader
        eyebrow="쉬운 로그인"
        title={
          <>
            복잡한 가입 없이
            <br />
            바로 시작하세요.
          </>
        }
        description="40대 이상 보호자가 어렵지 않게 시작할 수 있도록 카카오, 휴대폰, 이메일 링크 방식을 먼저 보여줍니다."
        actions={
          <>
            <CareButton href="/child" tone="soft">
              둘러보기
            </CareButton>
            <CareButton href="/signup" tone="dark">
              회원가입 화면
            </CareButton>
          </>
        }
      />

      <div className="mt-8">
        <EasyAuthPanel defaultMode="kakao" nextPath="/child" />
      </div>
    </AppFrame>
  )
}
