import Link from 'next/link'
import { ManagerTrustVerificationBoard } from '@/components/ManagerTrustVerificationBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function OpsManagerVerificationPage() {
  return (
    <AppFrame title="매니저 신뢰 검증" subtitle="매칭 전 본인확인과 매칭 후 평가를 관리합니다" backHref="/ops" showMobileNav={false}>
      <SectionHeader
        eyebrow="운영실"
        title={
          <>
            매칭 전 검증,
            <br />
            매칭 후 평가까지.
          </>
        }
        description="휴대폰 본인확인, 신분 확인, 차량 정책, 면접 확인이 끝나야 매칭할 수 있습니다. 매칭 후 평가는 신뢰카드 점수에 자동 반영됩니다."
        actions={
          <>
            <CareButton href="/ops/managers" tone="primary">
              지원서 심사
            </CareButton>
            <CareButton href="/manager/apply" tone="dark">
              지원 페이지
            </CareButton>
          </>
        }
      />

      <div className="mt-8">
        <ManagerTrustVerificationBoard mode="ops" />
      </div>

      <section className="mt-8 rounded-[2rem] bg-[#5F7C92] p-6 text-[#2E504D]">
        <h2 className="text-2xl font-black">매칭 차단 기준</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {['휴대폰 본인확인', '신분 확인', '차량 정책 확인', '면접 확인'].map((item) => (
            <div key={item} className="rounded-2xl bg-white/70 p-4 font-black">
              {item}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-bold leading-6 text-[#63807C]">
          위 4개가 확인되지 않으면 SQL 레벨에서 승인 상태로 변경할 수 없습니다.
        </p>
      </section>
    </AppFrame>
  )
}
