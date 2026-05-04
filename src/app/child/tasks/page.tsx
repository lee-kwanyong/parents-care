import Link from 'next/link'
import { FamilyTaskBoard } from '@/components/FamilyTaskBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

export default function ChildTasksPage() {
  return (
    <AppFrame title="가족 할 일" subtitle="누가 할지, 완료했는지만 확인하세요" backHref="/child">
      <SectionHeader
        eyebrow="자녀앱"
        title={
          <>
            가족이 할 일을
            <br />
            쉽게 나눕니다.
          </>
        }
        description="복잡한 업무 관리가 아닙니다. 제가 할게요, 완료했어요, 다른 가족에게 넘기기만 있으면 됩니다."
        actions={
          <>
            <CareButton href="/child/today" tone="soft">
              오늘의 안심판
            </CareButton>
            <CareButton href="/family-code" tone="dark">
              가족 초대
            </CareButton>
          </>
        }
      />

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <CareCard tone="green">
          <StatusPill text="쉽게" tone="green" />
          <h2 className="mt-4 text-2xl font-black">제가 할게요</h2>
          <p className="mt-2 text-sm font-bold leading-6">담당자를 정하면 가족이 헷갈리지 않습니다.</p>
        </CareCard>

        <CareCard tone="blue">
          <StatusPill text="명확하게" tone="blue" />
          <h2 className="mt-4 text-2xl font-black">완료했어요</h2>
          <p className="mt-2 text-sm font-bold leading-6">약 확인, 식사 확인, 서류 제출을 끝냈는지 남깁니다.</p>
        </CareCard>

        <CareCard tone="amber">
          <StatusPill text="함께" tone="amber" />
          <h2 className="mt-4 text-2xl font-black">다른 가족에게 넘기기</h2>
          <p className="mt-2 text-sm font-bold leading-6">형제자매와 역할을 나눌 수 있습니다.</p>
        </CareCard>
      </section>

      <div className="mt-8">
        <FamilyTaskBoard mode="family" />
      </div>

      <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-2xl font-black">관련 화면</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/child/cases" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black hover:bg-emerald-50">
            부모님 케이스
          </Link>
          <Link href="/child/costs" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black hover:bg-emerald-50">
            비용 승인
          </Link>
          <Link href="/child/notifications" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black hover:bg-emerald-50">
            알림함
          </Link>
        </div>
      </section>
    </AppFrame>
  )
}
