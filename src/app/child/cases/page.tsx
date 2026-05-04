import Link from 'next/link'
import { CareCaseBoard } from '@/components/CareCaseBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

export default function ChildCasesPage() {
  return (
    <AppFrame title="부모님 케이스" subtitle="흩어진 진행상황을 하나로 확인하세요" backHref="/child">
      <SectionHeader
        eyebrow="자녀앱"
        title={
          <>
            부모님 걱정을
            <br />
            한 케이스로 봅니다.
          </>
        }
        description="식사, 약, 서류, 비용, 매니저, 리포트를 따로 찾지 않아도 됩니다. 하나의 케이스에서 진행상황을 확인하세요."
        actions={
          <>
            <CareButton href="/care-intake" tone="primary">
              사진·카톡으로 맡기기
            </CareButton>
            <CareButton href="/child/today" tone="soft">
              오늘의 안심판
            </CareButton>
          </>
        }
      />

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <CareCard tone="green">
          <StatusPill text="먼저 보는 것" tone="green" />
          <h2 className="mt-4 text-2xl font-black">안심 / 확인 필요 / 긴급</h2>
          <p className="mt-2 text-sm font-bold leading-6">상세 내용보다 현재 상태를 먼저 봅니다.</p>
        </CareCard>

        <CareCard tone="blue">
          <StatusPill text="가족 할 일" tone="blue" />
          <h2 className="mt-4 text-2xl font-black">해야 할 일 3개</h2>
          <p className="mt-2 text-sm font-bold leading-6">약, 식사, 서류, 비용 승인 등 가족이 할 일을 정리합니다.</p>
        </CareCard>

        <CareCard tone="amber">
          <StatusPill text="진행상황" tone="amber" />
          <h2 className="mt-4 text-2xl font-black">통합 타임라인</h2>
          <p className="mt-2 text-sm font-bold leading-6">운영실과 매니저 진행상황을 시간순으로 확인합니다.</p>
        </CareCard>
      </section>

      <div className="mt-8">
        <CareCaseBoard mode="family" />
      </div>

      <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-2xl font-black">관련 화면</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/child/tasks" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black hover:bg-emerald-50">
            가족 할 일
          </Link>
          <Link href="/child/summaries" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black hover:bg-emerald-50">
            30초 요약
          </Link>
          <Link href="/child/files" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black hover:bg-emerald-50">
            파일함
          </Link>
          <Link href="/child/family" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black hover:bg-emerald-50">
            가족 공동조회
          </Link>
        </div>
      </section>
    </AppFrame>
  )
}
