import { DemoStartBoard } from '@/components/DemoStartBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function DemoStartPage() {
  return (
    <AppFrame title="데모 시작" subtitle="M&A·전략제휴 시연용 데모 모드">
      <SectionHeader
        eyebrow="DEMO OPERATING MODE"
        title={
          <>
            실제로 돌아가는
            <br />
            데모를 보여줍니다.
          </>
        }
        description="자료가 아니라 접수, 운영실 처리, 검증 매니저 매칭, 부모님 화면, 리포트, 평가까지 연결되는 실제 흐름을 보여줍니다."
        actions={
          <>
            <CareButton href="/deploy-readiness" tone="dark">
              배포 점검
            </CareButton>
            <CareButton href="/admin/ops/qa" tone="soft">
              QA 보드
            </CareButton>
          </>
        }
      />

      <div className="mt-8">
        <DemoStartBoard />
      </div>
    </AppFrame>
  )
}
