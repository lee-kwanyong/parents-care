import Link from 'next/link'
import { QAScenarioBoard } from '@/components/QAScenarioBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function QAScenariosPage() {
  return (
    <AppFrame title="서비스 QA" subtitle="출시 전 실제 이용 흐름 확인" backHref="/">
      <SectionHeader
        eyebrow="QA"
        title={
          <>
            출시 전에
            <br />
            실제 흐름을 확인합니다.
          </>
        }
        description="부모님 안심케어 접수, 사진·카톡, 매니저 검증, 비용승인, 부모님 화면, 평가까지 핵심 흐름을 확인합니다."
        actions={
          <>
            <CareButton href="/admin/ops/qa" tone="dark">
              운영실 QA
            </CareButton>
            <CareButton href="/care-request" tone="primary">
              안심케어 접수 테스트
            </CareButton>
          </>
        }
      />

      <div className="mt-8">
        <QAScenarioBoard />
      </div>
    </AppFrame>
  )
}
