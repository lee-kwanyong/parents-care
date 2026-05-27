import { kakaoAlimtalkTemplates } from '@/lib/anbu-kakao-templates'

export const metadata = {
  title: '카카오 알림톡 템플릿 | 안부웍스',
  description: '안부웍스 카카오 알림톡 템플릿 승인 준비 화면입니다.'
}

export default function KakaoTemplatesPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            운영실 · 카카오 알림톡 준비
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            알림톡 템플릿 심사에 넣을 문구를 준비합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            SMS 실발송은 잔액 보호를 위해 잠시 멈추고, 다음 단계로 카카오 알림톡 발신 프로필과 템플릿 심사를 준비합니다.
            아래 문구는 정보성 알림 기준으로 작성했습니다.
          </p>
        </section>

        <section className="rounded-[2rem] bg-[#FFF8E8] p-5 text-[#795313] ring-1 ring-[#F4D8A5] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">현재 운영 상태</h2>
          <p className="mt-3 text-sm font-bold leading-7">
            SOLAPI SMS 발송은 성공했지만, 잔액 보호를 위해 현재 SMS 실발송 모드는 일시정지 상태로 전환합니다.
            알림은 계속 발송함에 저장되며, 나중에 잔액 충전 후 다시 실발송 모드로 바꿀 수 있습니다.
          </p>
        </section>

        <div className="grid gap-5">
          {kakaoAlimtalkTemplates.map((item, index) => (
            <article key={item.id} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="inline-flex rounded-full bg-[#E8FAF5] px-3 py-1 text-xs font-black text-[#11977F]">
                    템플릿 {index + 1}
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-[-0.05em]">{item.title}</h2>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{item.purpose}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.variables.map((variable) => (
                    <span key={variable} className="rounded-full bg-[#F8FCFB] px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#D8EEE8]">
                      {variable}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="text-sm font-black text-[#11977F]">알림톡 템플릿 문구</div>
                  <pre className="mt-2 whitespace-pre-wrap rounded-2xl bg-[#123F38] p-4 text-sm font-bold leading-7 text-[#E7FFF7]">
                    {item.template}
                  </pre>
                </div>

                <div>
                  <div className="text-sm font-black text-[#11977F]">SMS 대체 문구</div>
                  <pre className="mt-2 whitespace-pre-wrap rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#4E6D69] ring-1 ring-[#D8EEE8]">
                    {item.smsFallback}
                  </pre>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">다음 작업 순서</h2>
          <ol className="mt-4 space-y-3 text-sm font-bold leading-7 text-[#637B76]">
            <li>1. 카카오톡 채널 이름을 안부웍스 또는 부모님 안심케어로 확정합니다.</li>
            <li>2. 카카오 비즈니스 채널 전환을 신청합니다.</li>
            <li>3. SOLAPI 또는 카카오 비즈메시지 콘솔에서 발신 프로필을 등록합니다.</li>
            <li>4. 발급된 Sender Key를 Vercel 환경변수 KAKAO_ALIMTALK_SENDER_KEY에 넣습니다.</li>
            <li>5. 위 템플릿을 알림톡 템플릿으로 심사 요청합니다.</li>
            <li>6. 승인 완료 후 SMS 우선 → 알림톡 우선 발송 구조로 전환합니다.</li>
          </ol>
        </section>
      </section>
    </main>
  )
}
