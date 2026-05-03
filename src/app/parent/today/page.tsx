import { BigButton } from '@/components/BigButton'

export default function ParentTodayPage() {
  return (
    <main className="min-h-screen bg-blue-50 px-4 py-5">
      <section className="mx-auto max-w-xl space-y-5">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xl font-black text-blue-700">오늘 병원 일정</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950">오전 10시 30분<br />정형외과 진료</h1>
          <p className="mt-4 text-2xl font-bold text-slate-700">서울튼튼병원</p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xl font-black text-slate-700">만나는 매니저</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">김도윤 매니저</h2>
          <p className="mt-3 text-2xl font-bold text-slate-700">집 앞 9시 20분 만남</p>
          <div className="mt-5 rounded-3xl bg-yellow-100 p-5 text-center">
            <p className="text-xl font-black text-yellow-900">만남 암호</p>
            <p className="mt-2 text-5xl font-black text-yellow-950">봄길 27</p>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-xl font-black text-slate-700">동의 범위</p>
          <p className="mt-2 text-2xl font-bold leading-snug text-slate-950">진료 진행상황, 약/검사/다음 예약, 비용, 컨디션을 자녀에게 공유합니다.</p>
        </div>

        <BigButton href="tel:01000000000">자녀에게 전화</BigButton>
        <BigButton href="tel:119" tone="danger">긴급 도움</BigButton>
        <BigButton href="/child" tone="plain">진행상황 보기</BigButton>
      </section>
    </main>
  )
}
