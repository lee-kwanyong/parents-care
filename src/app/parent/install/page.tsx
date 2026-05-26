import Link from 'next/link'

export default function ParentInstallPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F2FFFB_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            부모님 폰 설치 안내
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            홈 화면에 추가하면
            <br />
            버튼처럼 바로 열 수 있어요.
          </h1>

          <p className="mt-5 text-lg font-bold leading-8 text-[#637B76]">
            iPhone은 Safari 공유 버튼에서, Android는 Chrome 메뉴에서 홈 화면에 추가를 선택하세요.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/install" className="rounded-[1.5rem] bg-[#123F38] px-6 py-5 text-center text-lg font-black text-white">
              자세한 설치 안내
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
