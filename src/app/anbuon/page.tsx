import Link from 'next/link'

const features = [
  {
    title: '하루 안부 체크',
    desc: '식사, 약, 몸 상태, 기분을 부모님이 큰 버튼으로 응답합니다.'
  },
  {
    title: '응답 없음 확인',
    desc: '일정 시간 응답이 없으면 보호자가 확인할 수 있게 보여줍니다.'
  },
  {
    title: '복약·병원 일정 연결',
    desc: '약과 병원 일정을 보호자 알림과 케어 요청으로 연결합니다.'
  },
  {
    title: '확인 필요 신호',
    desc: '응답 없음, 식사 미확인, 복약 누락, 몸 불편, 기분 저하를 참고 점수로 보여줍니다.'
  },
  {
    title: '보호자 알림 화면',
    desc: '오늘 상태를 정상, 주의, 확인 필요로 한눈에 확인합니다.'
  },
  {
    title: '케어파트너 연결',
    desc: '확인이 필요한 순간 운영실 또는 케어파트너 연결로 이어집니다.'
  }
]

export default function AnbuonPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F4FFFB_50%,#F7FBFF_100%)] px-5 py-10 text-[#173B36]">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2.5rem] bg-white p-8 shadow-[0_20px_60px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] md:p-12">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            안부웍스 AI 안부 기능
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] md:text-6xl">
            안부온은 매일 부모님 안부를 묻고,
            필요한 순간 사람을 연결합니다.
          </h1>

          <p className="mt-6 max-w-3xl text-lg font-bold leading-8 text-[#637B76]">
            부모님이 식사, 복약, 몸 상태, 기분을 간단히 응답하면 보호자는 오늘 상태를 정상/주의/확인 필요로 확인합니다.
            위험을 진단하는 서비스가 아니라 가족의 확인을 돕는 안심 모니터링 기능입니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/parent/today" className="rounded-2xl bg-[#123F38] px-5 py-4 font-black text-white">
              부모님 체크 화면
            </Link>
            <Link href="/child/daily-care" className="rounded-2xl bg-[#20C5A8] px-5 py-4 font-black text-white">
              보호자 알림 화면
            </Link>
            <Link href="/ops/daily-care" className="rounded-2xl bg-[#EFFFF9] px-5 py-4 font-black text-[#116D5F]">
              운영실 관제
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article key={feature.title} className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D8EEE8]">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8FAF5] text-sm font-black text-[#11977F]">
                {index + 1}
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-[-0.05em]">{feature.title}</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{feature.desc}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[2rem] bg-[#123F38] p-6 text-white">
          <p className="text-sm font-black text-[#9DF4DD]">투자자 설명 문장</p>
          <p className="mt-3 text-2xl font-black leading-snug tracking-[-0.04em]">
            안부웍스는 AI 안부 체크에서 케어파트너 연결까지 이어지는 부모님 안심관리 플랫폼입니다.
          </p>
        </div>
      </section>
    </main>
  )
}
