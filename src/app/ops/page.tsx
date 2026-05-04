import Link from 'next/link'
import { OpsCommandCenterBoard } from '@/components/OpsCommandCenterBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

const opsMenus = [
  ['/deploy-readiness', '배포 전 점검'],
  ['/mobile-check', '모바일 최종 점검'],
  ['/ops/qa', 'QA 시나리오'],
  ['/ops/manager-matching', '검증 매니저 매칭'],
  ['/ops/manager-verification', '매니저 신뢰 검증'],
  ['/ops/managers', '매니저 등록 심사'],
  ['/ops/command-center', '통합 관제'],
  ['/ops/cases', '통합 케이스'],
  ['/ops/worry-center', '걱정센터'],
  ['/ops/intake-inbox', '사진·카톡 접수함'],
  ['/ops/notifications', '알림 큐'],
  ['/ops/files', '파일 운영'],
  ['/ops/families', '가족 공동조회'],
  ['/ops/manager-field', '매니저 현장'],
  ['/ops/tasks', '가족 할 일'],
  ['/ops/costs', '비용 승인'],
  ['/ops/contact-center', '연락센터'],
  ['/ops/meals', '안심밥상'],
  ['/ops/discharge', '퇴원 후 7일'],
  ['/ops/documents', '서류·영수증'],
  ['/ops/routines', '정기진료'],
  ['/ops/social-care', '사회공헌']
]

export default function OpsHomePage() {
  return (
    <AppFrame
      title="운영실"
      subtitle="긴급, 확인 필요, 진행 중, 완료를 먼저 봅니다"
      showMobileNav={false}
    >
      <CareCard tone="dark">
        <StatusPill text="운영실 통합 관제" tone="white" />
        <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight md:text-7xl">
          오늘 무엇을
          <br />
          먼저 처리해야 할까요?
        </h1>
        <p className="mt-6 max-w-3xl text-xl font-bold leading-9 text-slate-200">
          기능 메뉴를 찾기 전에 긴급, 확인 필요, 진행 중, 완료 상태를 먼저 확인합니다.
        </p>
      </CareCard>

      <div className="mt-8">
        <OpsCommandCenterBoard />
      </div>

      <section className="mt-8">
        <SectionHeader
          eyebrow="운영 메뉴"
          title="필요한 보드로 이동"
          description="운영실은 데스크톱 기준으로 모든 기능에 빠르게 접근할 수 있게 둡니다."
        />
        <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          {opsMenus.map(([href, label]) => (
            <Link key={href} href={href}>
              <CareCard className="h-full transition hover:-translate-y-1 hover:shadow-md">
                <h2 className="text-lg font-black">{label}</h2>
              </CareCard>
            </Link>
          ))}
        </div>
      </section>
    </AppFrame>
  )
}
