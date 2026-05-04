import Link from 'next/link'
import { ManagerTrustVerificationBoard } from '@/components/ManagerTrustVerificationBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function ChildManagerEvaluationsPage() {
  return (
    <AppFrame title="매니저 평가" subtitle="평가는 매니저 안심도에 반영됩니다" backHref="/child">
      <SectionHeader
        eyebrow="자녀앱"
        title={
          <>
            동행매니저를
            <br />
            평가해주세요.
          </>
        }
        description="안전, 친절, 정확성, 시간준수 평가는 다음 가족이 매니저를 안심하고 선택하는 데 반영됩니다."
        actions={
          <>
            <CareButton href="/child/cases" tone="soft">
              케이스 보기
            </CareButton>
            <CareButton href="/child/summaries" tone="dark">
              30초 요약
            </CareButton>
          </>
        }
      />

      <div className="mt-8">
        <ManagerTrustVerificationBoard mode="family" />
      </div>
    </AppFrame>
  )
}
