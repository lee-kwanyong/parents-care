import Link from 'next/link'

export default function ManagerHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-10">
          <p className="text-sm font-black text-emerald-700">동행매니저앱</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
            오늘 현장에서
            <br />
            꼭 확인할 것만 봅니다.
          </h1>
          <p className="mt-5 max-w-3xl text-xl leading-9 text-slate-600">
            부모님 상태, 만남 암호, 알러지, 복용약, 이동 정책, 서류, 약국, 안전 귀가를 체크합니다.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link href="/manager/today" className="rounded-3xl bg-emerald-600 p-6 text-white">
              <h2 className="text-2xl font-black">오늘 배정 보기</h2>
              <p className="mt-2 text-emerald-50">현장 체크리스트와 진행상태 업데이트</p>
            </Link>
            <Link href="/ops/manager-field" className="rounded-3xl bg-slate-900 p-6 text-white">
              <h2 className="text-2xl font-black">운영실 현장 보드</h2>
              <p className="mt-2 text-slate-200">배정 생성과 리포트 검수</p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
