import { AuthStatusCard } from '@/components/AuthStatusCard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function MyPage() {
  return (
    <AppFrame title="마이페이지" subtitle="로그인 상태와 내 역할을 확인합니다">
      <SectionHeader
        eyebrow="마이페이지"
        title={
          <>
            내 로그인 상태를
            <br />
            확인합니다.
          </>
        }
        description="역할에 따라 자녀앱, 가족 공동조회, 부모님 큰 글씨 화면, 매니저앱, 운영실로 이동할 수 있습니다."
        actions={
          <>
            <CareButton href="/login" tone="primary">
              로그인
            </CareButton>
            <CareButton href="/child" tone="soft">
              자녀앱
            </CareButton>
          </>
        }
      />

      <div className="mt-8">
        <AuthStatusCard />
      </div>
    </AppFrame>
  )
}
