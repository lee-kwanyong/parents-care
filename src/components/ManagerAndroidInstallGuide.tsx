import Link from 'next/link'

const steps = [
  ['1', 'Chrome으로 접속', '안드로이드폰에서 Chrome으로 매니저앱 주소를 엽니다.'],
  ['2', '오른쪽 위 점 3개', '브라우저 메뉴를 열고 “홈 화면에 추가”를 누릅니다.'],
  ['3', '앱처럼 사용', '홈 화면에 생긴 아이콘을 눌러 케어파트너 앱처럼 사용합니다.']
]

export function ManagerAndroidInstallGuide() {
  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-4xl">
        <header className="rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
          <div className="text-sm font-black text-[#19A98E]">Android 설치 안내</div>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] md:text-6xl">
            앱처럼 설치해서 사용하세요
          </h1>
          <p className="mt-4 text-base font-bold leading-7 text-[#607D79]">
            40대 이상 매니저도 쉽게 사용할 수 있도록 안드로이드 Chrome 기준으로 안내합니다.
          </p>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map(([num, title, desc]) => (
            <div key={num} className="rounded-[2rem] bg-white p-6 ring-1 ring-[#E3EFEC] shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#19B99A] text-xl font-black text-white">
                {num}
              </div>
              <h2 className="mt-5 text-2xl font-black">{title}</h2>
              <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">{desc}</p>
            </div>
          ))}
        </div>

        <section className="mt-6 rounded-[2rem] bg-white p-6 ring-1 ring-[#E3EFEC] shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
          <h2 className="text-2xl font-black">매니저앱에서 하는 일</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              '새 케어 요청 확인',
              '수락 또는 거절',
              '현장 시작/완료 체크',
              '예상 정산 확인'
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#F6FCFA] p-4 font-black ring-1 ring-[#E3EFEC]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Link href="/manager" className="rounded-3xl bg-[#19B99A] px-6 py-5 text-center text-xl font-black text-white">
            매니저앱 열기
          </Link>
          <Link href="/manager/apply" className="rounded-3xl bg-white px-6 py-5 text-center text-xl font-black text-[#426C68] ring-1 ring-[#CFE7E2]">
            매니저 간단 등록
          </Link>
        </div>
      </section>
    </main>
  )
}
