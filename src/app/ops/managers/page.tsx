import Link from 'next/link'
import { ManagerOnboardingBoard } from '@/components/ManagerOnboardingBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default function OpsManagersPage() {
  return (
    <AppFrame title="매니저 등록 심사" subtitle="지원, 심사, 교육, 승인, 신뢰카드 생성" backHref="/ops" showMobileNav={false}>
      <SectionHeader
        eyebrow="운영실"
        title={
          <>
            동행케어 매니저를
            <br />
            신중하게 심사합니다.
          </>
        }
        description="자격, 가능지역, 현장 경험, 디지털 활용, 차량 정책 동의, 면접과 교육 확인 후 보호자에게 보여줄 신뢰카드를 생성합니다."
        actions={
          <>
            <CareButton href="/manager/apply" tone="primary">
              매니저 지원 페이지
            </CareButton>
            <CareButton href="/ops/manager-field" tone="dark">
              현장 배정 보드
            </CareButton>
          </>
        }
      />

      <div className="mt-8">
        <ManagerOnboardingBoard mode="ops" />
      </div>

      <section className="mt-8 rounded-[2rem] bg-[#5F7C92] p-6 text-[#2E504D]">
        <h2 className="text-2xl font-black">운영 기준</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/70 p-4">
            <div className="font-black">1. 자격·경력 확인</div>
            <p className="mt-2 text-sm leading-6 text-[#63807C]">요양보호사, 사회복지사, 간호 관련 자격, 병원동행 교육 수료, CPR 여부를 확인합니다.</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-4">
            <div className="font-black">2. 현장 역량 확인</div>
            <p className="mt-2 text-sm leading-6 text-[#63807C]">지도앱, 택시앱, 키오스크, 보호자 질문 전달, 리포트 작성 능력을 봅니다.</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-4">
            <div className="font-black">3. 차량 정책 분리</div>
            <p className="mt-2 text-sm leading-6 text-[#63807C]">차량 보유 여부는 표시하되 직접 유상운송은 기본 서비스와 분리합니다.</p>
          </div>
        </div>
      </section>
    </AppFrame>
  )
}
