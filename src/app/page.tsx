import Link from 'next/link'

const headerLinks = [
  { label: '걱정접수', href: '/care-request' },
  { label: '사진·카톡', href: '/care-intake' },
  { label: '케어범위', href: '/care-scope' },
  { label: '신뢰기준', href: '/trust' },
  { label: '금액', href: '/pricing' },
  { label: '보호자', href: '/signup/guardian' },
  { label: '부모님', href: '/parent/login' },
  { label: '파트너', href: '/signup/manager' },
  { label: '홈추가', href: '/install' },
]

const careNeeds = [
  {
    title: '병원에 혼자 못 가세요',
    desc: '예약, 접수, 진료, 약국, 귀가 확인',
    emoji: '🏥',
  },
  {
    title: '밥을 잘 못 챙겨 드세요',
    desc: '식사 확인, 회복식, 안심밥상 연결',
    emoji: '🍱',
  },
  {
    title: '약을 잘 드시는지 모르겠어요',
    desc: '약 봉투, 복용 시간, 미확인 알림',
    emoji: '💊',
  },
  {
    title: '퇴원 후 집에서 걱정돼요',
    desc: '퇴원 후 7일, 통증, 낙상, 다음 외래',
    emoji: '🏠',
  },
  {
    title: '보험서류가 필요해요',
    desc: '영수증, 처방전, 세부내역서 정리',
    emoji: '📄',
  },
  {
    title: '뭘 해야 할지 모르겠어요',
    desc: '상황만 알려주면 운영실이 정리',
    emoji: '💬',
  },
]

const statCards = [
  { value: '3분', title: '안에 접수', desc: '상황 설명 → 사진/메모 → 안심케어 시작' },
  { value: '사진·카톡', title: '접수 가능', desc: '앱 입력이 어려워도 맡길 수 있어요' },
  { value: '검증', title: '매니저 연결', desc: '본인 확인·신분확인 후 접수 배정' },
  { value: '30초', title: '요약 리포트', desc: '부모님 상태와 다음 할 일 확인' },
]

function PillLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 touch-manipulation items-center justify-center rounded-full border border-[#D9ECE6] bg-[#F4FBF8] px-4 py-2.5 text-sm font-bold leading-none text-[#2D5B54] transition hover:border-[#23C7A9] hover:bg-white hover:text-[#173B36]"
    >
      <span className="block whitespace-nowrap [word-break:keep-all]">
        {label}
      </span>
    </Link>
  )
}

