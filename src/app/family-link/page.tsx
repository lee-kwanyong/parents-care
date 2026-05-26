import Link from 'next/link'

export default function FamilyLinkPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            부모님 연결
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            자녀가 6자리 코드를 만들고,
            <br />
            부모님이 입력하면 연결됩니다.
          </h1>

          <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-[#637B76]">
            부모님이 로그인 계정을 만들 필요 없이, 보호자가 만든 6자리 숫자 코드로 안부온 체크 화면에 접속합니다.
            연결된 부모님만 식사, 약, 몸 상태 확인을 보낼 수 있습니다.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: '1. 보호자가 코드 생성',
                desc: '보호자 화면에서 부모님용 6자리 숫자 코드를 만듭니다.'
              },
              {
                title: '2. 부모님이 코드 입력',
                desc: '부모님은 /parent/login에서 6자리 코드를 입력합니다.'
              },
              {
                title: '3. 안부 체크 전송',
                desc: '식사, 약, 몸 상태 버튼을 누르면 보호자 화면에 표시됩니다.'
              }
            ].map((item) => (
              <div key={item.title} className="rounded-[1.75rem] bg-[#F8FCFB] p-5 ring-1 ring-[#D8EEE8]">
                <h2 className="text-xl font-black tracking-[-0.04em]">{item.title}</h2>
                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/signup/guardian"
              className="rounded-[1.5rem] bg-[#123F38] px-6 py-5 text-center text-lg font-black text-white"
            >
              보호자가 6자리 코드 만들기
            </Link>
            <Link
              href="/parent/login"
              className="rounded-[1.5rem] bg-[#EFFFF9] px-6 py-5 text-center text-lg font-black text-[#116D5F] ring-1 ring-[#CDEFE5]"
            >
              부모님 6자리 코드 입력
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
