import Link from 'next/link'
import { ManagerMatchingBoard } from '@/components/ManagerMatchingBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function OpsManagerMatchingPage() {
  return (
    <AppFrame title="검증 매니저 매칭" subtitle="본인확인 완료 매니저만 배정합니다" backHref="/ops" showMobileNav={false}>
      <SectionHeader
        eyebrow="운영실"
        title={
          <>
            검증된 매니저만
            <br />
            부모님께 배정합니다.
          </>
        }
        description="휴대폰 본인확인, 신분확인, 차량정책, 면접 확인이 끝난 매니저만 후보로 추천하고 현장 배정으로 연결합니다."
        actions={
          <>
            <CareButton href="/ops/manager-verification" tone="primary">
              신뢰 검증 보드
            </CareButton>
            <CareButton href="/ops/manager-field" tone="dark">
              현장 배정 보드
            </CareButton>
          </>
        }
      />

      <div className="mt-8">
        <ManagerMatchingBoard />
      </div>

      <section className="mt-8 rounded-[2rem] bg-[#5F7C92] p-6 text-[#2E504D]">
        <h2 className="text-2xl font-black">매칭 원칙</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {['본인확인 완료', '활동 중 매니저', '직접 운송 미포함', '평가 반영'].map((item) => (
            <div key={item} className="rounded-2xl bg-white/70 p-4 font-black">
              {item}
            </div>
          ))}
        </div>
      </section>
    </AppFrame>
  )
}
