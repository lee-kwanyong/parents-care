import Link from 'next/link'

export default function GuardianSignupPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            보호자 가입
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            부모님 안심케어를
            <br />
            보호자가 시작합니다.
          </h1>

          <p className="mt-5 text-lg font-bold leading-8 text-[#637B76]">
            회원가입 후 부모님께 6자리 접속코드를 전달할 수 있습니다.
            부모님은 로그인 계정을 만들 필요 없이 6자리 코드만 입력하면 됩니다.
          </p>

          <div className="mt-8 rounded-[2rem] bg-[#FFF8E8] p-5 ring-1 ring-[#F0D299]">
            <div className="inline-flex rounded-full bg-[#E8FAF5] px-3 py-1 text-sm font-black text-[#11977F]">
              부모님 초대 · 6자리 코드
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.06em]">
              부모님은 6자리 코드만 입력합니다.
            </h2>

            <p className="mt-4 text-base font-bold leading-8 text-[#637B76]">
              보호자 가입이 끝나면 부모님 전용 6자리 초대코드를 만들 수 있습니다.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/family-link" className="rounded-[1.5rem] bg-[#123F38] px-6 py-5 text-center text-lg font-black text-white">
              부모님 연결 방법 보기
            </Link>
            <Link href="/parent/login" className="rounded-[1.5rem] bg-[#EFFFF9] px-6 py-5 text-center text-lg font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
              부모님 6자리 코드 입력
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
