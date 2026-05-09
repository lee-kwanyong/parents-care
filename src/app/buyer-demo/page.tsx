import { BuyerDemoBoard } from '@/components/BuyerDemoBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function BuyerDemoPage() {
  return (
    <AppFrame title="바이어 데모" subtitle="M&A·전략제휴 담당자용 작동 데모">
      <SectionHeader
        eyebrow="BUYER DEMO"
        title={
          <>
            자료가 아니라
            <br />
            실제 흐름을 보여줍니다.
          </>
        }
        description="보호자 접수, 운영실 처리, 매니저 검증, 매칭, 현장 배정, 리포트, 평가까지 실제 데이터 흐름을 확인하는 바이어용 데모 페이지입니다."
        actions={
          <>
            <CareButton href="/demo-start" tone="dark">
              데모 시작
            </CareButton>
            <CareButton href="/deploy-readiness" tone="soft">
              배포 점검
            </CareButton>
          </>
        }
      />

      <div className="mt-8">
        <BuyerDemoBoard />
      </div>
    </AppFrame>
  )
}
