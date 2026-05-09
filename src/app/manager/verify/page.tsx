import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

const required = [
  '휴대폰 본인확인',
  '신분 확인',
  '차량·이동 정책 확인',
  '운영실 면접 확인'
]

const optional = [
  '자격증 확인',
  '경력 확인',
  '교육 이수 확인',
  'CPR 교육 확인',
  '디지털 활용 확인'
]

export default function ManagerVerifyPage() {
  return (
    <AppFrame title="매니저 본인확인 안내" subtitle="매칭 전 필수 검증을 안내합니다" backHref="/manager">
      <SectionHeader
        eyebrow="매칭 전 필수"
        title={
          <>
            검증이 끝나야
            <br />
            부모님을 모실 수 있습니다.
          </>
        }
        description="부모님 케어는 단순 연결이 아닙니다. 본인확인, 신분 확인, 차량 정책, 면접 확인이 완료되어야 매칭됩니다."
        actions={
          <>
            <CareButton href="/manager/apply" tone="primary">
              지원서 작성
            </CareButton>
            <CareButton href="/ops/manager-verification" tone="dark">
              운영실 검증 보드
            </CareButton>
          </>
        }
      />

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <CareCard tone="red">
          <StatusPill text="필수" tone="red" />
          <h2 className="mt-4 text-3xl font-black">매칭 전 필수 확인</h2>
          <div className="mt-5 space-y-3">
            {required.map((item) => (
              <div key={item} className="rounded-2xl bg-white p-4 text-lg font-black">
                {item}
              </div>
            ))}
          </div>
        </CareCard>

        <CareCard tone="blue">
          <StatusPill text="신뢰도 상승" tone="blue" />
          <h2 className="mt-4 text-3xl font-black">추가 신뢰 확인</h2>
          <div className="mt-5 space-y-3">
            {optional.map((item) => (
              <div key={item} className="rounded-2xl bg-white p-4 text-lg font-black">
                {item}
              </div>
            ))}
          </div>
        </CareCard>
      </section>

      <section className="mt-8 rounded-[2rem] bg-amber-50 p-6">
        <h2 className="text-2xl font-black text-amber-950">차량 정책</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-amber-900">
          차량 보유 여부는 참고 정보입니다. 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.
          기본 이동은 병원 앞 만남, 집 앞 만남 후 택시 동행, 이동지원 제휴 기준입니다.
        </p>
      </section>

      <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">평가가 신뢰도에 반영됩니다</h2>
        <p className="mt-3 text-base font-bold leading-7 text-[#63807C]">
          매칭 후 보호자가 남기는 안전, 친절, 정확성, 시간준수 평가는 매니저 신뢰카드에 반영됩니다.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/child/manager-evaluations" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black">
            평가 화면 보기
          </Link>
        </div>
      </section>
    </AppFrame>
  )
}
