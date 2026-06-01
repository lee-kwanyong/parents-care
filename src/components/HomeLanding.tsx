'use client'

import Link from 'next/link'

const infoCards = [
  {
    badge: '부모님',
    title: '안부버튼',
    desc: '부모님이 식사, 복약, 몸 상태를 바로 알려줄 수 있습니다.'
  },
  {
    badge: '부모님',
    title: '안심동의',
    desc: '부모님이 자녀에게 공유할 정보를 직접 선택합니다.'
  },
  {
    badge: '보호자',
    title: '자녀-부모 연결',
    desc: '보호자가 부모님께 전달할 6자리 연결코드를 만듭니다.'
  },
  {
    badge: '보호자',
    title: '부모님 케어',
    desc: '보호자가 식사, 약, 몸 상태, 도움 요청을 한 화면에서 확인합니다.'
  },
  {
    badge: '운영',
    title: '무응답 관리',
    desc: '응답이 없을 때 보호자 확인, 가족 2차 확인, 운영실 확인으로 이어집니다.'
  },
  {
    badge: '실증',
    title: '실증 리포트',
    desc: '안부 응답률, 확인 완료율, 부모님 부담도, 보호자 만족도를 정리합니다.'
  }
]

export function HomeLanding() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_54%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-9">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            부모님 안심케어
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
            부모님 안부를
            <br />
            가족이 함께 확인합니다.
          </h1>

          <p className="mt-5 max-w-3xl text-base font-bold leading-8 text-[#637B76] sm:text-lg">
            부모님은 6자리 코드로 안부 버튼을 누르고,
            보호자는 식사·약·몸 상태·도움 요청을 한 화면에서 확인합니다.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href="/parent/login"
              className="rounded-2xl bg-[#193B38] px-5 py-5 text-center text-base font-black text-white shadow-sm"
            >
              부모님 코드입력
            </Link>

            <Link
              href="/install"
              className="rounded-2xl bg-white px-5 py-5 text-center text-base font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              홈 화면에 추가하기
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {infoCards.map((item) => (
            <article
              key={`${item.badge}-${item.title}`}
              className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6"
            >
              <span className="inline-flex rounded-full bg-[#E8FAF5] px-3 py-1 text-xs font-black text-[#11977F]">
                {item.badge}
              </span>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.06em]">
                {item.title}
              </h2>

              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                {item.desc}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] bg-[#123F38] p-5 text-white sm:p-7">
          <h2 className="text-2xl font-black tracking-[-0.06em]">
            역할별 사용 흐름
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              <div className="text-sm font-black text-[#A7F2E3]">부모님</div>
              <p className="mt-2 text-sm font-bold leading-7 text-[#E7FFF7]">
                6자리 코드입력 → 안부버튼 → 안심동의
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              <div className="text-sm font-black text-[#A7F2E3]">보호자</div>
              <p className="mt-2 text-sm font-bold leading-7 text-[#E7FFF7]">
                회원가입 → 자녀-부모 연결 → 부모님 케어 확인
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              <div className="text-sm font-black text-[#A7F2E3]">운영실</div>
              <p className="mt-2 text-sm font-bold leading-7 text-[#E7FFF7]">
                무응답 관리 → Risk-to-Action → 결과 라벨링
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default HomeLanding
