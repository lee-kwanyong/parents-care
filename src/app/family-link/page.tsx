import Link from 'next/link'

const steps = [
  {
    title: '1. 자녀가 초대코드 생성',
    desc: '자녀가 보호자 앱에서 부모님 연결을 누르면 6자리 초대코드와 공유 링크가 만들어집니다.'
  },
  {
    title: '2. 부모님이 코드 입력 또는 링크 클릭',
    desc: '부모님은 복잡한 가입 없이 문자 링크를 누르거나 6자리 코드를 입력합니다.'
  },
  {
    title: '3. 부모님 동의 후 연결 완료',
    desc: '부모님이 안부 정보 공유에 동의하면 자녀와 부모님이 한 가족으로 연결됩니다.'
  },
  {
    title: '4. 안부온 기록이 자녀에게 전달',
    desc: '부모님이 식사, 약, 몸상태 버튼을 누르면 자녀의 보호자 알림 화면에 기록됩니다.'
  }
]

const rules = [
  '초대코드는 1회용으로 사용합니다.',
  '초대코드는 24시간 뒤 자동 만료됩니다.',
  '부모님 동의 없이는 자녀가 안부 기록을 볼 수 없습니다.',
  '부모님은 언제든 연결 해제를 요청할 수 있습니다.',
  '응급상황 판단은 AI가 아니라 보호자와 119가 우선입니다.'
]

export default function FamilyLinkPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-10 text-[#173B36]">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2.5rem] bg-white p-7 shadow-[0_20px_60px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] md:p-10">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            안부웍스 연결 방식
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] md:text-6xl">
            부모님과 자녀는
            <br />
            초대코드로 연결합니다.
          </h1>

          <p className="mt-6 max-w-3xl text-lg font-bold leading-8 text-[#637B76]">
            자녀가 먼저 가족 연결을 만들고, 부모님이 한 번만 동의하면 안부온 체크 기록이 보호자 화면으로 전달됩니다.
            부모님은 이후 큰 버튼만 누르면 됩니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/child/daily-care" className="rounded-2xl bg-[#123F38] px-5 py-4 font-black text-white">
              보호자 화면 보기
            </Link>
            <Link href="/parent/today" className="rounded-2xl bg-[#20C5A8] px-5 py-4 font-black text-white">
              부모님 체크하기
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <article key={step.title} className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D8EEE8]">
              <h2 className="text-2xl font-black tracking-[-0.05em] text-[#173B36]">
                {step.title}
              </h2>
              <p className="mt-3 text-base font-bold leading-8 text-[#637B76]">
                {step.desc}
              </p>
            </article>
          ))}
        </div>

        <section className="mt-6 rounded-[2rem] bg-[#123F38] p-6 text-white">
          <p className="text-sm font-black text-[#9DF4DD]">연결 후 데이터 흐름</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              '부모님 체크',
              '안부온 분석',
              '정상/주의/확인 필요',
              '자녀 알림'
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 p-4 text-center text-lg font-black">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D8EEE8]">
          <h2 className="text-2xl font-black tracking-[-0.05em]">안전 규칙</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {rules.map((rule) => (
              <div key={rule} className="rounded-2xl bg-[#F6FCFA] p-4 text-base font-black leading-7 text-[#4E6D69]">
                {rule}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
