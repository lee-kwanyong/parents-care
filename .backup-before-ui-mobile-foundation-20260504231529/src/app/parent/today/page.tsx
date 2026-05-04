import { ParentDailyCareButtons } from '@/components/ParentDailyCareButtons'

export default function ParentTodayPage() {
  return (
    <main className="min-h-screen bg-emerald-50 px-5 py-6 text-slate-950">
      <section className="mx-auto max-w-xl">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-lg font-black text-emerald-700">오늘 일정</p>
          <h1 className="mt-4 text-4xl font-black leading-tight">
            오늘은
            <br />
            도와드릴 분이
            <br />
            오시는 날이에요.
          </h1>

          <div className="mt-6 rounded-3xl bg-slate-900 p-6 text-white">
            <p className="text-lg font-black text-emerald-200">만나는 분</p>
            <div className="mt-2 text-4xl font-black">김OO 매니저</div>
            <p className="mt-4 text-2xl font-bold">오전 9시에 만나요</p>
          </div>

          <div className="mt-5 rounded-3xl bg-amber-50 p-6">
            <p className="text-lg font-black text-amber-700">만남 암호</p>
            <div className="mt-2 text-6xl font-black tracking-widest">2580</div>
            <p className="mt-3 text-lg font-bold text-amber-900">
              이 번호를 아는 분인지 확인하세요.
            </p>
          </div>

          <div className="mt-5 rounded-3xl bg-blue-50 p-6">
            <p className="text-lg font-black text-blue-700">도와드릴 때 참고할 내용</p>
            <ul className="mt-3 space-y-2 text-xl font-black text-blue-950">
              <li>• 천천히 설명드릴게요</li>
              <li>• 불편하시면 바로 말씀해주세요</li>
              <li>• 약이나 알러지는 자녀분과 확인할게요</li>
            </ul>
          </div>
        </div>

        <ParentDailyCareButtons elderName="어머니" />
      </section>
    </main>
  )
}