function SectionCard({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <section id={id} className="rounded-[28px] border border-[#DDEEE8] bg-white p-6 shadow-[0_12px_40px_rgba(35,199,169,0.08)] sm:p-8">
      <div className="mb-3 inline-flex rounded-full bg-[#ECF9F5] px-3 py-1 text-xs font-bold text-[#189B84]">
        {eyebrow}
      </div>
      <h3 className="text-2xl font-black tracking-[-0.03em] text-[#173B36]">{title}</h3>
      <p className="mt-3 text-base leading-7 text-[#56716B]">{description}</p>
    </section>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FCFA_0%,#EEF7F4_100%)] text-[#173B36]">
      <header className="sticky top-0 z-40 border-b border-[#E3F1EC] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#24C6A8] text-2xl text-white shadow-[0_10px_24px_rgba(36,198,168,0.28)]">
              <img src="/icons/parents-care-logo.jpg" alt="부모님 안심케어 로고" className="h-12 w-12 rounded-2xl object-cover" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[28px] font-black tracking-[-0.04em] text-[#173B36] sm:text-3xl">
                부모님 안심케어
              </div>
              <div className="truncate text-sm font-medium text-[#6A8780]">
                부모님 안심케어를 간단히 시작하세요.
              </div>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 lg:block">
            <div className="flex min-w-0 items-center justify-end gap-2 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {headerLinks.map((item) => (
                <PillLink key={item.label} href={item.href} label={item.label} />
              ))}
              <Link
                href="/login"
                className="inline-flex shrink-0 touch-manipulation items-center justify-center whitespace-nowrap rounded-full border border-[#23C7A9] bg-white px-5 py-3 text-sm font-bold leading-none text-[#159A84] shadow-[0_8px_20px_rgba(35,199,169,0.10)] transition hover:bg-[#F0FFFB] active:scale-[0.98] [word-break:keep-all]"
              >
                로그인
              </Link>
              <Link
                href="/app"
                className="relative z-[80] inline-flex shrink-0 touch-manipulation items-center justify-center whitespace-nowrap rounded-full bg-[#23C7A9] px-5 py-3 text-sm font-bold leading-none text-white shadow-[0_8px_20px_rgba(35,199,169,0.26)] transition hover:opacity-90 active:scale-[0.98] [word-break:keep-all]"
              >
                메뉴
              </Link>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 lg:hidden">
            <Link
              href="/login"
              className="relative z-[80] inline-flex min-h-11 touch-manipulation items-center justify-center whitespace-nowrap rounded-full border border-[#23C7A9] bg-white px-4 py-3 text-sm font-bold text-[#159A84] shadow-[0_8px_20px_rgba(35,199,169,0.10)] active:scale-[0.98] [word-break:keep-all]"
            >
              로그인
            </Link>
            <Link
              href="/app"
              className="relative z-[80] inline-flex min-h-11 touch-manipulation items-center justify-center whitespace-nowrap rounded-full bg-[#23C7A9] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(35,199,169,0.26)] active:scale-[0.98] [word-break:keep-all]"
            >
              메뉴
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section
          id="hero"
          className="grid items-start gap-8 rounded-[32px] border border-[#DDEEE8] bg-white px-6 py-8 shadow-[0_20px_60px_rgba(35,199,169,0.08)] sm:px-8 sm:py-10 xl:grid-cols-[1.05fr_0.95fr]"
        >
          <div>
            <div className="inline-flex rounded-full border border-[#CBECE3] bg-[#F3FBF8] px-4 py-2 text-sm font-bold text-[#169D84]">
              40대 이상 보호자용 · 쉬운 부모님 케어
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-[-0.05em] text-[#173B36] sm:text-5xl lg:text-6xl">
              부모님 안심케어,
              <br />
              쉽게 시작하세요.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#56716B]">
              앱이 어려워도 괜찮습니다. 사진, 카톡, 전화, 한 줄 메모만으로 병원·식사·약·서류·퇴원 후 케어를
              운영실이 정리합니다.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/care-intake"
                className="inline-flex min-h-[60px] items-center justify-center rounded-[22px] bg-[#23C7A9] px-7 text-lg font-black text-white shadow-[0_14px_30px_rgba(35,199,169,0.25)] transition hover:-translate-y-0.5 hover:opacity-95"
              >
                사진·카톡으로 바로 맡기기
              </Link>

              <Link
                href="/care-request"
                className="inline-flex min-h-[60px] items-center justify-center rounded-[22px] border border-[#CFE7E0] bg-white px-7 text-lg font-black text-[#204A44] transition hover:border-[#23C7A9] hover:bg-[#F7FFFC]"
              >
                부모님 안심케어하기
              </Link>

              <Link
                href="/install"
                className="inline-flex min-h-[60px] items-center justify-center rounded-[22px] border border-[#CFE7E0] bg-white px-7 text-lg font-black text-[#204A44] transition hover:border-[#23C7A9] hover:bg-[#F7FFFC]"
              >
                홈 화면에 추가하기
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[24px] border border-[#DCEDE7] bg-[#FBFEFD] p-5 shadow-[0_8px_20px_rgba(20,82,70,0.04)]"
                >
                  <div className="text-4xl font-black tracking-[-0.04em] text-[#15A68D]">{card.value}</div>
                  <div className="mt-2 text-xl font-black tracking-[-0.03em] text-[#173B36]">{card.title}</div>
                  <p className="mt-2 text-sm leading-6 text-[#607B74]">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-[#DAEEE8] bg-[#F3FBF8] p-5 sm:p-6">
            <div className="mb-4 text-sm font-black text-[#249D87]">어떤 안심케어가 필요하세요?</div>
            <div className="space-y-3">
              {careNeeds.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-[22px] border border-[#E1F1EC] bg-white px-4 py-4 shadow-[0_8px_18px_rgba(20,82,70,0.04)]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2FBF8] text-2xl">
                    {item.emoji}
                  </div>
                  <div>
                    <div className="text-lg font-black tracking-[-0.03em] text-[#173B36]">{item.title}</div>
                    <div className="mt-1 text-sm leading-6 text-[#607B74]">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[20px] bg-[#BCEEDD] px-4 py-3 text-sm font-bold text-[#1B5B51]">
              잘 모르겠으면 “뭘 해야 할지 모르겠어요”만 눌러도 됩니다.
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <SectionCard
            id="photo-kakao"
            eyebrow="사진·카톡 접수"
            title="사진과 카톡만 보내도 접수가 됩니다."
            description="복잡한 입력 없이 사진 한 장, 카카오톡 메시지, 짧은 메모만으로도 접수할 수 있게 구성했습니다. 보호자가 바쁜 상황에서도 빠르게 시작할 수 있도록 가장 쉬운 방식부터 제공합니다."
          />
          <SectionCard
            id="care-scope"
            eyebrow="케어 범위"
            title="병원, 식사, 약, 서류, 퇴원 후 관리까지 이어집니다."
            description="한 번의 접수로 끝나는 것이 아니라 부모님 상황에 맞는 후속 케어까지 연결합니다. 병원 방문 확인, 식사/약 체크, 서류 정리, 귀가 후 주의사항까지 필요한 범위를 넓게 다룹니다."
          />
          <SectionCard
            id="trust"
            eyebrow="신뢰 기준"
            title="검증과 확인 절차를 우선으로 둡니다."
            description="보호자가 가장 걱정하는 부분은 ‘믿을 수 있느냐’입니다. 그래서 본인 확인, 접수 확인, 상황 정리, 보고 흐름을 이해하기 쉽게 설계해 안심하고 맡길 수 있게 했습니다."
          />
          <SectionCard
            id="guardian-care"
            eyebrow="보호자 케어"
            title="보호자는 간편하게 접수하고 결과만 확인하면 됩니다."
            description="복잡한 절차보다 ‘쉽게 신청하고, 확인하고, 필요한 다음 행동을 받는 경험’에 집중했습니다. 모바일에서도 부담 없이 사용할 수 있도록 큰 버튼과 짧은 동선으로 정리했습니다."
          />
          <SectionCard
            id="parent-safe"
            eyebrow="부모님 안심"
            title="부모님은 복잡한 회원가입 없이도 연결할 수 있습니다."
            description="보호자가 먼저 시작하고, 부모님은 안내받은 방식대로 간단히 연결될 수 있도록 설계했습니다. 어려운 가입 절차를 줄여 실제 사용 가능성을 높이는 방향으로 구성했습니다."
          />
          <SectionCard
            id="care-partner"
            eyebrow="케어파트너"
            title="현장 케어와 운영 연결이 자연스럽게 이어지게 합니다."
            description="서비스 설명만 예쁘게 보여주는 것이 아니라 실제 접수, 배정, 확인, 보고가 이어지는 구조를 목표로 하고 있습니다. 보호자가 체감하는 안정감이 서비스의 핵심입니다."
          />
        </div>

        <section
          id="install-guide"
          className="mt-8 rounded-[28px] border border-[#DDEEE8] bg-white p-6 shadow-[0_12px_40px_rgba(35,199,169,0.08)] sm:p-8"
        >
          <div className="mb-3 inline-flex rounded-full bg-[#ECF9F5] px-3 py-1 text-xs font-bold text-[#189B84]">
            홈 화면 추가
          </div>
          <h3 className="text-2xl font-black tracking-[-0.03em] text-[#173B36]">모바일에서 더 편하게 쓰는 방법</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-[#E2F0EB] bg-[#F9FEFC] p-5">
              <div className="text-sm font-black text-[#14A58C]">1단계</div>
              <div className="mt-2 text-lg font-black text-[#173B36]">브라우저 공유 메뉴 열기</div>
              <p className="mt-2 text-sm leading-6 text-[#607B74]">사파리 또는 크롬에서 공유 버튼을 눌러주세요.</p>
            </div>
            <div className="rounded-[22px] border border-[#E2F0EB] bg-[#F9FEFC] p-5">
              <div className="text-sm font-black text-[#14A58C]">2단계</div>
              <div className="mt-2 text-lg font-black text-[#173B36]">홈 화면에 추가 선택</div>
              <p className="mt-2 text-sm leading-6 text-[#607B74]">“홈 화면에 추가”를 선택하면 앱처럼 바로 실행할 수 있습니다.</p>
            </div>
            <div className="rounded-[22px] border border-[#E2F0EB] bg-[#F9FEFC] p-5">
              <div className="text-sm font-black text-[#14A58C]">3단계</div>
              <div className="mt-2 text-lg font-black text-[#173B36]">부모님 안심케어 바로 사용</div>
              <p className="mt-2 text-sm leading-6 text-[#607B74]">다음부터는 홈 화면 아이콘만 눌러 빠르게 접속할 수 있습니다.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
