import Link from 'next/link'

const worryCards = [
  {
    emoji: '🏥',
    title: '병원에 혼자 못 가세요',
    desc: '예약, 접수, 진료, 약국, 귀가 확인'
  },
  {
    emoji: '🍱',
    title: '밥을 잘 못 챙겨 드세요',
    desc: '식사 확인, 회복식, 안심밥상 연결'
  },
  {
    emoji: '💊',
    title: '약을 잘 드시는지 모르겠어요',
    desc: '약 봉투, 복용 시간, 미확인 알림'
  },
  {
    emoji: '🏠',
    title: '퇴원 후 집에서 걱정돼요',
    desc: '퇴원 후 7일, 통증, 낙상, 다음 외래'
  },
  {
    emoji: '📄',
    title: '보험서류가 필요해요',
    desc: '영수증, 처방전, 세부내역서 정리'
  },
  {
    emoji: '💬',
    title: '뭘 해야 할지 모르겠어요',
    desc: '상황만 알려주면 운영실이 정리'
  }
]

const proofPoints = [
  {
    value: '3번',
    label: '안에 접수',
    desc: '걱정 선택 → 사진/메모 → 맡기기'
  },
  {
    value: '사진·카톡',
    label: '접수 가능',
    desc: '앱 입력이 어려워도 맡길 수 있음'
  },
  {
    value: '검증',
    label: '매니저 매칭',
    desc: '본인확인·신분확인·면접 후 배정'
  },
  {
    value: '30초',
    label: '요약 리포트',
    desc: '부모님 상태와 다음 할 일 확인'
  }
]

const servicePacks = [
  {
    emoji: '🏥',
    title: '병원 안심팩',
    desc: '병원·약국 동행, 접수·수납 도움',
    tag: '가장 기본'
  },
  {
    emoji: '🍱',
    title: '식사·약 안심팩',
    desc: '안심밥상, 복약 확인, 가족 알림',
    tag: '생활 케어'
  },
  {
    emoji: '🏠',
    title: '퇴원 후 7일',
    desc: '약, 식사, 통증, 낙상, 다음 외래 확인',
    tag: '회복 집중'
  },
  {
    emoji: '📄',
    title: '서류 챙김팩',
    desc: '영수증, 처방전, 보험서류 정리',
    tag: '번거로움 해결'
  }
]

const flowSteps = [
  ['1', '걱정 접수', '전화·카톡·사진·한 줄 메모'],
  ['2', '케어플랜 정리', '병원·식사·약·서류 중 필요한 도움 정리'],
  ['3', '검증 연결', '검증 매니저 또는 케어 서비스 연결'],
  ['4', '보호자 공유', '출발·도착·진행상황·특이사항 알림'],
  ['5', '케어 리포트', '부모님 상태와 다음 할 일 전달']
]

