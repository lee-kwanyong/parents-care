export const metadata = {
  title: '케어 리포트 작성 가이드 | 안부웍스',
  description: '케어파트너가 보호자 리포트를 작성할 때 지켜야 할 기준입니다.'
}

const goodExamples = [
  '오늘 병원 접수와 진료 대기 동행을 진행했습니다. 진료 후 약국에서 처방약 수령을 확인했습니다.',
  '점심 식사는 완료하셨고, 물을 조금 더 드시도록 안내했습니다.',
  '보행은 가능했지만 계단 이동 시 천천히 이동하셨습니다. 보호자께 다음 외출 시 동행을 권장드립니다.'
]

const badExamples = [
  '약을 중단하셔도 됩니다.',
  '치매 증상이 확실합니다.',
  '응급은 아니니 병원에 안 가도 됩니다.',
  '현관 비밀번호는 1234입니다.'
]

export default function CarePartnerReportGuidePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-5 py-8 text-[#17443F]">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            케어파트너 · 리포트 가이드
          </div>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            리포트는 사실 중심으로 짧고 정확하게 작성합니다.
          </h1>
          <p className="mt-4 text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            케어파트너는 의료진이 아닙니다. 진단, 처방, 복약 변경 판단은 하지 않고, 확인한 사실과 보호자에게 필요한 다음 행동만 작성합니다.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">좋은 예시</h2>
          <div className="mt-4 space-y-3">
            {goodExamples.map((item) => (
              <p key={item} className="rounded-2xl bg-[#EFFFFA] p-4 text-sm font-bold leading-7 text-[#2AA897] ring-1 ring-[#CDEFE7]">
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">쓰면 안 되는 예시</h2>
          <div className="mt-4 space-y-3">
            {badExamples.map((item) => (
              <p key={item} className="rounded-2xl bg-[#FFF4F4] p-4 text-sm font-bold leading-7 text-[#8A3030] ring-1 ring-[#F3C8C8]">
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#247A71] p-5 text-white sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">작성 기준</h2>
          <ol className="mt-4 space-y-3 text-sm font-bold leading-7 text-[#E7FFF7]">
            <li>1. 진단, 처방, 치료 판단을 쓰지 않습니다.</li>
            <li>2. 주민번호, 계좌번호, 비밀번호, 상세 주소를 쓰지 않습니다.</li>
            <li>3. 응급 가능성이 보이면 리포트보다 보호자 연락 또는 119 안내가 먼저입니다.</li>
            <li>4. 보호자가 바로 이해할 수 있도록 수행한 일, 확인한 상태, 다음 할 일을 구분해 작성합니다.</li>
          </ol>
        </section>
      </section>
    </main>
  )
}
