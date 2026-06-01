import Link from 'next/link'

export const metadata = {
  title: '홈 화면에 추가하기 | 부모님 안심케어',
  description: '부모님 안심케어를 휴대폰 홈 화면에 추가하는 방법입니다.'
}

export default function InstallPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            홈 화면에 추가하기
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em]">
            휴대폰에서 앱처럼
            <br />
            바로 열 수 있습니다.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
            부모님이 매번 주소를 입력하지 않아도 되도록 홈 화면에 추가해두세요.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">iPhone Safari</h2>
          <ol className="mt-4 space-y-3 text-sm font-bold leading-7 text-[#637B76]">
            <li>1. Safari에서 parents-care.net을 엽니다.</li>
            <li>2. 아래쪽 공유 버튼을 누릅니다.</li>
            <li>3. “홈 화면에 추가”를 선택합니다.</li>
            <li>4. 이름을 확인하고 “추가”를 누릅니다.</li>
          </ol>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">Android Chrome</h2>
          <ol className="mt-4 space-y-3 text-sm font-bold leading-7 text-[#637B76]">
            <li>1. Chrome에서 parents-care.net을 엽니다.</li>
            <li>2. 오른쪽 위 메뉴 버튼을 누릅니다.</li>
            <li>3. “홈 화면에 추가”를 선택합니다.</li>
            <li>4. 추가를 누르면 홈 화면에 아이콘이 생깁니다.</li>
          </ol>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/family-link"
            className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white"
          >
            부모님과 연결
          </Link>

          <Link
            href="/"
            className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  )
}