const differenceCards = [
  {
    title: '병원동행만이 아닙니다',
    desc: '식사, 약, 서류, 퇴원 후 7일까지 부모님 걱정을 함께 정리합니다.'
  },
  {
    title: '매칭보다 케어플랜이 먼저입니다',
    desc: '사용자는 기능을 고르는 게 아니라 걱정을 맡깁니다.'
  },
  {
    title: '부모님 상태를 미리 공유합니다',
    desc: '오른쪽 귀, 다리 통증, 알러지, 복용약을 케어패스포트로 정리합니다.'
  },
  {
    title: '평가가 안심도에 반영됩니다',
    desc: '매칭 후 평가가 매니저 신뢰카드와 운영 기준에 반영됩니다.'
  }
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F6FCFA_45%,#F7FBFF_100%)] text-[#24423F]">
      <header className="sticky top-0 z-40 border-b border-[#E3F0ED] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(82,112,108,0.08)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DCF8F1] text-2xl">
              ♡
            </div>
            <div>
              <div className="text-lg font-black tracking-[-0.02em]">
                부모님 케어 플랫폼
              </div>
              <div className="text-xs font-bold text-[#6F8D89]">
                부모님 걱정을 간단히 맡기는 앱
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {[
              ['걱정 맡기기', '/care-request'],
              ['사진·카톡 접수', '/care-intake'],
              ['자녀앱', '/child'],
              ['부모님앱', '/parent/today'],
              ['데모', '/buyer-demo']
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full bg-[#F2FAF8] px-4 py-2 text-sm font-black text-[#537875] ring-1 ring-[#DDEEEA] transition hover:bg-[#E4F7F2]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#467C76] ring-1 ring-[#D7ECE8] shadow-[0_10px_30px_rgba(113,178,168,0.12)]">
            <span className="h-2 w-2 rounded-full bg-[#73D6C5]" />
            40대 이상 보호자용 · 쉬운 부모님 케어
          </div>

          <h1 className="mt-6 text-5xl font-black leading-[1.03] tracking-[-0.06em] text-[#193B38] md:text-7xl">
            부모님 걱정,
            <br />
            쉽게 맡기세요.
          </h1>

          <p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-[#607D79] md:text-xl md:leading-9">
            앱이 어려워도 괜찮습니다. 사진, 카톡, 전화, 한 줄 메모만으로 병원·식사·약·서류·퇴원 후 케어를 운영실이 정리합니다.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/care-intake"
              className="inline-flex items-center justify-center rounded-3xl bg-[#74D6C6] px-7 py-5 text-lg font-black text-[#113E39] shadow-[0_18px_45px_rgba(116,214,198,0.28)] transition hover:bg-[#65CDBD]"
            >
              사진·카톡으로 바로 맡기기
            </Link>
            <Link
              href="/care-request"
              className="inline-flex items-center justify-center rounded-3xl bg-white px-7 py-5 text-lg font-black text-[#426C68] ring-1 ring-[#CFE7E2] transition hover:bg-[#F2FAF8]"
            >
              걱정 선택하기
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {proofPoints.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-[#E0EFEC] bg-white p-4 shadow-[0_12px_34px_rgba(125,169,162,0.10)]"
              >
                <div className="text-2xl font-black text-[#39A997]">{item.value}</div>
                <div className="mt-1 text-sm font-black text-[#24423F]">{item.label}</div>
                <p className="mt-2 text-xs font-bold leading-5 text-[#718A87]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-5 -top-5 h-28 w-28 rounded-full bg-[#DFF8F2] blur-2xl" />
          <div className="absolute -bottom-8 right-4 h-32 w-32 rounded-full bg-[#DCEEFF] blur-2xl" />

          <div className="relative rounded-[2rem] border border-[#DCEEEA] bg-white p-5 shadow-[0_24px_70px_rgba(125,169,162,0.18)]">
            <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#F1FBF8_0%,#F7FCFF_100%)] p-5">
              <div className="text-sm font-black text-[#48A596]">
                무엇이 걱정되세요?
              </div>

              <div className="mt-4 grid gap-3">
                {worryCards.map((item) => (
                  <Link
                    key={item.title}
                    href="/care-request"
                    className="group flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-[#E2F0ED] transition hover:-translate-y-0.5 hover:bg-[#F7FDFC] hover:shadow-[0_10px_28px_rgba(125,169,162,0.14)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ECF8F5] text-2xl">
                      {item.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-black text-[#24423F]">
                        {item.title}
                      </div>
                      <div className="mt-1 text-sm font-bold text-[#6F8D89]">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-[#A8F0DD] px-5 py-4 text-sm font-black leading-6 text-[#1A4B43]">
                잘 모르겠으면 “뭘 해야 할지 모르겠어요”만 눌러도 됩니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-8">
        <div className="rounded-[2rem] border border-[#DDEEEA] bg-white p-6 shadow-[0_18px_50px_rgba(125,169,162,0.12)] md:p-8">
          <div className="inline-flex rounded-full bg-[#EAF7F4] px-4 py-2 text-sm font-black text-[#4B8079]">
            빠른 시작
          </div>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-[#193B38] md:text-5xl">
            3번 안에 끝납니다
          </h2>
          <p className="mt-3 text-base font-bold leading-7 text-[#698783]">
            복잡한 메뉴 대신 가장 많이 쓰는 행동부터 보여줍니다.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              ['1', '걱정 선택', '병원, 밥, 약, 퇴원 후, 서류 중 하나만 고릅니다.'],
              ['2', '사진·카톡 첨부', '예약 문자, 약 봉투, 영수증을 그대로 올립니다.'],
              ['3', '운영실 정리', '운영실이 케어플랜과 다음 행동을 정리합니다.']
            ].map(([num, title, desc]) => (
              <div key={num} className="rounded-[1.5rem] bg-[#F6FCFA] p-5 ring-1 ring-[#E1F0EC]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#74D6C6] text-xl font-black text-[#103E38]">
                  {num}
                </div>
                <h3 className="mt-4 text-2xl font-black text-[#24423F]">{title}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-[#718A87]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-[#F1F8FF] px-4 py-2 text-sm font-black text-[#52758D]">
              케어 영역
            </div>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-[#193B38]">
              병원동행을 넘어 생활 케어까지
            </h2>
          </div>
          <Link
            href="/care-request"
            className="rounded-3xl bg-[#DCEEFF] px-6 py-4 text-center text-base font-black text-[#3F627B] ring-1 ring-[#C7E1F3]"
          >
            케어 요청하기
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {servicePacks.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.75rem] border border-[#E0EFEC] bg-white p-5 shadow-[0_14px_40px_rgba(125,169,162,0.10)]"
            >
              <div className="flex items-center justify-between">
                <div className="text-4xl">{item.emoji}</div>
                <span className="rounded-full bg-[#F2FAF8] px-3 py-1 text-xs font-black text-[#5B7E79]">
                  {item.tag}
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-black text-[#24423F]">{item.title}</h3>
              <p className="mt-3 text-sm font-bold leading-6 text-[#718A87]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-[2rem] border border-[#DDEEEA] bg-[#FBFEFD] p-6 md:p-8">
          <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-[#4B8079] ring-1 ring-[#E0EFEC]">
            진행 흐름
          </div>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-[#193B38]">
            걱정이 케어 리포트가 되는 과정
          </h2>

          <div className="mt-7 grid gap-4 lg:grid-cols-5">
            {flowSteps.map(([num, title, desc]) => (
              <div key={num} className="rounded-[1.5rem] bg-white p-5 ring-1 ring-[#E1F0EC]">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E5F8F4] text-lg font-black text-[#3C7B72]">
                  {num}
                </div>
                <h3 className="mt-4 text-xl font-black text-[#24423F]">{title}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-[#718A87]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6">
          <div className="inline-flex rounded-full bg-[#FFF7E8] px-4 py-2 text-sm font-black text-[#8A6C35]">
            차별화
          </div>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-[#193B38]">
            기존 병원동행과 다르게 봐야 합니다
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {differenceCards.map((item) => (
            <div key={item.title} className="rounded-[1.75rem] border border-[#E5EFEA] bg-white p-6 shadow-[0_14px_38px_rgba(125,169,162,0.09)]">
              <h3 className="text-2xl font-black text-[#24423F]">{item.title}</h3>
              <p className="mt-3 text-base font-bold leading-7 text-[#6E8884]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 pb-16">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#DFF8F2_0%,#EAF6FF_100%)] p-6 shadow-[0_18px_50px_rgba(125,169,162,0.14)] md:p-8">
          <h2 className="text-3xl font-black tracking-[-0.03em] text-[#193B38]">
            의료행위를 대신하지 않습니다.
          </h2>
          <p className="mt-3 text-base font-bold leading-7 text-[#54726E]">
            부모님 걱정해결 케어는 이동·동행·기록·보호자 공유 중심의 안심형 케어 서비스입니다. 의료 판단과 처방 변경은 의료진의 영역입니다.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/buyer-demo"
              className="rounded-3xl bg-white px-7 py-5 text-center text-lg font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
            >
              바이어 데모 보기
            </Link>
            <Link
              href="/demo-start"
              className="rounded-3xl bg-[#74D6C6] px-7 py-5 text-center text-lg font-black text-[#113E39]"
            >
              작동 데모 시작
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
