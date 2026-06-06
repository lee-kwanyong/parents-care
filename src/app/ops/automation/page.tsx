export const metadata = {
  title: '자동 알림 루틴 | 안부웍스',
  description: '부모님 안부 요청, 응답 없음, 복약·병원 일정 SMS 자동화를 확인합니다.'
}

const automationItems = [
  {
    title: '부모님 아침 안부 요청',
    desc: '부모님 휴대폰으로 오늘 식사·약·몸 상태 체크 링크를 보냅니다.'
  },
  {
    title: '응답 없음 보호자 알림',
    desc: '최근 12시간 안부 응답이 없으면 보호자에게 확인 필요 SMS를 보냅니다.'
  },
  {
    title: '오늘 복약·병원 일정 알림',
    desc: '오늘 등록된 약·병원 일정이 있으면 보호자에게 일정 SMS를 보냅니다.'
  },
  {
    title: '중복 발송 방지',
    desc: '같은 가족에게 같은 알림이 하루에 여러 번 가지 않도록 확인합니다.'
  }
]

export default function OpsAutomationPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-5 py-8 text-[#17443F]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            운영실 · 자동 알림
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            안부온 자동 SMS 루틴을 운영합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            Vercel Cron이 매일 API를 호출하면 부모님 안부 요청, 응답 없음, 오늘 일정 알림이 자동으로 생성되고 SOLAPI SMS로 발송됩니다.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {automationItems.map((item, index) => (
            <section key={item.title} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFFFFA] text-sm font-black text-[#2AA897]">
                {index + 1}
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{item.desc}</p>
            </section>
          ))}
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">수동 테스트 주소</h2>

          <div className="mt-5 space-y-3">
            <CodeBox label="실제 발송 테스트">
              /api/anbu-cron/daily?secret=CRON_SECRET값
            </CodeBox>
            <CodeBox label="발송 없이 대상만 확인">
              /api/anbu-cron/daily?secret=CRON_SECRET값&dryRun=1
            </CodeBox>
            <CodeBox label="보호자 응답 없음만 테스트">
              /api/anbu-cron/daily?secret=CRON_SECRET값&parentPrompt=0&schedules=0
            </CodeBox>
          </div>

          <p className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-bold leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            실제 운영에서는 CRON_SECRET 값을 URL에 직접 노출하지 않는 것이 좋습니다.
            Vercel Cron은 Authorization Bearer 방식으로 자동 호출하도록 설정됩니다.
          </p>
        </section>

        <section className="rounded-[2rem] bg-[#247A71] p-5 text-white sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">다음 확인 순서</h2>
          <ol className="mt-4 space-y-3 text-sm font-bold leading-7 text-[#E7FFF7]">
            <li>1. /family-link 에서 부모님 전화번호와 보호자 전화번호를 모두 넣고 연결코드를 만듭니다.</li>
            <li>2. /parent/login 에서 부모님이 코드를 입력합니다.</li>
            <li>3. /api/anbu-cron/daily?secret=CRON_SECRET값&dryRun=1 로 대상을 확인합니다.</li>
            <li>4. 이상 없으면 /api/anbu-cron/daily?secret=CRON_SECRET값 으로 실제 SMS를 발송합니다.</li>
            <li>5. /ops/outbox 에서 발송완료 상태를 확인합니다.</li>
          </ol>
        </section>
      </section>
    </main>
  )
}

function CodeBox({ label, children }: { label: string; children: string }) {
  return (
    <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
      <div className="text-xs font-black text-[#2AA897]">{label}</div>
      <code className="mt-2 block break-all text-sm font-black text-[#17443F]">{children}</code>
    </div>
  )
}
