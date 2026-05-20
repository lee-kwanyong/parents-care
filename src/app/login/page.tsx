import { AppFrame } from '@/components/ui/AppFrame'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { RoleAccessPanel } from '@/components/RoleAccessPanel'

export default function LoginPage() {
  return (
    <AppFrame title="앱 접속" subtitle="부모님·자녀·매니저·운영실 역할별로 들어갑니다">
      <SectionHeader
        eyebrow="역할별 접속"
        title={
          <>
            필요한 앱으로
            <br />
            바로 들어가세요.
          </>
        }
        description="부모님앱, 자녀앱, 매니저앱, 운영실 화면을 접속 코드로 구분합니다."
      />

      <div className="mt-8">
        <RoleAccessPanel />
      </div>
    </AppFrame>
  )
}
