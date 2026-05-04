import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

const managerChecks = [
  '만남 암호 확인',
  '차량 보유와 직접 운송 분리 확인',
  '알러지·복용약 확인',
  '청력·보행·낙상 주의 확인',
  '병원 접수·약국·서류 확인',
  '보호자 30초 리포트 초안'
]

export default function ManagerHomePage() {
  return (
    <AppFrame
      title="동행매니저앱"
      subtitle="현장에서 꼭 확인할 것만 봅니다"
      navItems={[
        { href: '/manager', label: '홈', emoji: '🏠' },
        { href: '/manager/today', label: '오늘', emoji: '📋' },
        { href: '/ops/manager-field', label: '운영', emoji: '🧭' },
        { href: '/ops', label: '전체', emoji: '⚙️' }
      ]}
    >
      <SectionHeader
        eyebrow="동행매니저앱"
        title={
          <>
            오늘 현장에서
            <br />
            꼭 확인할 것만 봅니다.
          </>
        }
        description="부모님 상태, 만남 암호, 알러지, 복용약, 이동 정책, 서류, 안전 귀가를 체크합니다."
        actions={
          <CareButton href="/manager/today" size="xl">
            오늘 배정 보기
          </CareButton>
        }
      />

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <CareCard tone="green">
          <StatusPill text="현장 원칙" tone="green" />
          <h2 className="mt-4 text-3xl font-black">차량 정책</h2>
          <p className="mt-3 text-base font-bold leading-7">
            차량 보유 여부는 참고 정보입니다. 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.
          </p>
        </CareCard>

        <CareCard tone="blue">
          <StatusPill text="부모님 응대" tone="blue" />
          <h2 className="mt-4 text-3xl font-black">천천히, 쉽게</h2>
          <p className="mt-3 text-base font-bold leading-7">
            부모님께는 관리가 아니라 도움으로 설명하고, 만남 암호를 먼저 확인합니다.
          </p>
        </CareCard>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-black">현장 체크 기준</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {managerChecks.map((check) => (
            <CareCard key={check}>
              <p className="text-lg font-black">{check}</p>
            </CareCard>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/manager/today">
          <CareCard tone="dark" className="h-full">
            <h2 className="text-2xl font-black">오늘 배정</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-200">
              현장 체크리스트와 단계별 진행상태 업데이트
            </p>
          </CareCard>
        </Link>

        <Link href="/ops/manager-field">
          <CareCard tone="white" className="h-full">
            <h2 className="text-2xl font-black">운영실 현장 보드</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
              배정 생성, 이슈 확인, 리포트 검수
            </p>
          </CareCard>
        </Link>
      </section>
    </AppFrame>
  )
}
