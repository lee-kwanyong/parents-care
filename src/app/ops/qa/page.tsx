import Link from 'next/link'
import { QAScenarioBoard } from '@/components/QAScenarioBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function OpsQAPage() {
  return (
    <AppFrame title="QA 시나리오" subtitle="실제 부모님 케어 흐름을 테스트합니다" backHref="/ops" showMobileNav={false}>
      <SectionHeader
        eyebrow="운영실 QA"
        title={
          <>
            실제 사용 흐름을
            <br />
            끝까지 테스트합니다.
          </>
        }
        description="기능별 테스트가 아니라 보호자가 걱정을 맡기는 순간부터 검증 매니저 매칭, 현장, 리포트, 평가까지 한 흐름으로 확인합니다."
        actions={
          <>
            <CareButton href="/ops" tone="dark">
              운영실 홈
            </CareButton>
            <CareButton href="/child" tone="soft">
              자녀앱 확인
            </CareButton>
          </>
        }
      />

      <div className="mt-8">
        <QAScenarioBoard />
      </div>

      <section className="mt-8 rounded-[2rem] bg-[#5F7C92] p-6 text-[#2E504D]">
        <h2 className="text-2xl font-black">QA 기준</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {['3번 안에 접수', '검증 매니저만 배정', '부모님 큰 글씨', '평가가 신뢰도 반영'].map((item) => (
            <div key={item} className="rounded-2xl bg-white/70 p-4 font-black">
              {item}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-bold leading-6 text-[#63807C]">
          40대 이상 보호자가 한눈에 이해하고, 앱을 못 써도 전화·카톡·사진으로 대체 가능한지 확인합니다.
        </p>
      </section>
    </AppFrame>
  )
}
