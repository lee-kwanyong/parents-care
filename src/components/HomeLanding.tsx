'use client'

import Link from 'next/link'

const featureCards = [
  {
    step: '01',
    title: '부모님은 쉽게',
    desc: '회원가입 없이 자녀가 알려준 6자리 코드만 입력하고 안부 버튼을 누릅니다.'
  },
  {
    step: '02',
    title: '보호자는 한눈에',
    desc: '식사, 약, 몸 상태, 도움 요청을 부모님 케어 화면에서 확인합니다.'
  },
  {
    step: '03',
    title: '부담 없이 오래',
    desc: '위치와 사진 공유는 기본으로 꺼두고, 부모님이 원하는 정보만 공유합니다.'
  }
]

const careCards = [
  {
    badge: '안부',
    title: '오늘 상태 확인',
    desc: '괜찮아요, 식사했어요, 약 먹었어요 같은 간단한 버튼으로 오늘 상태를 전달합니다.'
  },
  {
    badge: '확인',
    title: '무응답 확인',
    desc: '안부 응답이 없을 때 보호자가 확인할 수 있도록 흐름을 정리합니다.'
  },
  {
    badge: '동의',
    title: '부모님 안심동의',
    desc: '부모님이 자녀에게 공유할 항목을 직접 선택합니다.'
  },
  {
    badge: '케어',
    title: '보호자 화면',
    desc: '보호자는 부모님의 식사, 복약, 몸 상태를 한 화면에서 확인합니다.'
  }
]

export function HomeLanding() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F8FFFC_0%,#FFFFFF_48%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-9 lg:p-10">
              <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
                부모님 안심케어
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                멀리 있어도
                <br />
                부모님 안부를
                <br />
                놓치지 않도록.
              </h1>

              <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-[#637B76] sm:text-lg">
                부모님은 복잡한 가입 없이 6자리 코드로 안부를 알려주고,
                보호자는 부모님 상태를 한 화면에서 확인합니다.
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

              <p className="mt-4 text-xs font-bold leading-6 text-[#7A9692]">
                메인 화면에서 클릭 가능한 버튼은 부모님 코드입력과 홈 화면에 추가하기 두 가지입니다.
              </p>
            </div>

            <div className="bg-[#F1FFFA] p-6 sm:p-9 lg:p-10">
              <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8]">
                <div className="text-sm font-black text-[#11977F]">오늘 부모님 상태</div>
                <div className="mt-3 text-4xl font-black tracking-[-0.08em] text-[#173B36]">
                  확인 중
                </div>
                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                  식사, 약, 몸 상태, 도움 요청을 보호자가 확인할 수 있도록 정리합니다.
                </p>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl bg-[#EFFFF9] p-4 ring-1 ring-[#CDEFE5]">
                    <div className="text-xs font-black text-[#116D5F]">식사</div>
                    <div className="mt-1 text-lg font-black text-[#173B36]">식사했어요</div>
                  </div>

                  <div className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                    <div className="text-xs font-black text-[#637B76]">복약</div>
                    <div className="mt-1 text-lg font-black text-[#173B36]">약 먹었어요</div>
                  </div>

                  <div className="rounded-2xl bg-[#FFF8E8] p-4 ring-1 ring-[#F4D8A5]">
                    <div className="text-xs font-black text-[#795313]">몸 상태</div>
                    <div className="mt-1 text-lg font-black text-[#173B36]">불편한 곳 확인 가능</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {featureCards.map((item) => (
            <article
              key={item.step}
              className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8FAF5] text-sm font-black text-[#11977F]">
                {item.step}
              </div>

              <h2 className="mt-5 text-2xl font-black tracking-[-0.06em]">
                {item.title}
              </h2>

              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                {item.desc}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
                주요 기능
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
                가족이 함께 보는 안부 흐름
              </h2>
            </div>
            <p className="text-sm font-bold leading-7 text-[#637B76]">
              아래 카드는 설명용입니다. 메인 클릭 버튼은 위 두 개만 유지합니다.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {careCards.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.5rem] bg-[#F8FCFB] p-5 ring-1 ring-[#D8EEE8]"
              >
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#11977F] ring-1 ring-[#D8EEE8]">
                  {item.badge}
                </span>

                <h3 className="mt-4 text-xl font-black tracking-[-0.05em]">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#123F38] p-5 text-white sm:p-7">
          <h2 className="text-2xl font-black tracking-[-0.06em]">
            사용하는 순서
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
                무응답 관리 → 행동 가이드 → 결과 기록
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

export default HomeLanding
