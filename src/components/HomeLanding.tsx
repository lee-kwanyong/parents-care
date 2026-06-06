'use client'

import Link from 'next/link'

const infoCards = [
  {
    title: '3분 안에 접수',
    desc: '상황 설명 → 부모님 코드 입력 → 안심케어 시작',
    accent: '3분'
  },
  {
    title: '부모님 연결 유지',
    desc: '부모님이 6자리 코드를 입력하면 같은 기기에서 연결 상태가 유지됩니다.',
    accent: '연결'
  },
  {
    title: '자녀가 한눈에',
    desc: '식사·약·몸 상태·도움 요청을 자녀 리포트 화면에서 확인합니다.',
    accent: '케어'
  }
]

export function HomeLanding() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_48%,#F7FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-10">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            40대 이상 보호자용 · 쉬운 부모님 케어
          </div>

          <h1 className="mt-7 text-5xl font-black leading-tight tracking-[-0.09em] text-[#17443F] sm:text-7xl">
            부모님 안심케어,
            <br />
            쉽게 시작하세요.
          </h1>

          <p className="mt-7 max-w-4xl text-xl font-bold leading-10 text-[#637B76] sm:text-2xl sm:leading-[3.25rem]">
            앱이 어려워도 괜찮습니다. 부모님은 6자리 코드로 접속하고,
            자녀는 식사·약·몸 상태를 한 화면에서 확인합니다.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/parent/login"
              className="rounded-[1.5rem] bg-[#247A71] px-6 py-5 text-center text-lg font-black text-white shadow-sm sm:text-xl"
            >
              부모님 코드입력
            </Link>

            <Link
              href="/install"
              className="rounded-[1.5rem] bg-[#EFFFFA] px-6 py-5 text-center text-lg font-black text-[#17443F] ring-1 ring-[#CDEFE7] sm:text-xl"
            >
              홈 화면에 추가하기
            </Link>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {infoCards.map((item) => (
            <article
              key={item.title}
              className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8"
            >
              <div className="text-5xl font-black tracking-[-0.08em] text-[#20B69E]">
                {item.accent}
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-[-0.06em] text-[#17443F]">
                {item.title}
              </h2>

              <p className="mt-4 text-base font-bold leading-8 text-[#637B76]">
                {item.desc}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-[#247A71] p-6 text-white shadow-sm sm:p-8">
            <div className="text-sm font-black text-[#A7F2E3]">
              부모님 안부 확인
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.08em]">
              오늘 상태를
              <br />
              가족에게 전달합니다.
            </h2>

            <p className="mt-5 text-base font-bold leading-8 text-[#E7FFF7]">
              괜찮아요, 식사했어요, 약 먹었어요, 몸이 불편해요 같은 버튼으로 자녀에게 상태가 전달됩니다.
            </p>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
            <div className="grid gap-3">
              <div className="rounded-2xl bg-[#EFFFFA] p-4 ring-1 ring-[#CDEFE7]">
                <div className="text-xs font-black text-[#2AA897]">식사</div>
                <div className="mt-1 text-xl font-black text-[#17443F]">식사했어요</div>
              </div>

              <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-xs font-black text-[#637B76]">복약</div>
                <div className="mt-1 text-xl font-black text-[#17443F]">약 먹었어요</div>
              </div>

              <div className="rounded-2xl bg-[#FFF9EE] p-4 ring-1 ring-[#F3DEB5]">
                <div className="text-xs font-black text-[#795C22]">몸 상태</div>
                <div className="mt-1 text-xl font-black text-[#17443F]">불편한 곳 확인 가능</div>
              </div>
            </div>
          </section>
        </section>
      </section>
    </main>
  )
}

export default HomeLanding
