import Link from 'next/link'

const careNeeds = [
  { title: '병원에 혼자 못 가세요', desc: '예약, 접수, 진료, 약국, 귀가 확인' },
  { title: '밥을 잘 못 챙겨 드세요', desc: '식사 확인, 회복식, 안심밥상 연결' },
  { title: '약을 잘 드시는지 모르겠어요', desc: '약 봉투, 복용 시간, 미확인 알림' },
  { title: '퇴원 후 집에서 걱정돼요', desc: '퇴원 후 7일, 통증, 낙상, 다음 외래' },
  { title: '보험서류가 필요해요', desc: '영수증, 처방전, 세부내역서 정리' },
  { title: '뭘 해야 할지 모르겠어요', desc: '상황만 알려주면 운영실이 정리' }
]

const statCards = [
  { value: '3분', title: '안에 접수', desc: '상황 설명 → 사진/메모 → 안심케어 시작', href: '/care-request' },
  { value: '사진·카톡', title: '접수 가능', desc: '앱 입력이 어려워도 맡길 수 있어요', href: '/care-intake' },
  { value: '검증', title: '매니저 연결', desc: '본인 확인·신분확인 후 접수 배정', href: '/care-difference' },
  { value: '30초', title: '요약 리포트', desc: '부모님 상태와 다음 할 일 확인', href: '/child/reports' }
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_52%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_20px_60px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] md:p-10">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            40대 이상 보호자용 · 쉬운 부모님 케어
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] md:text-6xl">
                부모님 안심케어,
                <br />
                쉽게 시작하세요.
              </h1>

              <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-[#637B76]">
                앱이 어려워도 괜찮습니다. 사진, 카톡, 전화, 한 줄 메모만으로
                병원·식사·약·서류·퇴원 후 케어를 운영실이 정리합니다.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/care-intake" className="rounded-2xl bg-[#19B99A] px-5 py-4 text-base font-black text-white">
                  사진·카톡으로 바로 맡기기
                </Link>
                <Link href="/care-request" className="rounded-2xl bg-white px-5 py-4 text-base font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                  부모님 안심케어하기
                </Link>
                <Link href="/install" className="rounded-2xl bg-[#EFFFF9] px-5 py-4 text-base font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
                  홈 화면에 추가하기
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {statCards.map((card) => (
                  <Link
                    key={card.title}
                    href={card.href}
                    className="rounded-[1.75rem] bg-[#FBFEFD] p-5 shadow-sm ring-1 ring-[#D8EEE8] transition hover:-translate-y-0.5"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-3xl font-black text-[#15A68D]">{card.value}</span>
                      <span className="text-lg font-black text-[#173B36]">{card.title}</span>
                    </div>
                    <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{card.desc}</p>
                    <div className="mt-4 text-sm font-black text-[#159A84]">바로가기 →</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-[#F4FFFB] p-5 ring-1 ring-[#D8EEE8]">
              <p className="text-sm font-black text-[#13A88F]">어떤 안심케어가 필요하세요?</p>

              <div className="mt-4 space-y-3">
                {careNeeds.map((item) => (
                  <div key={item.title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#E3F0ED]">
                    <h2 className="text-lg font-black text-[#173B36]">{item.title}</h2>
                    <p className="mt-1 text-sm font-bold text-[#637B76]">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-[#B5F1E3] px-4 py-3 text-sm font-black text-[#126F61]">
                잘 모르겠으면 “뭘 해야 할지 모르겠어요”만 눌러도 됩니다.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D8EEE8]">
            <p className="text-sm font-black text-[#13A88F]">사진·카톡 접수</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">사진과 카톡만 보내도 접수가 됩니다.</h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
              복잡한 입력 없이 사진 한 장, 카카오톡 메시지, 짧은 메모만으로 접수할 수 있습니다.
            </p>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D8EEE8]">
            <p className="text-sm font-black text-[#13A88F]">케어 범위</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">병원, 식사, 약, 서류, 퇴원 후 관리까지 이어집니다.</h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
              한 번의 접수로 끝나는 것이 아니라 부모님 상황에 맞는 후속 케어까지 연결합니다.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
