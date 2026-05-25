import Link from 'next/link'
import { ParentDailyCareButtons } from '@/components/ParentDailyCareButtons'

export default function ParentTodayPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F2FFFB_0%,#FFFFFF_58%,#F7FBFF_100%)] px-5 py-5 text-[#173B36]">
      <section className="mx-auto max-w-xl space-y-5">
        <div className="rounded-[2rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8]">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            안부웍스 · 안부온
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.06em] sm:text-5xl">
            오늘 안부를
            <br />
            버튼으로 알려주세요.
          </h1>

          <p className="mt-4 text-lg font-bold leading-8 text-[#647C77]">
            식사, 약, 몸 상태, 기분을 누르면 자녀가 오늘 상태를 바로 확인할 수 있습니다.
          </p>

          <div className="mt-6 rounded-[1.75rem] bg-[#123F38] p-5 text-white">
            <p className="text-sm font-black text-[#9DF4DD]">오늘 부모님 화면</p>
            <div className="mt-2 text-2xl font-black">어렵게 입력하지 않아도 됩니다.</div>
            <p className="mt-3 text-sm font-bold leading-6 text-[#CDEEE6]">
              아래 큰 버튼 중 지금 상태에 맞는 것만 눌러주세요.
            </p>
          </div>
        </div>

        <ParentDailyCareButtons elderName="어머니" />

        <div className="grid gap-3">
          <Link
            href="tel:01012345678"
            className="rounded-[1.5rem] bg-[#123F38] px-6 py-5 text-center text-xl font-black text-white shadow-sm"
          >
            자녀에게 전화
          </Link>
          <Link
            href="tel:119"
            className="rounded-[1.5rem] bg-[#FFE7E7] px-6 py-5 text-center text-xl font-black text-[#8A2525] shadow-sm"
          >
            긴급하면 119
          </Link>
          <Link
            href="/child/daily-care"
            className="rounded-[1.5rem] bg-white px-6 py-5 text-center text-xl font-black text-[#173B36] shadow-sm ring-1 ring-[#D8EEE8]"
          >
            보호자 화면 보기
          </Link>
        </div>

        <div className="rounded-[2rem] bg-[#F7FBFF] p-5 text-sm font-bold leading-7 text-[#5F7772] ring-1 ring-[#DCEDE7]">
          안부온은 의료 진단이 아니라 가족의 안부 확인을 돕는 기능입니다.
          몸이 많이 아프거나 응급상황이면 119에 연락하세요.
        </div>
      </section>
    </main>
  )
}
